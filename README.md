# Forecastly — Personal Finance Forecasting Platform

> Symfony 7.4 · PHP 8.4 · PostgreSQL 16 · Redis · Docker

![PHP](https://img.shields.io/badge/PHP-8.4-blue)
![Symfony](https://img.shields.io/badge/Symfony-7.4%20LTS-green)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

A production-grade personal finance forecasting platform built with Symfony 7.4. Tracks multi-account net worth, projects 13-month daily balances, and runs revolving interest calculations — all in a zero-dependency Docker environment.

---

## For Technical Reviewers

Six files worth your time, in order:

**1. Strategy Pattern + Money Value Object**
→ [`src/Services/ForecastingEngine.php`](src/Services/ForecastingEngine.php) · [`src/ValueObject/Money.php`](src/ValueObject/Money.php)
- `ForecastStrategyInterface[]` injected via DI tag — adding a new account type is one new class, zero engine changes (OCP in practice)
- `Money` VO uses PHP 8.4 property hook for `$formatted`, stores amounts as integer cents to eliminate IEEE 754 float errors

**2. Query Mastery + N+1 Elimination**
→ [`src/Services/AccountsService.php`](src/Services/AccountsService.php)
- `jsonb_set()` via Doctrine DBAL — inline comment explains why ORM falls short here
- Single `flush()` after a full 365-day projection loop (was per-day before)

**3. Architecture Contracts**
→ [`src/Services/Contract/`](src/Services/Contract/)
- Every controller type-hints these interfaces, never the concretions
- `config/services.yaml` holds the `_instanceof` tag block and all bindings

**4. Pre-loaded Projection Context**
→ [`src/DTO/ProjectionContext.php`](src/DTO/ProjectionContext.php)
- All data pre-loaded once before the projection loop — no queries inside the loop
- Uses PHP 8.4 `array_find()` for account lookup by ID

**5. Unit Tests (TDD)**
→ [`tests/Unit/`](tests/Unit/)
- Tests document business rules, not just coverage: single-flush invariant, strategy dispatch, Money arithmetic edge cases

**6. Integration Test**
→ [`tests/Integration/`](tests/Integration/)
- Full HTTP stack: `loginUser('customer')` against the correct firewall, real PostgreSQL, verifies JSON shape

---

## What This Demonstrates

- **Layered service architecture** with interface contracts bound in `config/services.yaml` — controllers never depend on concretions
- **Strategy pattern** for extensible forecasting — adding a new account type is one new class, zero engine changes
- **`Money` Value Object** with PHP 8.4 property hook — integer-cent arithmetic, no IEEE 754 float errors
- **Doctrine ORM + PostgreSQL `jsonb_set()`** via DBAL — inline comment explains when to use ORM vs. DBAL
- **N+1 eliminated**: single pre-load query + single `flush()` for a 365-day projection window
- **`ProjectionContext` DTO** pre-loads all data before the loop — no queries inside iteration
- **Redis cache pool** wired to Symfony Cache component (visible in the Symfony Profiler)
- **PHP 8.4 features**: property hooks, `array_find()`, `DateTimeImmutable::createFromInterface()`, asymmetric visibility (`public private(set)`)
- **12 focused PHPUnit tests** documenting architectural decisions, not coverage padding

---

## Quick Start

```bash
git clone https://github.com/your-handle/forecastly
cd forecastly
cp .env.example .env.local
docker compose up -d
make demo
```

Open [http://localhost:8080](http://localhost:8080)
Login: `demo@forecastly.com` / `Demo1234!`

---

## Architecture

```
Browser / API Client
       |
     Nginx
       |
    PHP-FPM
   +--------------------------------------+
   |  Controller (type-hints interface)   |
   |       |                              |
   |  Service Contract Interface          |
   |       |                              |
   |  Concrete Service --> Repository     |
   |       |          +--> Cache (Redis)  |
   |  Strategy Orchestrator               |
   |  (ForecastingEngine)                 |
   |    +- RecurringIncomeForecastStrategy|
   |    +- RecurringExpenseForecastStrategy|
   |    +- RecurringInterestForecastStrategy|
   |    +- RecurringSavingsForecastStrategy|
   +--------------------------------------+
       |
  Doctrine ORM
       |
  PostgreSQL 16
```

---

## Makefile Reference

| Command         | What it does                                     |
|-----------------|--------------------------------------------------|
| `make demo`     | Full setup: install + migrate + fixtures         |
| `make test`     | Run PHPUnit with testdox output                  |
| `make reset`    | Drop DB, re-migrate, reload fixtures             |
| `make lint`     | php-cs-fixer dry-run + PHPStan                   |
| `make shell`    | Open shell in app container                      |
| `make forecast` | Re-generate forecasts for all customers          |

---

## Key Design Decisions

**Strategy over conditionals** — `ForecastStrategyInterface` tagged collection means adding a crypto wallet account type is one new class implementing the interface. Zero changes to `ForecastingEngine`. Open/Closed Principle in practice.

**`Money` VO over float** — IEEE 754 arithmetic produces errors (`0.1 + 0.2 !== 0.3`). For a financial application this is unacceptable. `Money` stores amounts as integer cents and provides explicit arithmetic. PHP 8.4 property hook exposes a computed `$formatted` string.

**`ProjectionContext` DTO** — all data loaded once before the projection loop: accounts, recurring incomes, expenses, interests, savings. The loop is pure computation, zero additional queries.

**Single `flush()` per projection run** — previous implementation flushed inside the per-day loop (O(n) queries). Now a single flush after the entire window is generated, regardless of window size.

**`jsonb_set()` via DBAL** — Doctrine ORM cannot express jsonb key-level mutation. This is one of two places in the codebase that deliberately drops to DBAL; both have an inline comment explaining why.

---

## Running Tests

```bash
# Unit + integration
make test

# Or directly
docker compose exec app php bin/phpunit --testdox
```

Expected output: `OK (12 tests, 22 assertions)`
