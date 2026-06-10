# Forecastly Portfolio Demo — Plan 5: Security, Tests & CI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Security Voters for resource ownership, the batch `ForecastRegenerateCommand`, 9 API integration tests covering the full HTTP stack, and a GitHub Actions CI pipeline running PHPStan level 8 + php-cs-fixer + PHPUnit against a real PostgreSQL service container.

**Architecture:** `AccountVoter` and `RecurringItemVoter` implement Symfony's `VoterInterface` pattern — controllers call `denyAccessUnlessGranted`, voters handle the ownership check. Both return `404` (not `403`) on failure: returning `403` reveals the resource exists to an unauthorized caller. API integration tests use `KernelBrowser` + `dama/doctrine-test-bundle` for transaction-wrapped isolation. CI runs three parallel jobs so a lint failure doesn't block tests.

**Tech Stack:** PHP 8.4, Symfony Security 7.4, PHPUnit 12, PHPStan 2.x level 8, php-cs-fixer 3.x, GitHub Actions.

**Prerequisite:** Plans 1–4 complete. JWT, API controllers, and fixtures all in place.

---

## File Map

| Action | Path |
|---|---|
| Create | `src/Security/Voter/AccountVoter.php` |
| Create | `src/Security/Voter/RecurringItemVoter.php` |
| Modify | `src/Controller/Api/AccountApiController.php` |
| Modify | `src/Controller/Api/RecurringItemApiController.php` |
| Modify | `src/Controller/Api/ForecastApiController.php` |
| Create | `src/Command/ForecastRegenerateCommand.php` |
| Create | `tests/Unit/Security/AccountVoterTest.php` |
| Create | `tests/Integration/Api/AuthTest.php` |
| Create | `tests/Integration/Api/AccountApiTest.php` |
| Create | `tests/Integration/Api/ForecastApiTest.php` |
| Create | `.github/workflows/ci.yml` |
| Create | `phpstan.neon` |
| Create | `.php-cs-fixer.php` |
| Modify | `Makefile` (lint target updated to PHPStan level 8) |

---

## Task 1: AccountVoter + RecurringItemVoter

**Files:**
- Create: `src/Security/Voter/AccountVoter.php`
- Create: `src/Security/Voter/RecurringItemVoter.php`

- [ ] **Step 1: Create `AccountVoter`**

```php
<?php

namespace App\Security\Voter;

use App\Entity\Account;
use App\Entity\Customer;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class AccountVoter extends Voter
{
    public const VIEW = 'VIEW';
    public const EDIT = 'EDIT';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT], true)
            && $subject instanceof Account;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof Customer) {
            return false;
        }

        /** @var Account $subject */
        return $subject->getCustomerAccount()->getId() === $user->getCustomersAccount()->getId();
    }
}
```

- [ ] **Step 2: Create `RecurringItemVoter`**

This voter covers both `RecurringIncome` and `RecurringExpense` via a shared interface. Both entities implement `RecurringIncomeExpensesInterface` which exposes `getCustomersAccount()`.

```php
<?php

namespace App\Security\Voter;

use App\Entity\Customer;
use App\Entity\RecurringExpense;
use App\Entity\RecurringIncome;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class RecurringItemVoter extends Voter
{
    public const VIEW   = 'VIEW';
    public const DELETE = 'DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::DELETE], true)
            && ($subject instanceof RecurringIncome || $subject instanceof RecurringExpense);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof Customer) {
            return false;
        }

        /** @var RecurringIncome|RecurringExpense $subject */
        return $subject->getCustomersAccount()->getId() === $user->getCustomersAccount()->getId();
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/Security/Voter/
git commit -m "feat: add AccountVoter and RecurringItemVoter for resource ownership authorization"
```

---

## Task 2: AccountVoter unit test

**Files:**
- Create: `tests/Unit/Security/AccountVoterTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace App\Tests\Unit\Security;

use App\Entity\Account;
use App\Entity\Customer;
use App\Entity\CustomersAccount;
use App\Security\Voter\AccountVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Authorization\Voter\VoterInterface;

class AccountVoterTest extends TestCase
{
    private AccountVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new AccountVoter();
    }

    public function testOwnerCanViewOwnAccount(): void
    {
        [$token, $account] = $this->buildOwnerScenario();

        $result = $this->voter->vote($token, $account, [AccountVoter::VIEW]);

        $this->assertSame(VoterInterface::ACCESS_GRANTED, $result);
    }

    public function testNonOwnerCannotViewAccount(): void
    {
        $ownerCa   = $this->buildCustomersAccount(1);
        $strangerCa = $this->buildCustomersAccount(2);

        $account = $this->createStub(Account::class);
        $account->method('getCustomerAccount')->willReturn($ownerCa);

        $stranger = $this->createStub(Customer::class);
        $stranger->method('getCustomersAccount')->willReturn($strangerCa);

        $token = new UsernamePasswordToken($stranger, 'main', ['ROLE_USER']);

        $result = $this->voter->vote($token, $account, [AccountVoter::VIEW]);

        $this->assertSame(VoterInterface::ACCESS_DENIED, $result);
    }

    public function testAnonymousUserCannotViewAccount(): void
    {
        $ca = $this->buildCustomersAccount(1);
        $account = $this->createStub(Account::class);
        $account->method('getCustomerAccount')->willReturn($ca);

        // Anonymous token has no user object
        $token = new UsernamePasswordToken(new \stdClass(), 'main', []);

        $result = $this->voter->vote($token, $account, [AccountVoter::VIEW]);

        $this->assertSame(VoterInterface::ACCESS_DENIED, $result);
    }

    private function buildOwnerScenario(): array
    {
        $ca = $this->buildCustomersAccount(1);

        $account = $this->createStub(Account::class);
        $account->method('getCustomerAccount')->willReturn($ca);

        $user = $this->createStub(Customer::class);
        $user->method('getCustomersAccount')->willReturn($ca);

        $token = new UsernamePasswordToken($user, 'main', ['ROLE_USER']);

        return [$token, $account];
    }

    private function buildCustomersAccount(int $id): CustomersAccount
    {
        $ca = $this->createStub(CustomersAccount::class);
        $ca->method('getId')->willReturn($id);
        return $ca;
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose exec app php bin/phpunit tests/Unit/Security/AccountVoterTest.php --testdox
# Expected: FAIL — AccountVoter class not found (before Task 1) or PASS (if run after Task 1)
```

- [ ] **Step 3: Run tests — all pass**

```bash
docker compose exec app php bin/phpunit tests/Unit/Security/AccountVoterTest.php --testdox
# Expected: OK (3 tests, 3 assertions)
```

- [ ] **Step 4: Commit**

```bash
git add tests/Unit/Security/AccountVoterTest.php
git commit -m "test: add AccountVoterTest covering owner, non-owner, and anonymous scenarios"
```

---

## Task 3: Wire Voters into API controllers

**Files:**
- Modify: `src/Controller/Api/AccountApiController.php`
- Modify: `src/Controller/Api/RecurringItemApiController.php`
- Modify: `src/Controller/Api/ForecastApiController.php`

- [ ] **Step 1: Update `AccountApiController::show()` to use the Voter**

Replace the manual ownership check in the `show` method with `denyAccessUnlessGranted`. The Voter handles the ownership logic; the controller stays thin:

```php
#[Route('/{id}', name: 'show', methods: ['GET'])]
public function show(int $id): JsonResponse
{
    $account = $this->em->find(Account::class, $id);

    if ($account === null) {
        return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
    }

    // Voter returns ACCESS_DENIED for non-owners.
    // We throw 404 (not 403) to avoid confirming the resource exists.
    // See AccountVoter for the ownership logic.
    if (!$this->isGranted('VIEW', $account)) {
        return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
    }

    $json = $this->serializer->serialize($account, 'json', ['groups' => ['api:read']]);
    return new JsonResponse($json, Response::HTTP_OK, [], true);
}
```

- [ ] **Step 2: Update `RecurringItemApiController::delete()` to use the Voter**

```php
#[Route('/{type}/{id}', name: 'delete', methods: ['DELETE'])]
public function delete(string $type, int $id): JsonResponse
{
    $entityClass = $type === 'income' ? RecurringIncome::class : RecurringExpense::class;
    $item = $this->em->find($entityClass, $id);

    if ($item === null) {
        return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
    }

    if (!$this->isGranted('DELETE', $item)) {
        return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
    }

    $this->em->remove($item);
    $this->em->flush();

    return new JsonResponse(null, Response::HTTP_NO_CONTENT);
}
```

- [ ] **Step 3: Update `ForecastApiController::projections()` to use the Voter**

```php
#[Route('/{accountId}', name: 'projections', methods: ['GET'])]
public function projections(int $accountId): JsonResponse
{
    $account = $this->em->find(Account::class, $accountId);

    if ($account === null) {
        return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
    }

    if (!$this->isGranted('VIEW', $account)) {
        return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
    }

    // ... rest of method unchanged
}
```

- [ ] **Step 4: Commit**

```bash
git add src/Controller/Api/
git commit -m "refactor: wire AccountVoter and RecurringItemVoter into API controllers via isGranted"
```

---

## Task 4: ForecastRegenerateCommand

**Files:**
- Create: `src/Command/ForecastRegenerateCommand.php`

- [ ] **Step 1: Create the command**

```php
<?php

namespace App\Command;

use App\Entity\CustomersAccount;
use App\Message\GenerateForecastMessage;
use App\Entity\ForecastJob;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand(
    name: 'app:forecast:regenerate',
    description: 'Dispatch async forecast regeneration for one or all customer accounts',
)]
final class ForecastRegenerateCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $bus,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('customer-id', null, InputOption::VALUE_OPTIONAL, 'Regenerate for a specific customer account ID')
            ->addOption('all', null, InputOption::VALUE_NONE, 'Regenerate for all active customer accounts');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $customerId = $input->getOption('customer-id');
        $all        = $input->getOption('all');

        if (!$customerId && !$all) {
            $io->error('Provide --customer-id=X or --all');
            return Command::FAILURE;
        }

        if ($customerId) {
            $account = $this->em->find(CustomersAccount::class, (int) $customerId);
            if ($account === null) {
                $io->error("Customer account {$customerId} not found");
                return Command::FAILURE;
            }
            $accounts = [$account];
        } else {
            $accounts = $this->em->getRepository(CustomersAccount::class)
                ->findBy(['isActive' => true]);
        }

        $io->info(sprintf('Dispatching forecast regeneration for %d account(s)...', count($accounts)));

        $progressBar = new ProgressBar($output, count($accounts));
        $progressBar->start();

        foreach ($accounts as $account) {
            $job = new ForecastJob($account);
            $this->em->persist($job);
            $this->em->flush();

            $this->bus->dispatch(new GenerateForecastMessage(
                customerAccountId: $account->getId(),
                forecastJobId: $job->id,
            ));

            $progressBar->advance();
        }

        $progressBar->finish();
        $output->writeln('');
        $io->success(sprintf('Dispatched %d forecast job(s). Worker will process them.', count($accounts)));

        return Command::SUCCESS;
    }
}
```

- [ ] **Step 2: Verify the command is registered**

```bash
docker compose exec app php bin/console list app
# Expected: app:forecast:regenerate listed

docker compose exec app php bin/console app:forecast:regenerate
# Expected: [ERROR] Provide --customer-id=X or --all

docker compose exec app php bin/console app:forecast:regenerate --all
# Expected: progress bar, then success message with job count
```

- [ ] **Step 3: Commit**

```bash
git add src/Command/ForecastRegenerateCommand.php
git commit -m "feat: add app:forecast:regenerate console command with --all and --customer-id options and ProgressBar output"
```

---

## Task 5: API integration tests

**Files:**
- Create: `tests/Integration/Api/AuthTest.php`
- Create: `tests/Integration/Api/AccountApiTest.php`
- Create: `tests/Integration/Api/ForecastApiTest.php`

- [ ] **Step 1: Create `AuthTest`**

```php
<?php

namespace App\Tests\Integration\Api;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuthTest extends WebTestCase
{
    public function testValidCredentialsReturnJwtToken(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/v1/auth/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => 'demo@forecastly.com', 'password' => 'Demo1234!']));

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $data);
        $this->assertNotEmpty($data['token']);
    }

    public function testInvalidCredentialsReturn401(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/v1/auth/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => 'demo@forecastly.com', 'password' => 'wrong']));

        $this->assertResponseStatusCodeSame(401);
    }
}
```

- [ ] **Step 2: Create `AccountApiTest`**

```php
<?php

namespace App\Tests\Integration\Api;

use App\Entity\Account;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AccountApiTest extends WebTestCase
{
    private string $token;

    protected function setUp(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/v1/auth/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => 'demo@forecastly.com', 'password' => 'Demo1234!']));

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->token = $data['token'];
    }

    public function testUnauthenticatedRequestReturns401(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/v1/accounts');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testListAccountsReturnsOwnAccountsOnly(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/v1/accounts', [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
        ]);

        $this->assertResponseIsSuccessful();
        $accounts = json_decode($client->getResponse()->getContent(), true);
        $this->assertCount(6, $accounts, 'Demo user should have exactly 6 accounts from fixtures');
    }

    public function testShowOwnAccountReturns200(): void
    {
        $em      = static::getContainer()->get(EntityManagerInterface::class);
        $account = $em->getRepository(Account::class)->findOneBy(['name' => 'Checking Account']);

        $client = static::createClient();
        $client->request('GET', "/api/v1/accounts/{$account->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Checking Account', $data['name']);
    }

    public function testShowNonExistentAccountReturns404(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/v1/accounts/99999', [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
        ]);

        $this->assertResponseStatusCodeSame(404);
    }

    public function testResponseDoesNotLeakSensitiveFields(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/v1/accounts', [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
        ]);

        $accounts = json_decode($client->getResponse()->getContent(), true);
        $first    = $accounts[0];

        // These fields must never appear in the API response
        $this->assertArrayNotHasKey('log',             $first);
        $this->assertArrayNotHasKey('customerAccount', $first);
    }
}
```

- [ ] **Step 3: Create `ForecastApiTest`**

```php
<?php

namespace App\Tests\Integration\Api;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ForecastApiTest extends WebTestCase
{
    private string $token;

    protected function setUp(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/v1/auth/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => 'demo@forecastly.com', 'password' => 'Demo1234!']));

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->token = $data['token'];
    }

    public function testGenerateReturns202WithJobId(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/v1/forecasts/generate', [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
            'CONTENT_TYPE'       => 'application/json',
        ]);

        $this->assertResponseStatusCodeSame(202);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('jobId', $data);
        $this->assertNotEmpty($data['jobId']);
    }

    public function testJobStatusIsPendingImmediatelyAfterDispatch(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/v1/forecasts/generate', [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
            'CONTENT_TYPE'       => 'application/json',
        ]);
        $jobId = json_decode($client->getResponse()->getContent(), true)['jobId'];

        $client->request('GET', "/api/v1/forecasts/jobs/{$jobId}", [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
        ]);

        $this->assertResponseIsSuccessful();
        $status = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('pending', $status['status']);
        $this->assertNull($status['completedAt']);
    }

    public function testJobStatusIsCompletedAfterWorkerProcesses(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/v1/forecasts/generate', [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
            'CONTENT_TYPE'       => 'application/json',
        ]);
        $jobId = json_decode($client->getResponse()->getContent(), true)['jobId'];

        // In test environment messenger.yaml uses in-memory transport (see when@test block)
        // so messages are dispatched synchronously when the handler is invoked via the test bus
        static::getContainer()->get('messenger.bus.default');
        static::getContainer()->get('messenger.transport.async')->process(1);

        $client->request('GET', "/api/v1/forecasts/jobs/{$jobId}", [], [], [
            'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
        ]);

        $this->assertResponseIsSuccessful();
        $status = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('completed', $status['status']);
        $this->assertNotNull($status['completedAt']);
    }
}
```

- [ ] **Step 4: Run the full integration suite**

```bash
docker compose exec app php bin/phpunit tests/Integration/Api/ --testdox
# Expected: OK (9 tests)
```

If `ForecastApiTest::testJobStatusIsCompletedAfterWorkerProcesses` is flaky due to the in-memory transport setup, adjust the messenger test config in `config/packages/messenger.yaml` `when@test` block to ensure the transport processes immediately.

- [ ] **Step 5: Commit**

```bash
git add tests/Integration/Api/
git commit -m "test: add 9 API integration tests covering auth, account ownership, and async forecast job lifecycle"
```

---

## Task 6: GitHub Actions CI + PHPStan level 8

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `phpstan.neon`
- Create: `.php-cs-fixer.php`

- [ ] **Step 1: Create `phpstan.neon`**

```neon
includes:
    - vendor/phpstan/phpstan-symfony/extension.neon
    - vendor/phpstan/phpstan-doctrine/extension.neon

parameters:
    level: 8
    paths:
        - src
    excludePaths:
        - src/Kernel.php
    symfony:
        container_xml_path: var/cache/dev/App_KernelDevDebugContainer.xml
    doctrine:
        objectManagerLoader: tests/orm.php
```

- [ ] **Step 2: Create `tests/orm.php`** (required by phpstan-doctrine)

```php
<?php

use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
$kernel->boot();

return $kernel->getContainer()->get('doctrine')->getManager();
```

- [ ] **Step 3: Create `.php-cs-fixer.php`**

```php
<?php

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__ . '/src')
    ->in(__DIR__ . '/tests');

return (new PhpCsFixer\Config())
    ->setRules([
        '@Symfony'               => true,
        '@PHP84Migration'        => true,
        'array_syntax'           => ['syntax' => 'short'],
        'ordered_imports'        => ['sort_algorithm' => 'alpha'],
        'no_unused_imports'      => true,
        'trailing_comma_in_multiline' => true,
        'phpdoc_to_comment'      => false,
    ])
    ->setFinder($finder);
```

- [ ] **Step 4: Run PHPStan locally and fix all issues**

```bash
docker compose exec app php vendor/bin/phpstan analyse --level=8
```

Common level 8 issues to fix:
- `mixed` return types on Doctrine repository calls — add `@return` annotations or cast results
- Nullable parameters not handled — add null checks
- `array` parameters — replace with typed array shapes where possible (`Account[]`)
- Unsafe string → int casts — use explicit `(int)` casts

Fix issues iteratively until `phpstan` exits 0.

- [ ] **Step 5: Run php-cs-fixer locally**

```bash
docker compose exec app php vendor/bin/php-cs-fixer fix --diff
```

This auto-fixes formatting. Review the diff then commit.

- [ ] **Step 6: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]

jobs:
  lint:
    name: Code Style (php-cs-fixer)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: "8.4"
          coverage: none
      - uses: actions/cache@v4
        with:
          path: ~/.composer/cache
          key: composer-${{ hashFiles('composer.lock') }}
      - run: composer install --no-interaction --prefer-dist
      - run: vendor/bin/php-cs-fixer fix --dry-run --diff
        env:
          PHP_CS_FIXER_IGNORE_ENV: 1

  static-analysis:
    name: Static Analysis (PHPStan level 8)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: "8.4"
          coverage: none
      - uses: actions/cache@v4
        with:
          path: ~/.composer/cache
          key: composer-${{ hashFiles('composer.lock') }}
      - run: composer install --no-interaction --prefer-dist
      - run: vendor/bin/phpstan analyse --level=8 --no-progress

  test:
    name: Tests (PHPUnit + PostgreSQL)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: forecastly_test
          POSTGRES_USER: app
          POSTGRES_PASSWORD: app
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: "8.4"
          extensions: pdo_pgsql, redis, intl, zip
          coverage: none
      - uses: actions/cache@v4
        with:
          path: ~/.composer/cache
          key: composer-${{ hashFiles('composer.lock') }}
      - run: composer install --no-interaction --prefer-dist
      - name: Run migrations and fixtures
        env:
          DATABASE_URL: postgresql://app:app@localhost:5432/forecastly_test?serverVersion=16
          APP_ENV: test
        run: |
          php bin/console doctrine:migrations:migrate --no-interaction
          php bin/console messenger:setup-transports
          php bin/console doctrine:fixtures:load --no-interaction
      - name: Run PHPUnit
        env:
          DATABASE_URL: postgresql://app:app@localhost:5432/forecastly_test?serverVersion=16
          APP_ENV: test
          JWT_SECRET_KEY: '%kernel.project_dir%/config/jwt/private.pem'
          JWT_PUBLIC_KEY: '%kernel.project_dir%/config/jwt/public.pem'
          JWT_PASSPHRASE: test-passphrase
        run: php bin/phpunit --testdox
```

- [ ] **Step 7: Generate test JWT keys for CI**

Add a step before the test run that generates a throwaway keypair for CI:

```yaml
      - name: Generate JWT keys for CI
        run: |
          mkdir -p config/jwt
          openssl genrsa -out config/jwt/private.pem 2048
          openssl rsa -in config/jwt/private.pem -pubout -out config/jwt/public.pem
```

Add this step in the `test` job BEFORE the migrations step.

- [ ] **Step 8: Commit everything**

```bash
git add .github/ phpstan.neon .php-cs-fixer.php tests/orm.php
git commit -m "feat: add GitHub Actions CI with PHPStan level 8, php-cs-fixer, and PHPUnit against PostgreSQL sidecar"
```

---

## Plan 5 Complete

Run the final full test suite to confirm everything passes:

```bash
docker compose exec app php bin/phpunit --testdox
# Expected: OK (18 tests)
# Breakdown:
#   MoneyTest                          6
#   ForecastingEngineTest              5
#   AccountVoterTest                   3
#   CustomerForecastingControllerTest  1
#   AuthTest                           2
#   AccountApiTest                     5 (note: list test counts as 5 assertions)
#   ForecastApiTest                    3
```

Run lint and static analysis:

```bash
docker compose exec app php vendor/bin/php-cs-fixer fix --dry-run --diff
# Expected: no violations

docker compose exec app php vendor/bin/phpstan analyse --level=8
# Expected: no errors
```

Final smoke test — `make demo` from scratch:

```bash
docker compose down -v
docker compose up -d
make demo
# Open http://localhost:8080
# Login: demo@forecastly.com / Demo1234!
# API: POST http://localhost:8080/api/v1/auth/login
```

---

## Full Plan Sequence

| Plan | Sections Covered | Est. Hours |
|---|---|---|
| [Plan 1 — Foundation](2026-06-09-forecastly-plan-1-foundation.md) | §0 Version Upgrade, §1 Docker | 3.5h |
| [Plan 2 — Core Architecture](2026-06-09-forecastly-plan-2-core-architecture.md) | §2 Three World-Class Files, Service Contracts | 6h |
| [Plan 3 — Data Layer & DX](2026-06-09-forecastly-plan-3-data-layer.md) | §3 Cleanup, §4 Fixtures, §5 Tests, §6 README | 5.5h |
| [Plan 4 — Async & REST API](2026-06-09-forecastly-plan-4-async-api.md) | §7 REST API, §10 Messenger | 7h |
| [Plan 5 — Security, Tests & CI](2026-06-09-forecastly-plan-5-security-tests-ci.md) | §9 Voters, §11 Console+Tests, §8 CI | 5.5h |
| **Total** | | **~27.5h** |
