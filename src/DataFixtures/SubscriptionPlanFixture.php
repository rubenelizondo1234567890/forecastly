<?php

namespace App\DataFixtures;

use App\Entity\SubscriptionPlan;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class SubscriptionPlanFixture extends Fixture
{
    public const FREE    = 'subscription_plan_free';
    public const PRO     = 'subscription_plan_pro';
    public const PREMIUM = 'subscription_plan_premium';

    public function load(ObjectManager $manager): void
    {
        $now = new \DateTime();

        foreach ([
            [self::FREE,    'Free',    0.00,  0,    1],
            [self::PRO,     'Pro',     9.99,  999,  2],
            [self::PREMIUM, 'Premium', 19.99, 1999, 3],
        ] as [$ref, $name, $price, $stripePrice, $ordering]) {
            $plan = new SubscriptionPlan();
            $plan->setPlanName($name);
            $plan->setPrice($price);
            $plan->setStripePrice($stripePrice);
            $plan->setStripeInterval('month');
            $plan->setPlanFeatures(json_encode(['budgets', 'forecasts']));
            $plan->setCreatedAt($now);
            $plan->setIsActive(true);
            $plan->setIsStripeUse($stripePrice > 0);
            $plan->setOrdering($ordering);
            $plan->setStripePriceId('price_demo_' . strtolower($name));
            $manager->persist($plan);
            $this->addReference($ref, $plan);
        }
        $manager->flush();
    }
}
