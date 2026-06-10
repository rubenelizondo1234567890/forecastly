<?php

namespace App\DataFixtures;

use App\Entity\Customer;
use App\Entity\CustomersAccount;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class CustomerFixture extends Fixture implements DependentFixtureInterface
{
    public const DEMO_CUSTOMER          = 'demo_customer';
    public const DEMO_CUSTOMERS_ACCOUNT = 'demo_customers_account';

    public function __construct(private readonly UserPasswordHasherInterface $hasher) {}

    public function load(ObjectManager $manager): void
    {
        $now = new \DateTime();

        $customerAccount = new CustomersAccount();
        $customerAccount->setAccountName('Demo Portfolio Account');
        $customerAccount->setCreatedAt($now);
        $customerAccount->setIsActive(true);
        $customerAccount->setSubscriptionPlan(
            $this->getReference(SubscriptionPlanFixture::PRO, \App\Entity\SubscriptionPlan::class)
        );
        $manager->persist($customerAccount);
        $manager->flush();

        $customer = new Customer();
        $customer->setUsername('demo');
        $customer->setEmail('demo@forecastly.com');
        $customer->setFirstName('Demo');
        $customer->setLastName('User');
        $customer->setCreatedAt($now);
        $customer->setIsActive(true);
        $customer->setIsConfirmed(true);
        $customer->setIsMain(true);
        $customer->setCustomersAccount($customerAccount);
        $customer->setPassword($this->hasher->hashPassword($customer, 'Demo1234!'));
        $manager->persist($customer);
        $manager->flush();

        $this->addReference(self::DEMO_CUSTOMER, $customer);
        $this->addReference(self::DEMO_CUSTOMERS_ACCOUNT, $customerAccount);
    }

    public function getDependencies(): array
    {
        return [SubscriptionPlanFixture::class];
    }
}
