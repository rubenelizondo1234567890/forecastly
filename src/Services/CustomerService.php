<?php

namespace App\Services;

use App\Constants\AppConstants;
use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\Customer;
use App\Entity\CustomersAccount;
use App\Entity\NonRecurringExpense;
use App\Entity\NonRecurringIncome;
use App\Entity\RecurringExpense;
use App\Entity\RecurringIncome;
use DateInterval;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Random\RandomException;

class CustomerService
{
    private EntityManagerInterface $em;
    
    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }
    
    public function getDashboardChartsData(Customer $user)
    {
        try {
            //Get Dates for this month
            $today = new DateTime('now');
            $currentMonth = $today->format('Y-m');
            $startDate = $currentMonth . '-01';
            $next = $today->add(new DateInterval('P1M'));
            $nextMonth = $next->format('Y-m');
            $endDate = $nextMonth . '-01';
            $cAcct = $user->getCustomersAccount();
            $entries = $this->getCalendarEntries($cAcct, $startDate, $endDate);
            $i = $this->getIncomesBreakdownChartData($entries);
            $e = $this->getExpensesBreakdownChartData($entries);
            return [
                'incomes' => $i['incomes'],
                'totalIncomes' => $i['totalIncomes'],
                'expenses' => $e['expenses'],
                'totalExpenses' => $e['totalExpenses'],
                'netWorth' => $this->getTotalNetworthChartData($cAcct),
            ];
        } catch (\Throwable $e) {
            dd($e);
            //dont break the dashboard
            return [
                'incomes' => [],
                'expenses' => [],
                'netWorth' => []
            ];
        }
    }
    
    /**
     * @param CustomersAccount $cAcct
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    private function getCalendarEntries(CustomersAccount $cAcct, string $startDate, string $endDate): array
    {
        $qb = $this->em->getRepository(AccountsTrackingCalendar::class)->createQueryBuilder('act');
        $qb->where('act.calendarDate>=:startDate');
        $qb->andWhere('act.calendarDate<:endDate');
        $qb->andWhere('act.customersAccount=:customersaccount');
        $qb->setParameter('startDate', $startDate);
        $qb->setParameter('endDate', $endDate);
        $qb->setParameter('customersaccount', $cAcct);
        
        return $qb->getQuery()->getResult();
    }
    
    /**
     * @param array $entries
     * @return array|array[]
     * @throws RandomException
     */
    private function getIncomesBreakdownChartData(array $entries): array
    {
        $totalIncomes = 0;
        $incomes = ['labels' => [], 'data' => [], 'bkgd' => []];
        // Process recurring incomes
        $recurringIncome = $nonRecurringIncome = [];
        foreach ($entries as $entry) {
            $entryRecurringIncomes = $entry->getRecurringIncomes();
            if (!empty($entryRecurringIncomes)) {
                foreach ($entryRecurringIncomes as $acctId => $items) {
                    foreach ($items as $id => $amount) {
                        if (!isset($recurringIncome[$id])) {
                            $recurringIncome[$id] = 0;
                        }
                        $recurringIncome[$id] += $amount;
                    }
                }
            }
            $entryNonRecurringIncomes = $entry->getNonRecurringIncomes();
            if (!empty($entryNonRecurringIncomes)) {
                foreach ($entryNonRecurringIncomes as $acctId => $items) {
                    foreach ($items as $id => $amount) {
                        if (!isset($nonRecurringIncome[$id])) {
                            $nonRecurringIncome[$id] = 0;
                        }
                        $nonRecurringIncome[$id] += $amount;
                    }
                }
            }
        }
        
        foreach ($recurringIncome as $acctId => $amount) {
            $iEntry = $this->em->getRepository(RecurringIncome::class)->find($acctId);
            $incomes['labels'][] = !empty($iEntry) ? $iEntry->getName() : 'na';
            $incomes['data'][] = $amount ?? 0;
            $incomes['bkgd'][] = 'rgba(40, 167, ' . random_int(60, 100) . ', 0.7)';
            $totalIncomes += $amount;
        }
        
        foreach ($nonRecurringIncome as $acctId => $amount) {
            $iEntry = $this->em->getRepository(NonRecurringIncome::class)->find($acctId);
            $incomes['labels'][] = !empty($iEntry) ? $iEntry->getName() : 'na';
            $incomes['data'][] = $amount ?? 0;
            $incomes['bkgd'][] = 'rgba(40, 167, ' . random_int(60, 100) . ', 0.7)';
            $totalIncomes += $amount;
        }
        
        return ['incomes' => $incomes, 'totalIncomes' => $totalIncomes];
    }
    
    /**
     * @param array $entries
     * @return array|array[]
     * @throws RandomException
     */
    private function getExpensesBreakdownChartData(array $entries): array
    {
        $totalExpenses = 0;
        $expenses = ['labels' => [], 'data' => [], 'bkgd' => []];
        
        // Process recurring expenses (unchanged)
        $recurringExpense = $nonRecurringExpense = [];
        foreach ($entries as $entry) {
            $entryRecurringExpenses = $entry->getRecurringExpenses();
            if (!empty($entryRecurringExpenses)) {
                foreach ($entryRecurringExpenses as $acctId => $items) {
                    foreach ($items as $id => $amount) {
                        if (!isset($recurringExpense[$id])) {
                            $recurringExpense[$id] = 0;
                        }
                        $recurringExpense[$id] += $amount;
                    }
                }
            }
            $entryNonRecurringExpenses = $entry->getNonRecurringExpenses();
            if (!empty($entryNonRecurringExpenses)) {
                foreach ($entryNonRecurringExpenses as $acctId => $items) {
                    foreach ($items as $id => $amount) {
                        if (!isset($nonRecurringExpense[$id])) {
                            $nonRecurringExpense[$id] = 0;
                        }
                        $nonRecurringExpense[$id] += $amount;
                    }
                }
            }
        }
        foreach ($recurringExpense as $acctId => $amount) {
            $iEntry = $this->em->getRepository(RecurringExpense::class)->find($acctId);
            $expenses['labels'][] = !empty($iEntry) ? $iEntry->getName() : 'na';
            $expenses['data'][] = $amount ?? 0;
            $expenses['bkgd'][] = 'rgba(40, 167, ' . random_int(60, 100) . ', 0.7)';
            $totalExpenses += $amount;
        }
        foreach ($nonRecurringExpense as $acctId => $amount) {
            $iEntry = $this->em->getRepository(NonRecurringExpense::class)->find($acctId);
            $expenses['labels'][] = !empty($iEntry) ? $iEntry->getName() : 'na';
            $expenses['data'][] = $amount ?? 0;
            $expenses['bkgd'][] = 'rgba(40, 167, ' . random_int(60, 100) . ', 0.7)';
            $totalExpenses += $amount;
        }
        
        return ['expenses' => $expenses, 'totalExpenses' => $totalExpenses];
    }
    
    private function getTotalNetworthChartData(CustomersAccount $cAcct): array
    {
        $totAsset = $totLiability = $net = 0;
        $today = new DateTime(date('Y-m-d'));
        $entry = $this->em->getRepository(AccountsTrackingCalendar::class)->findOneBy(['calendarDate' => $today, 'customersAccount' => $cAcct]);
        if (!empty($entry)) {
            $accountBalances = $entry->getAccountsBalances();
            if (!empty($accountBalances)) {
                //dd($accountBalances);
                foreach ($accountBalances as $accountId => $amount) {
                    $account = $this->em->getRepository(Account::class)->find($accountId);
                    if ($account && $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() == 'income') {
                        $totAsset += $amount ?? 0;
                    } elseif ($account && $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() == 'expense') {
                        $totLiability += $amount ?? 0;
                    }
                }
            }
        }
        $net = $totAsset - $totLiability;
        
        $netWorth['labels'] = ['Total Assets', 'Total Liabilities', 'Net Worth'];
        $netWorth['data'] = [$totAsset, $totLiability, $net];
        $netWorth['bkgd'] = [
            'rgba(40, ' . random_int(30, 120) . ', ' . random_int(30, 120) . ', 0.7)',
            'rgba(220, ' . random_int(120, 200) . ', ' . random_int(0, 20) . ', 0.7)',
            'rgba(0, ' . random_int(0, 20) . ', ' . random_int(200, 255) . ', 0.7)'
        ];
        $netWorth['color'] = [
            'rgba(40, ' . random_int(30, 120) . ', ' . random_int(30, 120) . ', 0.7)',
            'rgba(220, ' . random_int(120, 200) . ', ' . random_int(0, 20) . ', 0.7)',
            'rgba(0, ' . random_int(0, 20) . ', ' . random_int(200, 255) . ', 0.7)'
        ];
        
        
        return $netWorth;
    }
    
}