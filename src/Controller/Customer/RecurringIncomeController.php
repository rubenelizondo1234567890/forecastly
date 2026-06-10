<?php

// src/Controller/Customer/RecurringIncomeController.php
namespace App\Controller\Customer;

use App\Constants\AppConstants;
use App\Entity\Account;
use App\Entity\RecurringIncome;
use App\Entity\Log;
use App\Entity\RecurringInterest;
use App\Entity\RevolvingPayments;
use App\Form\RecurringIncomeType;
use App\Services\AccountsService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/income/recurring', name: 'customer_recurring_income_')]
#[IsGranted('ROLE_CUSTOMER')]
class RecurringIncomeController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $incomes = $entityManager
            ->getRepository(RecurringIncome::class)
            ->findBy(['customerAccount' => $cAcct]);

        //Create new form
        $income = new RecurringIncome();
        $form = $this->createForm(RecurringIncomeType::class, $income, [
            'customerAccount' => $cAcct,
        ]);

        return $this->render('customer/income/recurring/index.html.twig', [
            'incomes' => $incomes,
            'isIncomeOrExpense' => 'income',
            'form' => $form->createView(),
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $income = new RecurringIncome();
        $form = $this->createForm(RecurringIncomeType::class, $income, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Set default start date if not provided
            if (!$income->getStartOn()) {
                $income->setStartOn(new DateTime());
            }

            // Validate start date is not in the past
            $today = new DateTime();
            $today->setTime(0, 0, 0); // Reset time to compare dates only

            if ($income->getStartOn() < $today) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['success' => false, 'error' => 'Start date cannot be in the past.'], 400);
                }
                $this->addFlash('error', 'Start date cannot be in the past.');
                return $this->redirectToRoute('customer_recurring_income_index');
            }

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

            //Add to Calendar
            $ok = $accountsService->generateCalendarEntriesForRecurring($income);

            // Recalculate Calendar
            $startFromDate = $income->getStartOn();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Recurring income created successfully',
                    'accountId' => $income->getAccount()->getId()
                ]);
            }

            $this->addFlash('success', 'Recurring income created successfully');
            return $this->redirectToRoute('customer_recurring_income_index');
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
            return $this->redirectToRoute('customer_recurring_income_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/income/recurring/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $incomes = $entityManager
            ->getRepository(RecurringIncome::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/income/recurring/index.html.twig', [
            'incomes' => $incomes,
            'form' => $form->createView(),
            'isIncomeOrExpense' => 'income',
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, RecurringIncome $income, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        // Ensure user owns this asset
        if ($income->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        // Store original values for comparison
        $originalAmount = $income->getAmount();
        $originalAccountId = $income->getAccount()->getId();

        $form = $this->createForm(RecurringIncomeType::class, $income, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Create log for update
            $log = $this->createLog($income, 'update');
            $income->setLog($log);

            $entityManager->persist($log);

            //flush before applying to calendar
            $entityManager->flush();

            //Remove Calendar Entries for this Recurring Income
            $ok = $accountsService->removeCalendarEntriesForRecurring($income, $originalAccountId);

            //Then generate new Calendar Entries for this Recurring Income
            $ok = $accountsService->generateCalendarEntriesForRecurring($income);

            // Recalculate Calendar
            $startFromDate = $income->getStartOn();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Recurring income updated successfully',
                    'accountId' => $income->getAccount()->getId()
                ]);
            }

            $this->addFlash('success', 'Recurring income updated successfully');
            return $this->redirectToRoute('customer_recurring_income_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/income/recurring/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $incomes = $entityManager
            ->getRepository(RecurringIncome::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/income/recurring/index.html.twig', [
            'incomes' => $incomes,
            'form' => $form->createView(),
            'isIncomeOrExpense' => 'income',
            'original_start_on' => $income->getStartOn()->format('Y-m-d'), // Pass original value for JS
            'frequency_name' => $income->getFrequency()->getName(), // Pass frequency name for display
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['POST'])]
    public function delete(Request $request, RecurringIncome $income, EntityManagerInterface $entityManager): Response
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

            $this->addFlash('success', 'Recurring income deleted successfully');
        }

        return $this->redirectToRoute('customer_recurring_income_index');
    }

    private function createLog(RecurringIncome $income, string $action): Log
    {
        $logData = [
            'id' => $income->getId(),
            'name' => $income->getName(),
            'description' => $income->getDescription() ?? '',
            'amount' => $income->getAmount() ?? 0,
            'startOn' => $income->getStartOn()?->format('Y-m-d'),
            'canceledAfter' => $income->getCanceledAfter()?->format('Y-m-d'),
            'frequency' => $income->getFrequency()->getName(),
            'budgetGroup' => $income->getBudgetTrackingGroup()->getName(),
            'customerAccount' => $income->getCustomerAccount()->getId(),
            'action' => $action,
            'timestamp' => (new DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setAffectedEntityName('RecurringIncome');
        $log->setAction($action);
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new DateTime());
        $log->setCustomer($this->getUser());

        return $log;
    }
}
