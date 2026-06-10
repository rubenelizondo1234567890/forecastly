<?php

// src/Controller/Customer/RecurringExpenseController.php
namespace App\Controller\Customer;

use App\Constants\AppConstants;
use App\Entity\Account;
use App\Entity\RecurringExpense;
use App\Entity\Log;
use App\Entity\RecurringInterest;
use App\Entity\RevolvingPayments;
use App\Form\RecurringExpenseType;
use App\Services\AccountsService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/expense/recurring', name: 'customer_recurring_expense_')]
#[IsGranted('ROLE_CUSTOMER')]
class RecurringExpenseController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $expenses = $entityManager
            ->getRepository(RecurringExpense::class)
            ->findBy(['customerAccount' => $cAcct]);

        // Create new form
        $expense = new RecurringExpense();
        $form = $this->createForm(RecurringExpenseType::class, $expense, [
            'customerAccount' => $cAcct,
        ]);

        return $this->render('customer/expense/recurring/index.html.twig', [
            'expenses' => $expenses,
            'isIncomeOrExpense' => 'expense',
            'form' => $form->createView(),
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $expense = new RecurringExpense();
        $form = $this->createForm(RecurringExpenseType::class, $expense, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Set default start date if not provided
            if (!$expense->getStartOn()) {
                $expense->setStartOn(new \DateTime());
            }

            // Validate start date is not in the past
            $today = new \DateTime();
            $today->setTime(0, 0, 0); // Reset time to compare dates only

            if ($expense->getStartOn() < $today) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['success' => false, 'error' => 'Start date cannot be in the past.'], 400);
                }
                $this->addFlash('error', 'Start date cannot be in the past.');
                return $this->redirectToRoute('customer_recurring_expense_index');
            }

            // Set customer
            $expense->setCustomerAccount($cAcct);

            // Persist RecurringExpense
            $entityManager->persist($expense);
            $entityManager->flush();

            // Create log
            $log = $this->createLog($expense, 'create');
            $expense->setLog($log);

            $entityManager->persist($log);
            $entityManager->flush();

            //Add to calendar
            $ok = $accountsService->generateCalendarEntriesForRecurring($expense);

            // Recalculate Calendar
            $startFromDate = $expense->getStartOn();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Recurring expense created successfully',
                    'accountId' => $expense->getAccount()->getId()
                ]);
            }

            $this->addFlash('success', 'Recurring expense created successfully');
            return $this->redirectToRoute('customer_recurring_expense_index');
        }

        // Make sure there are Accounts available before creating new entry
        $qb = $entityManager->getRepository(Account::class)->createQueryBuilder('a');
        $qb->innerJoin('a.budgetTrackingGroup', 'b');
        $qb->innerJoin('a.customerAccount', 'c');
        $qb->where('b.isIncomeOrExpense = :isIncomeOrExpense');
        $qb->andWhere('c.id = :customerAccountId');
        $qb->setParameter('isIncomeOrExpense', 'expense');
        $qb->setParameter('customerAccountId', $cAcct->getId());
        $qb->setMaxResults(1);
        $results = $qb->getQuery()->getResult();

        if (empty($results)) {
            $this->addFlash('error', 'You need to create Liability accounts first.');
            return $this->redirectToRoute('customer_recurring_expense_index');
        }

        // If form is not valid, redirect back to index with form errors
        $expenses = $entityManager
            ->getRepository(RecurringExpense::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/expense/recurring/index.html.twig', [
            'expenses' => $expenses,
            'form' => $form->createView(),
            'isIncomeOrExpense' => 'expense',
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, RecurringExpense $expense, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        // Ensure user owns this asset
        if ($expense->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        // Store original values for comparison
        $originalAmount = $expense->getAmount();
        $originalAccountId = $expense->getAccount()->getId();

        $form = $this->createForm(RecurringExpenseType::class, $expense, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Create log for update
            $log = $this->createLog($expense, 'update');
            $expense->setLog($log);

            $entityManager->persist($log);
            $entityManager->flush();

            //Remove Calendar Entries for this Recurring Expense
            $ok = $accountsService->removeCalendarEntriesForRecurring($expense, $originalAccountId);

            //Then generate new Calendar Entries for this Recurring Expense
            $ok = $accountsService->generateCalendarEntriesForRecurring($expense);

            // Recalculate Calendar
            $startFromDate = $expense->getStartOn();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Recurring expense updated successfully',
                    'accountId' => $expense->getAccount()->getId()
                ]);
            }

            $this->addFlash('success', 'Recurring expense updated successfully');
            return $this->redirectToRoute('customer_recurring_expense_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/expense/recurring/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $expenses = $entityManager
            ->getRepository(RecurringExpense::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/expense/recurring/index.html.twig', [
            'expenses' => $expenses,
            'expense' => $expense,
            'form' => $form->createView(),
            'isIncomeOrExpense' => 'expense',
            'original_start_on' => $expense->getStartOn()->format('Y-m-d'), // Pass original value for JS
            'frequency_name' => $expense->getFrequency()->getName(), // Pass frequency name for display
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['POST'])]
    public function delete(Request $request, RecurringExpense $expense, EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        // Ensure user owns this asset
        if ($expense->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        if ($this->isCsrfTokenValid('delete'.$expense->getId(), $request->request->get('_token'))) {

            //Set isMasterBudgetTrackingGroupLoaded = true
            $customerAccount = $expense->getCustomerAccount();
            $entityManager->flush();

            // Create log before deletion
            $log = $this->createLog($expense, 'delete');
            $entityManager->persist($log);

            $entityManager->remove($expense);
            $entityManager->flush();

            $this->addFlash('success', 'Recurring expense deleted successfully');
        }

        return $this->redirectToRoute('customer_recurring_expense_index');
    }

    private function createLog(RecurringExpense $expense, string $action): Log
    {
        $logData = [
            'id' => $expense->getId(),
            'name' => $expense->getName(),
            'description' => $expense->getDescription() ?? '',
            'amount' => $expense->getAmount() ?? 0,
            'startOn' => $expense->getStartOn()?->format('Y-m-d'),
            'canceledAfter' => $expense->getCanceledAfter()?->format('Y-m-d'),
            'account' => $expense->getAccount()->getId(),
            'frequency' => $expense->getFrequency()->getName(),
            'budgetGroup' => $expense->getBudgetTrackingGroup()->getName(),
            'customerAccount' => $expense->getCustomerAccount()->getId(),
            'action' => $action,
            'timestamp' => (new \DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setAffectedEntityName('RecurringExpense');
        $log->setAction($action);
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new \DateTime());
        $log->setCustomer($this->getUser());

        return $log;
    }
}
