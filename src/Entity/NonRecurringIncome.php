<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'non_recurring_incomes')]
class NonRecurringIncome implements NonRecurringIncomeExpensesInterface
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
    #[ORM\Column(name: 'date_to_apply', type: 'datetime')]
    private DateTimeInterface $dateToApply;
    
    /**
     * @var Account
     */
    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'account_id', referencedColumnName: 'id')]
    private Account $account;
    
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
     * @return NonRecurringIncome
     */
    public function setName(string $name): NonRecurringIncome
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
     * @return NonRecurringIncome
     */
    public function setDescription(?string $description): NonRecurringIncome
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
     * @return NonRecurringIncome
     */
    public function setAmount(float $amount): NonRecurringIncome
    {
        $this->amount = $amount;
        return $this;
    }
    
    /**
     * @return DateTimeInterface
     */
    public function getDateToApply(): DateTimeInterface
    {
        return $this->dateToApply;
    }
    
    /**
     * @param DateTimeInterface $dateToApply
     * @return NonRecurringIncome
     */
    public function setDateToApply(DateTimeInterface $dateToApply): NonRecurringIncome
    {
        $this->dateToApply = $dateToApply;
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
     * @return NonRecurringIncome
     */
    public function setAccount(Account $account): NonRecurringIncome
    {
        $this->account = $account;
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
     * @return NonRecurringIncome
     */
    public function setCustomerAccount(CustomersAccount $customerAccount): NonRecurringIncome
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
     * @return NonRecurringIncome
     */
    public function setLog(Log $log): NonRecurringIncome
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
     * @return NonRecurringIncome
     */
    public function setBudgetTrackingGroup(BudgetTrackingGroup $budgetTrackingGroup): NonRecurringIncome
    {
        $this->budgetTrackingGroup = $budgetTrackingGroup;
        return $this;
    }
    
}