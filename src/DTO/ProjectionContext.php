<?php
// Copyright (c) 2026 Ruben Elizondo. All Rights Reserved. See LICENSE.

namespace App\DTO;

use App\Entity\Account;
use App\Entity\CustomersAccount;
use App\Entity\RecurringExpense;
use App\Entity\RecurringIncome;
use App\Entity\RecurringInterest;
use App\Entity\RecurringSavings;

final class ProjectionContext
{
    public function __construct(
        public readonly CustomersAccount $customerAccount,
        public readonly \DateTimeImmutable $startDate,
        public readonly \DateTimeImmutable $endDate,
        /** @var array<int, Account> keyed by account ID */
        public readonly array $accounts,
        /** @var RecurringIncome[] */
        public readonly array $recurringIncomes,
        /** @var RecurringExpense[] */
        public readonly array $recurringExpenses,
        /** @var RecurringInterest[] */
        public readonly array $recurringInterests,
        /** @var RecurringSavings[] */
        public readonly array $recurringSavings,
    ) {}

    public function getAccountById(int $id): ?Account
    {
        // PHP 8.4: array_find replaces array_filter()[0] ?? null
        return array_find($this->accounts, fn(Account $a) => $a->getId() === $id);
    }
}
