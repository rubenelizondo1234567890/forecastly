<?php

namespace App\Controller\Customer;

use App\Entity\Account;
use App\Entity\Log;
use App\Entity\RecurringSavings;
use App\Form\RecurringSavingsType;
use App\Services\AccountsService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/recurring-savings', name: 'customer_recurring_savings_')]
#[IsGranted('ROLE_CUSTOMER')]
class RecurringSavingsController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $recurringSavings = $entityManager
            ->getRepository(RecurringSavings::class)
            ->findBy(['customerAccount' => $cAcct]);

        // Create new form
        $recurringSaving = new RecurringSavings();
        $form = $this->createForm(RecurringSavingsType::class, $recurringSaving, [
            'customerAccount' => $cAcct,
        ]);

        return $this->render('customer/recurring_savings/index.html.twig', [
            'recurringSavings' => $recurringSavings,
            'form' => $form->createView(),
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager, AccountsService $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $recurringSaving = new RecurringSavings();
        $form = $this->createForm(RecurringSavingsType::class, $recurringSaving, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Set default start date if not provided
            if (!$recurringSaving->getStartOn()) {
                $recurringSaving->setStartOn(new DateTime());
            }

            // Validate start date is not in the past
            $today = new DateTime();
            $today->setTime(0, 0, 0);

            if ($recurringSaving->getStartOn() < $today) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['success' => false, 'error' => 'Start date cannot be in the past.'], 400);
                }
                $this->addFlash('error', 'Start date cannot be in the past.');
                return $this->redirectToRoute('customer_recurring_savings_index');
            }

            // Set customer
            $recurringSaving->setCustomerAccount($cAcct);

            // Persist RecurringSavings
            $entityManager->persist($recurringSaving);
            $entityManager->flush();

            // Create log
            $log = $this->createLog($recurringSaving, 'create');
            $recurringSaving->setLog($log);

            $entityManager->persist($log);
            $entityManager->flush();

            // Generate Calendar Entries for Recurring Savings
            $ok = $accountsService->generateCalendarEntriesForRecurringSavings($recurringSaving);

            // Recalculate calendar
            $accountsService->updateCalendarAccountsBalances($cAcct);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Recurring Saving created successfully',
                    'accountToWithdrawId' => $recurringSaving->getAccountToWithdraw()->getId(),
                    'accountToSaveId' => $recurringSaving->getAccountToSave()->getId()
                ]);
            }

            $this->addFlash('success', 'Recurring Saving created successfully');
            return $this->redirectToRoute('customer_recurring_savings_index');
        }

        // Check if there are accounts available
        $incomeAccounts = $entityManager->getRepository(Account::class)
            ->createQueryBuilder('a')
            ->innerJoin('a.budgetTrackingGroup', 'b')
            ->innerJoin('a.customerAccount', 'c')
            ->where('b.isIncomeOrExpense = :income')
            ->andWhere('c.id = :customerAccountId')
            ->setParameter('income', 'income')
            ->setParameter('customerAccountId', $cAcct->getId())
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        $savingsAccounts = $entityManager->getRepository(Account::class)
            ->createQueryBuilder('a')
            ->innerJoin('a.budgetTrackingGroup', 'b')
            ->innerJoin('a.customerAccount', 'c')
            ->where('b.isIncomeOrExpense = :asset')
            ->andWhere('c.id = :customerAccountId')
            ->setParameter('asset', 'asset')
            ->setParameter('customerAccountId', $cAcct->getId())
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        if (empty($incomeAccounts) || empty($savingsAccounts)) {
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse(['success' => false, 'error' => 'You need both Income and Savings accounts to create recurring savings.'], 400);
            }
            $this->addFlash('error', 'You need both Income and Savings accounts to create recurring savings.');
            return $this->redirectToRoute('customer_recurring_savings_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/recurring_savings/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $recurringSavings = $entityManager
            ->getRepository(RecurringSavings::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/recurring_savings/index.html.twig', [
            'recurringSavings' => $recurringSavings,
            'form' => $form->createView(),
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, RecurringSavings $recurringSaving, EntityManagerInterface $entityManager, AccountsService $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();

        // Ensure user owns this saving
        if ($recurringSaving->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        $originalAccountToSaveId = $recurringSaving->getAccountToSave()->getId();
        $originalAccountToWithdrawId = $recurringSaving->getAccountToWithdraw()->getId();

        $form = $this->createForm(RecurringSavingsType::class, $recurringSaving, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Create log for update
            $log = $this->createLog($recurringSaving, 'update');
            $recurringSaving->setLog($log);

            $entityManager->persist($log);

            // Flush before applying to calendar
            $entityManager->flush();

            // Remove Calendar Entries for this Recurring Savings
            $ok = $accountsService->removeCalendarEntriesForRecurringSavings($recurringSaving, $originalAccountToSaveId, $originalAccountToWithdrawId);

            // Recalculate Calendar
            $startFromDate = $recurringSaving->getStartOn();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            // Generate Calendar Entries for Recurring Savings
            $ok = $accountsService->generateCalendarEntriesForRecurringSavings($recurringSaving);

            // Recalculate Calendar
            $startFromDate = $recurringSaving->getStartOn();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Recurring Savings updated successfully',
                    'accountToWithdrawId' => $recurringSaving->getAccountToWithdraw()->getId(),
                    'accountToSaveId' => $recurringSaving->getAccountToSave()->getId()
                ]);
            }

            $this->addFlash('success', 'Recurring Saving updated successfully');
            return $this->redirectToRoute('customer_recurring_savings_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/recurring_savings/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $recurringSavings = $entityManager
            ->getRepository(RecurringSavings::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/recurring_savings/index.html.twig', [
            'recurringSavings' => $recurringSavings,
            'form' => $form->createView(),
        ]);
    }

    #[Route('/update-savings/{accountId}', name: 'update_savings_ajax', methods: ['GET','POST'])]
    public function updateRecurringSavings(int $accountId, EntityManagerInterface $entityManager, AccountsService $accountsService): JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $account = $entityManager->getRepository(Account::class)->findOneBy(['id' => $accountId, 'customerAccount' => $cAcct]);
        if ($account) {
            //Check if this account is used for accountToSave or accountToWithdraw in a saving
            $recurringSaving = $entityManager->getRepository(RecurringSavings::class)->findOneBy(['accountToWithdraw' => $account]);
            if (!$recurringSaving) {
                $recurringSaving = $entityManager->getRepository(RecurringSavings::class)->findOneBy(['accountToSave' => $account]);
            }
            if ($recurringSaving) {
                //If there is a Recurring Saving associated to this account then make updates in Calendar
                $originalAccountToSaveId = $recurringSaving->getAccountToSave()->getId();
                $originalAccountToWithdrawId = $recurringSaving->getAccountToWithdraw()->getId();

                // Remove Calendar Entries for this Recurring Savings
                $ok = $accountsService->removeCalendarEntriesForRecurringSavings($recurringSaving, $originalAccountToSaveId, $originalAccountToWithdrawId);

                // Recalculate Calendar
                $startFromDate = $recurringSaving->getStartOn();
                $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

                // Generate Calendar Entries for Recurring Savings
                $ok = $accountsService->generateCalendarEntriesForRecurringSavings($recurringSaving);

                // Recalculate Calendar
                $startFromDate = $recurringSaving->getStartOn();
                $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);
            }
        }

        return new JsonResponse(['status' => 'success']);
    }

    #[Route('/{id}', name: 'delete', methods: ['POST'])]
    public function delete(Request $request, RecurringSavings $recurringSaving, EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();

        // Ensure user owns this saving
        if ($recurringSaving->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        if ($this->isCsrfTokenValid('delete'.$recurringSaving->getId(), $request->request->get('_token'))) {

            // Set isDataUpdatedSinceLastCron = true
            $customerAccount = $recurringSaving->getCustomerAccount();
            $entityManager->flush();

            // Create log before deletion
            $log = $this->createLog($recurringSaving, 'delete');
            $entityManager->persist($log);

            $entityManager->remove($recurringSaving);
            $entityManager->flush();

            $this->addFlash('success', 'Recurring Saving deleted successfully');
        }

        return $this->redirectToRoute('customer_recurring_savings_index');
    }

    private function createLog(RecurringSavings $recurringSaving, string $action): Log
    {
        $logData = [
            'id' => $recurringSaving->getId(),
            'name' => $recurringSaving->getName(),
            'savingsStrategy' => $recurringSaving->getSavingsStrategy(),
            'startOn' => $recurringSaving->getStartOn()?->format('Y-m-d'),
            'accountToWithdraw' => $recurringSaving->getAccountToWithdraw()->getId(),
            'accountToSave' => $recurringSaving->getAccountToSave()->getId(),
            'customerAccount' => $recurringSaving->getCustomerAccount()->getId(),
            'action' => $action,
            'timestamp' => (new DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setAffectedEntityName('RecurringSavings');
        $log->setAction($action);
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new DateTime());
        $log->setCustomer($this->getUser());

        return $log;
    }
}
