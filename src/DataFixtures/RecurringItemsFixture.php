<?php

namespace App\DataFixtures;

use App\Entity\Account;
use App\Entity\BudgetTrackingGroup;
use App\Entity\CustomersAccount;
use App\Entity\Frequency;
use App\Entity\RecurringExpense;
use App\Entity\RecurringIncome;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class RecurringItemsFixture extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        $ca        = $this->getReference(CustomerFixture::DEMO_CUSTOMERS_ACCOUNT, CustomersAccount::class);
        $frequency = $this->getReference(FrequencyFixture::MONTHLY, Frequency::class);

        // name, amount, day-of-month, account ref, btg ref
        $incomes = [
            ['Monthly Salary',   6500.00, 1,  AccountFixture::CHECKING, BudgetTrackingGroupFixture::SALARY],
            ['Freelance Income', 1200.00, 15, AccountFixture::CHECKING, BudgetTrackingGroupFixture::FREELANCE],
        ];

        foreach ($incomes as [$name, $amount, $day, $accountRef, $btgRef]) {
            $income = new RecurringIncome();
            $income->setName($name);
            $income->setAmount($amount);
            // getRecurringDay() reads from startOn — encode the day into startOn
            $income->setStartOn(new \DateTime(sprintf('2000-01-%02d', $day)));
            $income->setCustomerAccount($ca);
            $income->setAccount($this->getReference($accountRef, Account::class));
            $income->setFrequency($frequency);
            $income->setBudgetTrackingGroup($this->getReference($btgRef, BudgetTrackingGroup::class));
            $manager->persist($income);
        }

        $expenses = [
            ['Mortgage Payment', 1800.00, 1,  AccountFixture::CHECKING, BudgetTrackingGroupFixture::MORTGAGE],
            ['Car Insurance',     210.00, 5,  AccountFixture::CHECKING, BudgetTrackingGroupFixture::TRANSPORT],
            ['Groceries',         450.00, 10, AccountFixture::CHECKING, BudgetTrackingGroupFixture::GROCERIES],
            ['Subscriptions',      85.00, 15, AccountFixture::CHECKING, BudgetTrackingGroupFixture::HOUSING],
            ['Utilities',         160.00, 20, AccountFixture::CHECKING, BudgetTrackingGroupFixture::HOUSING],
        ];

        foreach ($expenses as [$name, $amount, $day, $accountRef, $btgRef]) {
            $expense = new RecurringExpense();
            $expense->setName($name);
            $expense->setAmount($amount);
            $expense->setStartOn(new \DateTime(sprintf('2000-01-%02d', $day)));
            $expense->setCustomerAccount($ca);
            $expense->setAccount($this->getReference($accountRef, Account::class));
            $expense->setFrequency($frequency);
            $expense->setBudgetTrackingGroup($this->getReference($btgRef, BudgetTrackingGroup::class));
            $manager->persist($expense);
        }

        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [AccountFixture::class, FrequencyFixture::class, BudgetTrackingGroupFixture::class];
    }
}
