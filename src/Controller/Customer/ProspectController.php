<?php

// src/Controller/ProspectController.php
namespace App\Controller\Customer;

use App\Entity\AccountsTrackingCalendar;
use App\Entity\BudgetTrackingGroup;
use App\Entity\ContactSupport;
use App\Entity\Customer;
use App\Entity\CustomersAccount;
use App\Entity\MasterBudgetTrackingGroup;
use App\Entity\SubscriptionPlan;
use App\Entity\Subscriptions;
use App\Form\ProspectAccountType;
use App\Form\ProspectCustomerType;
use App\Services\EmailService;
use App\Services\StripeService;
use DateTime;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class ProspectController extends AbstractController
{
    #[Route('/test', name: 'customer_test', methods: ['GET'])]
    public function customerDashboard(Request $request, EntityManagerInterface $em, EmailServiceInterface $emailService): Response
    {
        //for testing purposes.. remove it
        $customer = $em->getRepository(Customer::class)->find(1);

        //Send Activation email
        $emailService->sendActivationEmail($customer);
        dd('done');
    }

    #[Route('/get-started', name: 'prospect_landing')]
    public function landing(): Response
    {
        //return $this->render('prospect/landing.html.twig');
        return $this->redirectToRoute('app_page_show', ['journey' => 'journeys', 'slug' => 'promo-landing']);
    }

    #[Route('/create-combined-account', name: 'create_combined_account', methods: ['GET', 'POST'])]
    public function createCombinedAccount(Request $request): Response
    {
        $plan = $request->query->get('plan', 'standard');

        // Validate the plan
        $validPlans = ['standard', 'premium'];
        if (!in_array($plan, $validPlans)) {
            $plan = 'standard';
        }

        // Get form data from session if available
        $formData = $request->getSession()->get('registration_form_data', []);

        return $this->render('prospect/create_combined_account.html.twig', [
            'plan' => $plan,
            'form_data' => $formData
        ]);
    }

    #[Route('/process-combined-account', name: 'process_combined_account', methods: ['POST'])]
    public function processCombinedAccount(Request $request, EntityManagerInterface $entityManager, UserPasswordHasherInterface $passwordHasher, EmailServiceInterface $emailService, StripeService $stripeService): Response
    {
        $formData = $request->request->all();
        $plan = $request->request->get('plan', 'free');

        try {
            // Get the account
            $account = $entityManager->getRepository(CustomersAccount::class)
                ->find($formData['account']['id']);

            if (!$account) {
                throw new Exception('Account not found');
            }

            // Check if email already exists
            $existingCustomer = $entityManager->getRepository(Customer::class)
                ->findOneBy(['email' => $formData['customer']['email']]);

            if ($existingCustomer) {
                // Delete the account that was created in step 1 since registration failed
                $entityManager->remove($account);
                $entityManager->flush();

                // Store form data in session for repopulation
                $request->getSession()->set('registration_form_data', $formData);

                $this->addFlash('error', 'This email address is already registered. Please use a different email address or try logging in.');
                return $this->redirectToRoute('create_combined_account', [
                    'plan' => $plan
                ]);
            }

            // Check if username already exists
            $existingUsername = $entityManager->getRepository(Customer::class)
                ->findOneBy(['username' => $formData['customer']['username']]);

            if ($existingUsername) {
                // Delete the account that was created in step 1 since registration failed
                $entityManager->remove($account);
                $entityManager->flush();

                // Store form data in session for repopulation
                $request->getSession()->set('registration_form_data', $formData);

                $this->addFlash('error', 'This username is already taken. Please choose a different username.');
                return $this->redirectToRoute('create_combined_account', [
                    'plan' => $plan
                ]);
            }

            // Create customer
            $customer = new Customer();
            $customer->setUsername($formData['customer']['username']);
            $customer->setFirstName($formData['customer']['firstName']);
            $customer->setLastName($formData['customer']['lastName']);
            $customer->setEmail($formData['customer']['email']);
            $customer->setPhoneNumber($formData['customer']['phoneNumber'] ?? '');
            $customer->setIsMain(true);
            $customer->setIsActive(false);
            $customer->setIsConfirmed(false);
            $customer->setCreatedAt(new DateTime());
            $customer->setCustomersAccount($account);

            // Hash password
            $hashedPassword = $passwordHasher->hashPassword(
                $customer,
                $formData['customer']['plainPassword']['first']
            );
            $customer->setPassword($hashedPassword);

            // Generate activation token
            $customer->setPasswordResetToken(uniqid() . '_' . time());

            $entityManager->persist($customer);
            $entityManager->flush();

            // Add Customer to marketing list
            $contactSupport = new ContactSupport();
            $contactSupport->setEmail($customer->getEmail());
            $contactSupport->setAlreadyCustomer(true);
            $contactSupport->setAuthorizeContact(true);
            $contactSupport->setDescription('Customer Sign Up');
            $contactSupport->setTitle('Customer Sign Up');
            $contactSupport->setPhone($customer->getPhoneNumber());
            $contactSupport->setFullName($customer->getFirstName() . ' ' . $customer->getLastName());
            $entityManager->persist($contactSupport);
            $entityManager->flush();

            if ($plan != 'free') {
                // Store customer and account IDs in session for Stripe checkout
                $request->getSession()->set('pending_customer_id', $customer->getId());
                $request->getSession()->set('pending_account_id', $account->getId());
                $request->getSession()->set('pending_plan', $plan);

                // Redirect to Stripe checkout page
                return $this->redirectToRoute('stripe_checkout', ['plan' => $plan]);
            }

            // For free plan, send activation email immediately
            $emailService->sendActivationEmail($customer);

            // Clear any stored form data since registration is successful
            $request->getSession()->remove('registration_form_data');

            return $this->redirectToRoute('registration_success', [
                'accountId' => $account->getId(),
                'customerId' => $customer->getId(),
                'plan' => $plan
            ]);

        } catch (Exception $e) {
            // Handle error - check if it's a unique constraint violation
            if (strpos($e->getMessage(), 'UNIQUE') !== false || strpos($e->getMessage(), 'unique') !== false) {
                if (isset($account) && $account) {
                    // Delete the account that was created in step 1 since registration failed
                    $entityManager->remove($account);
                    $entityManager->flush();
                }

                // Store form data in session for repopulation
                $request->getSession()->set('registration_form_data', $formData);

                if (strpos($e->getMessage(), 'email') !== false) {
                    $this->addFlash('error', 'This email address is already registered. Please use a different email address or try logging in.');
                } elseif (strpos($e->getMessage(), 'username') !== false) {
                    $this->addFlash('error', 'This username is already taken. Please choose a different username.');
                } else {
                    $this->addFlash('error', 'The provided information conflicts with an existing account. Please check your details and try again.');
                }
            } else {
                $this->addFlash('error', 'Error creating account: ' . $e->getMessage());
            }

            return $this->redirectToRoute('create_combined_account', [
                'plan' => $plan
            ]);
        }
    }

    #[Route('/create-account-ajax', name: 'create_account_ajax', methods: ['POST'])]
    public function createAccountAjax(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        try {
            // Create new account
            $account = new CustomersAccount();
            $account->setAccountName($data['accountName']);
            $account->setCreatedAt(new DateTime());
            $account->setIsActive(false);
            $account->setIsMasterBudgetTrackingGroupLoaded(false);

            // Get subscription plan
            $plan = $entityManager->getRepository(SubscriptionPlan::class)
                ->findOneBy(['planName' => $data['subscriptionPlan']]);

            if (!$plan) {
                return new JsonResponse(['success' => false, 'message' => 'Invalid subscription plan']);
            }

            $account->setSubscriptionPlan($plan);

            $entityManager->persist($account);
            $entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'accountId' => $account->getId()
            ]);

        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    #[Route('/registration-success', name: 'registration_success')]
    public function registrationSuccess(Request $request): Response
    {
        $accountId = $request->query->get('accountId');
        $customerId = $request->query->get('customerId');
        $plan = $request->query->get('plan', 'free');

        return $this->render('prospect/success.html.twig', [
            'accountId' => $accountId,
            'customerId' => $customerId,
            'plan' => $plan
        ]);
    }

    /**
     * @param string $token
     * @param EntityManagerInterface $entityManager
     * @return Response
     * @throws Exception
     */
    #[Route('/activate-account/{token}', name: 'activate_account')]
    public function activateAccount(string $token, EntityManagerInterface $entityManager): Response
    {
        $customer = $entityManager->getRepository(Customer::class)
            ->findOneBy(['passwordResetToken' => $token]);

        if (!$customer) {
            $this->addFlash('error', 'Invalid or expired activation token.');
            return $this->redirectToRoute('prospect_landing');
        }

        // Split token to check expiration
        $tokenParts = explode('_', $token);
        if (count($tokenParts) < 2) {
            $this->addFlash('error', 'Invalid activation token format.');
            return $this->render('prospect/resend_activation_token.html.twig', [
                'customer' => $customer
            ]);
        }

        $exp = end($tokenParts);
        if ($exp < time() - 7200) { // 2 hours expiration
            $this->addFlash('error', 'Your activation link has expired. Please request a new one.');
            return $this->render('prospect/resend_activation_token.html.twig', [
                'customer' => $customer
            ]);
        }

        // Rest of your activation logic...
        // Activate the customer and customer account
        $customer->setIsActive(true);
        $customer->setIsConfirmed(true);
        $customer->setPasswordResetToken(null); // Clear the token

        $customerAccount = $customer->getCustomersAccount();
        $customerAccount->setIsActive(true);

        $entityManager->flush();

        // Generate calendar entries
        $account = $customer->getCustomersAccount();
        $this->generateCalendarEntries($account, $entityManager);

        $this->addFlash('success', 'Your account has been activated successfully! You can now log in.');
        return $this->redirectToRoute('customer_login');
    }

    #[Route('/resend-activation-email/{customerId}', name: 'resend_activation_email', methods: ['POST'])]
    public function resendActivationEmail(int $customerId, EntityManagerInterface $entityManager, EmailServiceInterface $emailService): JsonResponse
    {
        try {
            $customer = $entityManager->getRepository(Customer::class)->find($customerId);

            if (!$customer) {
                return new JsonResponse(['success' => false, 'message' => 'Customer not found']);
            }

            // Generate new token
            $customer->setPasswordResetToken(uniqid() . '_' . time());
            $entityManager->flush();

            // Send activation email
            $result = $emailService->sendActivationEmail($customer);

            if ($result) {
                return new JsonResponse(['success' => true, 'message' => 'Activation email sent successfully']);
            } else {
                return new JsonResponse(['success' => false, 'message' => 'Failed to send activation email']);
            }
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    #[Route('/stripe-checkout/{plan}', name: 'stripe_checkout', methods: ['GET'])]
    public function stripeCheckout(string $plan, Request $request, EntityManagerInterface $entityManager, StripeService $stripeService): Response
    {
        $customerId = $request->getSession()->get('pending_customer_id');
        $accountId = $request->getSession()->get('pending_account_id');

        if (!$customerId || !$accountId) {
            $this->addFlash('error', 'Session expired. Please start the registration process again.');
            return $this->redirectToRoute('create_combined_account', ['plan' => $plan]);
        }

        $customer = $entityManager->getRepository(Customer::class)->find($customerId);
        $account = $entityManager->getRepository(CustomersAccount::class)->find($accountId);

        if (!$customer || !$account) {
            $this->addFlash('error', 'Invalid customer or account. Please start over.');
            return $this->redirectToRoute('create_combined_account', ['plan' => $plan]);
        }

        // Get subscription plans for the selected plan (both monthly and yearly)
        $subscriptionPlans = $entityManager->getRepository(SubscriptionPlan::class)
            ->findBy(['planName' => $plan, 'isActive' => true]);

        return $this->render('prospect/stripe_new_customer_checkout.html.twig', [
            'plan' => $plan,
            'customer' => $customer,
            'account' => $account,
            'subscriptionPlans' => $subscriptionPlans,
            'stripe_publishable_key' => $stripeService->getPublishableKey()
        ]);
    }

    #[Route('/create-stripe-checkout-session', name: 'create_stripe_checkout_session', methods: ['POST'])]
    public function createStripeCheckoutSession(Request $request, EntityManagerInterface $entityManager, StripeService $stripeService, EmailServiceInterface $emailService): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $priceId = $data['priceId'];
        $interval = $data['interval'];

        $customerId = $request->getSession()->get('pending_customer_id');
        $accountId = $request->getSession()->get('pending_account_id');
        $plan = $request->getSession()->get('pending_plan');

        try {
            $customer = $entityManager->getRepository(Customer::class)->find($customerId);
            $account = $entityManager->getRepository(CustomersAccount::class)->find($accountId);

            if (!$customer || !$account) {
                throw new Exception('Customer or account not found');
            }

            // Create Stripe customer
            $stripeCustomerId = $stripeService->createCustomer([
                'id' => $customer->getId(),
                'accountId' => $account->getId(),
                'email' => $customer->getEmail(),
                'firstName' => $customer->getFirstName(),
                'lastName' => $customer->getLastName()
            ]);

            // Create checkout session
            $checkoutSession = $stripeService->createCheckoutSession(
                $stripeCustomerId,
                $priceId,
                [
                    'customer_id' => $customer->getId(),
                    'account_id' => $account->getId(),
                    'plan' => $plan,
                    'interval' => $interval,
                    'success_url' => $this->generateUrl('stripe_checkout_success', [], UrlGeneratorInterface::ABSOLUTE_URL),
                    'cancel_url' => $this->generateUrl('stripe_checkout_cancel', [], UrlGeneratorInterface::ABSOLUTE_URL)
                ]
            );

            // Store Stripe customer ID and session ID in session for later use
            $request->getSession()->set('stripe_customer_id', $stripeCustomerId);
            $request->getSession()->set('stripe_session_id', $checkoutSession->id);
            $request->getSession()->set('stripe_plan_interval', $interval);

            return new JsonResponse([
                'success' => true,
                'sessionId' => $checkoutSession->id
            ]);

        } catch (Exception $e) {
            // Clean up on error
            if (isset($customer) && $customer) {
                $entityManager->remove($customer);
            }
            if (isset($account) && $account) {
                $entityManager->remove($account);
            }
            $entityManager->flush();

            return new JsonResponse([
                'success' => false,
                'message' => 'Failed to create checkout session: ' . $e->getMessage()
            ]);
        }
    }

    #[Route('/stripe-checkout-success', name: 'stripe_checkout_success', methods: ['GET'])]
    public function stripeCheckoutSuccess(Request $request, EntityManagerInterface $entityManager, EmailServiceInterface $emailService, StripeService $stripeService): Response
    {
        $sessionId = $request->query->get('session_id');
        $customerId = $request->getSession()->get('pending_customer_id');
        $accountId = $request->getSession()->get('pending_account_id');
        $stripeCustomerId = $request->getSession()->get('stripe_customer_id');
        $plan = $request->getSession()->get('pending_plan');
        $interval = $request->getSession()->get('stripe_plan_interval');

        try {
            if (!$sessionId || !$customerId || !$accountId) {
                throw new Exception('Missing session data');
            }

            // Get the basic checkout session first
            $checkoutSession = $stripeService->getCheckoutSession($sessionId);

            if ($checkoutSession->payment_status !== 'paid') {
                throw new Exception('Payment not completed successfully');
            }

            $customer = $entityManager->getRepository(Customer::class)->find($customerId);
            $account = $entityManager->getRepository(CustomersAccount::class)->find($accountId);

            if (!$customer || !$account) {
                throw new Exception('Customer or account not found');
            }

            $subscriptionPlan = $entityManager->getRepository(SubscriptionPlan::class)->findOneBy(['planName' => $plan, 'stripeInterval' => $interval]);
            // Get the subscription details separately
            $stripeSubscription = $stripeService->getSubscription($checkoutSession->subscription);
            //dd($stripeSubscription);
            // Create Subscriptions entity to track the Stripe subscription
            $subscription = new Subscriptions();
            $subscription->setCustomerAccount($account);
            $subscription->setStripeSubscriptionId($stripeSubscription->id);
            $subscription->setStripeCustomerId($stripeCustomerId);
            $subscription->setStripePriceId($subscriptionPlan->getStripePriceId());
            $subscription->setStatus($stripeSubscription->status);

            // Fix for PHP 8.3: Use setTimestamp() method
            $currentPeriodStart = new DateTime();
            $currentPeriodStart->setTimestamp($stripeSubscription->items->data[0]->current_period_start);
            $subscription->setCurrentPeriodStart($currentPeriodStart);

            $currentPeriodEnd = new DateTime();
            $currentPeriodEnd->setTimestamp($stripeSubscription->items->data[0]->current_period_end);
            $subscription->setCurrentPeriodEnd($currentPeriodEnd);

            $entityManager->persist($subscription);
            $entityManager->flush();

            // Update the account's subscription plan based on the Stripe price ID
            if ($subscriptionPlan) {
                $account->setSubscriptionPlan($subscriptionPlan);
                $entityManager->flush();
            }

            // Send activation email
            $emailService->sendActivationEmail($customer);

            // Clear session data
            $request->getSession()->remove('pending_customer_id');
            $request->getSession()->remove('pending_account_id');
            $request->getSession()->remove('pending_plan');
            $request->getSession()->remove('stripe_customer_id');
            $request->getSession()->remove('stripe_session_id');
            $request->getSession()->remove('registration_form_data');

            return $this->redirectToRoute('registration_success', [
                'accountId' => $account->getId(),
                'customerId' => $customer->getId(),
                'plan' => $plan
            ]);

        } catch (Exception $e) {
            // Clean up on failure
            $customer = $entityManager->getRepository(Customer::class)->find($customerId);
            $account = $entityManager->getRepository(CustomersAccount::class)->find($accountId);

            if ($customer) {
                $entityManager->remove($customer);
            }
            if ($account) {
                $entityManager->remove($account);
            }
            $entityManager->flush();

            $this->addFlash('error', 'Payment failed: ' . $e->getMessage());
            return $this->redirectToRoute('create_combined_account', ['plan' => $plan]);
        }
    }

    #[Route('/stripe-checkout-cancel', name: 'stripe_checkout_cancel', methods: ['GET'])]
    public function stripeCheckoutCancel(Request $request, EntityManagerInterface $entityManager): Response
    {
        $customerId = $request->getSession()->get('pending_customer_id');
        $accountId = $request->getSession()->get('pending_account_id');
        $plan = $request->getSession()->get('pending_plan');

        // Clean up - remove the customer and account since payment was cancelled
        if ($customerId) {
            $customer = $entityManager->getRepository(Customer::class)->find($customerId);
            if ($customer) {
                $entityManager->remove($customer);
            }
        }

        if ($accountId) {
            $account = $entityManager->getRepository(CustomersAccount::class)->find($accountId);
            if ($account) {
                $entityManager->remove($account);
            }
        }

        $entityManager->flush();

        // Clear session data
        $request->getSession()->remove('pending_customer_id');
        $request->getSession()->remove('pending_account_id');
        $request->getSession()->remove('pending_plan');
        $request->getSession()->remove('stripe_customer_id');
        $request->getSession()->remove('stripe_session_id');

        $this->addFlash('warning', 'Payment was cancelled. Please try again if you wish to complete your registration.');
        return $this->redirectToRoute('create_combined_account', ['plan' => $plan]);
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
        $startDate = new DateTime(date('Y-01-01')); // January 1st of current year

        switch ($account->getSubscriptionPlan()->getPlanName()) {
            case 'standard':
                $endDate = (clone $startDate)->modify('+10 years');
                break;
            case 'premium':
                $endDate = (clone $startDate)->modify('+15 years');
                break;
            case 'free':
            default:
                $endDate = (clone $startDate)->modify('+5 years');
                break;
        }

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

}
