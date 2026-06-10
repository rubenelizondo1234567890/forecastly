<?php

namespace App\DataFixtures;

use App\Entity\Account;
use App\Entity\BudgetTrackingGroup;
use App\Entity\CustomersAccount;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class AccountFixture extends Fixture implements DependentFixtureInterface
{
    public const CHECKING   = 'account_checking';
    public const EMERGENCY  = 'account_emergency';
    public const INVESTMENT = 'account_investment';
    public const VISA       = 'account_visa';
    public const MORTGAGE   = 'account_mortgage';
    public const CAR_LOAN   = 'account_car_loan';

    public function load(ObjectManager $manager): void
    {
        $ca      = $this->getReference(CustomerFixture::DEMO_CUSTOMERS_ACCOUNT, CustomersAccount::class);
        $created = new \DateTime('-1 month');

        $accounts = [
            // [ref, name, balance, apr, groupRef]
            [self::CHECKING,   'Checking Account',     4200.00,    null,   BudgetTrackingGroupFixture::SAVINGS],
            [self::EMERGENCY,  'Emergency Fund',       12500.00,   null,   BudgetTrackingGroupFixture::SAVINGS],
            [self::INVESTMENT, 'Investment Portfolio', 38000.00,   null,   BudgetTrackingGroupFixture::INVESTMENT],
            [self::VISA,       'Visa Credit Card',     -2100.00,   19.99,  BudgetTrackingGroupFixture::CREDIT_CARD],
            [self::MORTGAGE,   'Mortgage',             -285000.00, 6.75,   BudgetTrackingGroupFixture::MORTGAGE],
            [self::CAR_LOAN,   'Car Loan',             -18400.00,  null,   BudgetTrackingGroupFixture::CAR_LOAN],
        ];

        foreach ($accounts as [$ref, $name, $balance, $apr, $groupRef]) {
            $account = new Account();
            $account->setName($name);
            $account->setProjectedBalance($balance);
            $account->setRealBalance($balance);
            $account->setAccountType($balance >= 0 ? 'asset' : 'liability');
            $account->setCustomerAccount($ca);
            $account->setCreatedOn($created);
            $account->setBudgetTrackingGroup(
                $this->getReference($groupRef, BudgetTrackingGroup::class)
            );
            if ($apr !== null) {
                $account->setAnnualInterestRate($apr);
            }
            $manager->persist($account);
            $this->addReference($ref, $account);
        }
        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [CustomerFixture::class, BudgetTrackingGroupFixture::class];
    }
}
