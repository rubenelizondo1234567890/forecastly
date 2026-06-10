# Forecastly Portfolio Demo — Design Spec

**Date:** 2026-06-09
**Goal:** Transform the existing Forecastly codebase into a recruiter-ready portfolio demo that runs via `docker compose up`, showcases Senior PHP/Symfony expertise, and demonstrates depth in the specific files technical screeners will actually read.
**Target platforms:** Lemon.io, Arc.dev, Toptal, Codementor
**Estimated effort:** ~25h (includes version upgrade)
**Strategy:** Option B — Full-Stack Senior. Three world-class core files + REST API with JWT + Security Voters + Symfony Messenger async + GitHub Actions CI + focused test suite. Depth in the right places, complete feature delivery everywhere else.
**Runtime:** PHP 8.4 · Symfony 7.4 (LTS)

---

## Current State Assessment

### Stack (target after upgrade)
- Symfony 7.4 (LTS), PHP 8.4, Doctrine ORM 3.x, Symfony Messenger, Stripe, Twig, Webpack Encore
- Rich financial domain: forecasting, revolving payments, recurring income/expenses, PII encryption, multi-account budget tracking

### Critical Issues Found
| Issue | Location | Severity |
|---|---|---|
| `dd($e)` debug statement in production path | `CustomerService::getDashboardChartsData()` line 51 | Critical |
| Duplicate `EntityManagerInterface` injection | `AccountsService` constructor (`$em` + `$entityManager`) | Critical |
| Raw MySQL `JSON_SET` SQL on a PostgreSQL docker setup | `AccountsService::addAccountToAccountsTrackingCalendar()` | Critical |
| `flush()` called per-day inside projection loop | `ForecastingEngine::createProjectedDay()` | High |
| `find()` called per-account inside inner loops | `ForecastingEngine::calculateProjectedBalances()` | High |
| Real Stripe + SMTP credentials committed to `.env` | `.env` | High |
| Stub method `projectOneTimeTransactions()` returns `[]` | `ForecastingEngine` | Medium |
| `projectRecurringTransactions()` called but not defined | `ForecastingEngine` | Medium |
| DB mismatch: `compose.yaml` = PostgreSQL, `.env` = MariaDB | Root config | High |
| Inline `createQueryBuilder` in controllers | `CustomerForecastingController` | Medium |
| PHP 8.2 typed properties with redundant `@var` docblocks | All entities | Low |
| Zero fixtures, zero tests, no Dockerfile | Repo root | High |

### Decision: PostgreSQL as canonical DB
The docker compose already declares PostgreSQL 16. All MySQL-specific SQL will be replaced with proper Doctrine ORM/DQL. This is itself a senior architecture demonstration — removing raw SQL in favour of the ORM's full capability.

---

## Section 0: Version Upgrade (First Step)

This must complete and pass before any other section begins. All downstream sections assume PHP 8.4 and Symfony 7.4.

### composer.json changes

```json
"require": {
    "php": "^8.4",
    "symfony/framework-bundle": "^7.4",
    "symfony/console": "^7.4",
    "symfony/messenger": "^7.4",
    "symfony/security-bundle": "^7.4",
    "symfony/serializer": "^7.4",
    "doctrine/orm": "^3.0"
}
```

All `symfony/*` constraints set to `^7.4`. Run `composer update` and resolve any dependency conflicts. The `dama/doctrine-test-bundle` and `lexik/jwt-authentication-bundle` must confirm Symfony 7.4 compatibility before the update proceeds.

### PHP 8.4 features to adopt

Three specific places where 8.4 syntax is adopted deliberately — not a blanket rewrite, just enough to show you track the language:

| Feature | Where | Signal |
|---|---|---|
| Asymmetric visibility (`public private(set)`) | Entity `$id`, `$createdAt` properties | "I read the RFCs" |
| `array_find()` | `ForecastingEngine` — replace `array_filter()[0] ?? null` patterns | Cleaner intent |
| Property hooks | `Money` VO — `public string $formatted { get => ... }` | VO expressiveness |

No other 8.4 features adopted speculatively. These three have clear, visible value in the showcase files.

### Deprecation pass

After `composer update`, run:
```bash
php bin/console debug:container --deprecations
php -d error_reporting=E_ALL bin/console cache:warmup
```

Fix all deprecation notices before proceeding. Symfony 7.4 deprecations are indicators of what will break in 8.0 — a clean deprecation log is itself a senior signal.

### Verification gate

Before proceeding to Section 1, all of the following must pass on PHP 8.4:
```bash
php bin/console cache:warmup        # no errors
php bin/console doctrine:schema:validate  # mapping valid
php -r "echo PHP_VERSION;"         # confirms 8.4.x
composer show symfony/framework-bundle | grep versions  # confirms 7.4.x
```

---

## Section 1: Docker & Infrastructure

### Objective
`git clone → docker compose up → make demo` working in under 3 minutes with no local PHP or Node required.

### Dockerfile (new, multi-stage)
Three stages to maximise layer caching and keep the final image clean:

```
Stage 1 "deps"   — composer install (no dev dependencies in prod stage)
Stage 2 "assets" — Node 20 + npm ci + Webpack Encore build
Stage 3 "app"    — php:8.4-fpm-alpine, OPcache tuned, copies vendor/ and public/build/
```

### docker-compose.yml (replaces compose.yaml + compose.override.yaml)
Single file, no overrides needed for demo context:

| Service | Image | Purpose |
|---|---|---|
| `app` | Dockerfile (PHP 8.2-FPM) | Application |
| `nginx` | nginx:alpine | Web server, serves public/ assets |
| `database` | postgres:16-alpine | Primary data store |
| `redis` | redis:7-alpine | Symfony cache pool |
| `mailer` | axllent/mailpit | Local SMTP + web UI |

Networking: all services on a single `forecastly` bridge network. Database port not exposed publicly (internal only). Nginx exposes port 8080.

### Makefile (new)
```makefile
make install   # composer install + npm ci + migrations + fixtures
make demo      # alias for install — the "just works" entry point
make test      # phpunit --testdox
make reset     # drop DB + re-run migrations + fixtures
make lint      # php-cs-fixer --dry-run + phpstan level 6
make shell     # exec into app container
```

### .env cleanup
- All real credentials replaced with `CHANGE_ME` placeholders
- `.env.example` committed to git (the canonical template)
- `.env.local` in `.gitignore` holds actual local overrides
- `DATABASE_URL` points to Docker service: `postgresql://app:app@database:5432/forecastly`

### Redis cache wiring
`config/packages/cache.yaml` — default cache pool bound to `redis://redis:6379`. Visible in Symfony Profiler on every request. Screeners who open the profiler see caching is actively configured.

---

## Section 2: The Three World-Class Files

### File 1: `ForecastingEngine.php` — Architecture Showpiece

#### Strategy Pattern
Extract forecast calculation behind an interface:

```php
// src/Services/Forecasting/Strategy/ForecastStrategyInterface.php
interface ForecastStrategyInterface
{
    public function applies(Account $account): bool;
    public function project(ProjectionContext $context, \DateTimeImmutable $date): Money;
}
```

Concrete strategies (one file each):
- `RecurringIncomeForecastStrategy`
- `RecurringExpenseForecastStrategy`
- `RevolvingInterestForecastStrategy`
- `RecurringSavingsForecastStrategy`

`ForecastingEngine` becomes an orchestrator: it holds a `ForecastStrategyInterface[]` collection (injected via DI tag), iterates strategies per account per day, delegates calculation. Adding a new account type = adding one new Strategy class, zero changes to the engine.

#### Money Value Object
```php
// src/ValueObject/Money.php
final class Money
{
    public function __construct(
        private readonly int $amount,   // stored in cents, no float
        private readonly string $currency = 'USD'
    ) {}

    public function add(Money $other): self { ... }
    public function subtract(Money $other): self { ... }
    public function toFloat(): float { return $this->amount / 100; }
}
```
Eliminates IEEE 754 floating-point rounding errors in financial arithmetic. Every balance in the engine goes through `Money`, not raw floats.

#### ProjectionContext DTO
```php
// src/DTO/ProjectionContext.php
final class ProjectionContext
{
    public function __construct(
        public readonly CustomersAccount $customerAccount,
        public readonly \DateTimeImmutable $startDate,
        public readonly \DateTimeImmutable $endDate,
        public readonly array $accounts,        // pre-loaded, keyed by ID
        public readonly array $recurringItems,  // pre-loaded
    ) {}
}
```
Engine receives a fully hydrated context object. No service-locator lookups, no `find()` calls during iteration.

#### Batch processing (N+1 fix)
```
Before: 365 flush() calls + N find() calls per day = O(n²) DB operations
After:  1 bulk SELECT to load all accounts + 1 flush() at the end = O(1) DB writes
```
Implementation: `ForecastingEngine::generateFutureProjections()` calls two pre-load queries before the loop, passes results into `ProjectionContext`, accumulates all new `AccountsTrackingCalendar` entities in memory, single `flush()` after loop completion.

#### PHPUnit Tests (5 focused)
- `testProjectsCorrectBalanceForRecurringIncome()`
- `testRevolvingInterestAccruedDailyOnNegativeBalance()`
- `testBatchFlushCalledOnceNotPerDay()` — mocked EM asserting `flush()` called exactly once
- `testEarlyReturnWhenNoCalendarBaselineExists()`
- `testStrategySkippedWhenAccountTypeDoesNotApply()`

---

### File 2: `AccountsService.php` — Query Mastery

#### Fix duplicate injection
```php
// Before: two properties, same object
private EntityManagerInterface $em;
private EntityManagerInterface $entityManager;

// After: one
public function __construct(private readonly EntityManagerInterface $em) {}
```

#### Replace raw SQL with Doctrine DQL
The `JSON_SET` raw SQL is MySQL-specific and breaks on PostgreSQL. Replacement strategy:

For `accounts_balances` (a `jsonb` column in PostgreSQL), use Doctrine's native expression support:
- Simple updates: `UPDATE AccountsTrackingCalendar c SET c.accountsBalances = ... WHERE ...` via DQL
- For `jsonb` key-level updates where DQL is insufficient: use DBAL's `executeStatement` with PostgreSQL `jsonb_set()` syntax (not MySQL `JSON_SET`)

This demonstrates knowing *when* to use ORM vs. DBAL vs. raw SQL — the senior developer's actual decision framework.

#### Repository methods (moved from controllers)
All inline `createQueryBuilder` calls in `CustomerForecastingController` move to:
```
AccountsTrackingCalendarRepository::findByCustomerAccountInDateRange()
AccountRepository::findByCustomerAccountGroupedByType()
```
Controllers call repository methods. Business logic lives in services. Queries live in repositories. Clean separation.

---

### File 3: Service Interfaces — Architecture Signal

```
src/Services/Contract/ForecastingEngineInterface.php
src/Services/Contract/AccountsServiceInterface.php
src/Services/Contract/CustomerServiceInterface.php
src/Services/Contract/EmailServiceInterface.php
```

All controllers and cross-service dependencies type-hint against the interface. `config/services.yaml` binds concrete implementations:
```yaml
App\Services\Contract\ForecastingEngineInterface: '@App\Services\ForecastingEngine'
```

This is the single strongest OOP signal in a Symfony codebase. It takes 30 minutes to add and demonstrates you build to contracts, not implementations — the foundation of every SOLID principle.

---

## Section 3: Professional Baseline Cleanup

### Bug fixes
- `CustomerService::getDashboardChartsData()` — remove `dd($e)`, inject `LoggerInterface`, log at `error` level with context
- `AccountsService` — remove duplicate `$entityManager` property, single `$em` throughout
- `ForecastingEngine::projectOneTimeTransactions()` — implement properly or remove entirely (dead stubs are worse than missing methods)
- `ForecastingEngine::projectRecurringTransactions()` — surface and implement as part of Strategy refactor

### Security hygiene
- `.env`: replace all real values (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `MAILER_DSN`) with `CHANGE_ME` placeholders
- Add `.env.example` committed to git
- Verify `.env.local` is in `.gitignore`

### Code style cleanup
- Remove `@var` docblocks on PHP 8.2 typed properties in all entity classes (PHP 4-era style)
- Move inline `createQueryBuilder` from controllers to Repository classes
- Ensure consistent JSON response shape across all `JsonResponse` endpoints

---

## Section 4: Fixtures & Sample Data

### Package
`doctrine/fixtures-bundle` added to `require-dev`.

### Demo credentials (documented in README)
```
Email:    demo@forecastly.com
Password: Demo1234!
```

### Fixture load order
```
1. SubscriptionPlanFixture      (no dependencies)
2. BudgetTrackingGroupFixture   (no dependencies)
3. CustomerFixture              (depends on: SubscriptionPlanFixture)
4. AccountFixture               (depends on: CustomerFixture, BudgetTrackingGroupFixture)
5. RecurringItemsFixture        (depends on: AccountFixture)
6. AccountsTrackingCalendarFixture (depends on: all above)
```

### Demo data contents

**SubscriptionPlans:** Free ($0), Pro ($9.99/mo), Premium ($19.99/mo)

**BudgetTrackingGroups:**
- Income: Salary, Freelance, Investment Returns
- Expenses: Housing, Transport, Groceries, Utilities, Entertainment, Insurance
- Assets: Savings, Investment Portfolio
- Liabilities: Credit Cards, Loans, Mortgage

**Accounts (demo user):**
| Account | Balance | Type |
|---|---|---|
| Checking Account | $4,200 | Asset |
| Emergency Fund | $12,500 | Asset |
| Investment Portfolio | $38,000 | Asset |
| Visa Credit Card | -$2,100 | Liability (revolving, 19.99% APR) |
| Mortgage | -$285,000 | Liability (revolving, 6.75% APR) |
| Car Loan | -$18,400 | Liability |

**Recurring items:**
- Monthly salary: $6,500 (1st of month)
- Freelance income: $1,200 (15th of month)
- Rent/Mortgage payment: $1,800
- Car insurance: $210
- Groceries: $450
- Subscriptions (Netflix/Spotify/gym): $85
- Utilities: $160

**AccountsTrackingCalendar:** 13 months of daily entries (1 month past + 12 months future). This populates:
- Dashboard income/expense pie charts
- Net worth bar chart
- Forecasting projection charts (1–30 year)
- Calendar and grid tracking views

### What a recruiter sees on first login
- Dashboard with real category breakdowns
- Net worth: ~$42k assets vs ~$305k liabilities = -$263k (realistic, not utopian)
- 6 accounts with populated balances
- Forecasting charts showing multi-year projections
- 30-day populated calendar view

---

## Section 5: Testing

### Philosophy
Show you know *what* to test and *why*, not just that you can generate coverage. 5 focused, well-named tests signal more seniority than 50 getter/setter tests.

### ForecastingEngine unit tests
```
tests/Unit/Services/Forecasting/ForecastingEngineTest.php
```
- `testProjectsCorrectBalanceForRecurringIncome()` — $6,500 monthly salary → correct 30-day projected balance
- `testRevolvingInterestAccruedDailyOnNegativeBalance()` — 19.99% APR / 365 = correct daily accrual on Visa card
- `testBatchFlushCalledOnceNotPerDay()` — mock EM asserts `flush()` called exactly 1× for a 30-day projection window
- `testEarlyReturnWhenNoCalendarBaselineExists()` — no writes when no baseline entry exists
- `testStrategySkippedWhenAccountTypeDoesNotApply()` — Strategy dispatch: expense strategy does not apply to income account

### Integration test
```
tests/Integration/Controller/CustomerForecastingControllerTest.php
```
- `testAccountProjectionsReturnsCorrectJsonShape()` — `KernelBrowser` + demo user login → `GET /customer/forecasting/account-projections?account_id=X&period=1` → assert HTTP 200, assert `data`/`labels`/`account` keys present

### Infrastructure
- `dama/doctrine-test-bundle` (already in `require-dev`) wraps all DB tests in rolled-back transactions
- `tests/bootstrap.php` wired for Docker database container via `DATABASE_URL` env var

### What NOT to write
No getter/setter tests. No `assertTrue(true)`. No tests that assert the ORM works — test your business logic, not the framework.

---

## Section 6: README & Developer Experience

### Structure
```markdown
# Forecastly — Personal Finance Forecasting Platform
> Symfony 7.4 · PHP 8.4 · PostgreSQL 16 · Redis · Docker

[badges: PHP 8.4, Symfony 7.4, CI passing, license]

## What this demonstrates
## For Technical Reviewers       ← wayfinding section (see §6.4)
## Quick start (5 commands)
## Architecture
## API Reference
## Key design decisions
## Feature overview
## Running tests
```

### "What this demonstrates" section
- Layered service architecture with interface contracts and DI binding (`config/services.yaml`)
- Strategy pattern for extensible forecasting engine — OCP in practice
- `Money` Value Object for financial precision (eliminates float rounding errors)
- Doctrine ORM with PostgreSQL `jsonb` — custom DQL expressions, zero raw SQL
- N+1 query elimination via batch pre-loading and single-flush projection runs
- Redis cache pool via Symfony Cache component (visible in Symfony Profiler)
- Doctrine DataFixtures generating 13 months of realistic financial history
- Hand-rolled REST API with JWT authentication, Symfony Serializer groups, and correct HTTP semantics
- Security Voters for resource ownership — `403` vs `404` distinction explained inline
- Symfony Messenger for async forecast generation — `202 Accepted` → poll pattern via Doctrine transport
- GitHub Actions CI: PHPStan level 8 + php-cs-fixer + PHPUnit against a real PostgreSQL service container
- Symfony Console command for batch forecast regeneration with `ProgressBar` output
- PHPUnit tests documenting architectural decisions, not just coverage
- Full Docker setup: PHP-FPM + Nginx + PostgreSQL + Redis + Mailpit + Messenger worker

### Quick start
```bash
git clone https://github.com/your-handle/forecastly
cd forecastly
cp .env.example .env.local
docker compose up -d
make demo
# Open http://localhost:8080
# Login: demo@forecastly.com / Demo1234!
```

### Architecture diagram (Mermaid — renders on GitHub)
```mermaid
graph TD
    Browser --> Nginx
    MobileClient[API Client / Mobile] --> Nginx
    Nginx --> PHP-FPM
    PHP-FPM --> WebController[Web Controller]
    PHP-FPM --> ApiController[API Controller\nJWT-guarded]
    WebController --> ServiceInterface
    ApiController --> ServiceInterface
    ApiController --> Voter[Security Voter\nResource Ownership]
    ServiceInterface -->|"Strategy Pattern lives here"| ConcreteService
    ConcreteService --> Repository
    ConcreteService --> Cache[Redis Cache]
    ConcreteService --> Messenger[Symfony Messenger\nAsync Dispatch]
    Repository --> DoctrineORM
    DoctrineORM --> PostgreSQL
    Messenger --> Worker[Worker Container\nmessenger:consume]
    Worker --> ForecastingEngine[ForecastingEngine\nStrategy Orchestrator]
```

### Key design decisions (5 paragraphs)
1. **Strategy over conditionals in ForecastingEngine** — adding a new account type (e.g. crypto wallet, pension) requires one new Strategy class implementing `ForecastStrategyInterface`. Zero changes to the engine. Open/Closed Principle in practice.
2. **Money Value Object over float** — IEEE 754 floating-point arithmetic produces rounding errors (e.g. `0.1 + 0.2 !== 0.3`). For a financial application this is unacceptable. `Money` stores amounts as integer cents and provides explicit arithmetic methods.
3. **PostgreSQL `jsonb` for `accounts_balances`** — each calendar entry stores per-account balances as a `jsonb` map keyed by account ID. This avoids a join table per calendar entry while retaining full query capability via PostgreSQL GIN indexes. New accounts are added without schema migrations.
4. **`202 Accepted` for forecast generation** — generating 13 months of daily projections is CPU-heavy and unsuitable for a synchronous HTTP response. The API dispatches a `GenerateForecastMessage` and returns immediately with a `jobId`. Clients poll `/forecasts/jobs/{jobId}` for completion. This is the correct REST semantic for long-running operations — `200` would be a lie.
5. **Doctrine transport for Messenger over Redis** — the stack already has PostgreSQL; adding a Redis-backed queue transport would mean operating two persistence layers for one feature. Doctrine transport stores messages in a `messenger_messages` table, keeps infrastructure minimal, and is fully visible in the database — useful for debugging in a demo context.

### §6.4 Technical Review Guide

Placed immediately after "What this demonstrates" in the README. Target audience: screener with 10 minutes who already knows PHP. Numbered walk, not bullets — the order matters.

```markdown
## For Technical Reviewers

Six files worth your time, in order:

**1. Strategy Pattern + Money VO** → `src/Services/ForecastingEngine.php`
- `ForecastStrategyInterface[]` injected via DI tag — adding a new account type is one new class, zero engine changes (OCP in practice)
- `Money` value object — integer cents, no floats, explicit arithmetic methods

**2. Query Mastery** → `src/Services/AccountsService.php`
- PostgreSQL `jsonb_set()` via Doctrine DBAL — the inline comment explains why ORM falls short here
- Single `flush()` after projection loop (was N+1 before — visible in git history)

**3. Architecture Contracts** → `src/Services/Contract/`
- Every controller and cross-service dependency types against these interfaces
- `config/services.yaml` binds the concrete implementations

**4. REST API** → `src/Controller/Api/AccountApiController.php`
- Serializer groups prevent accidental field leakage — `api:read` is explicit, not default
- HTTP semantics: `201` for create, `202` for async dispatch, `422` for validation, `404` not `403` for ownership failures

**5. Security Voter** → `src/Security/Voter/AccountVoter.php`
- Resource ownership check decoupled from controller — `denyAccessUnlessGranted('VIEW', $account)`
- Returns `404` (not `403`) when ownership fails — comment explains the security rationale

**6. Async Handler** → `src/MessageHandler/GenerateForecastHandler.php`
- Calls `ForecastingEngine` unchanged — Messenger is the delivery mechanism, not a rewrite
- Sets `ForecastJob` status to `failed` on exception — no silent failures

**Tests** → `tests/Unit/Services/Forecasting/ForecastingEngineTest.php` + `tests/Integration/Api/`
- Unit tests document business rules; API integration tests verify the full HTTP stack including JWT and Voter
```

> **Implementation note:** Use GitHub deep-link anchors (`#L42`) for the specific lines once the code is final, so a screener can jump directly to the interesting section rather than scrolling.

### §6.5 App-to-Code Bridge

The running app should link back to the codebase so screeners who explore the UI land on the right starting point. Add a small footer to every Twig layout:

```twig
{# templates/base.html.twig — footer #}
<footer class="demo-footer">
    <a href="https://github.com/your-handle/forecastly#for-technical-reviewers"
       target="_blank" rel="noopener">View source &amp; architecture →</a>
</footer>
```

This bridges "user mode" (seeing the dashboard) back to "screener mode" (reading the code). Without it, a recruiter who boots the app and clicks around has no obvious path to the repository.

---

## Section 7: REST API with JWT

### Package
`lexik/jwt-authentication-bundle` added to `require`.

### Endpoints

| Method | Path | Auth | Response |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | None | `200` + `{token}` |
| `GET` | `/api/v1/accounts` | JWT | `200` accounts array |
| `GET` | `/api/v1/accounts/{id}` | JWT + Voter | `200` or `404` |
| `GET` | `/api/v1/recurring-items` | JWT | `200` items array |
| `POST` | `/api/v1/recurring-items` | JWT | `201` + created resource |
| `DELETE` | `/api/v1/recurring-items/{id}` | JWT + Voter | `204` or `404` |
| `POST` | `/api/v1/forecasts/generate` | JWT | `202` + `{jobId}` |
| `GET` | `/api/v1/forecasts/jobs/{jobId}` | JWT | `200` + `{status, completedAt}` |
| `GET` | `/api/v1/forecasts/{accountId}` | JWT + Voter | `200` projection data |

### Controllers
One controller per resource: `AccountApiController`, `RecurringItemApiController`, `ForecastApiController`. All extend `AbstractController`. No business logic — they call the same service interfaces already defined in `src/Services/Contract/`.

### Serialization
- Symfony Serializer with explicit groups: `api:read` on all response fields, `api:write` on accepted input fields
- `Money` VO gets a custom normalizer: serializes to `{"amount": 4200, "currency": "USD", "formatted": "$42.00"}`
- `DateTimeImmutable` normalized to ISO 8601
- Fields never leak by default — groups are required on every property

### HTTP status discipline
- `201 Created` for successful POST with `Location` header pointing to the new resource
- `202 Accepted` for async dispatch (not `200` — the work has not completed)
- `422 Unprocessable Entity` for validation failures: `{"errors": {"field": "message"}}`
- `401 Unauthorized` for missing/invalid JWT
- `404 Not Found` for ownership failures (see Section 9 for rationale)

### Validation error format
All `422` responses share a consistent shape so API consumers can handle them generically:
```json
{
  "errors": {
    "amount": "This value should be positive.",
    "recurringDay": "This value should be between 1 and 31."
  }
}
```

---

## Section 8: GitHub Actions CI

### File
`.github/workflows/ci.yml` — triggers on `push` and `pull_request` to any branch.

### Jobs (run in parallel)

| Job | Tool | Fails build if |
|---|---|---|
| `lint` | `php-cs-fixer --dry-run` | Any formatting violation |
| `static-analysis` | `phpstan --level=8` | Any type error, nullable violation, or unsafe call |
| `test` | `phpunit --testdox` | Any test failure against a real PostgreSQL service container |

### PostgreSQL service container
The `test` job declares a `postgres:16-alpine` service sidecar. Migrations and fixtures run before the suite. This proves the full stack — Docker config, migrations, fixtures, and tests — all work in a clean environment on every push.

### Caching
Composer cache keyed on `composer.lock` SHA. Cold build ~2 min, warm build ~40s.

### PHPStan level 8
Bumped from level 6 (original spec). Level 8 enforces strict nullability, typed array shapes, and return type inference. A pass over the existing codebase to reach level 8 cleanly is included in the hours estimate — the fixes themselves are portfolio-quality signals (proper nullable handling, typed collections).

### README badge
CI status badge added to the README badges row. A screener who never opens a file sees the build is passing.

---

## Section 9: Security Voters

### Files
```
src/Security/Voter/AccountVoter.php
src/Security/Voter/RecurringItemVoter.php
```

### AccountVoter
Supports two attributes: `VIEW` and `EDIT`. `voteOnAttribute()` loads the account's customer and compares against `$token->getUser()`. Returns `ACCESS_GRANTED` or `ACCESS_DENIED`. Symfony's access decision manager calls it automatically when controllers use `$this->denyAccessUnlessGranted('VIEW', $account)`.

Controllers stay thin — one `denyAccessUnlessGranted` call each, no ownership logic in the service layer.

### RecurringItemVoter
Same pattern applied to recurring items: item → account → customer → compare user. Demonstrates consistent application of the pattern across resources, not a one-off.

### 404 vs 403 choice
The API returns `404` (not `403`) when ownership fails on a known resource. Rationale (documented inline): returning `403` confirms the resource exists to an unauthorized caller — a minor but real information leak. `404` gives no information. This is the correct security posture for a financial application. The inline comment in both controllers explains this explicitly — a screener who notices it will know you've thought about security beyond happy-path auth.

### Tests
`tests/Unit/Security/AccountVoterTest.php`:
- Owner accessing own account → `ACCESS_GRANTED`
- Authenticated user accessing another user's account → `ACCESS_DENIED`
- Anonymous user → `ACCESS_DENIED`

---

## Section 10: Symfony Messenger — Async Forecast Generation

### Message + Handler
```
src/Message/GenerateForecastMessage.php         — readonly DTO: customerAccountId, requestedAt
src/MessageHandler/GenerateForecastHandler.php  — calls ForecastingEngine, updates ForecastJob status
```

`GenerateForecastMessage` is a plain PHP readonly class — no Messenger-specific base class needed. The handler is tagged automatically via `#[AsMessageHandler]`.

### ForecastJob entity
```
src/Entity/ForecastJob.php
```
Fields: `id` (UUID), `customerAccountId`, `status` (PHP 8.1 enum: `pending` / `processing` / `completed` / `failed`), `requestedAt` (`DateTimeImmutable`), `completedAt` (`?DateTimeImmutable`), `errorMessage` (`?string`).

No new infrastructure — stored in the existing PostgreSQL database.

### Transport
Doctrine transport (`doctrine://default`). Messages stored in `messenger_messages` table (created by `messenger:setup-transports`). Zero new services in `compose.yml`.

### Worker service in compose.yml
```yaml
worker:
  build: .
  command: php bin/console messenger:consume async --time-limit=3600 --memory-limit=128M
  depends_on: [database]
  restart: unless-stopped
```
Starts automatically on `docker compose up`. The `make demo` command also runs `messenger:consume async --limit=50` inline after fixtures load, so projections are ready when the demo user first logs in.

### Handler error handling
The handler wraps `ForecastingEngine::generateFutureProjections()` in a try/catch. On exception: sets `status = failed`, sets `errorMessage`, flushes, re-throws so Messenger can retry. After max retries (3), the job stays `failed` — visible in the database, not silently dropped.

### API flow
```
POST /api/v1/forecasts/generate
→ creates ForecastJob (status: pending)
→ dispatches GenerateForecastMessage
→ returns 202 {"jobId": "uuid"}

GET /api/v1/forecasts/jobs/{jobId}
→ returns {"status": "pending|processing|completed|failed", "completedAt": null|"ISO8601"}
```

---

## Section 11: Console Command + API Tests

### Console Command
```
src/Command/ForecastRegenerateCommand.php
```

`app:forecast:regenerate [--customer-id=X] [--all]`

- Without options: prints usage and exits `1`
- `--customer-id=X`: dispatches one `GenerateForecastMessage` for that customer
- `--all`: queries all active customers, dispatches a message per customer, outputs a `ProgressBar`

Makefile entry: `make forecast` → `docker compose exec app php bin/console app:forecast:regenerate --all`

Demonstrates: Symfony Console component beyond basic `writeln`, async-aware operations (dispatches messages, doesn't block), `ProgressBar` for long-running batch visibility.

### API Integration Tests

```
tests/Integration/Api/AuthTest.php
tests/Integration/Api/AccountApiTest.php
tests/Integration/Api/ForecastApiTest.php
```

**AuthTest:**
- Valid demo credentials → `200` + JWT token in response
- Invalid credentials → `401`

**AccountApiTest:**
- Unauthenticated request → `401`
- Authenticated `GET /accounts` → `200`, JSON contains only demo user's accounts
- `GET /accounts/{ownId}` → `200`
- `GET /accounts/{otherId}` → `404` (Voter + 404-not-403 policy)
- Serializer groups: sensitive fields absent from response

**ForecastApiTest:**
- `POST /forecasts/generate` → `202` + `jobId`
- `GET /forecasts/jobs/{jobId}` immediately → `{"status": "pending"}`
- Run `messenger:consume --limit=1` inline → `GET /forecasts/jobs/{jobId}` → `{"status": "completed"}`

All tests use `KernelBrowser` + `dama/doctrine-test-bundle` for rolled-back transactions. JWT token fetched in `setUp()` and reused across tests in the same class.

### Final test count
| Suite | Count | What it covers |
|---|---|---|
| Unit: ForecastingEngine | 5 | Business rules, N+1 fix, Strategy dispatch |
| Unit: AccountVoter | 3 | Owner, non-owner, anonymous |
| Integration: Controller (existing) | 1 | Web forecasting endpoint shape |
| Integration: API | 9 | Auth, ownership, async job lifecycle |
| **Total** | **18** | |

---

## Effort Summary

| Section | Estimated Hours | Primary Signal |
|---|---|---|
| **Version Upgrade — PHP 8.4 + Symfony 7.4 (Section 0)** | **1.5h** | **Tracks the language; LTS baseline** |
| Docker & Infrastructure | 2h | "Works in 3 min" = instant trust |
| Three World-Class Files | 5h | Architecture depth where screeners look |
| Baseline Cleanup | 1h | No red flags, professional baseline |
| Fixtures & Sample Data | 2h | Demo that sells itself |
| Testing (unit + integration) | 1.5h | Knows what to test and why |
| README & DX | 1h | Communicates like a senior |
| REST API with JWT (Section 7) | 3h | Ships a complete API layer |
| GitHub Actions CI (Section 8) | 1.5h | PHPStan 8 + real DB in CI = table stakes for senior |
| Security Voters (Section 9) | 1h | Resource ownership, not just role checks |
| Symfony Messenger (Section 10) | 2.5h | Async-aware architecture |
| Console Command + API Tests (Section 11) | 2.5h | Full toolkit + verified HTTP stack |
| **Total** | **~25h** | |

---

## Out of Scope (deliberate)

The following are intentionally excluded to avoid over-engineering signals and keep the scope deliverable:

- **API Platform** — hand-rolled controllers demonstrate deeper HTTP understanding; API Platform would obscure the serialization and routing decisions
- **Full CQRS** (Command/Query bus across all features) — the Messenger async pattern covers the meaningful use case without imposing CQRS ceremony everywhere
- **Full hexagonal architecture** with Ports & Adapters — the service interface contracts already demonstrate the principle; full hexagonal adds complexity without proportional clarity
- **OpenAPI/Swagger UI** (NelmioApiDocBundle) — the hand-rolled API is self-documenting via the Technical Review Guide; a Swagger UI would take 1h and not impress screeners reading code
- **Test coverage for entities, forms, and repositories** — diminishing returns; 18 focused tests outperform 60 getter/setter tests in every screener's eyes
- **Admin panel refactoring** — not on the customer-facing demo path
- **Multiple demo user scenarios** — one well-crafted demo user with realistic data is cleaner than two half-baked ones
