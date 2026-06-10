<?php

namespace App\DataFixtures;

use App\Entity\BudgetTrackingGroup;
use App\Entity\CustomersAccount;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class BudgetTrackingGroupFixture extends Fixture implements DependentFixtureInterface
{
    public const SALARY      = 'btg_salary';
    public const FREELANCE   = 'btg_freelance';
    public const HOUSING     = 'btg_housing';
    public const TRANSPORT   = 'btg_transport';
    public const GROCERIES   = 'btg_groceries';
    public const SAVINGS     = 'btg_savings';
    public const CREDIT_CARD = 'btg_credit_card';
    public const MORTGAGE    = 'btg_mortgage';
    public const CAR_LOAN    = 'btg_car_loan';
    public const INVESTMENT  = 'btg_investment';

    public function load(ObjectManager $manager): void
    {
        $ca = $this->getReference(CustomerFixture::DEMO_CUSTOMERS_ACCOUNT, CustomersAccount::class);

        $groups = [
            [self::SALARY,      'Salary',              'income'],
            [self::FREELANCE,   'Freelance',            'income'],
            [self::HOUSING,     'Housing',              'expense'],
            [self::TRANSPORT,   'Transport',            'expense'],
            [self::GROCERIES,   'Groceries',            'expense'],
            [self::SAVINGS,     'Savings',              'income'],
            [self::CREDIT_CARD, 'Credit Cards',         'expense'],
            [self::MORTGAGE,    'Mortgage',             'expense'],
            [self::CAR_LOAN,    'Car Loan',             'expense'],
            [self::INVESTMENT,  'Investment Portfolio', 'income'],
        ];

        foreach ($groups as [$ref, $name, $type]) {
            $group = new BudgetTrackingGroup();
            $group->setName($name);
            $group->setIsIncomeOrExpense($type);
            $group->setCustomerAccount($ca);
            $manager->persist($group);
            $this->addReference($ref, $group);
        }
        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [CustomerFixture::class];
    }
}
