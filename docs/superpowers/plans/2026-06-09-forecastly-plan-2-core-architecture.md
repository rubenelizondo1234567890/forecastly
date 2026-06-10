# Forecastly Portfolio Demo — Plan 2: Core Architecture

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the three world-class showcase files: `Money` Value Object, `ForecastStrategyInterface` + four concrete strategies, a fully refactored `ForecastingEngine` (Strategy orchestrator, N+1 eliminated, PHP 8.4 features), and the Service Contract layer.

**Architecture:** `ForecastingEngine` becomes a pure orchestrator — it holds a `ForecastStrategyInterface[]` collection injected via Symfony DI tags, builds a `ProjectionContext` DTO from a single pre-load query, iterates strategies per account per day, and accumulates entities for a single `flush()` at the end. `Money` VO stores amounts in integer cents. Service interfaces in `src/Services/Contract/` decouple all cross-service dependencies.

**Tech Stack:** PHP 8.4, Symfony 7.4 DI tags, Doctrine ORM 3.x, PHPUnit 12.

**Prerequisite:** Plan 1 complete. Docker stack running.

---

## File Map

| Action | Path |
|---|---|
| Create | `src/ValueObject/Money.php` |
| Create | `src/DTO/ProjectionContext.php` |
| Create | `src/Services/Forecasting/Strategy/ForecastStrategyInterface.php` |
| Create | `src/Services/Forecasting/Strategy/RecurringIncomeForecastStrategy.php` |
| Create | `src/Services/Forecasting/Strategy/RecurringExpenseForecastStrategy.php` |
| Create | `src/Services/Forecasting/Strategy/RevolvingInterestForecastStrategy.php` |
| Create | `src/Services/Forecasting/Strategy/RecurringSavingsForecastStrategy.php` |
| Modify | `src/Services/ForecastingEngine.php` |
| Create | `src/Services/Contract/ForecastingEngineInterface.php` |
| Create | `src/Services/Contract/AccountsServiceInterface.php` |
| Create | `src/Services/Contract/CustomerServiceInterface.php` |
| Create | `src/Services/Contract/EmailServiceInterface.php` |
| Modify | `config/services.yaml` |
| Create | `tests/Unit/ValueObject/MoneyTest.php` |
| Create | `tests/Unit/Services/Forecasting/ForecastingEngineTest.php` |

---

## Task 1: Money Value Object

**Files:**
- Create: `src/ValueObject/Money.php`
- Create: `tests/Unit/ValueObject/MoneyTest.php`

- [x] **Step 1: Write the failing test**

Create `tests/Unit/ValueObject/MoneyTest.php`:

```php
<?php

namespace App\Tests\Unit\ValueObject;

use App\ValueObject\Money;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    public function testAddReturnsCorrectCents(): void
    {
        $a = new Money(1000); // $10.00
        $b = new Money(250);  // $2.50
        $result = $a->add($b);
        $this->assertSame(1250, $result->getAmount());
    }

    public function testSubtractReturnsCorrectCents(): void
    {
        $a = new Money(1000);
        $b = new Money(300);
        $result = $a->subtract($b);
        $this->assertSame(700, $result->getAmount());
    }

    public function testToFloatConvertsFromCents(): void
    {
        $money = new Money(199);
        $this->assertSame(1.99, $money->toFloat());
    }

    public function testFromFloatConvertsToIntegerCents(): void
    {
        $money = Money::fromFloat(19.99);
        $this->assertSame(1999, $money->getAmount());
    }

    public function testFormattedHookReturnsUsdString(): void
    {
        $money = new Money(4200);
        $this->assertSame('$42.00', $money->formatted);
    }

    public function testAddThrowsOnCurrencyMismatch(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new Money(100, 'USD'))->add(new Money(100, 'EUR'));
    }
}
```

- [x] **Step 2: Run test to verify it fails**

```bash
docker compose exec app php bin/phpunit tests/Unit/ValueObject/MoneyTest.php --testdox
# Expected: FAIL — class Money not found
```

- [x] **Step 3: Implement `Money` with PHP 8.4 property hook**

Create `src/ValueObject/Money.php`:

```php
<?php

namespace App\ValueObject;

final class Money
{
    // PHP 8.4 property hook — computed property, no backing storage
    public string $formatted {
        get => sprintf('$%s', number_format($this->amount / 100, 2));
    }

    public function __construct(
        private readonly int $amount,
        private readonly string $currency = 'USD',
    ) {}

    public static function fromFloat(float $amount, string $currency = 'USD'): self
    {
        return new self((int) round($amount * 100), $currency);
    }

    public function add(Money $other): self
    {
        $this->assertSameCurrency($other);
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function subtract(Money $other): self
    {
        $this->assertSameCurrency($other);
        return new self($this->amount - $other->amount, $this->currency);
    }

    public function getAmount(): int
    {
        return $this->amount;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function toFloat(): float
    {
        return $this->amount / 100;
    }

    public function isNegative(): bool
    {
        return $this->amount < 0;
    }

    private function assertSameCurrency(Money $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException(
                "Cannot operate on different currencies: {$this->currency} and {$other->currency}"
            );
        }
    }
}
```

- [x] **Step 4: Run tests — all pass**

```bash
docker compose exec app php bin/phpunit tests/Unit/ValueObject/MoneyTest.php --testdox
# Expected: OK (6 tests, 6 assertions)
```

- [x] **Step 5: Commit**

```bash
git add src/ValueObject/Money.php tests/Unit/ValueObject/MoneyTest.php
git commit -m "feat: add Money value object with PHP 8.4 property hook and integer-cent arithmetic"
```

---

## Task 2: ProjectionContext DTO

**Files:**
- Create: `src/DTO/ProjectionContext.php`

- [x] **Step 1: Create `src/DTO/ProjectionContext.php`**

```php
<?php

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
```

- [x] **Step 2: Commit**

```bash
git add src/DTO/ProjectionContext.php
git commit -m "feat: add ProjectionContext DTO for pre-loaded forecast data"
```

---

## Task 3: ForecastStrategyInterface + 4 concrete strategies

**Files:**
- Create: `src/Services/Forecasting/Strategy/ForecastStrategyInterface.php`
- Create: `src/Services/Forecasting/Strategy/RecurringIncomeForecastStrategy.php`
- Create: `src/Services/Forecasting/Strategy/RecurringExpenseForecastStrategy.php`
- Create: `src/Services/Forecasting/Strategy/RevolvingInterestForecastStrategy.php`
- Create: `src/Services/Forecasting/Strategy/RecurringSavingsForecastStrategy.php`

- [x] **Step 1: Create the interface**

Create `src/Services/Forecasting/Strategy/ForecastStrategyInterface.php`:

```php
<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

interface ForecastStrategyInterface
{
    public function applies(Account $account): bool;

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money;
}
```

- [x] **Step 2: Create `RecurringIncomeForecastStrategy`**

Create `src/Services/Forecasting/Strategy/RecurringIncomeForecastStrategy.php`:

```php
<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

final class RecurringIncomeForecastStrategy implements ForecastStrategyInterface
{
    public function applies(Account $account): bool
    {
        return $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'income';
    }

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money
    {
        $total = new Money(0);
        $dayOfMonth = (int) $date->format('j');

        foreach ($context->recurringIncomes as $income) {
            if ($income->getAccount()->getId() !== $account->getId()) {
                continue;
            }
            if ($income->getRecurringDay() === $dayOfMonth) {
                $total = $total->add(Money::fromFloat((float) $income->getAmount()));
            }
        }

        return $total;
    }
}
```

- [x] **Step 3: Create `RecurringExpenseForecastStrategy`**

Create `src/Services/Forecasting/Strategy/RecurringExpenseForecastStrategy.php`:

```php
<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

final class RecurringExpenseForecastStrategy implements ForecastStrategyInterface
{
    public function applies(Account $account): bool
    {
        return $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'expense';
    }

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money
    {
        $total = new Money(0);
        $dayOfMonth = (int) $date->format('j');

        foreach ($context->recurringExpenses as $expense) {
            if ($expense->getAccount()->getId() !== $account->getId()) {
                continue;
            }
            if ($expense->getRecurringDay() === $dayOfMonth) {
                $total = $total->add(Money::fromFloat((float) $expense->getAmount()));
            }
        }

        return $total;
    }
}
```

- [x] **Step 4: Create `RevolvingInterestForecastStrategy`**

Create `src/Services/Forecasting/Strategy/RevolvingInterestForecastStrategy.php`:

```php
<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

final class RevolvingInterestForecastStrategy implements ForecastStrategyInterface
{
    public function applies(Account $account): bool
    {
        return $account->isRevolvingAccount();
    }

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money
    {
        $currentBalance = Money::fromFloat((float) ($account->getProjectedBalance() ?? 0));

        if (!$currentBalance->isNegative()) {
            return new Money(0);
        }

        // Daily interest: APR / 365, applied to negative (debt) balance
        $dailyRate = (float) $account->getAnnualInterestRate() / 36500;
        $dailyInterestCents = (int) round(abs($currentBalance->getAmount()) * $dailyRate);

        return new Money(-$dailyInterestCents);
    }
}
```

- [x] **Step 5: Create `RecurringSavingsForecastStrategy`**

Create `src/Services/Forecasting/Strategy/RecurringSavingsForecastStrategy.php`:

```php
<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

final class RecurringSavingsForecastStrategy implements ForecastStrategyInterface
{
    public function applies(Account $account): bool
    {
        return $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'savings';
    }

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money
    {
        $total = new Money(0);
        $dayOfMonth = (int) $date->format('j');

        foreach ($context->recurringSavings as $saving) {
            if ($saving->getAccount()->getId() !== $account->getId()) {
                continue;
            }
            if ($saving->getRecurringDay() === $dayOfMonth) {
                $total = $total->add(Money::fromFloat((float) $saving->getAmount()));
            }
        }

        return $total;
    }
}
```

- [x] **Step 6: Add `isRevolvingAccount()` to `Account` entity**

In `src/Entity/Account.php`, add this method after the existing getters:

```php
public function isRevolvingAccount(): bool
{
    return $this->annualInterestRate !== null && (float) $this->annualInterestRate > 0;
}
```

- [x] **Step 7: Commit**

```bash
git add src/Services/Forecasting/ src/Entity/Account.php
git commit -m "feat: add ForecastStrategyInterface and four concrete forecast strategies"
```

---

## Task 4: ForecastingEngine refactor

**Files:**
- Modify: `src/Services/ForecastingEngine.php`
- Modify: `config/services.yaml`

- [x] **Step 1: Register strategy DI tag in `config/services.yaml`**

Add to `config/services.yaml`:

```yaml
services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: '../src/'
        exclude:
            - '../src/DependencyInjection/'
            - '../src/Entity/'
            - '../src/Kernel.php'

    # Tag all ForecastStrategyInterface implementations for injection
    App\Services\Forecasting\Strategy\ForecastStrategyInterface:
        abstract: true

    _instanceof:
        App\Services\Forecasting\Strategy\ForecastStrategyInterface:
            tags: ['app.forecast_strategy']
```

- [x] **Step 2: Rewrite `ForecastingEngine.php`**

Replace the entire contents of `src/Services/ForecastingEngine.php`:

```php
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

        $startDate = \DateTimeImmutable::createFromMutable($lastEntry->getCalendarDate())
            ->modify('+1 day');
        $endDate = $startDate->modify("+{$monthsToProject} months");

        // Pre-load all data once — eliminates N+1 DB calls during projection loop
        $context = new ProjectionContext(
            customerAccount: $customerAccount,
            startDate: $startDate,
            endDate: $endDate,
            accounts: $this->preloadAccounts($customerAccount),
            recurringIncomes: $this->em->getRepository(RecurringIncome::class)
                ->findBy(['customersAccount' => $customerAccount]),
            recurringExpenses: $this->em->getRepository(RecurringExpense::class)
                ->findBy(['customersAccount' => $customerAccount]),
            recurringInterests: $this->em->getRepository(RecurringInterest::class)
                ->findBy(['customersAccount' => $customerAccount]),
            recurringSavings: $this->em->getRepository(RecurringSavings::class)
                ->findBy(['customersAccount' => $customerAccount]),
        );

        $entriesToPersist = [];
        $current = $startDate;

        while ($current <= $endDate) {
            $entry = $this->buildProjectedEntry($context, $current, $lastEntry);
            if ($entry !== null) {
                $this->em->persist($entry);
                $entriesToPersist[] = $entry;
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
```

- [x] **Step 3: Wire the strategies via tagged iterator in `config/services.yaml`**

Add the `ForecastingEngine` explicit binding after the `_instanceof` block:

```yaml
    App\Services\ForecastingEngine:
        arguments:
            $strategies: !tagged_iterator app.forecast_strategy
```

- [x] **Step 4: Verify container compiles**

```bash
docker compose exec app php bin/console debug:container App\\Services\\ForecastingEngine
# Expected: shows $strategies as tagged_iterator with 4 items
```

- [x] **Step 5: Commit**

```bash
git add src/Services/ForecastingEngine.php config/services.yaml
git commit -m "feat: refactor ForecastingEngine to Strategy pattern with single-flush batch processing"
```

---

## Task 5: ForecastingEngine unit tests

**Files:**
- Create: `tests/Unit/Services/Forecasting/ForecastingEngineTest.php`

- [x] **Step 1: Create the test file**

```php
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
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

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
        $customerAccount = $this->createMock(CustomersAccount::class);
        $repo = $this->createMock(EntityRepository::class);
        $repo->method('findOneBy')->willReturn(null);
        $this->em->method('getRepository')->willReturn($repo);

        $this->em->expects($this->never())->method('flush');

        $this->engine->generateFutureProjections($customerAccount, 1);
    }

    public function testBatchFlushCalledOnceNotPerDay(): void
    {
        $customerAccount = $this->createStub(CustomersAccount::class);

        $baseline = $this->createStub(AccountsTrackingCalendar::class);
        $baseline->method('getCalendarDate')
            ->willReturn(new \DateTime('2026-01-01'));
        $baseline->method('getAccountsBalances')
            ->willReturn([]);

        $calRepo = $this->createMock(EntityRepository::class);
        $calRepo->method('findOneBy')->willReturn($baseline);
        $calRepo->method('findBy')->willReturn([]);

        $this->em->method('getRepository')->willReturn($calRepo);
        $this->em->method('persist')->willReturn(null);

        // flush() must be called exactly ONCE regardless of projection window length
        $this->em->expects($this->once())->method('flush');

        $this->engine->generateFutureProjections($customerAccount, 1);
    }

    public function testProjectsCorrectBalanceForRecurringIncome(): void
    {
        $group = $this->createStub(BudgetTrackingGroup::class);
        $group->method('getIsIncomeOrExpense')->willReturn('income');

        $account = $this->createStub(Account::class);
        $account->method('getId')->willReturn(1);
        $account->method('getBudgetTrackingGroup')->willReturn($group);
        $account->method('isRevolvingAccount')->willReturn(false);
        $account->method('getProjectedBalance')->willReturn(0.0);

        $income = $this->createStub(RecurringIncome::class);
        $income->method('getAccount')->willReturn($account);
        $income->method('getRecurringDay')->willReturn(1);
        $income->method('getAmount')->willReturn('6500.00');

        $context = new ProjectionContext(
            customerAccount: $this->createStub(CustomersAccount::class),
            startDate: new \DateTimeImmutable('2026-02-01'),
            endDate: new \DateTimeImmutable('2026-02-28'),
            accounts: [1 => $account],
            recurringIncomes: [$income],
            recurringExpenses: [],
            recurringInterests: [],
            recurringSavings: [],
        );

        $baseline = $this->createStub(AccountsTrackingCalendar::class);
        $baseline->method('getCalendarDate')->willReturn(new \DateTime('2026-01-31'));
        $baseline->method('getAccountsBalances')->willReturn([1 => 0.0]);

        $calRepo = $this->createMock(EntityRepository::class);
        $calRepo->method('findOneBy')->willReturn($baseline);
        $calRepo->method('findBy')->willReturnCallback(function (string $entityClass) use ($account, $income) {
            return match ($entityClass) {
                \App\Entity\Account::class => [$account],
                \App\Entity\RecurringIncome::class => [$income],
                default => [],
            };
        });

        $this->em->method('getRepository')->willReturn($calRepo);
        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($entity) use (&$persisted) {
            $persisted[] = $entity;
        });
        $this->em->method('flush');

        $this->engine->generateFutureProjections($this->createStub(CustomersAccount::class), 1);

        // Feb 1 entry should have $6,500 income applied
        $feb1 = array_find($persisted, fn($e) => $e->getCalendarDate()->format('Y-m-d') === '2026-02-01');
        $this->assertNotNull($feb1);
        $this->assertSame(6500.0, $feb1->getAccountsBalances()[1]);
    }

    public function testRevolvingInterestAccruedDailyOnNegativeBalance(): void
    {
        $group = $this->createStub(BudgetTrackingGroup::class);
        $group->method('getIsIncomeOrExpense')->willReturn('liability');

        $account = $this->createStub(Account::class);
        $account->method('getId')->willReturn(1);
        $account->method('getBudgetTrackingGroup')->willReturn($group);
        $account->method('isRevolvingAccount')->willReturn(true);
        $account->method('getAnnualInterestRate')->willReturn('19.99');
        $account->method('getProjectedBalance')->willReturn(-2100.0);

        $baseline = $this->createStub(AccountsTrackingCalendar::class);
        $baseline->method('getCalendarDate')->willReturn(new \DateTime('2026-01-31'));
        $baseline->method('getAccountsBalances')->willReturn([1 => -2100.0]);

        $calRepo = $this->createMock(EntityRepository::class);
        $calRepo->method('findOneBy')->willReturn($baseline);
        $calRepo->method('findBy')->willReturnCallback(fn() => match(true) {
            true => [],
        });
        $calRepo->expects($this->atLeast(1))->method('findBy')->willReturnCallback(
            function (string $class) use ($account) {
                return $class === Account::class ? [$account] : [];
            }
        );

        $this->em->method('getRepository')->willReturn($calRepo);
        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($e) use (&$persisted) { $persisted[] = $e; });
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
        $incomeAccount->method('getProjectedBalance')->willReturn(0.0);

        $baseline = $this->createStub(AccountsTrackingCalendar::class);
        $baseline->method('getCalendarDate')->willReturn(new \DateTime('2026-01-31'));
        $baseline->method('getAccountsBalances')->willReturn([1 => 0.0]);

        $calRepo = $this->createMock(EntityRepository::class);
        $calRepo->method('findOneBy')->willReturn($baseline);
        $calRepo->method('findBy')->willReturnCallback(
            fn(string $class) => $class === Account::class ? [$incomeAccount] : []
        );

        $this->em->method('getRepository')->willReturn($calRepo);
        $persisted = [];
        $this->em->method('persist')->willReturnCallback(fn($e) => $persisted[] = $e);
        $this->em->method('flush');

        $this->engine->generateFutureProjections($this->createStub(CustomersAccount::class), 1);

        // RevolvingInterestForecastStrategy must not apply to an income account
        $feb1 = array_find($persisted, fn($e) => $e->getCalendarDate()->format('Y-m-d') === '2026-02-01');
        $this->assertNotNull($feb1);
        // Balance stays 0 — no expense or revolving strategy applies
        $this->assertSame(0.0, $feb1->getAccountsBalances()[1]);
    }
}
```

- [x] **Step 2: Run tests**

```bash
docker compose exec app php bin/phpunit tests/Unit/Services/Forecasting/ForecastingEngineTest.php --testdox
# Expected: OK (5 tests)
```

- [x] **Step 3: Commit**

```bash
git add tests/Unit/Services/Forecasting/ForecastingEngineTest.php
git commit -m "test: add 5 focused ForecastingEngine unit tests documenting business rules"
```

---

## Task 6: Service interfaces (Contract layer)

**Files:**
- Create: `src/Services/Contract/ForecastingEngineInterface.php`
- Create: `src/Services/Contract/AccountsServiceInterface.php`
- Create: `src/Services/Contract/CustomerServiceInterface.php`
- Create: `src/Services/Contract/EmailServiceInterface.php`
- Modify: `config/services.yaml`

- [x] **Step 1: Create `ForecastingEngineInterface.php`**

```php
<?php

namespace App\Services\Contract;

use App\Entity\CustomersAccount;

interface ForecastingEngineInterface
{
    public function generateFutureProjections(CustomersAccount $customerAccount, int $monthsToProject = 12): void;
}
```

- [x] **Step 2: Create `AccountsServiceInterface.php`**

```php
<?php

namespace App\Services\Contract;

use App\Entity\Account;
use App\Entity\CustomersAccount;

interface AccountsServiceInterface
{
    public function addAccountToAccountsTrackingCalendar(Account $account): void;
    public function getAccountsForCustomer(CustomersAccount $customerAccount): array;
}
```

- [x] **Step 3: Create `CustomerServiceInterface.php`**

```php
<?php

namespace App\Services\Contract;

use App\Entity\Customer;

interface CustomerServiceInterface
{
    public function getDashboardChartsData(Customer $user): array;
}
```

- [x] **Step 4: Create `EmailServiceInterface.php`**

```php
<?php

namespace App\Services\Contract;

interface EmailServiceInterface
{
    public function sendWelcomeEmail(string $toEmail, string $name): void;
}
```

- [x] **Step 5: Make concrete services implement their interfaces**

In `src/Services/ForecastingEngine.php`, update the class declaration:

```php
use App\Services\Contract\ForecastingEngineInterface;

class ForecastingEngine implements ForecastingEngineInterface
```

In `src/Services/AccountsService.php`:

```php
use App\Services\Contract\AccountsServiceInterface;

class AccountsService implements AccountsServiceInterface
```

In `src/Services/CustomerService.php`:

```php
use App\Services\Contract\CustomerServiceInterface;

class CustomerService implements CustomerServiceInterface
```

In `src/Services/EmailService.php`:

```php
use App\Services\Contract\EmailServiceInterface;

class EmailService implements EmailServiceInterface
```

- [x] **Step 6: Bind interfaces to implementations in `config/services.yaml`**

Add to the bottom of `config/services.yaml`:

```yaml
    App\Services\Contract\ForecastingEngineInterface: '@App\Services\ForecastingEngine'
    App\Services\Contract\AccountsServiceInterface: '@App\Services\AccountsService'
    App\Services\Contract\CustomerServiceInterface: '@App\Services\CustomerService'
    App\Services\Contract\EmailServiceInterface: '@App\Services\EmailService'
```

- [x] **Step 7: Update all controllers to type-hint interfaces**

In any controller that injects `ForecastingEngine`, `AccountsService`, `CustomerService`, or `EmailService` directly — change the constructor type-hint to the interface. Example:

```php
// Before
public function __construct(private readonly ForecastingEngine $forecastingEngine) {}

// After
use App\Services\Contract\ForecastingEngineInterface;
public function __construct(private readonly ForecastingEngineInterface $forecastingEngine) {}
```

Search all controllers:

```bash
grep -r "ForecastingEngine\|AccountsService\|CustomerService\|EmailService" src/Controller/
```

Update each one found.

- [x] **Step 8: Verify container compiles**

```bash
docker compose exec app php bin/console debug:container --no-interaction 2>&1 | grep -i error || echo "Container OK"
# Expected: Container OK
```

- [x] **Step 9: Commit**

```bash
git add src/Services/Contract/ src/Services/ForecastingEngine.php src/Services/AccountsService.php \
        src/Services/CustomerService.php src/Services/EmailService.php \
        config/services.yaml src/Controller/
git commit -m "feat: add service contract interfaces and bind via DI — controllers type-hint interfaces not concretions"
```

---

## Plan 2 Complete

Run the full unit test suite:

```bash
docker compose exec app php bin/phpunit tests/Unit/ --testdox
# Expected: OK (11 tests across MoneyTest + ForecastingEngineTest)
```

**Next:** `2026-06-09-forecastly-plan-3-data-layer.md`
