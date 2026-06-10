<?php

namespace App\Controller\Customer;

use App\Entity\Account;
use App\Entity\Log;
use App\Entity\RecurringInterest;
use App\Entity\RevolvingPayments;
use App\Form\RevolvingPaymentsType;
use App\Services\AccountsService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/revolving-payments', name: 'customer_revolving_payments_')]
#[IsGranted('ROLE_CUSTOMER')]
class RevolvingPaymentsController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $revolvingPayments = $entityManager
            ->getRepository(RevolvingPayments::class)
            ->findBy(['customerAccount' => $cAcct]);

        // Create new form
        $revolvingPayment = new RevolvingPayments();
        $form = $this->createForm(RevolvingPaymentsType::class, $revolvingPayment, [
            'customerAccount' => $cAcct,
        ]);

        return $this->render('customer/revolving_payments/index.html.twig', [
            'revolvingPayments' => $revolvingPayments,
            'form' => $form->createView(),
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager, AccountsService $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $revolvingPayment = new RevolvingPayments();
        $form = $this->createForm(RevolvingPaymentsType::class, $revolvingPayment, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Set default start date if not provided
            if (!$revolvingPayment->getStartOn()) {
                $revolvingPayment->setStartOn(new DateTime());
            }

            // Validate start date is not in the past
            $today = new DateTime();
            $today->setTime(0, 0, 0);

            if ($revolvingPayment->getStartOn() < $today) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['success' => false, 'error' => 'Start date cannot be in the past.'], 400);
                }
                $this->addFlash('error', 'Start date cannot be in the past.');
                return $this->redirectToRoute('customer_revolving_payments_index');
            }

            // Set customer
            $revolvingPayment->setCustomerAccount($cAcct);

            // Persist RevolvingPayments
            $entityManager->persist($revolvingPayment);
            $entityManager->flush();

            // Create log
            $log = $this->createLog($revolvingPayment, 'create');
            $revolvingPayment->setLog($log);

            $entityManager->persist($log);
            $entityManager->flush();

            // Generate Calendar Entries for Revolving Payments
            $ok = $accountsService->generateCalendarEntriesForRevolvingPayment($revolvingPayment);

            // Recalculate calendar
            $accountsService->updateCalendarAccountsBalances($cAcct);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Revolving payment created successfully',
                    'accountToWithdrawId' => $revolvingPayment->getAccountToWithdraw()->getId(),
                    'accountToPayId' => $revolvingPayment->getAccountToPay()->getId()
                ]);
            }

            $this->addFlash('success', 'Revolving payment created successfully');
            return $this->redirectToRoute('customer_revolving_payments_index');
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

        $expenseAccounts = $entityManager->getRepository(Account::class)
            ->createQueryBuilder('a')
            ->innerJoin('a.budgetTrackingGroup', 'b')
            ->innerJoin('a.customerAccount', 'c')
            ->where('b.isIncomeOrExpense = :expense')
            ->andWhere('c.id = :customerAccountId')
            ->setParameter('expense', 'expense')
            ->setParameter('customerAccountId', $cAcct->getId())
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        if (empty($incomeAccounts) || empty($expenseAccounts)) {
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse(['success' => false, 'error' => 'You need both Income and Expense accounts to create revolving payments.'], 400);
            }
            $this->addFlash('error', 'You need both Income and Expense accounts to create revolving payments.');
            return $this->redirectToRoute('customer_revolving_payments_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/revolving_payments/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $revolvingPayments = $entityManager
            ->getRepository(RevolvingPayments::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/revolving_payments/index.html.twig', [
            'revolvingPayments' => $revolvingPayments,
            'form' => $form->createView(),
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, RevolvingPayments $revolvingPayment, EntityManagerInterface $entityManager, AccountsService $accountsService): Response|JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();

        // Ensure user owns this payment
        if ($revolvingPayment->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        $originalAccountToPayId = $revolvingPayment->getAccountToPay()->getId();
        $originalAccountToWithdrawId = $revolvingPayment->getAccountToWithdraw()->getId();

        $form = $this->createForm(RevolvingPaymentsType::class, $revolvingPayment, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Create log for update
            $log = $this->createLog($revolvingPayment, 'update');
            $revolvingPayment->setLog($log);

            $entityManager->persist($log);

            // Flush before applying to calendar
            $entityManager->flush();

            // Remove Calendar Entries for this Revolving Payments
            $ok = $accountsService->removeCalendarEntriesForRevolvingPayment($revolvingPayment, $originalAccountToPayId, $originalAccountToWithdrawId);

            // Recalculate Calendar
            $startFromDate = $revolvingPayment->getStartOn();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            // Generate Calendar Entries for Revolving Payments
            $ok = $accountsService->generateCalendarEntriesForRevolvingPayment($revolvingPayment);

            // Recalculate Calendar
            $startFromDate = $revolvingPayment->getStartOn();
            $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Revolving payment updated successfully',
                    'accountToWithdrawId' => $revolvingPayment->getAccountToWithdraw()->getId(),
                    'accountToPayId' => $revolvingPayment->getAccountToPay()->getId()
                ]);
            }

            $this->addFlash('success', 'Revolving payment updated successfully');
            return $this->redirectToRoute('customer_revolving_payments_index');
        }

        // If form is not valid and it's AJAX, return form with errors
        if ($form->isSubmitted() && $request->isXmlHttpRequest()) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Form validation failed',
                'form' => $this->renderView('customer/revolving_payments/_form.html.twig', [
                    'form' => $form->createView(),
                ])
            ], 400);
        }

        // If form is not valid, redirect back to index with form errors
        $revolvingPayments = $entityManager
            ->getRepository(RevolvingPayments::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/revolving_payments/index.html.twig', [
            'revolvingPayments' => $revolvingPayments,
            'form' => $form->createView(),
        ]);
    }

    #[Route('/update-payments/{accountId}', name: 'update_payments_ajax', methods: ['GET','POST'])]
    public function updateRevolvingPayments(int $accountId, EntityManagerInterface $entityManager, AccountsService $accountsService): JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $account = $entityManager->getRepository(Account::class)->findOneBy(['id' => $accountId, 'customerAccount' => $cAcct]);
        if ($account) {
            //Check if this account is used for accountToPay or accountToWithdraw in a payment
            $revolvingPayment = $entityManager->getRepository(RevolvingPayments::class)->findOneBy(['accountToWithdraw' => $account]);
            if (!$revolvingPayment) {
                $revolvingPayment = $entityManager->getRepository(RevolvingPayments::class)->findOneBy(['accountToPay' => $account]);
            }
            if ($revolvingPayment) {
                //If there is a Revolving Payment associated to this account then make updates in Calendar
                $originalAccountToPayId = $revolvingPayment->getAccountToPay()->getId();
                $originalAccountToWithdrawId = $revolvingPayment->getAccountToWithdraw()->getId();

                // Remove Calendar Entries for this Revolving Payments
                $ok = $accountsService->removeCalendarEntriesForRevolvingPayment($revolvingPayment, $originalAccountToPayId, $originalAccountToWithdrawId);

                // Recalculate Calendar
                $startFromDate = $revolvingPayment->getStartOn();
                $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);

                // Generate Calendar Entries for Revolving Payments
                $ok = $accountsService->generateCalendarEntriesForRevolvingPayment($revolvingPayment);

                // Recalculate Calendar
                $startFromDate = $revolvingPayment->getStartOn();
                $accountsService->updateCalendarAccountsBalances($cAcct, $startFromDate);
            }
        }

        return new JsonResponse(['status' => 'success']);

    }

    #[Route('/{id}', name: 'delete', methods: ['POST'])]
    public function delete(Request $request, RevolvingPayments $revolvingPayment, EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();

        // Ensure user owns this payment
        if ($revolvingPayment->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        if ($this->isCsrfTokenValid('delete'.$revolvingPayment->getId(), $request->request->get('_token'))) {

            // Set isDataUpdatedSinceLastCron = true
            $customerAccount = $revolvingPayment->getCustomerAccount();
            $customerAccount->setIsDataUpdatedSinceLastCron(true);
            $entityManager->flush();

            // Create log before deletion
            $log = $this->createLog($revolvingPayment, 'delete');
            $entityManager->persist($log);

            $entityManager->remove($revolvingPayment);
            $entityManager->flush();

            $this->addFlash('success', 'Revolving payment deleted successfully');
        }

        return $this->redirectToRoute('customer_revolving_payments_index');
    }

    private function createLog(RevolvingPayments $revolvingPayment, string $action): Log
    {
        $logData = [
            'id' => $revolvingPayment->getId(),
            'name' => $revolvingPayment->getName(),
            'paymentStrategy' => $revolvingPayment->getPaymentStrategy(),
            'startOn' => $revolvingPayment->getStartOn()?->format('Y-m-d'),
            'canceledAfter' => $revolvingPayment->getCanceledAfter()?->format('Y-m-d'),
            'accountToWithdraw' => $revolvingPayment->getAccountToWithdraw()->getId(),
            'accountToPay' => $revolvingPayment->getAccountToPay()->getId(),
            'customerAccount' => $revolvingPayment->getCustomerAccount()->getId(),
            'action' => $action,
            'timestamp' => (new DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setAffectedEntityName('RevolvingPayments');
        $log->setAction($action);
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new DateTime());
        $log->setCustomer($this->getUser());

        return $log;
    }
}
