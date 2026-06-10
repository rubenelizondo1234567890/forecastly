<?php

namespace App\Controller\Customer;

use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Repository\AccountRepository;
use App\Repository\AccountsTrackingCalendarRepository;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/customer/forecasting', name: 'customer_forecasting_')]
class CustomerForecastingController extends AbstractController
{
    #[Route('/account-projections-page', name: 'accounts_projections_page', methods: ['GET'])]
    public function accountsProjectionsPage(EntityManagerInterface $em): Response
    {
        $customerAccount = $this->getUser()->getCustomersAccount();
        $accounts = $em->getRepository(Account::class)->findBy(['customerAccount' => $customerAccount]);

        return $this->render('customer/forecasting/accounts_projections.html.twig', [
            'accounts' => $accounts,
        ]);
    }

    #[Route('/account-projections', name: 'account_projections', methods: ['GET'])]
    public function accountProjections(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $accountId = $request->query->get('account_id');
        $period = (int) $request->query->get('period');

        // Validate period
        $allowedPeriods = [1, 3, 5, 10, 15, 20, 30];
        if (!in_array($period, $allowedPeriods)) {
            return $this->json(['error' => 'Invalid period'], 400);
        }

        $cAcct = $this->getUser()->getCustomersAccount();
        $account = $em->getRepository(Account::class)->find($accountId);

        // Validate account ownership
        if (!$account || $account->getCustomerAccount() !== $cAcct) {
            return $this->json(['error' => 'Account not found'], 404);
        }

        // Calculate date range
        $startDate = new DateTime();
        $endDate = (new DateTime())->modify("+$period years");

        // Get ALL calendar entries for this period (we'll filter for Mondays)
        /** @var AccountsTrackingCalendarRepository $calRepo */
        $calRepo = $em->getRepository(AccountsTrackingCalendar::class);
        $calendarEntries = $calRepo->findByCustomerAccountInDateRange($cAcct, $startDate, $endDate);

        // Create a map of dates to balances for easier lookup
        $balanceMap = [];
        foreach ($calendarEntries as $entry) {
            $dateKey = $entry->getCalendarDate()->format('Y-m-d');
            $accountsBalances = $entry->getAccountsBalances();
            $balanceMap[$dateKey] = $accountsBalances[$accountId] ?? 0;
        }

        // Generate data points for each Monday in the range
        $data = [];
        $labels = [];

        $currentMonday = clone $startDate;
        // Find the first Monday on or after start date
        if ($currentMonday->format('N') != 1) { // 1 = Monday
            $currentMonday->modify('next monday');
        }

        while ($currentMonday <= $endDate) {
            $mondayKey = $currentMonday->format('Y-m-d');

            // Find the closest available balance (use the balance from this Monday, or the most recent previous date)
            $balance = 0;
            if (isset($balanceMap[$mondayKey])) {
                $balance = $balanceMap[$mondayKey];
            } else {
                // Look for the most recent previous date with data
                $tempDate = clone $currentMonday;
                while ($balance === 0 && $tempDate >= $startDate) {
                    $tempKey = $tempDate->format('Y-m-d');
                    if (isset($balanceMap[$tempKey])) {
                        $balance = $balanceMap[$tempKey];
                        break;
                    }
                    $tempDate->modify('-1 day');
                }
            }

            $data[] = floatval($balance);

            // Format labels based on period (keep existing label logic)
            if ($period === 1) {
                // For 1 year, show month names
                $labels[] = $currentMonday->format('M Y');
            } else {
                // For multiple years, show year only (once per year)
                $year = $currentMonday->format('Y');
                if (empty($labels) || $year !== substr(end($labels), -4)) {
                    $labels[] = $year;
                } else {
                    $labels[] = '';
                }
            }

            // Move to next Monday
            $currentMonday->modify('+1 week');
        }

        return $this->json([
            'success' => true,
            'data' => $data,
            'labels' => $labels,
            'account' => [
                'name' => $account->getName(),
                'currentBalance' => $account->getProjectedBalance(),
                'hasMaxLimit' => $account->isHasMaxLimit(),
                'maxLimit' => $account->getMaxLimit()
            ]
        ]);
    }

    #[Route('/customer/net-balance-projections-page', name: 'net_balance_projections_page', methods: ['GET'])]
    public function netBalanceProjectionsPage(EntityManagerInterface $em): Response
    {
        return $this->render('customer/forecasting/net_balance_projections.html.twig', []);
    }

    #[Route('/net-balance-projections', name: 'net_balance_projections', methods: ['GET'])]
    public function netBalanceProjections(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $period = (int) $request->query->get('period');

        // Validate period
        $allowedPeriods = [1, 3, 5, 10, 15, 20, 30];
        if (!in_array($period, $allowedPeriods)) {
            return $this->json(['error' => 'Invalid period'], 400);
        }

        $cAcct = $this->getUser()->getCustomersAccount();

        // Calculate date range
        $startDate = new DateTime();
        $endDate = (new DateTime())->modify("+$period years");

        // Get calendar entries for this period
        /** @var AccountsTrackingCalendarRepository $calRepo */
        $calRepo = $em->getRepository(AccountsTrackingCalendar::class);
        $calendarEntries = $calRepo->findByCustomerAccountInDateRange($cAcct, $startDate, $endDate);

        // Get all accounts for the customer
        $accounts = $em->getRepository(Account::class)->findBy(['customerAccount' => $cAcct]);

        $data = [
            'income' => [],
            'expense' => [],
            'net' => []
        ];
        $labels = [];
        $currentMonth = null;

        foreach ($calendarEntries as $entry) {
            $date = $entry->getCalendarDate();
            $month = $date->format('Y-m');

            if ($month !== $currentMonth) {
                $currentMonth = $month;

                // Calculate aggregates for this month
                $monthIncome = 0;
                $monthExpense = 0;
                $accountsBalances = $entry->getAccountsBalances();

                foreach ($accounts as $account) {
                    $balance = $accountsBalances[$account->getId()] ?? 0;

                    if ($account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'income') {
                        $monthIncome += $balance;
                    } else {
                        $monthExpense += $balance;
                    }
                }

                $data['income'][] = floatval($monthIncome);
                $data['expense'][] = floatval($monthExpense);
                $data['net'][] = floatval($monthIncome - $monthExpense);

                // Format labels based on period
                $labelDate = DateTime::createFromFormat('Y-m', $currentMonth);
                if ($period === 1) {
                    $labels[] = $labelDate->format('M Y');
                } else {
                    $year = $labelDate->format('Y');
                    if (!in_array($year, $labels)) {
                        $labels[] = $year;
                    } else {
                        $labels[] = '';
                    }
                }
            }
        }

        return $this->json([
            'success' => true,
            'data' => $data,
            'labels' => $labels
        ]);
    }

    #[Route('/what-if-projections-page', name: 'what_if_projections_page', methods: ['GET'])]
    public function whatIfProjectionsPage(EntityManagerInterface $em): Response
    {
        $customerAccount = $this->getUser()->getCustomersAccount();

        /** @var AccountRepository $accountRepo */
        $accountRepo = $em->getRepository(Account::class);
        $incomeAccounts  = $accountRepo->findByTypeAndCustomerAccount($customerAccount, 'income');
        $expenseAccounts = $accountRepo->findByTypeAndCustomerAccount($customerAccount, 'expense');

        return $this->render('customer/forecasting/what_if_projections.html.twig', [
            'incomeAccounts' => $incomeAccounts,
            'expenseAccounts' => $expenseAccounts,
        ]);
    }
}
