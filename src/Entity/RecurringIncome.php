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
    private ?string $description = null;
    
    /**
     * @var float
     */
    #[ORM\Column(name: 'amount', type: Types::FLOAT)]
    private float $amount;
    
    /**
     * @var DateTimeInterface
     */
    #[ORM\Column(name: 'start_on', type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $startOn;
    
    /**
     * @var DateTimeInterface|null
     */
    #[ORM\Column(name: 'canceled_after', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?DateTimeInterface $canceledAfter;
    
    /**
     * @var Account
     */
    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'account_id', referencedColumnName: 'id')]
    private Account $account;
    
    /**
     * @var Frequency
     */
    #[ORM\ManyToOne(targetEntity: Frequency::class)]
    #[ORM\JoinColumn(name: 'frequencies_id', referencedColumnName: 'id')]
    private Frequency $frequency;
    
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
    #[ORM\JoinColumn(name: 'budget_tracking_groups_id', referencedColumnName: 'id')]
    private BudgetTrackingGroup $budgetTrackingGroup;
    
    public function __construct()
    {
        $this->startOn  = new DateTime('now');
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
     * @return RecurringIncome
     */
    public function setName(string $name): RecurringIncome
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
     * @return RecurringIncome
     */
    public function setDescription(?string $description): RecurringIncome
    {
        $this->description = $description;
        return $this;
    }
    
    /**
     * @return float
     */
    public function getAmount(): float
    {
        return $this->amount;
    }
    
    /**
     * @param float $amount
     * @return RecurringIncome
     */
    public function setAmount(float $amount): RecurringIncome
    {
        $this->amount = $amount;
        return $this;
    }
    
    /**
     * @return DateTimeInterface
     */
    public function getStartOn(): DateTimeInterface
    {
        return $this->startOn;
    }
    
    /**
     * @param DateTimeInterface $startOn
     * @return RecurringIncome
     */
    public function setStartOn(DateTimeInterface $startOn): RecurringIncome
    {
        $this->startOn = $startOn;
        return $this;
    }
    
    /**
     * @return DateTimeInterface|null
     */
    public function getCanceledAfter(): ?DateTimeInterface
    {
        return $this->canceledAfter;
    }
    
    /**
     * @param DateTimeInterface|null $canceledAfter
     * @return RecurringIncome
     */
    public function setCanceledAfter(?DateTimeInterface $canceledAfter): RecurringIncome
    {
        $this->canceledAfter = $canceledAfter;
        return $this;
    }
    
    /**
     * @return Account
     */
    public function getAccount(): Account
    {
        return $this->account;
    }
    
    /**
     * @param Account $account
     * @return RecurringIncome
     */
    public function setAccount(Account $account): RecurringIncome
    {
        $this->account = $account;
        return $this;
    }
    
    /**
     * @return Frequency
     */
    public function getFrequency(): Frequency
    {
        return $this->frequency;
    }
    
    /**
     * @param Frequency $frequency
     * @return RecurringIncome
     */
    public function setFrequency(Frequency $frequency): RecurringIncome
    {
        $this->frequency = $frequency;
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
     * @return RecurringIncome
     */
    public function setCustomerAccount(CustomersAccount $customerAccount): RecurringIncome
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
     * @return RecurringIncome
     */
    public function setLog(Log $log): RecurringIncome
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
     * @return RecurringIncome
     */
    public function setBudgetTrackingGroup(BudgetTrackingGroup $budgetTrackingGroup): RecurringIncome
    {
        $this->budgetTrackingGroup = $budgetTrackingGroup;
        return $this;
    }
    
}