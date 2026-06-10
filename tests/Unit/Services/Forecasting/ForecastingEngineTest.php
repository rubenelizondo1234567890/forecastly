<?php

namespace App\Tests\Unit\Services\Forecasting;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\BudgetTrackingGroup;
use App\Entity\CustomersAccount;
use App\Entity\RecurringIncome;
use App\Services\ForecastingEngine;
use App\Services\Forecasting\Strategy\RecurringExpenseForecastStrategy;
use App\Services\Forecasting\Strategy\RecurringIncomeForecastStrategy;
use App\Services\Forecasting\Strategy\RevolvingInterestForecastStrategy;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

#[AllowMockObjectsWithoutExpectations]
class ForecastingEngineTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private ForecastingEngine $engine;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $strategies = [
            new RecurringIncomeForecastStrategy(),
            new RecurringExpenseForecastStrategy(),
            new RevolvingInterestForecastStrategy(),
        ];
        $this->engine = new ForecastingEngine($this->em, $strategies);
    }

    public function testEarlyReturnWhenNoCalendarBaselineExists(): void
    {
        $customerAccount = $this->createStub(CustomersAccount::class);
        $repo = $this->createStub(EntityRepository::class);
        $repo->method('findOneBy')->willReturn(null);
        $this->em->method('getRepository')->willReturn($repo);

        $this->em->expects($this->never())->method('flush');

        $this->engine->generateFutureProjections($customerAccount, 1);
    }

    public function testBatchFlushCalledOnceNotPerDay(): void
    {
        $baseline = $this->createStub(AccountsTrackingCalendar::class);
        $baseline->method('getCalendarDate')->willReturn(new \DateTime('2026-01-01'));
        $baseline->method('getAccountsBalances')->willReturn([]);

        $this->wireRepositories(
            baseline: $baseline,
            accounts: [],
            recurringIncomes: [],
            recurringExpenses: [],
            recurringInterests: [],
            recurringSavings: [],
        );

        $this->em->method('persist');
        // flush() must be called exactly ONCE regardless of projection window length
        $this->em->expects($this->once())->method('flush');

        $this->engine->generateFutureProjections($this->createStub(CustomersAccount::class), 1);
    }

    public function testProjectsCorrectBalanceForRecurringIncome(): void
    {
        $group = $this->createStub(BudgetTrackingGroup::class);
        $group->method('getIsIncomeOrExpense')->willReturn('income');

        $account = $this->createStub(Account::class);
        $account->method('getId')->willReturn(1);
        $account->method('getBudgetTrackingGroup')->willReturn($group);
        $account->method('isRevolvingAccount')->willReturn(false);

        $income = $this->createStub(RecurringIncome::class);
        $income->method('getAccount')->willReturn($account);
        $income->method('getRecurringDay')->willReturn(1);
        $income->method('getAmount')->willReturn(6500.0);

        $baseline = $this->createStub(AccountsTrackingCalendar::class);
        $baseline->method('getCalendarDate')->willReturn(new \DateTime('2026-01-31'));
        $baseline->method('getAccountsBalances')->willReturn([1 => 0.0]);

        $this->wireRepositories(
            baseline: $baseline,
            accounts: [$account],
            recurringIncomes: [$income],
            recurringExpenses: [],
            recurringInterests: [],
            recurringSavings: [],
        );

        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($entity) use (&$persisted): void {
            $persisted[] = $entity;
        });
        $this->em->method('flush');

        $this->engine->generateFutureProjections($this->createStub(CustomersAccount::class), 1);

        // Feb 1 entry should have $6,500 income applied
        $feb1 = array_find($persisted, fn($e) => $e->getCalendarDate()->format('Y-m-d') === '2026-02-01');
        $this->assertNotNull($feb1);
        // assertEquals (not assertSame) because JSON round-trip strips float .0 suffix
        $this->assertEquals(6500.0, $feb1->getAccountsBalances()[1]);
    }

    public function testRevolvingInterestAccruedDailyOnNegativeBalance(): void
    {
        $group = $this->createStub(BudgetTrackingGroup::class);
        $group->method('getIsIncomeOrExpense')->willReturn('liability');

        $account = $this->createStub(Account::class);
        $account->method('getId')->willReturn(1);
        $account->method('getBudgetTrackingGroup')->willReturn($group);
        $account->method('isRevolvingAccount')->willReturn(true);
        $account->method('getAnnualInterestRate')->willReturn(19.99);
        $account->method('getProjectedBalance')->willReturn(-2100.0);

        $baseline = $this->createStub(AccountsTrackingCalendar::class);
        $baseline->method('getCalendarDate')->willReturn(new \DateTime('2026-01-31'));
        $baseline->method('getAccountsBalances')->willReturn([1 => -2100.0]);

        $this->wireRepositories(
            baseline: $baseline,
            accounts: [$account],
            recurringIncomes: [],
            recurringExpenses: [],
            recurringInterests: [],
            recurringSavings: [],
        );

        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($e) use (&$persisted): void {
            $persisted[] = $e;
        });
        $this->em->method('flush');

        $this->engine->generateFutureProjections($this->createStub(CustomersAccount::class), 1);

        // Daily interest on -$2100 at 19.99% APR = $2100 * (19.99/36500) ≈ $1.15/day
        $feb1 = array_find($persisted, fn($e) => $e->getCalendarDate()->format('Y-m-d') === '2026-02-01');
        $this->assertNotNull($feb1);
        $balance = $feb1->getAccountsBalances()[1];
        $this->assertLessThan(-2100.0, $balance, 'Interest should decrease (worsen) a negative balance');
    }

    public function testStrategySkippedWhenAccountTypeDoesNotApply(): void
    {
        $incomeGroup = $this->createStub(BudgetTrackingGroup::class);
        $incomeGroup->method('getIsIncomeOrExpense')->willReturn('income');

        $incomeAccount = $this->createStub(Account::class);
        $incomeAccount->method('getId')->willReturn(1);
        $incomeAccount->method('getBudgetTrackingGroup')->willReturn($incomeGroup);
        $incomeAccount->method('isRevolvingAccount')->willReturn(false);

        $baseline = $this->createStub(AccountsTrackingCalendar::class);
        $baseline->method('getCalendarDate')->willReturn(new \DateTime('2026-01-31'));
        $baseline->method('getAccountsBalances')->willReturn([1 => 0.0]);

        $this->wireRepositories(
            baseline: $baseline,
            accounts: [$incomeAccount],
            recurringIncomes: [],
            recurringExpenses: [],
            recurringInterests: [],
            recurringSavings: [],
        );

        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($e) use (&$persisted): void {
            $persisted[] = $e;
        });
        $this->em->method('flush');

        $this->engine->generateFutureProjections($this->createStub(CustomersAccount::class), 1);

        // RevolvingInterestForecastStrategy must not apply to an income account
        $feb1 = array_find($persisted, fn($e) => $e->getCalendarDate()->format('Y-m-d') === '2026-02-01');
        $this->assertNotNull($feb1);
        // Balance stays 0 — no expense or revolving strategy applies; no income scheduled on Feb 1
        // assertEquals (not assertSame) because JSON round-trip strips float .0 suffix
        $this->assertEquals(0.0, $feb1->getAccountsBalances()[1]);
    }

    /**
     * Wire all repository calls on the shared EM mock.
     * Each entity class gets its own dedicated repo stub so findBy/findOneBy
     * can return independent data without conflating results.
     *
     * @param Account[] $accounts
     */
    private function wireRepositories(
        AccountsTrackingCalendar $baseline,
        array $accounts,
        array $recurringIncomes,
        array $recurringExpenses,
        array $recurringInterests,
        array $recurringSavings,
    ): void {
        $calRepo = $this->createStub(EntityRepository::class);
        $calRepo->method('findOneBy')->willReturn($baseline);
        $calRepo->method('findBy')->willReturn([]);

        $accountRepo = $this->createStub(EntityRepository::class);
        $accountRepo->method('findBy')->willReturn($accounts);

        $incomeRepo = $this->createStub(EntityRepository::class);
        $incomeRepo->method('findBy')->willReturn($recurringIncomes);

        $expenseRepo = $this->createStub(EntityRepository::class);
        $expenseRepo->method('findBy')->willReturn($recurringExpenses);

        $interestRepo = $this->createStub(EntityRepository::class);
        $interestRepo->method('findBy')->willReturn($recurringInterests);

        $savingsRepo = $this->createStub(EntityRepository::class);
        $savingsRepo->method('findBy')->willReturn($recurringSavings);

        $this->em->method('getRepository')->willReturnCallback(
            fn(string $class) => match ($class) {
                \App\Entity\AccountsTrackingCalendar::class => $calRepo,
                \App\Entity\Account::class                  => $accountRepo,
                \App\Entity\RecurringIncome::class          => $incomeRepo,
                \App\Entity\RecurringExpense::class         => $expenseRepo,
                \App\Entity\RecurringInterest::class        => $interestRepo,
                \App\Entity\RecurringSavings::class         => $savingsRepo,
                default                                     => $this->createStub(EntityRepository::class),
            }
        );
    }
}
