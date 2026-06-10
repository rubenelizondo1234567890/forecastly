# Forecastly Portfolio Demo — Plan 4: Async & REST API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Symfony Messenger for async forecast generation, stand up JWT authentication, and deliver three hand-rolled API controllers covering accounts, recurring items, and forecasting — with correct HTTP semantics throughout.

**Architecture:** `ForecastJob` entity tracks async job state (pending → processing → completed/failed) in PostgreSQL via Doctrine transport. JWT auth uses `lexik/jwt-authentication-bundle` with a dedicated API firewall. Symfony's native serializer (not JMS) handles API responses via explicit `api:read` / `api:write` groups. `Money` VO gets a custom normalizer. Controllers are thin — they delegate to the existing service interfaces from Plan 2.

**Tech Stack:** PHP 8.4, Symfony Messenger 7.4, Doctrine transport, lexik/jwt-authentication-bundle 3.x, Symfony Serializer 7.4.

**Prerequisite:** Plans 1–3 complete. `ForecastingEngineInterface` and service contracts in place.

---

## File Map

| Action | Path |
|---|---|
| Create | `src/Enum/ForecastJobStatus.php` |
| Create | `src/Entity/ForecastJob.php` |
| Create | `src/Message/GenerateForecastMessage.php` |
| Create | `src/MessageHandler/GenerateForecastHandler.php` |
| Modify | `config/packages/messenger.yaml` |
| Create | `config/packages/lexik_jwt_authentication.yaml` |
| Modify | `config/packages/security.yaml` |
| Create | `src/Serializer/MoneyNormalizer.php` |
| Modify | `src/Entity/Account.php` (add serializer Groups) |
| Modify | `src/Entity/RecurringExpense.php` (add serializer Groups) |
| Modify | `src/Entity/RecurringIncome.php` (add serializer Groups) |
| Create | `src/Controller/Api/AccountApiController.php` |
| Create | `src/Controller/Api/RecurringItemApiController.php` |
| Create | `src/Controller/Api/ForecastApiController.php` |

---

## Task 1: ForecastJob entity + enum + migration

**Files:**
- Create: `src/Enum/ForecastJobStatus.php`
- Create: `src/Entity/ForecastJob.php`

- [ ] **Step 1: Create `ForecastJobStatus` enum**

```php
<?php

namespace App\Enum;

enum ForecastJobStatus: string
{
    case Pending    = 'pending';
    case Processing = 'processing';
    case Completed  = 'completed';
    case Failed     = 'failed';
}
```

- [ ] **Step 2: Create `ForecastJob` entity**

```php
<?php

namespace App\Entity;

use App\Enum\ForecastJobStatus;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'forecast_jobs')]
class ForecastJob
{
    // PHP 8.4: public read, private write — visible to API, immutable externally
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    public private(set) string $id;

    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customers_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customerAccount;

    #[ORM\Column(type: Types::STRING, enumType: ForecastJobStatus::class)]
    private ForecastJobStatus $status = ForecastJobStatus::Pending;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    public private(set) \DateTimeImmutable $requestedAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $errorMessage = null;

    public function __construct(CustomersAccount $customerAccount)
    {
        $this->customerAccount = $customerAccount;
        $this->requestedAt     = new \DateTimeImmutable();
    }

    public function getCustomerAccount(): CustomersAccount { return $this->customerAccount; }
    public function getStatus(): ForecastJobStatus         { return $this->status; }
    public function getCompletedAt(): ?\DateTimeImmutable  { return $this->completedAt; }
    public function getErrorMessage(): ?string             { return $this->errorMessage; }

    public function markProcessing(): void
    {
        $this->status = ForecastJobStatus::Processing;
    }

    public function markCompleted(): void
    {
        $this->status      = ForecastJobStatus::Completed;
        $this->completedAt = new \DateTimeImmutable();
    }

    public function markFailed(string $message): void
    {
        $this->status       = ForecastJobStatus::Failed;
        $this->errorMessage = $message;
        $this->completedAt  = new \DateTimeImmutable();
    }
}
```

- [ ] **Step 3: Generate and run the migration**

```bash
docker compose exec app php bin/console doctrine:migrations:diff
docker compose exec app php bin/console doctrine:migrations:migrate --no-interaction
# Expected: migrated successfully — forecast_jobs table created
```

- [ ] **Step 4: Commit**

```bash
git add src/Enum/ForecastJobStatus.php src/Entity/ForecastJob.php migrations/
git commit -m "feat: add ForecastJob entity with PHP 8.4 asymmetric visibility and ForecastJobStatus enum"
```

---

## Task 2: Symfony Messenger config + Message + Handler

**Files:**
- Modify: `config/packages/messenger.yaml`
- Create: `src/Message/GenerateForecastMessage.php`
- Create: `src/MessageHandler/GenerateForecastHandler.php`

- [ ] **Step 1: Configure Doctrine transport in `config/packages/messenger.yaml`**

Replace the file content:

```yaml
framework:
    messenger:
        failure_transport: failed

        transports:
            async:
                dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
                retry_strategy:
                    max_retries: 3
                    delay: 1000
                    multiplier: 2
            failed:
                dsn: 'doctrine://default?queue_name=failed'

        routing:
            App\Message\GenerateForecastMessage: async

when@test:
    framework:
        messenger:
            transports:
                async: 'in-memory://'
```

- [ ] **Step 2: Create `GenerateForecastMessage`**

```php
<?php

namespace App\Message;

final readonly class GenerateForecastMessage
{
    public function __construct(
        public int $customerAccountId,
        public string $forecastJobId,
    ) {}
}
```

- [ ] **Step 3: Create `GenerateForecastHandler`**

```php
<?php

namespace App\MessageHandler;

use App\Entity\ForecastJob;
use App\Message\GenerateForecastMessage;
use App\Services\Contract\ForecastingEngineInterface;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class GenerateForecastHandler
{
    public function __construct(
        private readonly ForecastingEngineInterface $forecastingEngine,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {}

    public function __invoke(GenerateForecastMessage $message): void
    {
        $job = $this->em->find(ForecastJob::class, $message->forecastJobId);

        if ($job === null) {
            $this->logger->error('ForecastJob not found', ['jobId' => $message->forecastJobId]);
            return;
        }

        $job->markProcessing();
        $this->em->flush();

        try {
            $customerAccount = $job->getCustomerAccount();
            $this->forecastingEngine->generateFutureProjections($customerAccount);
            $job->markCompleted();
        } catch (\Throwable $e) {
            // Set failed status so the job is visible in the DB — not silently dropped.
            // Messenger will retry up to max_retries (3) based on messenger.yaml config.
            $job->markFailed($e->getMessage());
            $this->logger->error('Forecast generation failed', [
                'jobId'     => $message->forecastJobId,
                'exception' => $e->getMessage(),
            ]);
            throw $e; // Re-throw so Messenger retries
        } finally {
            $this->em->flush();
        }
    }
}
```

- [ ] **Step 4: Set up Messenger transports**

```bash
docker compose exec app php bin/console messenger:setup-transports
# Expected: [OK] The async transport was set up successfully.
# Expected: [OK] The failed transport was set up successfully.
```

- [ ] **Step 5: Commit**

```bash
git add config/packages/messenger.yaml src/Message/ src/MessageHandler/
git commit -m "feat: add Symfony Messenger async forecast generation with Doctrine transport and job status tracking"
```

---

## Task 3: JWT setup

**Files:**
- Create: `config/packages/lexik_jwt_authentication.yaml`
- Modify: `config/packages/security.yaml`

- [ ] **Step 1: Generate JWT keypair**

```bash
docker compose exec app php bin/console lexik:jwt:generate-keypair
# Expected: keypair generated at config/jwt/private.pem and config/jwt/public.pem
```

Set `JWT_PASSPHRASE` in `.env.local` (not `.env`):

```dotenv
JWT_PASSPHRASE=your-local-passphrase-here
```

- [ ] **Step 2: Create `config/packages/lexik_jwt_authentication.yaml`**

```yaml
lexik_jwt_authentication:
    secret_key: '%env(resolve:JWT_SECRET_KEY)%'
    public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
    pass_phrase: '%env(JWT_PASSPHRASE)%'
    token_ttl: 3600
```

- [ ] **Step 3: Update `config/packages/security.yaml` to add the API firewall**

Add the `api` firewall **before** the existing `main` firewall. Symfony processes firewalls in order; the first match wins:

```yaml
security:
    firewalls:
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false

        api:
            pattern: ^/api/v1
            stateless: true
            jwt: ~

        main:
            # ... existing main firewall config unchanged ...

    access_control:
        - { path: ^/api/v1/auth/login, roles: PUBLIC_ACCESS }
        - { path: ^/api/v1,            roles: ROLE_USER }
        # ... existing access_control entries ...
```

- [ ] **Step 4: Verify JWT login works**

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@forecastly.com","password":"Demo1234!"}'
# Expected: {"token": "eyJ..."}
```

- [ ] **Step 5: Commit**

```bash
git add config/packages/lexik_jwt_authentication.yaml config/packages/security.yaml
git commit -m "feat: add JWT authentication with lexik/jwt-authentication-bundle and dedicated API firewall"
```

---

## Task 4: Symfony Serializer groups + MoneyNormalizer

**Files:**
- Create: `src/Serializer/MoneyNormalizer.php`
- Modify: `src/Entity/Account.php`
- Modify: `src/Entity/RecurringExpense.php`
- Modify: `src/Entity/RecurringIncome.php`

- [ ] **Step 1: Create `MoneyNormalizer`**

```php
<?php

namespace App\Serializer;

use App\ValueObject\Money;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

final class MoneyNormalizer implements NormalizerInterface
{
    /**
     * @param Money $object
     * @return array{amount: int, currency: string, formatted: string}
     */
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        return [
            'amount'    => $object->getAmount(),
            'currency'  => $object->getCurrency(),
            'formatted' => $object->formatted,
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Money;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [Money::class => true];
    }
}
```

- [ ] **Step 2: Add `api:read` serializer groups to `Account` entity**

In `src/Entity/Account.php`, add `use Symfony\Component\Serializer\Attribute\Groups;` then annotate the properties to expose:

```php
use Symfony\Component\Serializer\Attribute\Groups;

// On the $id property:
#[Groups(['api:read'])]
public private(set) ?int $id = null;

// On $name:
#[Groups(['api:read'])]
private string $name;

// On $accountType:
#[Groups(['api:read'])]
private ?string $accountType = null;

// On $projectedBalance:
#[Groups(['api:read'])]
private ?float $projectedBalance;

// On $annualInterestRate:
#[Groups(['api:read'])]
private ?float $annualInterestRate = null;
```

Do NOT add `api:read` to `$log`, `$customerAccount`, or any relation that could cause circular serialization or expose internal data.

- [ ] **Step 3: Add `api:read` and `api:write` groups to `RecurringExpense` and `RecurringIncome`**

In each entity, expose `id`, `name`, `amount`, `recurringDay`. Mark `amount` and `recurringDay` as both `api:read` and `api:write` (they are user-supplied on POST):

```php
#[Groups(['api:read'])]
private ?int $id = null;

#[Groups(['api:read', 'api:write'])]
private string $name;

#[Groups(['api:read', 'api:write'])]
private float $amount;

#[Groups(['api:read', 'api:write'])]
private int $recurringDay;
```

- [ ] **Step 4: Commit**

```bash
git add src/Serializer/MoneyNormalizer.php src/Entity/Account.php \
        src/Entity/RecurringExpense.php src/Entity/RecurringIncome.php
git commit -m "feat: add MoneyNormalizer and api:read/api:write serializer groups on entities"
```

---

## Task 5: AccountApiController

**Files:**
- Create: `src/Controller/Api/AccountApiController.php`

- [ ] **Step 1: Create the controller**

```php
<?php

namespace App\Controller\Api;

use App\Entity\Account;
use App\Services\Contract\AccountsServiceInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/v1/accounts', name: 'api_accounts_')]
final class AccountApiController extends AbstractController
{
    public function __construct(
        private readonly AccountsServiceInterface $accountsService,
        private readonly EntityManagerInterface $em,
        private readonly SerializerInterface $serializer,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $customer = $this->getUser();
        $accounts = $this->accountsService->getAccountsForCustomer(
            $customer->getCustomersAccount()
        );

        $json = $this->serializer->serialize($accounts, 'json', ['groups' => ['api:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $account = $this->em->find(Account::class, $id);

        // Return 404 whether the account doesn't exist OR belongs to another user.
        // Returning 403 would confirm the resource exists to an unauthorized caller.
        if ($account === null || $account->getCustomerAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $json = $this->serializer->serialize($account, 'json', ['groups' => ['api:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }
}
```

- [ ] **Step 2: Verify routing is registered**

```bash
docker compose exec app php bin/console debug:router | grep api_accounts
# Expected: api_accounts_list   GET    /api/v1/accounts
#           api_accounts_show   GET    /api/v1/accounts/{id}
```

- [ ] **Step 3: Smoke test with JWT**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@forecastly.com","password":"Demo1234!"}' | jq -r '.token')

curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/accounts
# Expected: JSON array of 6 accounts
```

- [ ] **Step 4: Commit**

```bash
git add src/Controller/Api/AccountApiController.php
git commit -m "feat: add AccountApiController with JWT-guarded list and show endpoints"
```

---

## Task 6: RecurringItemApiController

**Files:**
- Create: `src/Controller/Api/RecurringItemApiController.php`

- [ ] **Step 1: Create the controller**

```php
<?php

namespace App\Controller\Api;

use App\Entity\Account;
use App\Entity\RecurringExpense;
use App\Entity\RecurringIncome;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/v1/recurring-items', name: 'api_recurring_items_')]
final class RecurringItemApiController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $ca = $this->getUser()->getCustomersAccount();

        $incomes  = $this->em->getRepository(RecurringIncome::class)->findBy(['customersAccount' => $ca]);
        $expenses = $this->em->getRepository(RecurringExpense::class)->findBy(['customersAccount' => $ca]);

        $json = $this->serializer->serialize(
            ['incomes' => $incomes, 'expenses' => $expenses],
            'json',
            ['groups' => ['api:read']],
        );
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (!isset($payload['type'], $payload['name'], $payload['amount'], $payload['recurringDay'], $payload['accountId'])) {
            return $this->json(
                ['errors' => ['body' => 'type, name, amount, recurringDay, accountId are required']],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $account = $this->em->find(Account::class, $payload['accountId']);
        if ($account === null || $account->getCustomerAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $item = $payload['type'] === 'income' ? new RecurringIncome() : new RecurringExpense();
        $item->setName($payload['name']);
        $item->setAmount((float) $payload['amount']);
        $item->setRecurringDay((int) $payload['recurringDay']);
        $item->setCustomersAccount($this->getUser()->getCustomersAccount());
        $item->setAccount($account);

        $errors = $this->validator->validate($item);
        if (count($errors) > 0) {
            $errs = [];
            foreach ($errors as $error) {
                $errs[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errs], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($item);
        $this->em->flush();

        $json = $this->serializer->serialize($item, 'json', ['groups' => ['api:read']]);
        return new JsonResponse($json, Response::HTTP_CREATED, [
            'Location' => '/api/v1/recurring-items/' . $item->getId(),
        ], true);
    }

    #[Route('/{type}/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $type, int $id): JsonResponse
    {
        $entityClass = $type === 'income' ? RecurringIncome::class : RecurringExpense::class;
        $item = $this->em->find($entityClass, $id);

        if ($item === null || $item->getCustomersAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($item);
        $this->em->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Controller/Api/RecurringItemApiController.php
git commit -m "feat: add RecurringItemApiController with list, create, and delete endpoints"
```

---

## Task 7: ForecastApiController

**Files:**
- Create: `src/Controller/Api/ForecastApiController.php`

- [ ] **Step 1: Create the controller**

```php
<?php

namespace App\Controller\Api;

use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\ForecastJob;
use App\Message\GenerateForecastMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/forecasts', name: 'api_forecasts_')]
final class ForecastApiController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $bus,
    ) {}

    /**
     * Dispatch async forecast generation.
     * Returns 202 Accepted immediately — the client polls /jobs/{id} for completion.
     * Returning 200 here would be incorrect: the work has not completed yet.
     */
    #[Route('/generate', name: 'generate', methods: ['POST'])]
    public function generate(): JsonResponse
    {
        $customerAccount = $this->getUser()->getCustomersAccount();

        $job = new ForecastJob($customerAccount);
        $this->em->persist($job);
        $this->em->flush();

        $this->bus->dispatch(new GenerateForecastMessage(
            customerAccountId: $customerAccount->getId(),
            forecastJobId: $job->id,
        ));

        return $this->json(['jobId' => $job->id], Response::HTTP_ACCEPTED);
    }

    #[Route('/jobs/{jobId}', name: 'job_status', methods: ['GET'])]
    public function jobStatus(string $jobId): JsonResponse
    {
        $job = $this->em->find(ForecastJob::class, $jobId);

        if ($job === null || $job->getCustomerAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'jobId'       => $job->id,
            'status'      => $job->getStatus()->value,
            'requestedAt' => $job->requestedAt->format(\DateTimeInterface::ATOM),
            'completedAt' => $job->getCompletedAt()?->format(\DateTimeInterface::ATOM),
            'error'       => $job->getErrorMessage(),
        ]);
    }

    #[Route('/{accountId}', name: 'projections', methods: ['GET'])]
    public function projections(int $accountId): JsonResponse
    {
        $account = $this->em->find(Account::class, $accountId);

        if ($account === null || $account->getCustomerAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $entries = $this->em->getRepository(AccountsTrackingCalendar::class)
            ->findByCustomerAccountInDateRange(
                $this->getUser()->getCustomersAccount(),
                new \DateTime(),
                new \DateTime('+12 months'),
            );

        $data   = [];
        $labels = [];
        foreach ($entries as $entry) {
            $labels[] = $entry->getCalendarDate()->format('Y-m-d');
            $data[]   = $entry->getAccountsBalances()[$accountId] ?? 0;
        }

        return $this->json([
            'account' => ['id' => $account->getId(), 'name' => $account->getName()],
            'labels'  => $labels,
            'data'    => $data,
        ]);
    }
}
```

- [ ] **Step 2: Verify all API routes are registered**

```bash
docker compose exec app php bin/console debug:router | grep "api_"
# Expected: api_accounts_list, api_accounts_show, api_recurring_items_*,
#           api_forecasts_generate, api_forecasts_job_status, api_forecasts_projections
```

- [ ] **Step 3: Smoke test async dispatch**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@forecastly.com","password":"Demo1234!"}' | jq -r '.token')

JOB=$(curl -s -X POST http://localhost:8080/api/v1/forecasts/generate \
  -H "Authorization: Bearer $TOKEN")
echo $JOB
# Expected: {"jobId":"some-uuid"}

JOB_ID=$(echo $JOB | jq -r '.jobId')
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/forecasts/jobs/$JOB_ID
# Expected: {"status":"pending",...}

# Worker processes it automatically (or run manually):
docker compose exec app php bin/console messenger:consume async --limit=1
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/forecasts/jobs/$JOB_ID
# Expected: {"status":"completed",...}
```

- [ ] **Step 4: Commit**

```bash
git add src/Controller/Api/ForecastApiController.php
git commit -m "feat: add ForecastApiController with 202-Accepted async dispatch and job polling"
```

---

## Plan 4 Complete

Full API smoke test:

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@forecastly.com","password":"Demo1234!"}' | jq -r '.token')

# List accounts
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/accounts | jq '.[] | .name'
# Expected: "Checking Account", "Emergency Fund", ...

# Recurring items
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/recurring-items | jq '.incomes | length'
# Expected: 2
```

**Next:** `2026-06-09-forecastly-plan-5-security-tests-ci.md`
