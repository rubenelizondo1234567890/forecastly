<?php
// src/Controller/Customer/CustomerResetController.php

namespace App\Controller\Customer;

use App\Entity\Account;
use App\Entity\BudgetTrackingGroup;
use App\Entity\Customer;
use App\Entity\CustomerQuizzes;
use App\Entity\CustomersAccount;
use App\Entity\Log;
use App\Entity\NonRecurringExpense;
use App\Entity\NonRecurringIncome;
use App\Entity\RecurringExpense;
use App\Entity\RecurringIncome;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\RecurringInterest;
use App\Entity\RecurringSavings;
use App\Entity\RevolvingPayments;
use App\Form\CustomerType;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

#[Route('/customer-account-settings')]
class CustomerAccountSettingsController extends AbstractController
{
    #[Route('/reset-account', name: 'customer_account_settings_reset_account', methods: ['GET'])]
    public function resetAccount(EntityManagerInterface $em, Request $request): JsonResponse
    {
        // Ensure user is authenticated
        $this->denyAccessUnlessGranted('ROLE_CUSTOMER');
        $customer = $this->getUser();

        // Start transaction
        $em->getConnection()->beginTransaction();

        try {
            // Delete all related financial data
            $this->deleteEntityData($em, AccountsTrackingCalendar::class, $customer);
            $this->deleteEntityData($em, NonRecurringExpense::class, $customer);
            $this->deleteEntityData($em, NonRecurringIncome::class, $customer);
            $this->deleteEntityData($em, RecurringExpense::class, $customer);
            $this->deleteEntityData($em, RecurringIncome::class, $customer);
            $this->deleteEntityData($em, RecurringInterest::class, $customer);
            $this->deleteEntityData($em, RevolvingPayments::class, $customer);
            $this->deleteEntityData($em, RecurringSavings::class, $customer);
            $this->deleteEntityData($em, Account::class, $customer);
            $this->deleteEntityData($em, BudgetTrackingGroup::class, $customer);
            $this->deleteEntityData($em, Log::class, $customer);

            // Commit transaction
            $em->getConnection()->commit();
            $em->clear();
        } catch (Exception $e) {
            // Rollback on error
            $em->getConnection()->rollBack();
            return new JsonResponse([
                'success' => false,
                'error' => 'Failed to reset account: ' . $e->getMessage()
            ], 500);
        }

        try {
            $cAcct = $this->getUser()->getCustomersAccount();
            // Generate 30 years of calendar entries
            $this->generateCalendarEntries($cAcct, $em);
            // Allow Budget Groups to be loaded from Master Ones
            $customerAcct = $em->getRepository(CustomersAccount::class)->find($cAcct->getId());
            $customerAcct->setIsMasterBudgetTrackingGroupLoaded(false);
            $em->flush();
        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Failed to reset account: ' . $e->getMessage()
            ], 500);
        }

        return new JsonResponse([
            'success' => true,
            'message' => 'Your account data has been successfully reset. The dashboard will refresh shortly.'
        ]);
    }

    #[Route('/', name: 'customer_account_settings_index', methods: ['GET'])]
    public function index(EntityManagerInterface $em): Response
    {
        $this->denyAccessUnlessGranted('ROLE_CUSTOMER');
        $customerAccount = $this->getUser()->getCustomersAccount();

        $customers = $em->getRepository(Customer::class)->findBy([
            'customersAccount' => $customerAccount
        ]);

        $mainCustomer = null;
        foreach ($customers as $cust) {
            if ($cust->isMain()) {
                $mainCustomer = $cust;
                break;
            }
        }

        $quizProgress = [];
        if ($mainCustomer) {
            $quizRepo = $em->getRepository(CustomerQuizzes::class);
            $quizzes = $quizRepo->createQueryBuilder('cq')
                ->select('cq, p, j')
                ->join('cq.page', 'p')
                ->join('p.journey', 'j')
                ->where('cq.customer = :customer')
                ->setParameter('customer', $mainCustomer)
                ->getQuery()
                ->getResult();

            $journeyMap = [];
            foreach ($quizzes as $quiz) {
                $journey = $quiz->getPage()->getJourney();
                if (!$journey) continue;
                $journeyId = $journey->getId();
                if (!isset($journeyMap[$journeyId])) {
                    $journeyMap[$journeyId] = [
                        'journey' => $journey,
                        'quizzes' => [],
                        'totalScore' => 0,
                        'count' => 0,
                    ];
                }
                $journeyMap[$journeyId]['quizzes'][] = [
                    'page' => $quiz->getPage(),
                    'score' => $quiz->getQuizzScore(),
                    'date' => $quiz->getDateQuizzTaken(),
                ];
                $journeyMap[$journeyId]['totalScore'] += $quiz->getQuizzScore();
                $journeyMap[$journeyId]['count']++;
            }

            foreach ($journeyMap as &$data) {
                $data['average'] = $data['count'] > 0 ? round($data['totalScore'] / $data['count']) : 0;
            }
            $quizProgress = array_values($journeyMap);
        }

        return $this->render('customer/account_settings/index.html.twig', [
            'customers' => $customers,
            'customerAccount' => $customerAccount,
            'quizProgress' => $quizProgress,
        ]);
    }

    #[Route('/edit/{id}', name: 'customer_account_settings_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Customer $customer, EntityManagerInterface $em, SluggerInterface $slugger): Response
    {
        $this->denyAccessUnlessGranted('ROLE_CUSTOMER');

        // Check if customer belongs to current user's account
        if ($customer->getCustomersAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            throw new AccessDeniedException('You cannot edit this customer.');
        }

        $form = $this->createForm(CustomerType::class, $customer, ['is_edit' => true]);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            /** @var UploadedFile $avatarFile */
            $avatarFile = $form->get('avatarFile')->getData();

            if ($avatarFile) {
                $originalFilename = pathinfo($avatarFile->getClientOriginalName(), PATHINFO_FILENAME);
                $safeFilename = $slugger->slug($originalFilename);
                $newFilename = $safeFilename.'-'.uniqid().'.'.$avatarFile->guessExtension();

                try {
                    $avatarFile->move(
                        $this->getParameter('avatars_directory'),
                        $newFilename
                    );
                } catch (FileException $e) {
                    // Handle exception if something happens during file upload
                }

                $customer->setAvatarImage($newFilename);
            }

            $customer->setUpdatedAt(new \DateTime());
            $em->flush();

            return $this->redirectToRoute('customer_account_settings_index');
        }

        return $this->render('customer/account_settings/_edit_customer_for_this_account.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    #[Route('/new', name: 'customer_account_settings_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $em, SluggerInterface $slugger): Response
    {
        $this->denyAccessUnlessGranted('ROLE_CUSTOMER');

        $customer = new Customer();
        $customer->setCustomersAccount($this->getUser()->getCustomersAccount());
        $customer->setIsActive(true);
        $customer->setIsConfirmed(true);
        $customer->setCreatedAt(new \DateTime());

        $form = $this->createForm(CustomerType::class, $customer);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            /** @var UploadedFile $avatarFile */
            $avatarFile = $form->get('avatarFile')->getData();

            if ($avatarFile) {
                $originalFilename = pathinfo($avatarFile->getClientOriginalName(), PATHINFO_FILENAME);
                $safeFilename = $slugger->slug($originalFilename);
                $newFilename = $safeFilename.'-'.uniqid().'.'.$avatarFile->guessExtension();

                try {
                    $avatarFile->move(
                        $this->getParameter('avatars_directory'),
                        $newFilename
                    );
                } catch (FileException $e) {
                    // Handle exception if something happens during file upload
                }

                $customer->setAvatarImage($newFilename);
            }

            $em->persist($customer);
            $em->flush();

            return $this->redirectToRoute('customer_account_settings_index');
        }

        return $this->render('customer/account_settings/_new_customer_for_this_account.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    /**
     * @param CustomersAccount $account
     * @param EntityManagerInterface $entityManager
     * @return void
     * @throws Exception
     */
    private function generateCalendarEntries(CustomersAccount $account, EntityManagerInterface $entityManager): void
    {
        $connection = $entityManager->getConnection();
        $yearDate = new \DateTime(date('Y-01-01')); // January 1st of current year
        $startDate = (clone $yearDate)->modify('-1 month');
        $endDate = (clone $startDate)->modify('+5 years');//TODO: Change to Subscription Plan's range in production

        $currentDate = clone $startDate;
        $batchSize = 100;
        $counter = 0;
        $values = [];

        while ($currentDate <= $endDate) {
            $values[] = sprintf(
                "(NULL, '%s', '{}', '{}', '{}', '{}', '{}', %d, '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}')",
                $currentDate->format('Y-m-d H:i:s'),
                $account->getId()
            );

            // Move to next day
            $currentDate->modify('+1 day');
            $counter++;

            // Execute batch insert every 100 entries
            if ($counter % $batchSize === 0) {
                $this->executeBatchInsert($connection, $values);
                $values = []; // Reset values array
            }
        }

        // Insert any remaining entries
        if (!empty($values)) {
            $this->executeBatchInsert($connection, $values);
        }
    }

    /**
     * Execute a batch insert of calendar entries
     */
    private function executeBatchInsert($connection, array $values): void
    {
        if (empty($values)) {
            return;
        }

        $sql = sprintf(
            "INSERT INTO accounts_tracking_calendar
        (
            id,
            calendar_date,
            recurring_incomes,
            non_recurring_incomes,
            recurring_expenses,
            non_recurring_expenses,
            accounts_balances,
            customers_account_id,
            recurring_income_interest,
            recurring_expense_interest,
            payments_account_to_pay,
            payments_account_to_withdraw,
            metadata,
            savings_account_to_save,
            savings_account_to_withdraw,
            recurring_savings_interest
         )
        VALUES %s",
            implode(',', $values)
        );

        $connection->executeStatement($sql);
    }

    /**
     * @param EntityManagerInterface $em
     * @param string $entityClass
     * @param $customer
     * @return void
     */
    private function deleteEntityData(EntityManagerInterface $em, string $entityClass, $customer): void
    {
        $repo = $em->getRepository($entityClass);

        // Check if entity has a customer relationship
        $metadata = $em->getClassMetadata($entityClass);
        $hasCustomer = $metadata->hasAssociation('customer') &&
            $metadata->getAssociationTargetClass('customer') === get_class($customer);

        // Check if entity has a customerAccount relationship
        $hasCustomerAccount = $metadata->hasAssociation('customerAccount') &&
            $metadata->getAssociationTargetClass('customerAccount') === CustomersAccount::class;

        // Check if entity has a customersAccount relationship
        $hasCustomersAccount = $metadata->hasAssociation('customersAccount') &&
            $metadata->getAssociationTargetClass('customersAccount') === CustomersAccount::class;

        if ($hasCustomer) {
            $entities = $repo->findBy(['customer' => $customer]);
            foreach ($entities as $entity) {
                $em->remove($entity);
            }
        } else if ($hasCustomerAccount) {
            $customerAccount = $customer->getCustomersAccount();
            $entities = $repo->findBy(['customerAccount' => $customerAccount]);
            foreach ($entities as $entity) {
                $em->remove($entity);
            }
        } else if ($hasCustomersAccount) {
            $customerAccount = $customer->getCustomersAccount();
            $entities = $repo->findBy(['customersAccount' => $customerAccount]);
            foreach ($entities as $entity) {
                $em->remove($entity);
            }
        }

        $em->flush();
    }
}
