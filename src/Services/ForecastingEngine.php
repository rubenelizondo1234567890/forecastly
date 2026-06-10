<?php

namespace App\Services;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\CustomersAccount;
use App\Entity\RecurringExpense;
use App\Entity\RecurringIncome;
use App\Entity\RecurringInterest;
use App\Entity\RecurringSavings;
use App\Services\Forecasting\Strategy\ForecastStrategyInterface;
use App\ValueObject\Money;
use Doctrine\ORM\EntityManagerInterface;

class ForecastingEngine
{
    /** @param ForecastStrategyInterface[] $strategies */
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly iterable $strategies,
    ) {}

    public function generateFutureProjections(CustomersAccount $customerAccount, int $monthsToProject = 12): void
    {
        $lastEntry = $this->em->getRepository(AccountsTrackingCalendar::class)
            ->findOneBy(['customersAccount' => $customerAccount], ['calendarDate' => 'DESC']);

        if (!$lastEntry) {
            return;
        }

        $startDate = \DateTimeImmutable::createFromInterface($lastEntry->getCalendarDate())
            ->modify('+1 day');
        $endDate = $startDate->modify("+{$monthsToProject} months");

        // Pre-load all data once — eliminates N+1 DB calls during projection loop
        $context = new ProjectionContext(
            customerAccount: $customerAccount,
            startDate: $startDate,
            endDate: $endDate,
            accounts: $this->preloadAccounts($customerAccount),
            recurringIncomes: $this->em->getRepository(RecurringIncome::class)
                ->findBy(['customerAccount' => $customerAccount]),
            recurringExpenses: $this->em->getRepository(RecurringExpense::class)
                ->findBy(['customerAccount' => $customerAccount]),
            recurringInterests: $this->em->getRepository(RecurringInterest::class)
                ->findBy(['customerAccount' => $customerAccount]),
            recurringSavings: $this->em->getRepository(RecurringSavings::class)
                ->findBy(['customerAccount' => $customerAccount]),
        );

        $current = $startDate;

        while ($current <= $endDate) {
            $entry = $this->buildProjectedEntry($context, $current, $lastEntry);
            if ($entry !== null) {
                $this->em->persist($entry);
                $lastEntry = $entry;
            }
            $current = $current->modify('+1 day');
        }

        // Single flush for the entire projection run — was O(n) flushes before
        $this->em->flush();
    }

    private function buildProjectedEntry(
        ProjectionContext $context,
        \DateTimeImmutable $date,
        AccountsTrackingCalendar $previousEntry,
    ): ?AccountsTrackingCalendar {
        $previousBalances = $previousEntry->getAccountsBalances() ?? [];
        $newBalances = $previousBalances;

        foreach ($context->accounts as $account) {
            $accountId = $account->getId();
            $currentBalance = new Money((int) round(($previousBalances[$accountId] ?? 0) * 100));
            $delta = new Money(0);

            foreach ($this->strategies as $strategy) {
                if ($strategy->applies($account)) {
                    $delta = $delta->add($strategy->project($account, $context, $date));
                }
            }

            // PHP 8.4: array_find used in ProjectionContext::getAccountById
            $newBalances[$accountId] = round(($currentBalance->add($delta))->toFloat(), 2);
        }

        $entry = new AccountsTrackingCalendar();
        $entry->setCustomersAccount($context->customerAccount);
        $entry->setCalendarDate(\DateTime::createFromImmutable($date));
        $entry->setAccountsBalances($newBalances);

        return $entry;
    }

    /** @return array<int, Account> keyed by account ID */
    private function preloadAccounts(CustomersAccount $customerAccount): array
    {
        $accounts = $this->em->getRepository(Account::class)
            ->findBy(['customerAccount' => $customerAccount]);

        $indexed = [];
        foreach ($accounts as $account) {
            $indexed[$account->getId()] = $account;
        }
        return $indexed;
    }
}
