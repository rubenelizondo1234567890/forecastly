<?php
// src/Controller/Customer/RecurringIncomeController.php
namespace App\Controller\Customer;

use App\Constants\AppConstants;
use App\Entity\Account;
use App\Entity\NonRecurringIncome;
use App\Entity\RecurringIncome;
use App\Entity\Log;
use App\Entity\RecurringInterest;
use App\Entity\RevolvingPayments;
use App\Form\NonRecurringIncomeType;
use App\Form\RecurringIncomeType;
use App\Services\AccountsService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/income/non-recurring', name: 'customer_non_recurring_income_')]
#[IsGranted('ROLE_CUSTOMER')]
class NonRecurringIncomeController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $incomes = $entityManager
            ->getRepository(NonRecurringIncome::class)
            ->findBy(['customerAccount' => $cAcct]);

        // Create new form
        $income = new NonRecurringIncome();
        $form = $this->createForm(NonRecurringIncomeType::class, $income, [
            'customerAccount' => $cAcct,
        ]);

        return $this->render('customer/income/non_recurring/index.html.twig', [
            'incomes' => $incomes,
            'isIncomeOrExpense' => 'income',
            'form' => $form->createView(),
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager, AccountsService $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $income = new NonRecurringIncome();
        $form = $this->createForm(NonRecurringIncomeType::class, $income, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Set customer
            $income->setCustomerAccount($cAcct);

            //persist RecurringExpense
            $entityManager->persist($income);
            $entityManager->flush();

            // Create log
            $log = $this->createLog($income, 'create');
            $income->setLog($log);
            $entityManager->persist($log);
            $entityManager->flush();

            //Upsert to Accounts Tracking Calendar
            $ok = $accountsService->upsertCalendarEntryForNonRecurring($income);

            // Recalculate Calendar
            $startFromDate = $income->getDateToApply();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Non Recurring income created successfully',
                    'accountId' => $income->getAccount()->getId()
                ]);
            }

            $this->addFlash('success', 'Non Recurring income created successfully');
            return $this->redirectToRoute('customer_non_recurring_income_index');
        }

        //make sure there are Accounts available before creating new entry
        $qb = $entityManager->getRepository(Account::class)->createQueryBuilder('a');
        $qb->innerJoin('a.budgetTrackingGroup', 'b');
        $qb->innerJoin('a.customerAccount', 'c');
        $qb->where('b.isIncomeOrExpense = :isIncomeOrExpense');
        $qb->andWhere('c.id = :customerAccountId');
        $qb->setParameter('isIncomeOrExpense', 'income');
        $qb->setParameter('customerAccountId', $cAcct->getId());
        $qb->setMaxResults(1);
        $results = $qb->getQuery()->getResult();
        if (empty($results)) {
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse(['success' => false, 'error' => 'You need to create Asset accounts first.'], 400);
            }
            $this->addFlash('error', 'You need to create Asset accounts first.');
            return $this->redirectToRoute('customer_non_recurring_income_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/income/non_recurring/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $incomes = $entityManager
            ->getRepository(NonRecurringIncome::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/income/non_recurring/index.html.twig', [
            'incomes' => $incomes,
            'form' => $form->createView(),
            'isIncomeOrExpense' => 'income',
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, NonRecurringIncome $income, EntityManagerInterface $entityManager, AccountsService $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        // Ensure user owns this asset
        if ($income->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        $originalDateToApply = $income->getDateToApply();

        $form = $this->createForm(NonRecurringIncomeType::class, $income, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Create log for update
            $log = $this->createLog($income, 'update');
            $income->setLog($log);
            $entityManager->persist($log);
            $entityManager->flush();

            //Remove Entry from Accounts Tracking Calendar
            $ok = $accountsService->removeCalendarEntryForNonRecurring($income, $originalDateToApply->format('Y-m-d 00:00:00'));

            //Upsert to Accounts Tracking Calendar
            $ok = $accountsService->upsertCalendarEntryForNonRecurring($income);

            // Recalculate Calendar
            $startFromDate = $income->getDateToApply();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Non Recurring income updated successfully',
                    'accountId' => $income->getAccount()->getId()
                ]);
            }

            $this->addFlash('success', 'Non Recurring income updated successfully');
            return $this->redirectToRoute('customer_non_recurring_income_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/income/non_recurring/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $incomes = $entityManager
            ->getRepository(NonRecurringIncome::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/income/non_recurring/index.html.twig', [
            'incomes' => $incomes,
            'income' => $income,
            'form' => $form->createView(),
            'isIncomeOrExpense' => 'income',
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['POST'])]
    public function delete(Request $request, NonRecurringIncome $income, EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        // Ensure user owns this asset
        if ($income->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        if ($this->isCsrfTokenValid('delete'.$income->getId(), $request->request->get('_token'))) {

            //Set isMasterBudgetTrackingGroupLoaded = true
            $customerAccount = $income->getCustomerAccount();
            $entityManager->flush();

            // Create log before deletion
            $log = $this->createLog($income, 'delete');
            $entityManager->persist($log);

            $entityManager->remove($income);
            $entityManager->flush();

            $this->addFlash('success', 'Non Recurring income deleted successfully');
        }

        return $this->redirectToRoute('customer_non_recurring_income_index');
    }

    private function createLog(NonRecurringIncome $income, string $action): Log
    {
        $logData = [
            'id' => $income->getId(),
            'name' => $income->getName(),
            'description' => $income->getDescription() ?? '',
            'amount' => $income->getAmount() ?? 0,
            'dateToApply' => $income->getDateToApply()?->format('Y-m-d'),
            'budgetGroup' => $income->getBudgetTrackingGroup()->getName(),
            'customerAccount' => $income->getCustomerAccount()->getId(),
            'action' => $action,
            'timestamp' => (new \DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setAffectedEntityName('NonRecurringIncome');
        $log->setAction($action);
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new \DateTime());
        $log->setCustomer($this->getUser());

        return $log;
    }
}
