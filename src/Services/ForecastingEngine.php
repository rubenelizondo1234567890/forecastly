<?php
// src/Services/ForecastingEngine.php

namespace App\Services;

use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\CustomersAccount;
use DateInterval;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;

class ForecastingEngine
{
    private EntityManagerInterface $em;
    private AccountsService $accountsService;
    
    public function __construct(EntityManagerInterface $em, AccountsService $accountsService)
    {
        $this->em = $em;
        $this->accountsService = $accountsService;
    }
    
    public function generateFutureProjections(CustomersAccount $customerAccount, int $monthsToProject = 12): void
    {
        $currentDate = new DateTime();
        $endDate = (clone $currentDate)->modify("+$monthsToProject months");
        
        // Get the latest calendar entry to use as starting point
        $lastEntry = $this->em->getRepository(AccountsTrackingCalendar::class)
            ->findOneBy(['customersAccount' => $customerAccount], ['calendarDate' => 'DESC']);
        
        if (!$lastEntry) {
            return;
        }
        
        $currentDate = clone $lastEntry->getCalendarDate();
        $currentDate->modify('+1 day');
        
        while ($currentDate <= $endDate) {
            $this->createProjectedDay($customerAccount, $currentDate);
            $currentDate->modify('+1 day');
        }
    }
    
    private function createProjectedDay(CustomersAccount $customerAccount, DateTime $date): void
    {
        $previousDay = (clone $date)->modify('-1 day');
        $previousEntry = $this->em->getRepository(AccountsTrackingCalendar::class)
            ->findOneBy(['customersAccount' => $customerAccount, 'calendarDate' => $previousDay]);
        
        if (!$previousEntry) {
            return;
        }
        
        $newEntry = new AccountsTrackingCalendar();
        $newEntry->setCustomersAccount($customerAccount);
        $newEntry->setCalendarDate(clone $date);
        
        // Copy recurring transactions from previous patterns
        $this->projectRecurringTransactions($newEntry, $date);
        
        // Calculate projected balances based on previous day + scheduled transactions
        $projectedBalances = $this->calculateProjectedBalances(
            $previousEntry->getAccountsBalances(),
            $newEntry->getRecurringIncomes(),
            $newEntry->getRecurringExpenses(),
            $customerAccount
        );
        
        $newEntry->setAccountsBalances($projectedBalances);
        
        $this->em->persist($newEntry);
        $this->em->flush();
    }
    
    private function calculateProjectedBalances(
        array $previousBalances,
        array $recurringIncomes,
        array $recurringExpenses,
        CustomersAccount $customerAccount
    ): array {
        $newBalances = $previousBalances;
        
        // Process incomes
        foreach ($recurringIncomes as $accountId => $incomeEntries) {
            $incomeTotal = array_sum($incomeEntries);
            $account = $this->em->getRepository(Account::class)->find($accountId);
            
            if ($account && $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'income') {
                $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) + $incomeTotal;
            }
        }
        
        // Process expenses
        foreach ($recurringExpenses as $accountId => $expenseEntries) {
            $expenseTotal = array_sum($expenseEntries);
            $account = $this->em->getRepository(Account::class)->find($accountId);
            
            if ($account && $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'expense') {
                $newBalances[$accountId] = ($newBalances[$accountId] ?? 0) - $expenseTotal;
            }
        }
        
        return $newBalances;
    }
    
    private function calculateInterestProjections(Account $account, array $balances): array
    {
        if ($account->isRevolvingAccount() && $account->getAnnualInterestRate()) {
            $dailyRate = $account->getAnnualInterestRate() / 36500;
            foreach ($balances as $date => $balance) {
                if ($balance < 0) { // Only charge interest on negative balances
                    $balances[$date] = $balance * (1 + $dailyRate);
                }
            }
        }
        return $balances;
    }
    
    private function projectOneTimeTransactions(DateTime $date): array
    {
        // Project scheduled one-time transactions
        return [
            'incomes' => [],
            'expenses' => []
        ];
    }
    
}