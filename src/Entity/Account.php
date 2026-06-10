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
    /**
     * @var int|null
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private ?int $id = null;

    /**
     * @var string
     */
    #[ORM\Column(name: 'name', type: Types::STRING, length: 45)]
    private string $name;

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'description', type: Types::STRING, length: 250, nullable: true)]
    private ?string $description = '';

    /**
     * @var float|null
     */
    #[Assert\PositiveOrZero(message: "Projected balance cannot be negative.", groups: ['Create'])]
    #[ORM\Column(name: 'projected_balance', type: Types::FLOAT, nullable: true)]
    private ?float $projectedBalance;

    /**
     * @var float|null
     */
    #[ORM\Column(name: 'real_balance', type: Types::FLOAT, nullable: true)]
    private ?float $realBalance = null;

    /**
     * @var DateTimeInterface|null
     */
    #[ORM\Column(name: 'last_reconciliation_date', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?DateTimeInterface $lastReconciliationDate = null;

    /**
     * @var DateTimeInterface|null
     */
    #[ORM\Column(name: 'created_on', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?DateTimeInterface $createdOn;

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'account_type', type: Types::STRING, length: 45, nullable: true)]
    private ?string $accountType = null;

    /**
     * @var float|null
     */
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

    /**
     * @var bool
     */
    #[ORM\Column(name: 'has_monthly_interest_created', type: Types::BOOLEAN, nullable: false)]
    private bool $hasMonthlyInterestCreated = false;

    /**
     * @var bool
     */
    #[ORM\Column(name: 'has_max_limit', type: Types::BOOLEAN, nullable: false)]
    private bool $hasMaxLimit = false;

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'max_limit', type: Types::DECIMAL, precision: 8, scale: 2, nullable: true)]
    private ?string $maxLimit = null;

    /**
     * @var CustomersAccount
     */
    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customer_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customerAccount;

    /**
     * @var Log
     */
    #[ORM\ManyToOne(targetEntity: Log::class)]
    #[ORM\JoinColumn(name: 'log_id', referencedColumnName: 'id')]
    private Log $log;

    /**
     * @var BudgetTrackingGroup
     */
    #[ORM\ManyToOne(targetEntity: BudgetTrackingGroup::class)]
    #[ORM\JoinColumn(name: 'budget_tracking_group_id', referencedColumnName: 'id')]
    private BudgetTrackingGroup $budgetTrackingGroup;

    /**
     * suggested for resetting Customer Accounts
     * @return string
     */
    public function __toString(): string
    {
        return $this->name . ' (ID: ' . $this->id . ')';
    }

    /**
     * @return int|null
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * @return string
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * @param string $name
     * @return Account
     */
    public function setName(string $name): Account
    {
        $this->name = $name;
        return $this;
    }

    /**
     * @return string|null
     */
    public function getDescription(): ?string
    {
        return $this->description;
    }

    /**
     * @param string|null $description
     * @return Account
     */
    public function setDescription(?string $description): Account
    {
        $this->description = $description;
        return $this;
    }

    /**
     * @return float|null
     */
    public function getProjectedBalance(): ?float
    {
        return $this->projectedBalance;
    }

    /**
     * @param float|null $projectedBalance
     * @return Account
     */
    public function setProjectedBalance(?float $projectedBalance): Account
    {
        $this->projectedBalance = round($projectedBalance, 2);
        return $this;
    }

    /**
     * @return float|null
     */
    public function getRealBalance(): ?float
    {
        return $this->realBalance;
    }

    /**
     * @param float|null $realBalance
     * @return Account
     */
    public function setRealBalance(?float $realBalance): Account
    {
        $this->realBalance = round($realBalance, 2);
        return $this;
    }

    /**
     * @return DateTimeInterface|null
     */
    public function getLastReconciliationDate(): ?DateTimeInterface
    {
        return $this->lastReconciliationDate;
    }

    /**
     * @param DateTimeInterface|null $lastReconciliationDate
     * @return Account
     */
    public function setLastReconciliationDate(?DateTimeInterface $lastReconciliationDate): Account
    {
        $this->lastReconciliationDate = $lastReconciliationDate;
        return $this;
    }

    /**
     * @return DateTimeInterface|null
     */
    public function getCreatedOn(): ?DateTimeInterface
    {
        return $this->createdOn;
    }

    /**
     * @param DateTimeInterface|null $createdOn
     * @return Account
     */
    public function setCreatedOn(?DateTimeInterface $createdOn): Account
    {
        $this->createdOn = $createdOn;
        return $this;
    }

    /**
     * @return string|null
     */
    public function getAccountType(): ?string
    {
        return $this->accountType;
    }

    /**
     * @param string|null $accountType
     * @return Account
     */
    public function setAccountType(?string $accountType): Account
    {
        $this->accountType = $accountType;
        return $this;
    }

    /**
     * @return float|null
     */
    public function getAnnualInterestRate(): ?float
    {
        return $this->annualInterestRate;
    }

    /**
     * @param float|null $annualInterestRate
     * @return Account
     */
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

    /**
     * @return bool
     */
    public function isHasMaxLimit(): bool
    {
        return $this->hasMaxLimit;
    }

    /**
     * @param bool $hasMaxLimit
     * @return Account
     */
    public function setHasMaxLimit(bool $hasMaxLimit): Account
    {
        $this->hasMaxLimit = $hasMaxLimit;
        return $this;
    }

    /**
     * @return string|null
     */
    public function getMaxLimit(): ?string
    {
        return $this->maxLimit;
    }

    /**
     * @param string|null $maxLimit
     * @return Account
     */
    public function setMaxLimit(?string $maxLimit): Account
    {
        $this->maxLimit = $maxLimit;
        return $this;
    }

    /**
     * @return CustomersAccount
     */
    public function getCustomerAccount(): CustomersAccount
    {
        return $this->customerAccount;
    }

    /**
     * @param CustomersAccount $customerAccount
     * @return Account
     */
    public function setCustomerAccount(CustomersAccount $customerAccount): Account
    {
        $this->customerAccount = $customerAccount;
        return $this;
    }

    /**
     * @return Log
     */
    public function getLog(): Log
    {
        return $this->log;
    }

    /**
     * @param Log $log
     * @return Account
     */
    public function setLog(Log $log): Account
    {
        $this->log = $log;
        return $this;
    }

    /**
     * @return BudgetTrackingGroup
     */
    public function getBudgetTrackingGroup(): BudgetTrackingGroup
    {
        return $this->budgetTrackingGroup;
    }

    /**
     * @param BudgetTrackingGroup $budgetTrackingGroup
     * @return Account
     */
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
