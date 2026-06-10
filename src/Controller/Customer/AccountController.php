<?php

// src/Controller/Customer/AccountController.php
namespace App\Controller\Customer;

use App\Constants\AppConstants;
use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\Log;
use App\Entity\NonRecurringExpense;
use App\Entity\NonRecurringIncome;
use App\Entity\NonRecurringIncomeExpensesInterface;
use App\Entity\RecurringExpense;
use App\Entity\RecurringIncome;
use App\Entity\RecurringInterest;
use App\Entity\RevolvingPayments;
use App\Form\AccountType;
use App\Services\AccountsService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/account', name: 'customer_account_')]
#[IsGranted('ROLE_CUSTOMER')]
class AccountController extends AbstractController
{
    #[Route('/new/{isIncomeOrExpense}', name: 'new', methods: ['GET', 'POST'])]
    public function new(string $isIncomeOrExpense, Request $request, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $account = new Account();

        // Set lastReconciliationDate to current date for display
        $account->setLastReconciliationDate(new DateTime());

        $form = $this->createForm(AccountType::class, $account, [
            'isIncomeOrExpense' => $isIncomeOrExpense,
            'customerAccount' => $cAcct,
            'action' => $this->generateUrl('customer_account_new', ['isIncomeOrExpense' => $isIncomeOrExpense])
        ]);

        $form->handleRequest($request);

        if ($form->isSubmitted() && ($form->isValid() || (!$form->isValid() && json_encode($form->getErrors()) == '{}'))) {
            // Set customer
            $account->setCustomerAccount($cAcct);
            //Set createdOn
            $now = new DateTime('-1 day');//Set the date one day before, so when adding trx we have a previous balance
            $account->setCreatedOn($now);

            // Set realBalance to match projectedBalance for new accounts
            $account->setRealBalance($account->getProjectedBalance());

            // Set lastReconciliationDate to match createdOn for new accounts
            $account->setLastReconciliationDate($now);

            //persist asset
            $entityManager->persist($account);
            $entityManager->flush();

            //Set isMasterBudgetTrackingGroupLoaded = true
            $customerAccount = $account->getCustomerAccount();
            $entityManager->flush();

            // Create log
            $log = $this->createLog($account, 'create');
            //update asset
            $account->setLog($log);

            $entityManager->persist($log);
            $entityManager->flush();

            // Get type from new account's budget group
            $type = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();

            //Add this new account to the AccountsTrackingCalendar
            $ok = $accountsService->addAccountToAccountsTrackingCalendar($account);

            //Create interest for this account if needed
            if ($account->getAccountType() != 'No Interest Earned' && $account->getAnnualInterestRate() > 0) {
                $ok = $accountsService->createRecurringInterestForAccount($account, $this->getUser());

                // Recalculate calendar
                $accountsService->updateCalendarAccountsBalances($cAcct);
            }


            $this->addFlash('success', 'Account created successfully');
            if ($account->getAccountType()) {
                $this->addFlash('success', 'Recurring Monthly Interest for this Account has been created!');
            }

            return $this->redirectToRoute('customer_account_index', [
                'isIncomeOrExpense' => $type
            ]);
        }

        return $this->redirectToRoute('customer_account_index', [
            'isIncomeOrExpense' => $isIncomeOrExpense
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Account $account, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response
    {
        $today = new DateTime(date('Y-m-d 00:00:00'));
        $cAcct = $this->getUser()->getCustomersAccount();
        // Ensure user owns this asset
        if ($account->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        // Get type from the existing account
        $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();

        //Get the projected Balance from Accounts Tracking Calendar that corresponds to today
        $entry = $entityManager->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $cAcct, 'calendarDate' => $today]);
        if ($entry) {
            $accountsBalances = $entry->getAccountsBalances();
            if (isset($accountsBalances[$account->getId()])) {
                $account->setProjectedBalance($accountsBalances[$account->getId()]);
            }
        }

        $form = $this->createForm(AccountType::class, $account, [
            'isIncomeOrExpense' => $isIncomeOrExpense,
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && ($form->isValid() || (!$form->isValid() && json_encode($form->getErrors()) == '{}'))) {
            // Create log for update
            $log = $this->createLog($account, 'update');
            $account->setLog($log);

            $entityManager->persist($log);
            $entityManager->flush();

            // Get updated type from account's budget group
            $type = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();

            $entityManager->flush();

            $this->addFlash('success', 'Account updated successfully');

            if ($account->getAccountType() && !$account->isHasMonthlyInterestCreated()) {
                $this->addFlash('error', 'You need to Generate Monthly Interest for this Account!');
            }

            return $this->redirectToRoute('customer_account_index', [
                'isIncomeOrExpense' => $type
            ]);
        } elseif ($form->isSubmitted() && $form->getErrors()){
            $this->addFlash('error', 'Form validation failed: ' . json_encode($form->getErrors()));
            return $this->redirectToRoute('customer_account_index', [
                'isIncomeOrExpense' => $isIncomeOrExpense
            ]);
        }

        //Get Accounts to list
        $accounts = $entityManager
            ->getRepository(Account::class)
            ->findBy(['customerAccount' => $cAcct]);

        foreach ($accounts as $account) {
            if ($account->getBudgetTrackingGroup()->getIsIncomeOrExpense() == $isIncomeOrExpense) {
                //Get the projected Balance from Accounts Tracking Calendar that corresponds to today
                $entry = $entityManager->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $cAcct, 'calendarDate' => $today]);
                if ($entry) {
                    $accountsBalances = $entry->getAccountsBalances();
                    if (isset($accountsBalances[$account->getId()])) {
                        $account->setProjectedBalance($accountsBalances[$account->getId()]);
                        //Update Projected Balance to todays calendar
                        $entityManager->persist($account);
                        $entityManager->flush();
                    }
                }
                $results[] = $account;
            }
        }

        return $this->render('customer/account/index.html.twig', [
            'accounts' => $results ?? [],
            'account' => $account,
            'form' => $form->createView(),
            'isIncomeOrExpense' => $isIncomeOrExpense
        ]);
    }

    #[Route('/reconcile', name: 'reconcile', methods: ['POST'])]
    public function reconcile(Request $request, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): JsonResponse
    {
        try {
            $accountId = $request->request->get('account_id');
            $realBalance = $request->request->get('real_balance');
            $reconciliationDate = new DateTime($request->request->get('reconciliation_date'));

            $account = $entityManager->getRepository(Account::class)->find($accountId);

            // Validate ownership
            if ($account->getCustomerAccount() !== $this->getUser()->getCustomersAccount()) {
                return $this->json(['success' => false, 'error' => 'Unauthorized access']);
            }

            // Calculate difference
            $projected = (float)$account->getProjectedBalance();
            $real = (float)$realBalance;
            $difference = $projected - $real;

            // Update account
            $account->setRealBalance($real);
            $account->setLastReconciliationDate($reconciliationDate);
            $entityManager->flush();

            // Create adjustment if needed
            if ($difference != 0) {
                $adjustment = $this->createAdjustment(
                    $account,
                    abs($difference),
                    $difference > 0 ? AppConstants::EXPENSE_TYPE : AppConstants::INCOME_TYPE
                );
                $entityManager->persist($adjustment);
                $entityManager->flush();

                //Upsert to Accounts Tracking Calendar
                $ok = $accountsService->upsertCalendarEntryForNonRecurring($adjustment);

                //Update Account Balances in Accounts Tracking Calendar
                $ok = $accountsService->updateCalendarAccountsBalancesForThisAccount($account);
            }
        } catch (\Throwable $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage() . ' - ' . $e->getTraceAsString()]);
        }

        return $this->json(['success' => true]);
    }

    #[Route('/{id}/transactions', name: 'transactions', methods: ['GET'])]
    public function getTransactions(Account $account, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            // Ensure user owns this account
            $cAcct = $this->getUser()->getCustomersAccount();
            if ($account->getCustomerAccount() !== $cAcct) {
                return $this->json(['error' => 'Unauthorized access'], 403);
            }

            // Get month and year from request
            $month = $request->query->get('month', date('n'));
            $year = $request->query->get('year', date('Y'));

            // Validate month and year
            if (!is_numeric($month) || $month < 1 || $month > 12) {
                return $this->json(['error' => 'Invalid month'], 400);
            }

            if (!is_numeric($year) || $year < 2000 || $year > 2100) {
                return $this->json(['error' => 'Invalid year'], 400);
            }

            // Create date range for the requested month
            $startDate = new DateTime("$year-$month-01 00:00:00");
            $endDate = clone $startDate;
            $endDate->modify('last day of this month')->setTime(23, 59, 59);

            // Get transactions for this account and date range
            $transactions = [];

            // Get Account Tracking Calendar Entries for this date range
            $calendarEntries = $entityManager->getRepository(AccountsTrackingCalendar::class)
                ->createQueryBuilder('atc')
                ->where('atc.customersAccount = :customersaccount')
                ->andWhere('atc.calendarDate >= :startDateStr')
                ->andWhere('atc.calendarDate <= :endDateStr')
                ->setParameter('customersaccount', $cAcct)
                ->setParameter('startDateStr', $startDate->format('Y-m-d'))
                ->setParameter('endDateStr', $endDate->format('Y-m-d'))
                ->getQuery()
                ->getResult();

            foreach ($calendarEntries as $calendarEntry) {

                //Get recurring income trx
                $recurringIncomes = $calendarEntry->getRecurringIncomes();
                foreach ($recurringIncomes as $accountId => $items) {
                    if ($accountId == $account->getId()) {
                        foreach ($items as $trxId => $amount) {
                            $incomeTrx = $entityManager->getRepository(RecurringIncome::class)->find($trxId);
                            if ($incomeTrx) {
                                $transactions[] = [
                                    'id' => $incomeTrx->getId(),
                                    'name' => $incomeTrx->getName(),
                                    'description' => $incomeTrx->getDescription(),
                                    'amount' => (float)$incomeTrx->getAmount(),
                                    'date' => $calendarEntry->getCalendarDate()->format('Y-m-d'),
                                    'type' => 'income'
                                ];
                            }
                        }
                    }
                }

                //Get non-recurring income tx
                $nonRecurringIncomes = $calendarEntry->getNonRecurringIncomes();
                foreach ($nonRecurringIncomes as $accountId => $items) {
                    if ($accountId == $account->getId()) {
                        foreach ($items as  $trxId => $amount) {
                            $incomeTrx = $entityManager->getRepository(NonRecurringIncome::class)->find($trxId);
                            if ($incomeTrx) {
                                $transactions[] = [
                                    'id' => $incomeTrx->getId(),
                                    'name' => $incomeTrx->getName(),
                                    'description' => $incomeTrx->getDescription(),
                                    'amount' => (float)$incomeTrx->getAmount(),
                                    'date' => $calendarEntry->getCalendarDate()->format('Y-m-d'),
                                    'type' => 'income'
                                ];
                            }
                        }
                    }
                }

                //Get recurring interest as income trx
                $recurringInterests = $calendarEntry->getRecurringIncomeInterest();
                foreach ($recurringInterests as $accountId => $items) {
                    if ($accountId == $account->getId()) {
                        foreach ($items as  $trxId => $amount) {
                            $interestTrx = $entityManager->getRepository(RecurringInterest::class)->find($trxId);
                            if ($interestTrx) {
                                $transactions[] = [
                                    'id' => $interestTrx->getId(),
                                    'name' => $interestTrx->getName(),
                                    'description' => null,
                                    'amount' => (float)$amount,
                                    'date' => $calendarEntry->getCalendarDate()->format('Y-m-d'),
                                    'type' => 'income'
                                ];
                            }
                        }
                    }
                }

                //Get recurring expense trx
                $recurringExpenses = $calendarEntry->getRecurringExpenses();
                foreach ($recurringExpenses as $accountId => $items) {
                    if ($accountId == $account->getId()) {
                        foreach ($items as  $trxId => $amount) {
                            $expenseTrx = $entityManager->getRepository(RecurringExpense::class)->find($trxId);
                            if ($expenseTrx) {
                                $transactions[] = [
                                    'id' => $expenseTrx->getId(),
                                    'name' => $expenseTrx->getName(),
                                    'description' => $expenseTrx->getDescription(),
                                    'amount' => (float)$expenseTrx->getAmount(),
                                    'date' => $calendarEntry->getCalendarDate()->format('Y-m-d'),
                                    'type' => 'expense'
                                ];
                            }
                        }
                    }
                }

                //Get non-recurring expense trx
                $nonRecurringExpenses = $calendarEntry->getNonRecurringExpenses();
                foreach ($nonRecurringExpenses as $accountId => $items) {
                    if ($accountId == $account->getId()) {
                        foreach ($items as  $trxId => $amount) {
                            $expenseTrx = $entityManager->getRepository(NonRecurringExpense::class)->find($trxId);
                            if ($expenseTrx) {
                                $transactions[] = [
                                    'id' => $expenseTrx->getId(),
                                    'name' => $expenseTrx->getName(),
                                    'description' => $expenseTrx->getDescription(),
                                    'amount' => (float)$expenseTrx->getAmount(),
                                    'date' => $calendarEntry->getCalendarDate()->format('Y-m-d'),
                                    'type' => 'expense'
                                ];
                            }
                        }
                    }
                }

                //Get recurring interest as expense trx
                $recurringInterests = $calendarEntry->getRecurringExpenseInterest();
                foreach ($recurringInterests as $accountId => $items) {
                    if ($accountId == $account->getId()) {
                        foreach ($items as  $trxId => $amount) {
                            $interestTrx = $entityManager->getRepository(RecurringInterest::class)->find($trxId);
                            if ($interestTrx) {
                                $transactions[] = [
                                    'id' => $interestTrx->getId(),
                                    'name' => $interestTrx->getName(),
                                    'description' => null,
                                    'amount' => (float)$amount,
                                    'date' => $calendarEntry->getCalendarDate()->format('Y-m-d'),
                                    'type' => 'expense'
                                ];
                            }
                        }
                    }
                }

                //Get revolving payments as expense trx
                $revolvingPayments = $calendarEntry->getPaymentsAccountToPay();
                foreach ($revolvingPayments as $accountId => $items) {
                    if ($accountId == $account->getId()) {
                        foreach ($items as  $trxId => $amount) {
                            $paymentTrx = $entityManager->getRepository(RevolvingPayments::class)->find($trxId);
                            if ($paymentTrx) {
                                $transactions[] = [
                                    'id' => $paymentTrx->getId(),
                                    'name' => $paymentTrx->getName(),
                                    'description' => null,
                                    'amount' => (float)$paymentTrx->getChosenAmount(),
                                    'date' => $calendarEntry->getCalendarDate()->format('Y-m-d'),
                                    'type' => 'expense'
                                ];
                            }
                        }
                    }
                }
            }

            // Sort transactions by date
            usort($transactions, function($a, $b) {
                return strtotime($a['date']) - strtotime($b['date']);
            });

            return $this->json([
                'success' => true,
                'transactions' => $transactions,
                'month' => (int) $month,
                'year' => (int) $year,
                'account_id' => $account->getId()
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => 'Failed to retrieve transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{isIncomeOrExpense}', name: 'index', methods: ['GET'])]
    public function index(string $isIncomeOrExpense, EntityManagerInterface $entityManager): Response
    {
        $today = new DateTime(date('Y-m-d 00:00:00'));
        $cAcct = $this->getUser()->getCustomersAccount();
        $accounts = $entityManager
            ->getRepository(Account::class)
            ->findBy(['customerAccount' => $cAcct]);

        foreach ($accounts as $account) {
            if ($account->getBudgetTrackingGroup()->getIsIncomeOrExpense() == $isIncomeOrExpense) {
                //Get the projected Balance from Accounts Tracking Calendar that corresponds to today
                $entry = $entityManager->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $cAcct, 'calendarDate' => $today]);
                if ($entry) {
                    $accountsBalances = $entry->getAccountsBalances();
                    if (isset($accountsBalances[$account->getId()])) {
                        $account->setProjectedBalance($accountsBalances[$account->getId()]);
                        //Update Projected Balance to todays calendar
                        $entityManager->persist($account);
                        $entityManager->flush();
                    }
                }
                $results[] = $account;
            }
        }

        // Create empty form for new account
        $newAccount = new Account();
        $newAccount->setLastReconciliationDate(new DateTime());
        $form = $this->createForm(AccountType::class, $newAccount, [
            'isIncomeOrExpense' => $isIncomeOrExpense,
            'customerAccount' => $cAcct,
            'action' => $this->generateUrl('customer_account_new', ['isIncomeOrExpense' => $isIncomeOrExpense])
        ]);

        return $this->render('customer/account/index.html.twig', [
            'accounts' => $results ?? [],
            'isIncomeOrExpense' => $isIncomeOrExpense,
            'form' => $form->createView(),
            'account' => null
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['POST'])]
    public function delete(Request $request, Account $account, EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        // Ensure user owns this asset
        if ($account->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        // Get type before deletion
        $type = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();

        if ($this->isCsrfTokenValid('delete'.$account->getId(), $request->request->get('_token'))) {

            //Set isMasterBudgetTrackingGroupLoaded = true
            $customerAccount = $account->getCustomerAccount();

            $entityManager->remove($account);
            $entityManager->flush();

            $this->addFlash('success', 'Account deleted successfully');
        }

        return $this->redirectToRoute('customer_account_index', [
            'isIncomeOrExpense' => $type
        ]);
    }

    private function createAdjustment(Account $account, float $amount, string $type): NonRecurringIncomeExpensesInterface
    {
        $budgetGroup = $account->getBudgetTrackingGroup();
        $customerAccount = $this->getUser()->getCustomersAccount();
        $raName = 'ADJ-ACCTID-' . $account->getId() . '-' . $type . '-' . $account->getLastReconciliationDate()->format('Y-m-d');

        if ($type == AppConstants::EXPENSE_TYPE) {
            $adjustment = new NonRecurringExpense();
            $adjustment->setName($raName);
            $adjustment->setBudgetTrackingGroup($budgetGroup);
        } else {
            $adjustment = new NonRecurringIncome();
            $adjustment->setName($raName);
            $adjustment->setBudgetTrackingGroup($budgetGroup);
        }

        $adjustment->setAmount($amount);
        $adjustment->setDateToApply(new DateTime());
        $adjustment->setAccount($account);
        $adjustment->setCustomerAccount($customerAccount);

        return $adjustment;
    }

    private function createLog(Account $account, string $action): Log
    {
        $logData = [
            'id' => $account->getId(),
            'name' => $account->getName(),
            'description' => $account->getDescription() ?? '',
            'projectedBalance' => $account->getProjectedBalance() ?? 0,
            'realBalance' => $account->getRealBalance() ?? 0,
            'lastReconciliationDate' => $account->getLastReconciliationDate()?->format('Y-m-d'),
            'annualInterestRate' => $account->getAnnualInterestRate() ?? 0,
            'timestamp' => (new DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new DateTime());
        $log->setCustomer($this->getUser());
        $log->setAffectedEntityName('Account');
        $log->setAction($action);

        return $log;
    }
}
