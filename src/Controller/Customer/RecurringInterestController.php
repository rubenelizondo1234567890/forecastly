<?php

// src/Controller/Customer/RecurringInterestController.php
namespace App\Controller\Customer;

use App\Entity\Account;
use App\Entity\RecurringInterest;
use App\Entity\Log;
use App\Form\RecurringInterestType;
use App\Services\AccountsService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/interest', name: 'customer_recurring_interest_')]
#[IsGranted('ROLE_CUSTOMER')]
class RecurringInterestController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $interests = $entityManager
            ->getRepository(RecurringInterest::class)
            ->findBy(['customerAccount' => $cAcct]);

        return $this->render('customer/interest/index.html.twig', [
            'interests' => $interests,
            'isIncomeOrExpense' => 'income',
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, RecurringInterest $interest, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): Response
    {
        $cAcct = $this->getUser()->getCustomersAccount();

        // Ensure user owns this interest
        if ($interest->getCustomerAccount() !== $cAcct) {
            throw $this->createAccessDeniedException();
        }

        // Store original values for comparison
        $originalAccountId = $interest->getAccount()->getId();
        $form = $this->createForm(RecurringInterestType::class, $interest, [
            'customerAccount' => $cAcct,
        ]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Check if account already has a recurring interest (excluding current one)
            $existingInterest = $entityManager
                ->getRepository(RecurringInterest::class)
                ->findOneBy([
                    'customerAccount' => $cAcct,
                    'account' => $interest->getAccount()
                ]);

            if ($existingInterest && $existingInterest->getId() !== $interest->getId()) {
                $this->addFlash('error', 'This account already has a recurring interest. Each account can only have one recurring interest.');
                return $this->redirectToRoute('customer_recurring_interest_index');
            }

            // Create log for update
            $log = $this->createLog($interest, 'update');
            $interest->setLog($log);

            $entityManager->persist($log);

            // Flush before applying to calendar
            $entityManager->flush();

            $this->addFlash('success', 'Recurring interest updated successfully');
            return $this->redirectToRoute('customer_recurring_interest_index');
        }

        // If form is not valid, render the edit template with form errors
        return $this->render('customer/interest/edit.html.twig', [
            'form' => $form->createView(),
            'interest' => $interest,
            'isIncomeOrExpense' => 'income',
        ]);
    }

    #[Route('/update-account-interest/{accountId}', name: 'update_account_interest_ajax', methods: ['GET','POST'])]
    public function updateInterestForAccount(int $accountId, EntityManagerInterface $entityManager, AccountsServiceInterface $accountsService): JsonResponse
    {
        $cAcct = $this->getUser()->getCustomersAccount();
        $account = $entityManager->getRepository(Account::class)->findOneBy(['id' => $accountId, 'customerAccount' => $cAcct]);
        if ($account) {
            $interest = $entityManager->getRepository(RecurringInterest::class)->findOneBy(['account' => $account, 'customerAccount' => $cAcct]);
            if ($interest) {
                // Remove Calendar Entries for this Recurring Interest from the date the account was created
                $startFromDate = $account->getCreatedOn();
                $removeFromDate = $startFromDate->format('Y-m-d');

                $ok = $accountsService->removeCalendarEntriesForRecurringInterest($interest, $accountId, $removeFromDate);

                // Recalculate calendar
                $accountsService->updateCalendarAccountsBalances($cAcct);

                // Then generate new Calendar Entries for this Recurring Interest
                $ok = $accountsService->generateCalendarEntriesForRecurringInterest($interest, $startFromDate);
                
                // Recalculate calendar
                $accountsService->updateCalendarAccountsBalances($cAcct);
            }
        }

        return new JsonResponse(['status' => 'success']);
    }

    private function createLog(RecurringInterest $interest, string $action): Log
    {
        $logData = [
            'id' => $interest->getId(),
            'name' => $interest->getName(),
            'customerAccount' => $interest->getCustomerAccount()->getId(),
            'action' => $action,
            'timestamp' => (new DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setAffectedEntityName('RecurringInterest');
        $log->setAction($action);
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new DateTime());
        $log->setCustomer($this->getUser());

        return $log;
    }
}
