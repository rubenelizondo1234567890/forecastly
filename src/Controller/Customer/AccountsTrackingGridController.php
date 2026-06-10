<?php
// src/Controller/Customer/AccountsTrackingGridController.php (updated)
namespace App\Controller\Customer;

use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\Log;
use App\Entity\NonRecurringExpense;
use App\Entity\NonRecurringIncome;
use App\Entity\NonRecurringIncomeExpensesInterface;
use App\Form\AccountType;
use App\Services\AccountsService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/accounts/tracking/grid', name: 'customer_accounts_tracking_grid_')]
#[IsGranted('ROLE_CUSTOMER')]
class AccountsTrackingGridController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(Request $request, EntityManagerInterface $entityManager): Response
    {
        $customerAccount = $this->getUser()->getCustomersAccount();
        $selectedYear = (int) $request->query->get('year', date('Y'));
        $selectedMonth = (int) $request->query->get('month', date('m'));

        $currentYear = (int) date('Y');

        $minYear = $currentYear - 1;
        $maxYear = $currentYear + 2;

        // Clamp selectedYear to the allowed range
        if ($selectedYear < $minYear) {
            $selectedYear = $currentYear;
        } elseif ($selectedYear > $maxYear) {
            $selectedYear = $maxYear;
        }

        // Clamp selectedMonth
        if ($selectedMonth < 1) {
            $selectedMonth = 1;
        } elseif ($selectedMonth > 12) {
            $selectedMonth = 12;
        }

        // Generate display years for the dropdown
        $displayYears = [];
        for ($year = $minYear; $year <= $maxYear; $year++) {
            $displayYears[] = $year;
        }

        // Get calendar data for the selected month
        $startDate = new DateTime(sprintf('%d-%02d-01', $selectedYear, $selectedMonth));
        $endDate = (clone $startDate)->modify('last day of this month')->setTime(23, 59, 59);

        $calendarData = $entityManager->getRepository(AccountsTrackingCalendar::class)
            ->createQueryBuilder('c')
            ->where('c.customersAccount = :customerAccount')
            ->andWhere('c.calendarDate BETWEEN :start AND :end')
            ->setParameter('customerAccount', $customerAccount)
            ->setParameter('start', $startDate)
            ->setParameter('end', $endDate)
            ->orderBy('c.calendarDate', 'ASC')
            ->getQuery()
            ->getResult();

        // Organize data by day
        $dailyData = [];
        foreach ($calendarData as $entry) {
            $day = (int) $entry->getCalendarDate()->format('j');

            $dailyData[$day] = [
                'entity' => $entry,
                'recurringIncomes' => $entry->getRecurringIncomes(),
                'nonRecurringIncomes' => $entry->getNonRecurringIncomes(),
                'recurringExpenses' => $entry->getRecurringExpenses(),
                'nonRecurringExpenses' => $entry->getNonRecurringExpenses(),
                'recurringIncomeInterests' => $entry->getRecurringIncomeInterest(),
                'recurringExpenseInterests' => $entry->getRecurringExpenseInterest(),
                'revolvingPaymentsToPay' => $entry->getPaymentsAccountToPay(),
                'revolvingPaymentsToWithdraw' => $entry->getPaymentsAccountToWithdraw(),
                'recurringSavingsInterests' => $entry->getRecurringSavingsInterest(),
                'savingsAccountToSave' => $entry->getSavingsAccountToSave(),
                'savingsAccountToWithdraw' => $entry->getSavingsAccountToWithdraw(),
                'accountMetadata' => $entry->getMetadata(),
                'accountsBalances' => $entry->getAccountsBalances(),
            ];
        }

        // Get accounts sorted by name
        $accounts = $entityManager->getRepository(Account::class)
            ->findBy(['customerAccount' => $customerAccount], ['name' => 'ASC']);

        $accountNames = [];
        $accountTypes = [];
        foreach ($accounts as $account) {
            $accountNames[$account->getId()] = $account->getName();
            $accountTypes[$account->getId()] = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
        }

        // Calculate monthly totals
        $monthlyTotals = [
            'accountTransactionNets' => [],
            'finalBalances' => [],
        ];

        $accountTransactionNets = [];
        $lastBalances = [];
        foreach ($accounts as $account) {
            $acctId = $account->getId();
            $accountTransactionNets[$acctId] = 0.0;
            $lastBalances[$acctId] = 0.0;
        }

        foreach ($calendarData as $entry) {
            $acctBalances = $entry->getAccountsBalances();
            foreach ($accounts as $account) {
                $acctId = $account->getId();
                $netDay = 0.0;

                // + incomes and income interests
                $netDay += array_sum($entry->getRecurringIncomes()[$acctId] ?? []);
                $netDay += array_sum($entry->getNonRecurringIncomes()[$acctId] ?? []);
                $netDay += array_sum($entry->getRecurringIncomeInterest()[$acctId] ?? []);

                // + recurring savings interests
                $netDay += array_sum($entry->getRecurringSavingsInterest()[$acctId] ?? []);

                // - savings withdrawals
                $netDay -= array_sum($entry->getSavingsAccountToWithdraw()[$acctId] ?? []);

                // - expenses and expense interests
                $netDay -= array_sum($entry->getRecurringExpenses()[$acctId] ?? []);
                $netDay -= array_sum($entry->getNonRecurringExpenses()[$acctId] ?? []);
                $netDay -= array_sum($entry->getRecurringExpenseInterest()[$acctId] ?? []);

                // + savings deposits
                $netDay += array_sum($entry->getSavingsAccountToSave()[$acctId] ?? []);

                // - revolving payments to withdraw
                $netDay -= array_sum($entry->getPaymentsAccountToWithdraw()[$acctId] ?? []);

                // + revolving payments to pay (money coming into the account)
                $netDay += array_sum($entry->getPaymentsAccountToPay()[$acctId] ?? []);

                $accountTransactionNets[$acctId] += $netDay;
            }

            // Update last balances (since ordered ASC)
            $lastBalances = $acctBalances;
        }

        $monthlyTotals['accountTransactionNets'] = $accountTransactionNets;
        $monthlyTotals['finalBalances'] = $lastBalances;

        return $this->render('customer/accounts_tracking_calendar/index_grid.html.twig', [
            'dailyData' => $dailyData,
            'accountNames' => $accountNames,
            'accountTypes' => $accountTypes,
            'selectedYear' => $selectedYear,
            'selectedMonth' => $selectedMonth,
            'displayYears' => $displayYears,
            'accounts' => $accounts,
            'monthlyTotals' => $monthlyTotals,
        ]);
    }

}
