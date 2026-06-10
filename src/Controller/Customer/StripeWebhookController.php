<?php

namespace App\Controller\Customer;

use App\Entity\Subscriptions;
use App\Services\StripeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class StripeWebhookController extends AbstractController
{
    #[Route('/webhook/stripe', name: 'app_webhook_stripe', methods: ['POST'])]
    public function handleWebhook(Request $request): Response
    {
        $payload = $request->getContent();
        $sig_header = $request->headers->get('stripe-signature');
        
        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sig_header, $this->stripeWebhookSecret
            );
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            return new Response('Invalid payload', 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Invalid signature
            return new Response('Invalid signature', 400);
        }
        
        // Handle the event
        switch ($event->type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                $subscription = $event->data->object;
                $this->handleSubscriptionEvent($event->type, $subscription);
                break;
            case 'invoice.payment_succeeded':
                $invoice = $event->data->object;
                $this->handlePaymentSucceeded($invoice);
                break;
            case 'invoice.payment_failed':
                $invoice = $event->data->object;
                $this->handlePaymentFailed($invoice);
                break;
            default:
                // Unexpected event type
                return new Response('Unexpected event type', 400);
        }
        
        return new Response('Webhook handled', 200);
    }
    
    private function handleSubscriptionEvent(string $eventType, object $stripeSubscription): void
    {
        $subscription = $this->entityManager->getRepository(Subscription::class)
            ->findByStripeSubscriptionId($stripeSubscription->id);
        
        if (!$subscription) {
            // You might want to create a new subscription here if it doesn't exist
            return;
        }
        
        switch ($eventType) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                $subscription->setStatus($stripeSubscription->status);
                $subscription->setCurrentPeriodStart(
                    \DateTimeImmutable::createFromFormat('U', $stripeSubscription->current_period_start)
                );
                $subscription->setCurrentPeriodEnd(
                    \DateTimeImmutable::createFromFormat('U', $stripeSubscription->current_period_end)
                );
                $subscription->setUpdatedAt(new \DateTimeImmutable());
                break;
            case 'customer.subscription.deleted':
                $subscription->setStatus('canceled');
                $subscription->setCanceledAt(new \DateTimeImmutable());
                break;
        }
        
        $this->entityManager->flush();
    }
    
    private function handlePaymentSucceeded(object $invoice): void
    {
        // Handle successful payment
        // You might want to send an email confirmation here
    }
    
    private function handlePaymentFailed(object $invoice): void
    {
        // Handle failed payment
        // You might want to send an email notification here
    }
}