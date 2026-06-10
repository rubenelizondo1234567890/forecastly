<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\Customer;
use Stripe\Price;
use Stripe\Product;
use Stripe\Subscription;
use Stripe\Checkout\Session;
use Stripe\Exception\ApiErrorException;

class StripeService
{
    private string $secretKey;
    private string $publishableKey;
    
    public function __construct(string $secretKey, string $publishableKey)
    {
        $this->secretKey = $secretKey;
        $this->publishableKey = $publishableKey;
        Stripe::setApiKey($this->secretKey);
    }
    
    /**
     * Create a Stripe customer
     */
    public function createCustomer(array $customerData): ?string
    {
        try {
            $stripeCustomer = Customer::create([
                'email' => $customerData['email'],
                'name' => $customerData['firstName'] . ' ' . $customerData['lastName'],
                'metadata' => [
                    'customer_id' => $customerData['id'],
                    'account_id' => $customerData['accountId']
                ]
            ]);
            
            return $stripeCustomer->id;
        } catch (ApiErrorException $e) {
            throw new \Exception('Failed to create Stripe customer: ' . $e->getMessage());
        }
    }
    
    /**
     * Create a Stripe Checkout Session
     */
    public function createCheckoutSession(string $stripeCustomerId, string $priceId, array $metadata): Session
    {
        try {
            return Session::create([
                'customer' => $stripeCustomerId,
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price' => $priceId,
                    'quantity' => 1,
                ]],
                'mode' => 'subscription',
                'success_url' => $metadata['success_url'] . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $metadata['cancel_url'],
                'metadata' => $metadata,
                'subscription_data' => [
                    'metadata' => $metadata
                ]
            ]);
        } catch (ApiErrorException $e) {
            throw new \Exception('Failed to create checkout session: ' . $e->getMessage());
        }
    }
    
    /**
     * Retrieve a Checkout Session
     */
    public function getCheckoutSession(string $sessionId): Session
    {
        try {
            return Session::retrieve($sessionId);
        } catch (ApiErrorException $e) {
            throw new \Exception('Failed to retrieve checkout session: ' . $e->getMessage());
        }
    }
    
    /**
     * Get publishable key
     */
    public function getPublishableKey(): string
    {
        return $this->publishableKey;
    }
    
    /**
     * Retrieve a Stripe Subscription
     */
    public function getSubscription(string $subscriptionId): Subscription
    {
        try {
            return Subscription::retrieve($subscriptionId);
        } catch (ApiErrorException $e) {
            throw new \Exception('Failed to retrieve subscription: ' . $e->getMessage());
        }
    }
    
    /**
     * Retrieve a Checkout Session with expanded subscription details
     */
    public function getCheckoutSessionWithSubscription(string $sessionId): Session
    {
        try {
            return Session::retrieve([
                'id' => $sessionId
            ]);
        } catch (ApiErrorException $e) {
            throw new \Exception('Failed to retrieve checkout session: ' . $e->getMessage());
        }
    }
}