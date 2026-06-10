<?php

namespace App\Entity;

use App\Repository\AccountRepository;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AccountRepository::class)]
#[ORM\Table(name: 'accounts')]
class Account
{
    // PHP 8.4: public read, private write — Doctrine sets via ReflectionProperty
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    public private(set) ?int $id = null;

    #[ORM\Column(name: 'name', type: Types::STRING, length: 45)]
    private string $name;

    #[ORM\Column(name: 'description', type: Types::STRING, length: 250, nullable: true)]
    private ?string $description = '';

    #[Assert\PositiveOrZero(message: "Projected balance cannot be negative.", groups: ['Create'])]
    #[ORM\Column(name: 'projected_balance', type: Types::FLOAT, nullable: true)]
    private ?float $projectedBalance;

    #[ORM\Column(name: 'real_balance', type: Types::FLOAT, nullable: true)]
    private ?float $realBalance = null;

    #[ORM\Column(name: 'last_reconciliation_date', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?DateTimeInterface $lastReconciliationDate = null;

    #[ORM\Column(name: 'created_on', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?DateTimeInterface $createdOn;

    #[ORM\Column(name: 'account_type', type: Types::STRING, length: 45, nullable: true)]
    private ?string $accountType = null;

    #[Assert\NotNull(groups: ['account_type_interest'])]
    #[Assert\Range(
        notInRangeMessage: "Interest rate must be between {{ min }}% and {{ max }}%",
        invalidMessage: "Interest rate must be a valid number",
        min: 0.1,
        max: 100,
        groups: ['account_type_interest']
    )]
    #[ORM\Column(name: 'annual_interest_rate', type: Types::FLOAT, nullable: true)]
    private ?float $annualInterestRate = null;

    #[ORM\Column(name: 'has_monthly_interest_created', type: Types::BOOLEAN, nullable: false)]
    private bool $hasMonthlyInterestCreated = false;

    #[ORM\Column(name: 'has_max_limit', type: Types::BOOLEAN, nullable: false)]
    private bool $hasMaxLimit = false;

    #[ORM\Column(name: 'max_limit', type: Types::DECIMAL, precision: 8, scale: 2, nullable: true)]
    private ?string $maxLimit = null;

    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customer_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customerAccount;

    // Nullable — audit log is optional; fixtures and tests can omit it
    #[ORM\ManyToOne(targetEntity: Log::class)]
    #[ORM\JoinColumn(name: 'log_id', referencedColumnName: 'id', nullable: true)]
    private ?Log $log = null;

    #[ORM\ManyToOne(targetEntity: BudgetTrackingGroup::class)]
    #[ORM\JoinColumn(name: 'budget_tracking_group_id', referencedColumnName: 'id')]
    private BudgetTrackingGroup $budgetTrackingGroup;

    /** suggested for resetting Customer Accounts */
    public function __toString(): string
    {
        return $this->name . ' (ID: ' . $this->id . ')';
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): Account
    {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): Account
    {
        $this->description = $description;
        return $this;
    }

    public function getProjectedBalance(): ?float
    {
        return $this->projectedBalance;
    }

    public function setProjectedBalance(?float $projectedBalance): Account
    {
        $this->projectedBalance = round($projectedBalance, 2);
        return $this;
    }

    public function getRealBalance(): ?float
    {
        return $this->realBalance;
    }

    public function setRealBalance(?float $realBalance): Account
    {
        $this->realBalance = round($realBalance, 2);
        return $this;
    }

    public function getLastReconciliationDate(): ?DateTimeInterface
    {
        return $this->lastReconciliationDate;
    }

    public function setLastReconciliationDate(?DateTimeInterface $lastReconciliationDate): Account
    {
        $this->lastReconciliationDate = $lastReconciliationDate;
        return $this;
    }

    public function getCreatedOn(): ?DateTimeInterface
    {
        return $this->createdOn;
    }

    public function setCreatedOn(?DateTimeInterface $createdOn): Account
    {
        $this->createdOn = $createdOn;
        return $this;
    }

    public function getAccountType(): ?string
    {
        return $this->accountType;
    }

    public function setAccountType(?string $accountType): Account
    {
        $this->accountType = $accountType;
        return $this;
    }

    public function getAnnualInterestRate(): ?float
    {
        return $this->annualInterestRate;
    }

    public function setAnnualInterestRate(?float $annualInterestRate): Account
    {
        $this->annualInterestRate = round($annualInterestRate, 2);
        return $this;
    }

    public function isRevolvingAccount(): bool
    {
        return $this->annualInterestRate !== null && $this->annualInterestRate > 0;
    }

    public function isHasMonthlyInterestCreated(): bool
    {
        return $this->hasMonthlyInterestCreated;
    }

    public function setHasMonthlyInterestCreated(bool $hasMonthlyInterestCreated): void
    {
        $this->hasMonthlyInterestCreated = $hasMonthlyInterestCreated;
    }

    public function isHasMaxLimit(): bool
    {
        return $this->hasMaxLimit;
    }

    public function setHasMaxLimit(bool $hasMaxLimit): Account
    {
        $this->hasMaxLimit = $hasMaxLimit;
        return $this;
    }

    public function getMaxLimit(): ?string
    {
        return $this->maxLimit;
    }

    public function setMaxLimit(?string $maxLimit): Account
    {
        $this->maxLimit = $maxLimit;
        return $this;
    }

    public function getCustomerAccount(): CustomersAccount
    {
        return $this->customerAccount;
    }

    public function setCustomerAccount(CustomersAccount $customerAccount): Account
    {
        $this->customerAccount = $customerAccount;
        return $this;
    }

    public function getLog(): ?Log
    {
        return $this->log;
    }

    public function setLog(?Log $log): Account
    {
        $this->log = $log;
        return $this;
    }

    public function getBudgetTrackingGroup(): BudgetTrackingGroup
    {
        return $this->budgetTrackingGroup;
    }

    public function setBudgetTrackingGroup(BudgetTrackingGroup $budgetTrackingGroup): Account
    {
        $this->budgetTrackingGroup = $budgetTrackingGroup;
        return $this;
    }

    public function hasMaxLimit(): ?bool
    {
        return $this->hasMaxLimit;
    }
}
