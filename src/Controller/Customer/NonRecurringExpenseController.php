<?php

// src/Controller/Customer/NonRecurringExpenseController.php
namespace App\Controller\Customer;

use App\Constants\AppConstants;
use App\Entity\Account;
use App\Entity\NonRecurringExpense;
use App\Entity\Log;
use App\Entity\RecurringInterest;
use App\Entity\RevolvingPayments;
use App\Form\NonRecurringExpenseType;
use App\Services\AccountsService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/expense/non-recurring', name: 'customer_non_recurring_expense_')]
#[IsGranted('ROLE_CUSTOMER')]
class NonRecurringExpenseController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $expenses = $entityManager
            ->getRepository(NonRecurringExpense::class)
            ->findBy(['customerAccount' => $cAcct]);

        // Create new form
        $expense = new NonRecurringExpense();
        $form = $this->createForm(NonRecurringExpenseType::class, $expense, [
            'customerAccount' => $cAcct,
        ]);

        return $this->render('customer/expense/non_recurring/index.html.twig', [
            'expenses' => $expenses,
            'isIncomeOrExpense' => 'expense',
            'form' => $form->createView(),
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $expense = new NonRecurringExpense();
        $form = $this->createForm(NonRecurringExpenseType::class, $expense, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Set customer
            $expense->setCustomerAccount($cAcct);

            //persist RecurringExpense
            $entityManager->persist($expense);
            $entityManager->flush();

            // Create log
            $log = $this->createLog($expense, 'create');
            $expense->setLog($log);
            $entityManager->persist($log);
            $entityManager->flush();

            //Upsert to Accounts Tracking Calendar
            $ok = $accountsService->upsertCalendarEntryForNonRecurring($expense);

            // Recalculate Calendar
            $startFromDate = $expense->getDateToApply();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Non Recurring expense created successfully',
                    'accountId' => $expense->getAccount()->getId()
                ]);
            }

            $this->addFlash('success', 'Non Recurring expense created successfully');
            return $this->redirectToRoute('customer_non_recurring_expense_index');
        }

        //make sure there are Accounts available before creating new entry
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
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse(['success' => false, 'error' => 'You need to create Liability accounts first.'], 400);
            }
            $this->addFlash('error', 'You need to create Liability accounts first.');
            return $this->redirectToRoute('customer_non_recurring_expense_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/expense/non_recurring/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $expenses = $entityManager
            ->getRepository(NonRecurringExpense::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/expense/non_recurring/index.html.twig', [
            'expenses' => $expenses,
            'form' => $form->createView(),
            'isIncomeOrExpense' => 'expense',
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, NonRecurringExpense $expense, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        // Ensure user owns this asset
        if ($expense->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        $originalDateToApply = $expense->getDateToApply();

        $form = $this->createForm(NonRecurringExpenseType::class, $expense, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Create log for update
            $log = $this->createLog($expense, 'update');
            $expense->setLog($log);
            $entityManager->persist($log);
            $entityManager->flush();

            //Remove Entry from Accounts Tracking Calendar
            $ok = $accountsService->removeCalendarEntryForNonRecurring($expense, $originalDateToApply->format('Y-m-d 00:00:00'));

            //Upsert to Accounts Tracking Calendar
            $ok = $accountsService->upsertCalendarEntryForNonRecurring($expense);

            // Recalculate Calendar
            $startFromDate = $expense->getDateToApply();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Non Recurring expense updated successfully',
                    'accountId' => $expense->getAccount()->getId()
                ]);
            }

            $this->addFlash('success', 'Non Recurring expense updated successfully');
            return $this->redirectToRoute('customer_non_recurring_expense_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/expense/non_recurring/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $expenses = $entityManager
            ->getRepository(NonRecurringExpense::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/expense/non_recurring/index.html.twig', [
            'expenses' => $expenses,
            'expense' => $expense,
            'form' => $form->createView(),
            'isIncomeOrExpense' => 'expense',
            'original_date_to_apply' => $expense->getDateToApply()->format('Y-m-d'),
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['POST'])]
    public function delete(Request $request, NonRecurringExpense $expense, EntityManagerInterface $entityManager): Response
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

            $this->addFlash('success', 'Non Recurring expense deleted successfully');
        }

        return $this->redirectToRoute('customer_non_recurring_expense_index');
    }

    private function createLog(NonRecurringExpense $expense, string $action): Log
    {
        $logData = [
            'id' => $expense->getId(),
            'name' => $expense->getName(),
            'description' => $expense->getDescription() ?? '',
            'amount' => $expense->getAmount() ?? 0,
            'dateToApply' => $expense->getDateToApply()?->format('Y-m-d'),
            'account' => $expense->getAccount()->getId(),
            'budgetGroup' => $expense->getBudgetTrackingGroup()->getName(),
            'customerAccount' => $expense->getCustomerAccount()->getId(),
            'action' => $action,
            'timestamp' => (new \DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setAffectedEntityName('NonRecurringExpense');
        $log->setAction($action);
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new \DateTime());
        $log->setCustomer($this->getUser());

        return $log;
    }
}
