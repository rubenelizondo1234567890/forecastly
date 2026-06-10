<?php
// src/Controller/Customer/AccountsTrackingCalendarController.php
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

#[Route('/customer/accounts/tracking/calendar', name: 'customer_accounts_tracking_calendar_')]
#[IsGranted('ROLE_CUSTOMER')]
class AccountsTrackingCalendarController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(Request $request, EntityManagerInterface $entityManager): Response
    {
        $customerAccount = $this->getUser()->getCustomersAccount();
        $selectedYear = $request->query->get('year', date('Y'));
        $currentYear = (int) date('Y');
        $selectedYear = (int) $selectedYear;

        $minYear = $currentYear - 1;
        $maxYear = $currentYear + 2;

        // Clamp selectedYear to the allowed range
        if ($selectedYear < $minYear) {
            $selectedYear = $currentYear;
        } elseif ($selectedYear > $maxYear) {
            $selectedYear = $maxYear;
        }

        // Generate display years for the dropdown (one year before, current, and three after)
        $displayYears = [];
        for ($year = $minYear; $year <= $maxYear; $year++) {
            $displayYears[] = $year;
        }

        // Get calendar data for the selected year
        $startDate = new DateTime("$selectedYear-01-01");
        $endDate = new DateTime("$selectedYear-12-31 23:59:59");

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

        // Organize data by month
        $monthlyData = [];
        foreach ($calendarData as $entry) {
            $month = (int)$entry->getCalendarDate()->format('n');
            $day = (int)$entry->getCalendarDate()->format('j');

            $monthlyData[$month][$day] = [
                'entity' => $entry,
                'recurringIncomes' => $entry->getRecurringIncomes(),
                'nonRecurringIncomes' => $entry->getNonRecurringIncomes(),
                'recurringExpenses' => $entry->getRecurringExpenses(),
                'nonRecurringExpenses' => $entry->getNonRecurringExpenses(),
                'recurringIncomeInterests' => $entry->getRecurringIncomeInterest(),
                'recurringExpenseInterests' => $entry->getRecurringExpenseInterest(),
                'recurringPaymentsToPay' => $entry->getPaymentsAccountToPay(),
                'recurringPaymentsToWithdraw' => $entry->getPaymentsAccountToWithdraw(),
                'recurringSavingsInterests' => $entry->getRecurringSavingsInterest(),
                'savingsAccountToSave' => $entry->getSavingsAccountToSave(),
                'savingsAccountToWithdraw' => $entry->getSavingsAccountToWithdraw(),
                'accountMetadata' => $entry->getMetadata(),
                'accountsBalances' => $entry->getAccountsBalances(),
            ];
        }

        // Calculate monthly totals
        $monthlyTotals = [];
        foreach ($monthlyData as $month => $days) {
            $totalIncomes = 0;
            $totalExpenses = 0;
            $accountBalances = [];

            foreach ($days as $dayData) {
                // Calculate incomes
                foreach ($dayData['recurringIncomes'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalIncomes += $amount;
                    }
                }
                foreach ($dayData['nonRecurringIncomes'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalIncomes += $amount;
                    }
                }
                foreach ($dayData['recurringPaymentsToWithdraw'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalIncomes -= $amount;
                    }
                }
                foreach ($dayData['recurringIncomeInterests'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalIncomes += $amount;
                    }
                }
                foreach ($dayData['recurringSavingsInterests'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalIncomes += $amount;
                    }
                }

                // Calculate expenses
                foreach ($dayData['recurringExpenses'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalExpenses += $amount;
                    }
                }
                foreach ($dayData['nonRecurringExpenses'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalExpenses += $amount;
                    }
                }
                foreach ($dayData['recurringExpenseInterests'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalExpenses += $amount;
                    }
                }
                foreach ($dayData['recurringPaymentsToPay'] as $accountTransactions) {
                    foreach ($accountTransactions as $amount) {
                        $totalExpenses -= $amount;
                    }
                }

                // Get latest account balances
                foreach ($dayData['accountsBalances'] as $accountId => $balance) {
                    $accountBalances[$accountId] = $balance;
                }
            }

            $monthlyTotals[$month] = [
                'totalIncomes' => $totalIncomes,
                'totalExpenses' => $totalExpenses,
                'accountBalances' => $accountBalances,
            ];
        }

        // Get account names for display
        $accounts = $entityManager->getRepository(Account::class)
            ->findBy(['customerAccount' => $customerAccount]);

        $accountNames = [];
        $accountTypes = [];
        foreach ($accounts as $account) {
            $accountNames[$account->getId()] = $account->getName();
            $accountTypes[$account->getId()] = $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
        }

        return $this->render('customer/accounts_tracking_calendar/index.html.twig', [
            'monthlyData' => $monthlyData,
            'monthlyTotals' => $monthlyTotals,
            'accountNames' => $accountNames,
            'accountTypes' => $accountTypes, // Add this line
            'selectedYear' => $selectedYear,
            'displayYears' => $displayYears,
        ]);
    }

    #[Route('/day-details/{date}', name: 'day_details', methods: ['GET'])]
    public function dayDetails(string $date, EntityManagerInterface $entityManager): Response
    {
        $customerAccount = $this->getUser()->getCustomersAccount();
        $dateObj = DateTime::createFromFormat('!Y-m-d', $date);

        if (!$dateObj) {
            throw $this->createNotFoundException('Invalid date format');
        }

        $calendarEntry = $entityManager->getRepository(AccountsTrackingCalendar::class)
            ->findOneBy([
                'customersAccount' => $customerAccount,
                'calendarDate' => $dateObj
            ]);

        if (!$calendarEntry) {
            return new JsonResponse(['error' => 'No data found for this date'], 404);
        }

        // Get account names for display
        $accountIds = array_keys($calendarEntry->getAccountsBalances());
        $accounts = $entityManager->getRepository(Account::class)
            ->findBy(['id' => $accountIds]);

        $accountNames = [];
        foreach ($accounts as $account) {
            $accountNames[$account->getId()] = $account->getName();
        }

        return $this->render('customer/accounts_tracking_calendar/day_details.html.twig', [
            'date' => $date,
            'entry' => $calendarEntry,
            'accountNames' => $accountNames,
        ]);
    }
}
