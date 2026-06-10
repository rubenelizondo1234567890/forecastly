<?php

namespace App\DataFixtures;

use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\CustomersAccount;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class AccountsTrackingCalendarFixture extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        $ca = $this->getReference(CustomerFixture::DEMO_CUSTOMERS_ACCOUNT, CustomersAccount::class);

        $accountRefs = [
            AccountFixture::CHECKING,
            AccountFixture::EMERGENCY,
            AccountFixture::INVESTMENT,
            AccountFixture::VISA,
            AccountFixture::MORTGAGE,
            AccountFixture::CAR_LOAN,
        ];

        $balances = [];
        foreach ($accountRefs as $ref) {
            $account = $this->getReference($ref, Account::class);
            $balances[$account->getId()] = $account->getProjectedBalance() ?? 0;
        }

        // 1 month of history + 12 months of projections = 13 months total
        $start   = new \DateTime('-1 month');
        $end     = new \DateTime('+12 months');
        $current = clone $start;

        $batchSize = 50;
        $i = 0;

        while ($current <= $end) {
            $entry = new AccountsTrackingCalendar();
            $entry->setCustomersAccount($ca);
            $entry->setCalendarDate(clone $current);
            $entry->setAccountsBalances($balances);
            $manager->persist($entry);

            $current->modify('+1 day');
            $i++;

            if ($i % $batchSize === 0) {
                $manager->flush();
            }
        }

        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [RecurringItemsFixture::class];
    }
}
