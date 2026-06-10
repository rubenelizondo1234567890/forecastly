<?php

namespace App\Entity;

use DateTime;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'recurring_incomes')]
class RecurringIncome implements RecurringIncomeExpensesInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(name: 'name', type: Types::STRING, length: 45)]
    private string $name;

    #[ORM\Column(name: 'description', type: Types::STRING, length: 250, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'amount', type: Types::FLOAT)]
    private float $amount;

    #[ORM\Column(name: 'start_on', type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $startOn;

    #[ORM\Column(name: 'canceled_after', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?DateTimeInterface $canceledAfter;

    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'account_id', referencedColumnName: 'id')]
    private Account $account;

    #[ORM\ManyToOne(targetEntity: Frequency::class)]
    #[ORM\JoinColumn(name: 'frequencies_id', referencedColumnName: 'id')]
    private Frequency $frequency;

    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customer_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customerAccount;

    // Nullable — audit log is optional; fixtures and tests can omit it
    #[ORM\ManyToOne(targetEntity: Log::class)]
    #[ORM\JoinColumn(name: 'log_id', referencedColumnName: 'id', nullable: true)]
    private ?Log $log = null;

    #[ORM\ManyToOne(targetEntity: BudgetTrackingGroup::class)]
    #[ORM\JoinColumn(name: 'budget_tracking_groups_id', referencedColumnName: 'id')]
    private BudgetTrackingGroup $budgetTrackingGroup;

    public function __construct()
    {
        $this->startOn = new DateTime('now');
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): RecurringIncome
    {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): RecurringIncome
    {
        $this->description = $description;
        return $this;
    }

    public function getAmount(): float
    {
        return $this->amount;
    }

    public function setAmount(float $amount): RecurringIncome
    {
        $this->amount = $amount;
        return $this;
    }

    public function getStartOn(): DateTimeInterface
    {
        return $this->startOn;
    }

    public function getRecurringDay(): int
    {
        return (int) $this->startOn->format('j');
    }

    public function setStartOn(DateTimeInterface $startOn): RecurringIncome
    {
        $this->startOn = $startOn;
        return $this;
    }

    public function getCanceledAfter(): ?DateTimeInterface
    {
        return $this->canceledAfter;
    }

    public function setCanceledAfter(?DateTimeInterface $canceledAfter): RecurringIncome
    {
        $this->canceledAfter = $canceledAfter;
        return $this;
    }

    public function getAccount(): Account
    {
        return $this->account;
    }

    public function setAccount(Account $account): RecurringIncome
    {
        $this->account = $account;
        return $this;
    }

    public function getFrequency(): Frequency
    {
        return $this->frequency;
    }

    public function setFrequency(Frequency $frequency): RecurringIncome
    {
        $this->frequency = $frequency;
        return $this;
    }

    public function getCustomerAccount(): CustomersAccount
    {
        return $this->customerAccount;
    }

    public function setCustomerAccount(CustomersAccount $customerAccount): RecurringIncome
    {
        $this->customerAccount = $customerAccount;
        return $this;
    }

    public function getLog(): ?Log
    {
        return $this->log;
    }

    public function setLog(?Log $log): RecurringIncome
    {
        $this->log = $log;
        return $this;
    }

    public function getBudgetTrackingGroup(): BudgetTrackingGroup
    {
        return $this->budgetTrackingGroup;
    }

    public function setBudgetTrackingGroup(BudgetTrackingGroup $budgetTrackingGroup): RecurringIncome
    {
        $this->budgetTrackingGroup = $budgetTrackingGroup;
        return $this;
    }
}
