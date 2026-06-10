<?php

namespace App\Services\Contract;

use App\Entity\Account;
use App\Entity\Customer;
use App\Entity\CustomersAccount;
use App\Entity\NonRecurringIncomeExpensesInterface;
use App\Entity\RecurringIncomeExpensesInterface;
use App\Entity\RecurringInterest;
use App\Entity\RecurringSavings;
use App\Entity\RevolvingPayments;
use DateTimeInterface;

interface AccountsServiceInterface
{
    public function addAccountToAccountsTrackingCalendar(Account $account);

    public function removeCalendarEntryForNonRecurring(NonRecurringIncomeExpensesInterface $incomeExpense, string $entryDateStr): bool;

    public function upsertCalendarEntryForNonRecurring(NonRecurringIncomeExpensesInterface $incomeExpense): bool;

    public function generateCalendarEntriesForRecurring(RecurringIncomeExpensesInterface $incomeExpense): bool;

    public function removeCalendarEntriesForRecurring(RecurringIncomeExpensesInterface $incomeExpense, int $originalAccountId): bool;

    public function updateCalendarAccountsBalances(CustomersAccount $customerAccount, ?DateTimeInterface $startFromDate = null): void;

    public function updateCalendarAccountsBalancesForThisAccount(Account $account): bool;

    public function generateCalendarEntriesForRecurringInterest(RecurringInterest $interest, ?DateTimeInterface $startFromDate = null): bool;

    public function removeCalendarEntriesForRecurringInterest(RecurringInterest $interest, int $originalAccountId, ?string $removeFromDate = null): bool;

    public function removeCalendarEntriesForRevolvingPayment(RevolvingPayments $revolvingPayment, int $originalAccountToPayId, int $originalAccountToWithdrawId): bool;

    public function generateCalendarEntriesForRevolvingPayment(RevolvingPayments $revolvingPayment): bool;

    public function createRecurringInterestForAccount(Account $account, Customer $user): bool;

    public function generateCalendarEntriesForRecurringSavings(RecurringSavings $recurringSaving): bool;

    public function removeCalendarEntriesForRecurringSavings(RecurringSavings $recurringSaving, int $originalAccountToSaveId, int $originalAccountToWithdrawId): bool;
}
