<?php

namespace App\Services;

use App\Constants\AppConstants;
use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\Customer;
use App\Entity\CustomersAccount;
use App\Entity\Log;
use App\Entity\NonRecurringIncomeExpensesInterface;
use App\Entity\RecurringIncomeExpensesInterface;
use App\Entity\RecurringInterest;
use App\Entity\RecurringSavings;
use App\Entity\RevolvingPayments;
use App\Exceptions\PreconditionFailedException;
use DateInterval;
use DateTime;
use DateTimeInterface;
use Doctrine\ORM\Cache;
use Doctrine\ORM\EntityManagerInterface;
use Exception;

class AccountsService
{
    private EntityManagerInterface $em;
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $em, EntityManagerInterface $entityManager)
    {
        $this->em = $em;
        $this->entityManager = $entityManager;
    }

    public function addAccountToAccountsTrackingCalendar(Account $account)
    {
        $conn = $this->em->getConnection();
        $accountId = $account->getId();
        $projectedBalance = $account->getProjectedBalance() ?? 0;
        $createdDate = $account->getCreatedOn()->format('Y-m-d');
        $customerAccountId = $account->getCustomerAccount()->getId();

        $sql = "
        UPDATE accounts_tracking_calendar
        SET accounts_balances = JSON_SET(
            COALESCE(accounts_balances, '{}'),
            CONCAT('$.', :accountId),
            :projectedBalance
        )
        WHERE calendar_date >= :createdDate
        AND customers_account_id = :customerAccountId
    ";

        $stmt = $conn->prepare($sql);
        $stmt->bindValue('accountId', $accountId);
        $stmt->bindValue('projectedBalance', $projectedBalance);
        $stmt->bindValue('createdDate', $createdDate);
        $stmt->bindValue('customerAccountId', $customerAccountId);
        $stmt->executeStatement();

        return true;
    }

    public function removeCalendarEntryForNonRecurring(NonRecurringIncomeExpensesInterface $incomeExpense, string $entryDateStr): bool
    {
        $isIncomeOrExpense = $incomeExpense->getBudgetTrackingGroup()->getIsIncomeOrExpense();
        $incomeExpenseId = $incomeExpense->getId();
        $customerAccountId = $incomeExpense->getCustomerAccount()->getId();
        $incomesExpenses = [];
        $entry = $this->entityManager->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $customerAccountId, 'calendarDate' => new DateTime($entryDateStr)]);
        if ($entry) {
            if ($isIncomeOrExpense == AppConstants::INCOME_TYPE || $isIncomeOrExpense == AppConstants::ASSET_TYPE) {
                $incomesExpenses = $entry->getNonRecurringIncomes();
            } else {
                $incomesExpenses = $entry->getNonRecurringExpenses();
            }
            if (!empty($incomesExpenses)) {
                foreach ($incomesExpenses as $acctId => $items) {
                    if (!empty($items)) {
                        foreach ($items as $entityId => $amount) {
                            if ($entityId == $incomeExpenseId) {
                                unset($incomesExpenses[$acctId][$incomeExpenseId]);
                            }
                        }
                    }
                }
            }
            if (empty($incomesExpenses[$acctId])) {
                unset($incomesExpenses[$acctId]);
            }
            if ($isIncomeOrExpense == AppConstants::INCOME_TYPE || $isIncomeOrExpense == AppConstants::ASSET_TYPE) {
                $entry->setNonRecurringIncomes($incomesExpenses);
            } else {
                $entry->setNonRecurringExpenses($incomesExpenses);
            }

            $this->em->persist($entry);
            $this->em->flush();
        }
        return true;
    }

    /**
     * @param NonRecurringIncomeExpensesInterface $incomeExpense
     * @return bool
     * @throws Exception
     */
    public function upsertCalendarEntryForNonRecurring(NonRecurringIncomeExpensesInterface $incomeExpense): bool
    {
        $isIncomeOrExpense = $incomeExpense->getBudgetTrackingGroup()->getIsIncomeOrExpense();
        $customerAccount = $incomeExpense->getCustomerAccount();
        $calendarDate = $incomeExpense->getDateToApply()->format('Y-m-d');
        $entry = $this->em->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $customerAccount, 'calendarDate' => new DateTime($calendarDate)]);
        if ($isIncomeOrExpense == AppConstants::INCOME_TYPE || $isIncomeOrExpense == AppConstants::ASSET_TYPE) {
            //Update Incomes/Savings
            $incomes = $entry->getNonRecurringIncomes();
            $incomes[$incomeExpense->getAccount()->getId()][$incomeExpense->getId()] = $incomeExpense->getAmount();
            $entry->setNonRecurringIncomes($incomes);
        } elseif ($isIncomeOrExpense == AppConstants::EXPENSE_TYPE) {
            //Update Expenses
            $expenses = $entry->getNonRecurringExpenses();
            $expenses[$incomeExpense->getAccount()->getId()][$incomeExpense->getId()] = $incomeExpense->getAmount();
            $entry->setNonRecurringExpenses($expenses);
        }
        $this->em->persist($entry);
        $this->em->flush();

        return true;
    }

    public function generateCalendarEntriesForRecurring(RecurringIncomeExpensesInterface $incomeExpense): bool
    {
        $isIncomeOrExpense = $incomeExpense->getBudgetTrackingGroup()->getIsIncomeOrExpense();
        $customerAccount = $incomeExpense->getCustomerAccount();
        $startDate = $incomeExpense->getStartOn();
        $acctTrackingCalendar = $this->em->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $customerAccount], ['calendarDate' => 'DESC']);
        $endDate = $acctTrackingCalendar->getCalendarDate();
        $cancelAfter = $incomeExpense->getCanceledAfter();

        if ($cancelAfter && $cancelAfter < $endDate) {
            $endDate = $cancelAfter;
        }

        $frequency = $incomeExpense->getFrequency();
        $intervalMap = AppConstants::INTERVAL_MAP;

        $interval = new DateInterval($intervalMap[$frequency->getId()]);
        $currentDate = clone $startDate;

        $counter = 0;
        while ($currentDate <= $endDate) {
            $currentDateFormatted = $currentDate->format("Y-m-d");
            $currDate = new DateTime(date($currentDateFormatted));
            $entry = $this->em->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $customerAccount, 'calendarDate' => $currDate]);
            if ($isIncomeOrExpense == AppConstants::INCOME_TYPE || $isIncomeOrExpense == AppConstants::ASSET_TYPE) {
                //Update Incomes/Savings
                $incomes = $entry->getRecurringIncomes();
                $incomes[$incomeExpense->getAccount()->getId()][$incomeExpense->getId()] = $incomeExpense->getAmount();
                $entry->setRecurringIncomes($incomes);
            } elseif ($isIncomeOrExpense == AppConstants::EXPENSE_TYPE) {
                //Update Expenses
                $expenses = $entry->getRecurringExpenses();
                $expenses[$incomeExpense->getAccount()->getId()][$incomeExpense->getId()] = $incomeExpense->getAmount();
                $entry->setRecurringExpenses($expenses);
            }
            $this->em->persist($entry);
            //Flush every 100 entries
            $counter++;
            if ($counter % 100 == 0) {
                $this->em->flush();
            }
            $currentDate = clone $currentDate;
            $currentDate->add($interval);
        }
        $this->em->flush();

        return true;
    }

    public function removeCalendarEntriesForRecurring(RecurringIncomeExpensesInterface $incomeExpense, int $originalAccountId): bool
    {
        $isIncomeOrExpense = $incomeExpense->getBudgetTrackingGroup()->getIsIncomeOrExpense();
        $entityId = $incomeExpense->getId();
        $customerAccountId = $incomeExpense->getCustomerAccount()->getId();

        $field = $isIncomeOrExpense === (AppConstants::INCOME_TYPE || AppConstants::ASSET_TYPE) ? 'recurring_incomes' : 'recurring_expenses';

        $conn = $this->em->getConnection();

        // Remove the entity from all accounts in the JSON field only for those entries >= $incomeExpense->getStartOn()
        $startOn = $incomeExpense->getStartOn()->format('Y-m-d');
        $sql = "
        UPDATE accounts_tracking_calendar
        SET $field = JSON_REMOVE(
            COALESCE($field, '{}'),
            CONCAT('$.', :account_id, '.', :entityId)
        )
        WHERE customers_account_id = :customerAccountId
        AND calendar_date >= '{$startOn}'
        AND JSON_CONTAINS_PATH($field, 'one', CONCAT('$.', :account_id, '.', :entityId))
    ";

        // Get all account IDs that might contain this entity
        $accountIds = [$originalAccountId];

        foreach ($accountIds as $accountId) {
            $stmt = $conn->prepare($sql);
            $stmt->bindValue('entityId', $entityId);
            $stmt->bindValue('customerAccountId', $customerAccountId);
            $stmt->bindValue('account_id', $originalAccountId);
            $stmt->executeStatement();
        }

        return true;
    }

    public function updateCalendarAccountsBalances(CustomersAccount $customerAccount, ?DateTimeInterface $startFromDate = null): void
    {
        $conn = $this->em->getConnection();
        $customerAccountId = $customerAccount->getId();

        // Get all calendar entries for this customer account ordered by date
        if ($startFromDate) {
            $d = $startFromDate->format('Y-m-d');
            $andWhere = " AND calendar_date >= '{$d}'";
        } else {
            $andWhere = "";
        }

        $sql = "SELECT
                    id,
                    calendar_date,
                    recurring_incomes,
                    non_recurring_incomes,
                    recurring_expenses,
                    non_recurring_expenses,
                    accounts_balances,
                    recurring_income_interest,
                    recurring_expense_interest,
                    payments_account_to_pay,
                    payments_account_to_withdraw,
                    savings_account_to_save,
                    savings_account_to_withdraw,
                    recurring_savings_interest,
                    metadata
                FROM accounts_tracking_calendar
                WHERE customers_account_id = :customerAccountId
                {$andWhere}";

        $stmt = $conn->prepare($sql);
        $stmt->bindValue('customerAccountId', $customerAccountId);
        $result = $stmt->executeQuery();
        $entries = $result->fetchAllAssociative();

        foreach ($entries as $key => $entry) {
            //Get previous day balances
            if ($key == 0) { continue;}

            $pastDayEntry = $entries[$key - 1];
            $pastDayBalances = json_decode($pastDayEntry['accounts_balances'] ?? '[]', true) ?? [];
            $currentDayBalances = json_decode($entry['accounts_balances'] ?? '[]', true) ?? [];

            //Get Current Trx
            $currentRecurringIncomes = json_decode($entry['recurring_incomes'] ?? '[]', true) ?? [];
            $currentNonRecurringIncomes = json_decode($entry['non_recurring_incomes'] ?? '[]', true) ?? [];
            $currentRecurringExpenses = json_decode($entry['recurring_expenses'] ?? '[]', true) ?? [];
            $currentNonRecurringExpenses = json_decode($entry['non_recurring_expenses'] ?? '[]', true) ?? [];
            $currentRecurringIncomeInterests = json_decode($entry['recurring_income_interest'] ?? '[]', true) ?? [];
            $currentRecurringExpenseInterests = json_decode($entry['recurring_expense_interest'] ?? '[]', true) ?? [];
            $currentPaymentsAccountToPay = json_decode($entry['payments_account_to_pay'] ?? '[]', true) ?? [];
            $currentPaymentsAccountToWithdraw = json_decode($entry['payments_account_to_withdraw'] ?? '[]', true) ?? [];
            $currentSavingsAccountToSave = json_decode($entry['savings_account_to_save'] ?? '[]', true) ?? [];
            $currentSavingsAccountToWithdraw = json_decode($entry['savings_account_to_withdraw'] ?? '[]', true) ?? [];
            $currentRecurringSavingsInterest = json_decode($entry['recurring_savings_interest'] ?? '[]', true) ?? [];

            $newBalances = $this->calculateNewBalances(
                $currentRecurringIncomes,
                $currentNonRecurringIncomes,
                $currentRecurringExpenses,
                $currentNonRecurringExpenses,
                $currentRecurringIncomeInterests,
                $currentRecurringExpenseInterests,
                $currentPaymentsAccountToPay,
                $currentPaymentsAccountToWithdraw,
                $currentSavingsAccountToSave,
                $currentSavingsAccountToWithdraw,
                $currentRecurringSavingsInterest,
                $pastDayBalances,
                $currentDayBalances
            );

            //Update metadata for accounts
            foreach ($newBalances as $accountId => $balance) {
                $account = $this->em->getRepository(Account::class)->find($accountId);
                $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
                $metadata = json_decode($entry['metadata'] ?? '{}', true) ?? [];
                if (($isIncomeOrExpense == AppConstants::INCOME_TYPE || $isIncomeOrExpense == AppConstants::ASSET_TYPE) && floor($balance) <= 0) {
                    $metadata['accounts'][$accountId]['overdraft'] = true;
                    $entries[$key]['metadata'] = json_encode($metadata);
                } elseif ($isIncomeOrExpense == AppConstants::EXPENSE_TYPE && $account->isHasMaxLimit() && $balance >= $account->getMaxLimit()) {
                    $metadata['accounts'][$accountId]['overdraft'] = true;
                    $entries[$key]['metadata'] = json_encode($metadata);
                } elseif (isset($metadata['accounts'][$accountId])) {
                    unset($metadata['accounts'][$accountId]);
                    $entries[$key]['metadata'] = json_encode($metadata);
                }
            }
            $entries[$key]['accounts_balances'] = json_encode($newBalances);
        }

        foreach ($entries as $entry) {
            // Update the entry with new balances
            $updateSql = "UPDATE accounts_tracking_calendar
                          SET accounts_balances = :balances, metadata = :metadata
                          WHERE id = :id";
            $updateStmt = $conn->prepare($updateSql);
            $updateStmt->bindValue('balances', $entry['accounts_balances']);
            $updateStmt->bindValue('metadata', $entry['metadata'] ?? '{}');
            $updateStmt->bindValue('id', $entry['id']);
            $updateStmt->executeStatement();
        }

        $conn->close();
    }

    public function calculateNewBalances(
        array $currentRecurringIncomes,
        array $currentNonRecurringIncomes,
        array $currentRecurringExpenses,
        array $currentNonRecurringExpenses,
        array $currentRecurringIncomeInterests,
        array $currentRecurringExpenseInterests,
        array $currentPaymentsAccountToPay,
        array $currentPaymentsAccountToWithdraw,
        array $currentSavingsAccountToSave,
        array $currentSavingsAccountToWithdraw,
        array $currentRecurringSavingsInterest,
        array $pastDayBalances,
        array $currentDayBalances
    ): array
    {
        $newBalances = [];
        if (!empty($pastDayBalances)) {
            foreach ($pastDayBalances as $accountId => $pastDayBalance) {
                $usingCurrentBalance[$accountId] = false;
                $newBalances[$accountId] = ($pastDayBalance ?? 0);
            }
        }

        foreach ($currentDayBalances as $accountId => $currentDayBalance) {
            if (!isset($newBalances[$accountId])) {
                $usingCurrentBalance[$accountId] = true;
                $newBalances[$accountId] = $currentDayBalance ?? 0;//If no previous balance then we assume account started from here
            }
        }

        //Process Revolving Payments
        foreach ($currentPaymentsAccountToPay as $accountId => $incomeEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $incomeTotal = array_sum($incomeEntries);
            $incomeTotal = (-1) * $incomeTotal;//This always decreases the Account Balance as this is always an Expense Account
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $incomeTotal;
        }
        foreach ($currentPaymentsAccountToWithdraw as $accountId => $incomeEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $incomeTotal = array_sum($incomeEntries);
            $incomeTotal = (-1) * $incomeTotal;//This always decreases the Account Balance as this ia always an Income Account
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $incomeTotal;
        }

        // Process savings withdrawals (from income accounts)
        foreach ($currentSavingsAccountToWithdraw as $accountId => $savingEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) { break; }
            $savingTotal = array_sum($savingEntries);
            $savingTotal = (-1) * $savingTotal; // This decreases the Account Balance as this is an Income Account
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $savingTotal;
        }

        // Process savings deposits (to savings/asset accounts)
        foreach ($currentSavingsAccountToSave as $accountId => $savingEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) { break; }
            $savingTotal = array_sum($savingEntries);
            // This increases the Account Balance as this is a Savings/Asset Account
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $savingTotal;
        }

        //Process savings interest
        foreach ($currentRecurringSavingsInterest as $accountId => $incomeEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $account = $this->em->getRepository(Account::class)->find($accountId);
            $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
            $incomeTotal = array_sum($incomeEntries);
            if ($isIncomeOrExpense == AppConstants::ASSET_TYPE) {
                $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $incomeTotal;
            }
        }

        // Process incomes
        foreach ($currentRecurringIncomes as $accountId => $incomeEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $account = $this->em->getRepository(Account::class)->find($accountId);
            $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
            $incomeTotal = array_sum($incomeEntries);
            if ($isIncomeOrExpense == AppConstants::EXPENSE_TYPE) {
                $incomeTotal = (-1) * $incomeTotal;
            }
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $incomeTotal;
        }

        foreach ($currentRecurringIncomeInterests as $accountId => $incomeEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $account = $this->em->getRepository(Account::class)->find($accountId);
            $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
            $incomeTotal = array_sum($incomeEntries);
            if ($isIncomeOrExpense == AppConstants::EXPENSE_TYPE) {
                $incomeTotal = (-1) * $incomeTotal;
            }
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $incomeTotal;
        }

        foreach ($currentNonRecurringIncomes as $accountId => $incomeEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $account = $this->em->getRepository(Account::class)->find($accountId);
            $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
            $incomeTotal = array_sum($incomeEntries);
            if ($isIncomeOrExpense == AppConstants::EXPENSE_TYPE) {
                $incomeTotal = (-1) * $incomeTotal;
            }
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $incomeTotal;
        }

        // Process expenses
        foreach ($currentRecurringExpenses as $accountId => $expenseEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $account = $this->em->getRepository(Account::class)->find($accountId);
            $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
            $expenseTotal = array_sum($expenseEntries);
            if ($isIncomeOrExpense == AppConstants::INCOME_TYPE || $isIncomeOrExpense == AppConstants::ASSET_TYPE) {
                $expenseTotal = (-1) * $expenseTotal;
            }
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $expenseTotal;
        }

        foreach ($currentRecurringExpenseInterests as $accountId => $expenseEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $account = $this->em->getRepository(Account::class)->find($accountId);
            $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
            $expenseTotal = array_sum($expenseEntries);
            if ($isIncomeOrExpense == AppConstants::INCOME_TYPE || $isIncomeOrExpense == AppConstants::ASSET_TYPE) {
                $expenseTotal = (-1) * $expenseTotal;
            }
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $expenseTotal;
        }

        foreach ($currentNonRecurringExpenses as $accountId => $expenseEntries) {
            if (isset($usingCurrentBalance[$accountId]) && $usingCurrentBalance[$accountId]) {break;}
            $account = $this->em->getRepository(Account::class)->find($accountId);
            $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
            $expenseTotal = array_sum($expenseEntries);
            if ($isIncomeOrExpense == AppConstants::INCOME_TYPE || $isIncomeOrExpense == AppConstants::ASSET_TYPE) {
                $expenseTotal = (-1) * $expenseTotal;
            }
            $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $expenseTotal;
        }

        // Format all balances to 2 decimal places
        foreach ($newBalances as $accountId => $balance) {
            $newBalances[$accountId] = number_format((float)$balance, 2, '.', '');
        }

        return $newBalances;
    }

    public function updateCalendarAccountsBalancesForThisAccount(Account $account): bool
    {
        $conn = $this->em->getConnection();
        $accountId = $account->getId();
        $customerAccountId = $account->getCustomerAccount()->getId();
        $reconciliationDate = $account->getLastReconciliationDate()->format('Y-m-d 00:00:00');
        $realBalance = $account->getRealBalance();

        // 1. Remove all occurrences of this account from accounts_balances before the reconciliation date
        $removeOldBalancesSql = "
        UPDATE accounts_tracking_calendar
        SET accounts_balances = JSON_REMOVE(
            COALESCE(accounts_balances, '{}'),
            CONCAT('$.', :accountId)
        )
        WHERE customers_account_id = :customerAccountId
        AND calendar_date < :reconciliationDate
    ";

        $stmt = $conn->prepare($removeOldBalancesSql);
        $stmt->bindValue('accountId', $accountId);
        $stmt->bindValue('customerAccountId', $customerAccountId);
        $stmt->bindValue('reconciliationDate', $reconciliationDate);
        $stmt->executeStatement();

        // 2. Remove income/expense entries for this account before the reconciliation date
        $removeTransactionsSql = "
        UPDATE accounts_tracking_calendar
        SET
            recurring_incomes = JSON_REMOVE(COALESCE(recurring_incomes, '{}'), CONCAT('$.', :accountId)),
            non_recurring_incomes = JSON_REMOVE(COALESCE(non_recurring_incomes, '{}'), CONCAT('$.', :accountId)),
            recurring_expenses = JSON_REMOVE(COALESCE(recurring_expenses, '{}'), CONCAT('$.', :accountId)),
            non_recurring_expenses = JSON_REMOVE(COALESCE(non_recurring_expenses, '{}'), CONCAT('$.', :accountId))
        WHERE customers_account_id = :customerAccountId
        AND calendar_date < :reconciliationDate
    ";

        $stmt = $conn->prepare($removeTransactionsSql);
        $stmt->bindValue('accountId', $accountId);
        $stmt->bindValue('customerAccountId', $customerAccountId);
        $stmt->bindValue('reconciliationDate', $reconciliationDate);
        $stmt->executeStatement();

        // 3. Set the account's projected_balance in accounts_balances for the reconciliation date
        $updateBalanceSql = "
        UPDATE accounts_tracking_calendar
        SET accounts_balances = JSON_SET(
            COALESCE(accounts_balances, '{}'),
            CONCAT('$.', :accountId),
            :realBalance
        )
        WHERE customers_account_id = :customerAccountId
        AND calendar_date = :reconciliationDate
    ";

        $stmt = $conn->prepare($updateBalanceSql);
        $stmt->bindValue('accountId', $accountId);
        $stmt->bindValue('realBalance', $realBalance);
        $stmt->bindValue('customerAccountId', $customerAccountId);
        $stmt->bindValue('reconciliationDate', $reconciliationDate);
        $stmt->executeStatement();

        return true;
    }

    public function generateCalendarEntriesForRecurringInterest(RecurringInterest $interest, ?DateTimeInterface $startFromDate = null): bool
    {
        $this->em->getConnection();
        $account = $interest->getAccount();
        $isIncomeOrExpense = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
        $customerAccount = $interest->getCustomerAccount();
        if ($startFromDate) {
            $startDate = $startFromDate;
        } else {
            $startDate = $account->getCreatedOn();
        }
        $acctTrackingCalendar = $this->em->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $customerAccount], ['calendarDate' => 'DESC']);
        $endDate = $acctTrackingCalendar->getCalendarDate();

        // Get all calendar entries for this customer account between start date and end date
        $calendarEntries = $this->em->getRepository(AccountsTrackingCalendar::class)
            ->createQueryBuilder('c')
            ->setCacheMode(Cache::MODE_REFRESH)
            ->where('c.customersAccount = :customerAccount')
            ->andWhere('c.calendarDate >= :startDate')
            ->andWhere('c.calendarDate <= :endDate')
            ->setParameter('customerAccount', $customerAccount)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('c.calendarDate', 'ASC')
            ->getQuery()
            ->getResult();

        if (empty($calendarEntries)) {
            return false;
        }

        $accountType = $account->getAccountType();
        $annualInterestRate = (float) $account->getAnnualInterestRate();
        $accountId = $account->getId();
        $interestId = $interest->getId();

        // Group entries by month
        $monthlyBatches = [];
        $agreggatedInterest = 0;
        foreach ($calendarEntries as $entry) {
            $date = $entry->getCalendarDate();
            $monthKey = $date->format('Y-m');

            if (!isset($monthlyBatches[$monthKey])) {
                $monthlyBatches[$monthKey] = [
                    'firstDay' => clone $date,
                    'entries' => [],
                    'daysInMonth' => (int) $date->format('t')
                ];
            }

            $monthlyBatches[$monthKey]['entries'][] = $entry;
        }

        // Process each monthly batch
        $counter = 0;
        foreach ($monthlyBatches as $monthKey => $batch) {
            $monthlyInterest = 0.0;
            $balance = 0.0;
            foreach ($batch['entries'] as $entry) {
                $balances = $entry->getAccountsBalances();
                $balance = $balances[$accountId] ?? 0;
            }
            if ($balance <= 0) {
                continue; // No interest on non-positive balances
            }

            switch ($accountType) {
                case 'Credit Card - Revolving':
                    $monthlyInterest = $this->calculateCreditCardRevolvingInterest($batch, $accountId, $annualInterestRate, $agreggatedInterest);
                    break;

                case 'Interest on outstanding bal. Loan':
                    $monthlyInterest = $this->calculateOutstandingBalanceLoanInterest($batch, $accountId, $annualInterestRate, $agreggatedInterest);
                    break;

                case 'Interest on avg. bal. checking-savings':
                    $monthlyInterest = $this->calculateAverageBalanceInterest($batch, $accountId, $annualInterestRate, $agreggatedInterest);
                    break;

                default:
                    continue 2; // Skip unknown account types
            }
            $agreggatedInterest += $monthlyInterest;//For each monthly batches add past aggregated interests

            if ($monthlyInterest > 0) {
                // Calculate the 4th of the next month
                $interestDate = $this->calculateFourthOfNextMonth($batch['firstDay']);

                // Only apply interest if the calculated date is within our calendar range
                if ($interestDate <= $endDate) {
                    $interestDateYearMonth = $interestDate->format('Y-m');
                    $monthlyBatchToApplyInterest = $monthlyBatches[$interestDateYearMonth];
                    $targetEntry = $this->findOrCreateCalendarEntryForDate($customerAccount, $interestDate, $monthlyBatchToApplyInterest['entries']);

                    if ($targetEntry) {
                        $this->addInterestToCalendarEntry($targetEntry, $accountId, $interestId, $monthlyInterest, $isIncomeOrExpense);
                        $this->em->persist($targetEntry);

                        // Flush every 100 entries to avoid memory issues
                        $counter++;
                        if ($counter % 100 == 0) {
                            $this->em->flush();
                        }
                    }
                }
            }
        }

        $this->em->flush();
        return true;
    }

    private function calculateFourthOfNextMonth(DateTime $currentMonth): DateTime
    {
        $fourthOfNextMonth = clone $currentMonth;
        $fourthOfNextMonth->modify('first day of next month')->modify('+3 days');
        return $fourthOfNextMonth;
    }

    private function findOrCreateCalendarEntryForDate(CustomersAccount $customerAccount, DateTime $targetDate, array $nextYearMonthEntries): ?AccountsTrackingCalendar
    {
        $targetDateStr = $targetDate->format('Y-m-d');

        // First, try to find in existing entries
        foreach ($nextYearMonthEntries as $entry) {
            $entryDateStr = $entry->getCalendarDate()->format('Y-m-d');
            if ($entryDateStr == $targetDateStr) {
                return $entry;
            }
        }

        return null;
    }

    private function calculateCreditCardRevolvingInterest(array $batch, int $accountId, float $annualInterestRate, float $agreggatedInterest): float
    {
        $dailyInterest = 0.0;
        $dailyRate = $annualInterestRate / 36500; // Divide by 36500 (365 days * 100 for percentage)

        foreach ($batch['entries'] as $key => $entry) {
            $balances = $entry->getAccountsBalances();
            $balance = $balances[$accountId] ?? 0;
            $bal = (float) $balance;
            if ($key == 3) {
                $bal += $agreggatedInterest;//add past monthly aggreg interest on day 4
            }
            $dailyInterest += $dailyRate * $bal;
        }

        if ($dailyInterest <= 0) {
            return 0.0;
        }

        return round($dailyInterest, 2);
    }

    private function calculateOutstandingBalanceLoanInterest(array $batch, int $accountId, float $annualInterestRate, float $agreggatedInterest): float
    {
        if (empty($batch['entries'])) {
            return 0.0;
        }

        // Get the last entry of the month for end-of-month balance
        $lastEntry = end($batch['entries']);
        $balances = $lastEntry->getAccountsBalances();
        $endOfMonthBalance = $balances[$accountId] ?? 0;
        $endOfMonthBalance += $agreggatedInterest;

        if ($endOfMonthBalance <= 0) {
            return 0.0;
        }

        $monthlyRate = $annualInterestRate / 1200; // Divide by 1200 (12 months * 100 for percentage)
        return round(($monthlyRate * (float) $endOfMonthBalance), 2);
    }

    private function calculateAverageBalanceInterest(array $batch, int $accountId, float $annualInterestRate, float $agreggatedInterest): float
    {
        if (empty($batch['entries'])) {
            return 0.0;
        }

        $totalBalance = 0.0;
        $dayCount = count($batch['entries']);

        foreach ($batch['entries'] as $entry) {
            $balances = $entry->getAccountsBalances();
            $balance = $balances[$accountId] ?? 0;
            $totalBalance += (float) $balance;
        }
        $totalBalance += $agreggatedInterest;

        if ($totalBalance <= 0) {
            return 0.0;
        }

        $averageBalance = $totalBalance / $dayCount;
        $monthlyRate = $annualInterestRate / 1200; // Divide by 1200 (12 months * 100 for percentage)

        return round(($monthlyRate * $averageBalance), 2);
    }

    private function addInterestToCalendarEntry(AccountsTrackingCalendar $entry, int $accountId, int $interestId, float $interestAmount, string $isIncomeOrExpense): void
    {
        if ($isIncomeOrExpense == AppConstants::INCOME_TYPE) {
            $recurringIncomeInterest = $entry->getRecurringIncomeInterest();
            if (!isset($recurringIncomeInterest[$accountId])) {
                $recurringIncomeInterest[$accountId] = [];
            }
            $recurringIncomeInterest[$accountId][$interestId] = number_format($interestAmount, 2, '.', '');
            $entry->setRecurringIncomeInterest($recurringIncomeInterest);
        } elseif ($isIncomeOrExpense == AppConstants::ASSET_TYPE) {
            $recurringSavingsInterest = $entry->getRecurringSavingsInterest();
            if (!isset($recurringSavingsInterest[$accountId])) {
                $recurringSavingsInterest[$accountId] = [];
            }
            $recurringSavingsInterest[$accountId][$interestId] = number_format($interestAmount, 2, '.', '');
            $entry->setRecurringSavingsInterest($recurringSavingsInterest);
        } elseif ($isIncomeOrExpense == AppConstants::EXPENSE_TYPE) {
            $recurringExpenseInterest = $entry->getRecurringExpenseInterest();
            if (!isset($recurringExpenseInterest[$accountId])) {
                $recurringExpenseInterest[$accountId] = [];
            }
            $recurringExpenseInterest[$accountId][$interestId] = number_format($interestAmount, 2, '.', '');
            $entry->setRecurringExpenseInterest($recurringExpenseInterest);
        }
    }

    public function removeCalendarEntriesForRecurringInterest(RecurringInterest $interest, int $originalAccountId, ?string $removeFromDate = null): bool
    {
        $isIncomeOrExpense = $interest->getAccount()->getBudgetTrackingGroup()->getIsIncomeOrExpense();
        $entityId = $interest->getId();
        $customerAccountId = $interest->getCustomerAccount()->getId();

        switch ($isIncomeOrExpense) {
            case AppConstants::INCOME_TYPE:
                $field = 'recurring_income_interest';
                break;
            case AppConstants::EXPENSE_TYPE:
                $field = 'recurring_expense_interest';
                break;
            case AppConstants::ASSET_TYPE:
                $field = 'recurring_savings_interest';
                break;
            default:
                return true;
                break;
        }

        $conn = $this->em->getConnection();

        // Remove the entity from all accounts in the JSON field only for those entries >= $interest->getStartOn()
        if ($removeFromDate) {
            $startOn = $removeFromDate;
        } else {
            $startOn = $interest->getAccount()->getCreatedOn()->format('Y-m-d');
        }
        $sql = "
        UPDATE accounts_tracking_calendar
        SET $field = JSON_REMOVE(
            COALESCE($field, '{}'),
            CONCAT('$.', :account_id, '.', :entityId)
        )
        WHERE customers_account_id = :customerAccountId
        AND calendar_date >= '{$startOn}'
        AND JSON_CONTAINS_PATH($field, 'one', CONCAT('$.', :account_id, '.', :entityId))
    ";

        // Get all account IDs that might contain this entity
        $accountIds = [$originalAccountId];

        foreach ($accountIds as $accountId) {
            $stmt = $conn->prepare($sql);
            $stmt->bindValue('entityId', $entityId);
            $stmt->bindValue('customerAccountId', $customerAccountId);
            $stmt->bindValue('account_id', $originalAccountId);
            $stmt->executeStatement();
        }

        $conn->close();

        return true;
    }

    public function removeCalendarEntriesForRevolvingPayment(RevolvingPayments $revolvingPayment, int $originalAccountToPayId, int $originalAccountToWithdrawId): bool
    {
        $conn = $this->em->getConnection();
        $entityId = $revolvingPayment->getId();
        $customerAccountId = $revolvingPayment->getCustomerAccount()->getId();

        $fields =  ['payments_account_to_pay', 'payments_account_to_withdraw'];

        // Remove the entity from all accounts in the JSON field only for those entries >= $revolvingPayment->getStartOn()
        $startOn = $revolvingPayment->getStartOn()->format('Y-m-d');

        foreach ($fields as $field) {
            $originalAccountId = match ($field) {
                'payments_account_to_pay' => $originalAccountToPayId,
                default => $originalAccountToWithdrawId,
            };
            $sql = "
                UPDATE accounts_tracking_calendar
                SET $field = JSON_REMOVE(
                    COALESCE($field, '{}'),
                    CONCAT('$.', :account_id, '.', :entityId)
                )
                WHERE customers_account_id = :customerAccountId
                AND calendar_date >= '{$startOn}'
                AND JSON_CONTAINS_PATH($field, 'one', CONCAT('$.', :account_id, '.', :entityId))
            ";

            // Get all account IDs that might contain this entity
            $accountIds = [$originalAccountToPayId, $originalAccountToWithdrawId];

            foreach ($accountIds as $accountId) {
                $stmt = $conn->prepare($sql);
                $stmt->bindValue('entityId', $entityId);
                $stmt->bindValue('customerAccountId', $customerAccountId);
                $stmt->bindValue('account_id', $originalAccountId);
                $stmt->executeStatement();
            }
        }

        return true;
    }

    /**
     * @param int $customerAccountId
     * @param string $startOn
     * @param int $accountId
     * @return void
     */
    public function removeMetadataForAccounts(int $customerAccountId, string $startFrom, int $accountId): void
    {
        $conn = $this->em->getConnection();
        $metadataEntries = $this->em->getRepository(AccountsTrackingCalendar::class)
            ->createQueryBuilder('c')
            ->setCacheMode(Cache::MODE_REFRESH)
            ->where('c.customersAccount = :customerAccount')
            ->andWhere('c.calendarDate >= :startDate')
            ->andWhere("c.metadata != '{}'")
            ->andWhere("c.metadata != '[]'")
            ->setParameter('customerAccount', $customerAccountId)
            ->setParameter('startDate', $startFrom)
            ->orderBy('c.calendarDate', 'ASC')
            ->getQuery()
            ->getResult();

        $counter = 0;
        foreach ($metadataEntries as $key => $metadataEntry) {
            $meta = $metadataEntry->getMetadata();
            if ($accountId && array_key_exists($accountId, ($meta['accounts'] ?? []))) {
                unset($meta['accounts'][$accountId]);
            }
            $metadataEntry->setMetadata($meta);
            $this->em->persist($metadataEntry);

            // Flush every 100 entries to avoid memory issues
            $counter++;
            if ($counter % 100 == 0) {
                $this->em->flush();
            }
        }

        $this->em->flush();
    }

    public function generateCalendarEntriesForRevolvingPayment(RevolvingPayments $revolvingPayment): bool
    {
        $customerAccount = $revolvingPayment->getCustomerAccount();
        $startDate = $revolvingPayment->getStartOn();
        $acctTrackingCalendar = $this->em->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $customerAccount], ['calendarDate' => 'DESC']);
        $endDate = $acctTrackingCalendar->getCalendarDate();
        $cancelAfter = $revolvingPayment->getCanceledAfter();

        if ($cancelAfter && $cancelAfter < $endDate) {
            $endDate = $cancelAfter;
        }

        // Get all calendar entries for this customer account between start date and end date
        $calendarEntries = $this->em->getRepository(AccountsTrackingCalendar::class)
            ->createQueryBuilder('c')
            ->setCacheMode(Cache::MODE_REFRESH)
            ->where('c.customersAccount = :customerAccount')
            ->andWhere('c.calendarDate >= :startDate')
            ->andWhere('c.calendarDate <= :endDate')
            ->setParameter('customerAccount', $customerAccount)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('c.calendarDate', 'ASC')
            ->getQuery()
            ->getResult();

        if (empty($calendarEntries)) {
            return false;
        }

        $accountToWithdraw = $revolvingPayment->getAccountToWithdraw();
        $accountToPay = $revolvingPayment->getAccountToPay();
        $dayOfMonth = $revolvingPayment->getDayOfMonthToMakePayment();
        $paymentStrategy = $revolvingPayment->getPaymentStrategy();
        $chosenAmount = $revolvingPayment->getChosenAmount();
        $revolvingPaymentId = $revolvingPayment->getId();

        // Group calendar entries by month
        $monthlyEntries = [];
        foreach ($calendarEntries as $entry) {
            $monthYear = $entry->getCalendarDate()->format('Y-m');
            if (!isset($monthlyEntries[$monthYear])) {
                $monthlyEntries[$monthYear] = [];
            }
            $monthlyEntries[$monthYear][] = $entry;
        }

        $counter = 0;
        $oldPaymentAmount = 0;
        foreach ($monthlyEntries as $monthYear => $entries) {
            // Find the entry for the specified day of month
            $targetEntry = null;
            foreach ($entries as $entry) {
                $entryDay = (int)$entry->getCalendarDate()->format('d');
                if ($entryDay === $dayOfMonth) {
                    $targetEntry = $entry;
                    break;
                }
            }

            if ($targetEntry) {
                $accountsBalances = $targetEntry->getAccountsBalances();
                $accountToPayBalance = ($accountsBalances[$accountToPay->getId()] ?? 0) - $oldPaymentAmount;//Reduce each one of the next account to pay balances in the amounts already paid
                $accountToWithdrawBalance = ($accountsBalances[$accountToWithdraw->getId()] ?? 0) - $oldPaymentAmount;//Reduce each one of the next account to withdraw balances in the amounts already paid

                if ($accountToPayBalance <= 0 || $accountToWithdrawBalance <= 0) {
                    break; // Finish if no balance to pay or withdraw
                }

                // Calculate payment amount based on strategy
                $paymentAmount = $this->calculatePaymentAmount($paymentStrategy, $accountToPayBalance, $chosenAmount);

                $isLastPayment = false;
                if ($paymentAmount > 0 && $accountToPayBalance > 0) {
                    if ($paymentAmount > $accountToPayBalance) {
                        $paymentAmount = $accountToPayBalance;
                    }

                    if ($paymentAmount > $accountToWithdrawBalance) {
                        $paymentAmount = $accountToWithdrawBalance; //this is the last payment as no more funds to pay
                        //Update Metadata with color code for this low balance account to withdraw
                        $metadata = $targetEntry->getMetadata();
                        $metadata['accounts'][$accountToPay->getId()]['cant_pay_full'] = true;
                        $metadata['accounts'][$accountToWithdraw->getId()]['low_balance'] = true;
                        $targetEntry->setMetadata($metadata);
                        $isLastPayment = true;
                    }

                    $paymentAmount = round($paymentAmount, 2);
                    // Update payments_account_to_withdraw (income account)
                    $paymentsToWithdraw = $targetEntry->getPaymentsAccountToWithdraw();
                    if (!isset($paymentsToWithdraw[$accountToWithdraw->getId()])) {
                        $paymentsToWithdraw[$accountToWithdraw->getId()] = [];
                    }
                    $paymentsToWithdraw[$accountToWithdraw->getId()][$revolvingPaymentId] = $paymentAmount;
                    $targetEntry->setPaymentsAccountToWithdraw($paymentsToWithdraw);

                    // Update payments_account_to_pay (expense account)
                    $paymentsToPay = $targetEntry->getPaymentsAccountToPay();
                    if (!isset($paymentsToPay[$accountToPay->getId()])) {
                        $paymentsToPay[$accountToPay->getId()] = [];
                    }
                    $paymentsToPay[$accountToPay->getId()][$revolvingPaymentId] = $paymentAmount;
                    $targetEntry->setPaymentsAccountToPay($paymentsToPay);

                    $this->em->persist($targetEntry);

                    // Flush every 100 entries to avoid memory issues
                    $counter++;
                    if ($counter % 100 == 0) {
                        $this->em->flush();
                    }
                }
                if ($isLastPayment) {
                    break;
                }
                $oldPaymentAmount += $paymentAmount;
            }
        }
        $this->em->flush();

        return true;
    }

    private function calculatePaymentAmount(string $paymentStrategy, float $accountBalance, ?float $chosenAmount): float
    {
        switch ($paymentStrategy) {
            case 'Min. Payment (2%)':
                return round(($accountBalance * 0.02), 2);

            case 'Min. Payment (2%) + given % of projected balance':
                if ($chosenAmount === null) {
                    return 0.0;
                }
                $additionalPercentage = $chosenAmount / 100;
                return round((($accountBalance * 0.02) + ($accountBalance * $additionalPercentage)), 2);

            case 'Fixed Amount':
                return round(($chosenAmount ?? 0.0), 2);

            default:
                return 0.0;
        }
    }

    public function createRecurringInterestForAccount(Account $account, Customer $user): bool
    {
        $existingInterest = $this->em->getRepository(RecurringInterest::class)->findOneBy(['account' => $account]);
        if ($existingInterest) {
            return true;
        }

        $recurringInterest = new RecurringInterest();
        $recurringInterest->setName('Interest for ' . $account->getName());
        $recurringInterest->setAccount($account);
        $recurringInterest->setCustomerAccount($account->getCustomerAccount());
        $this->em->persist($recurringInterest);
        $this->em->flush();

        //Create Log Entry
        $logData = [
            'id' => $recurringInterest->getId(),
            'name' => $recurringInterest->getName(),
            'customerAccount' => $recurringInterest->getCustomerAccount()->getId(),
            'action' => 'create',
            'timestamp' => (new DateTime())->format('Y-m-d H:i:s')
        ];

        $log = new Log();
        $log->setAffectedEntityName('RecurringInterest');
        $log->setAction('create');
        $log->setLogEntityData(json_encode($logData));
        $log->setLogTimestamp(new DateTime());
        $log->setCustomer($user);
        $this->em->persist($log);
        $this->em->flush();

        //Create calendar entries for this new Recurring Interest
        $ok = $this->generateCalendarEntriesForRecurringInterest($recurringInterest);

        return true;
    }

    public function generateCalendarEntriesForRecurringSavings(RecurringSavings $recurringSaving): bool
    {
        $customerAccount = $recurringSaving->getCustomerAccount();
        $startDate = $recurringSaving->getStartOn();
        $acctTrackingCalendar = $this->em->getRepository(AccountsTrackingCalendar::class)->findOneBy(['customersAccount' => $customerAccount], ['calendarDate' => 'DESC']);
        $endDate = $acctTrackingCalendar->getCalendarDate();

        // Get all calendar entries for this customer account between start date and end date
        $calendarEntries = $this->em->getRepository(AccountsTrackingCalendar::class)
            ->createQueryBuilder('c')
            ->setCacheMode(Cache::MODE_REFRESH)
            ->where('c.customersAccount = :customerAccount')
            ->andWhere('c.calendarDate >= :startDate')
            ->andWhere('c.calendarDate <= :endDate')
            ->setParameter('customerAccount', $customerAccount)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('c.calendarDate', 'ASC')
            ->getQuery()
            ->getResult();

        if (empty($calendarEntries)) {
            return false;
        }

        $accountToWithdraw = $recurringSaving->getAccountToWithdraw();
        $accountToSave = $recurringSaving->getAccountToSave();
        $dayOfMonth = $recurringSaving->getDayOfMonthToMakeSaving();
        $savingsStrategy = $recurringSaving->getSavingsStrategy();
        $chosenAmount = $recurringSaving->getChosenAmount();
        $recurringSavingId = $recurringSaving->getId();

        // Group calendar entries by month
        $monthlyEntries = [];
        foreach ($calendarEntries as $entry) {
            $monthYear = $entry->getCalendarDate()->format('Y-m');
            if (!isset($monthlyEntries[$monthYear])) {
                $monthlyEntries[$monthYear] = [];
            }
            $monthlyEntries[$monthYear][] = $entry;
        }

        $counter = 0;
        $oldSavingAmount = 0;
        foreach ($monthlyEntries as $monthYear => $entries) {
            // Find the entry for the specified day of month
            $targetEntry = null;
            foreach ($entries as $entry) {
                $entryDay = (int)$entry->getCalendarDate()->format('d');
                if ($entryDay === $dayOfMonth) {
                    $targetEntry = $entry;
                    break;
                }
            }

            if ($targetEntry) {
                $accountsBalances = $targetEntry->getAccountsBalances();
                $accountToWithdrawBalance = ($accountsBalances[$accountToWithdraw->getId()] ?? 0) - $oldSavingAmount; // Reduce by previous savings amounts

                if ($accountToWithdrawBalance <= 0) {
                    break; // Finish if no balance to withdraw from
                }

                // Calculate saving amount based on strategy
                $savingAmount = $this->calculateSavingAmount($savingsStrategy, $accountToWithdrawBalance, $chosenAmount);

                $isLastSaving = false;
                if ($savingAmount > 0 && $accountToWithdrawBalance > 0) {
                    if ($savingAmount > $accountToWithdrawBalance) {
                        $savingAmount = $accountToWithdrawBalance;
                        $isLastSaving = true;
                    }

                    $savingAmount = round($savingAmount, 2);

                    // Update savings_account_to_withdraw (income account - withdrawal)
                    $savingsToWithdraw = $targetEntry->getSavingsAccountToWithdraw();
                    $savingsToWithdrawArray = json_decode($savingsToWithdraw ?? '{}', true) ?? [];
                    if (!isset($savingsToWithdrawArray[$accountToWithdraw->getId()])) {
                        $savingsToWithdrawArray[$accountToWithdraw->getId()] = [];
                    }
                    $savingsToWithdrawArray[$accountToWithdraw->getId()][$recurringSavingId] = $savingAmount;
                    $targetEntry->setSavingsAccountToWithdraw(json_encode($savingsToWithdrawArray));

                    // Update savings_account_to_save (savings/asset account - deposit)
                    $savingsToSave = $targetEntry->getSavingsAccountToSave();
                    $savingsToSaveArray = json_decode($savingsToSave ?? '{}', true) ?? [];
                    if (!isset($savingsToSaveArray[$accountToSave->getId()])) {
                        $savingsToSaveArray[$accountToSave->getId()] = [];
                    }
                    $savingsToSaveArray[$accountToSave->getId()][$recurringSavingId] = $savingAmount;
                    $targetEntry->setSavingsAccountToSave(json_encode($savingsToSaveArray));

                    // Update metadata if this is the last saving due to low balance
                    if ($isLastSaving) {
                        $metadata = $targetEntry->getMetadata();
                        $metadata['accounts'][$accountToWithdraw->getId()]['low_balance'] = true;
                        $targetEntry->setMetadata($metadata);
                    }

                    $this->em->persist($targetEntry);

                    // Flush every 100 entries to avoid memory issues
                    $counter++;
                    if ($counter % 100 == 0) {
                        $this->em->flush();
                    }
                }

                if ($isLastSaving) {
                    break;
                }
                $oldSavingAmount += $savingAmount;
            }
        }
        $this->em->flush();

        return true;
    }

    public function removeCalendarEntriesForRecurringSavings(RecurringSavings $recurringSaving, int $originalAccountToSaveId, int $originalAccountToWithdrawId): bool
    {
        $conn = $this->em->getConnection();
        $entityId = $recurringSaving->getId();
        $customerAccountId = $recurringSaving->getCustomerAccount()->getId();

        $fields = ['savings_account_to_save', 'savings_account_to_withdraw'];

        // Remove the entity from all accounts in the JSON field only for those entries >= $recurringSaving->getStartOn()
        $startOn = $recurringSaving->getStartOn()->format('Y-m-d');

        foreach ($fields as $field) {
            $originalAccountId = match ($field) {
                'savings_account_to_save' => $originalAccountToSaveId,
                default => $originalAccountToWithdrawId,
            };

            $sql = "
            UPDATE accounts_tracking_calendar
            SET $field = JSON_REMOVE(
                COALESCE($field, '{}'),
                CONCAT('$.', :account_id, '.', :entityId)
            )
            WHERE customers_account_id = :customerAccountId
            AND calendar_date >= '{$startOn}'
            AND JSON_CONTAINS_PATH($field, 'one', CONCAT('$.', :account_id, '.', :entityId))
        ";

            // Get all account IDs that might contain this entity
            $accountIds = [$originalAccountToSaveId, $originalAccountToWithdrawId];

            foreach ($accountIds as $accountId) {
                $stmt = $conn->prepare($sql);
                $stmt->bindValue('entityId', $entityId);
                $stmt->bindValue('customerAccountId', $customerAccountId);
                $stmt->bindValue('account_id', $originalAccountId);
                $stmt->executeStatement();
            }
        }

        return true;
    }

    private function calculateSavingAmount(string $savingsStrategy, float $accountBalance, ?float $chosenAmount): float
    {
        switch ($savingsStrategy) {
            case 'Min. Savings (2%)':
                return round(($accountBalance * 0.02), 2);

            case 'Min. Savings (2%) + given % of projected balance':
                if ($chosenAmount === null) {
                    return 0.0;
                }
                $additionalPercentage = $chosenAmount / 100;
                return round((($accountBalance * 0.02) + ($accountBalance * $additionalPercentage)), 2);

            case 'Fixed Amount':
                return round(($chosenAmount ?? 0.0), 2);

            default:
                return 0.0;
        }
    }

}
