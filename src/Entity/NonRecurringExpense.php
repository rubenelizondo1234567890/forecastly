<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'non_recurring_expenses')]
class NonRecurringExpense implements NonRecurringIncomeExpensesInterface
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
    
    #[ORM\Column(name: 'date_to_apply', type: 'datetime')]
    private DateTimeInterface $dateToApply;
    
    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'account_id', referencedColumnName: 'id')]
    private Account $account;
    
    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customer_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customerAccount;
    
    #[ORM\ManyToOne(targetEntity: Log::class)]
    #[ORM\JoinColumn(name: 'log_id', referencedColumnName: 'id')]
    private Log $log;
    
    #[ORM\ManyToOne(targetEntity: BudgetTrackingGroup::class)]
    #[ORM\JoinColumn(name: 'budget_tracking_groups_id', referencedColumnName: 'id')]
    private BudgetTrackingGroup $budgetTrackingGroup;
    
    public function getId(): ?int
    {
        return $this->id;
    }
    
    public function getName(): string
    {
        return $this->name;
    }
    
    /**
     * @param string $name
     * @return NonRecurringExpense
     */
    public function setName(string $name): NonRecurringExpense
    {
        $this->name = $name;
        return $this;
    }
    
    public function getDescription(): ?string
    {
        return $this->description;
    }
    
    /**
     * @param string|null $description
     * @return NonRecurringExpense
     */
    public function setDescription(?string $description): NonRecurringExpense
    {
        $this->description = $description;
        return $this;
    }
    
    public function getAmount(): float
    {
        return $this->amount;
    }
    
    /**
     * @param float $amount
     * @return NonRecurringExpense
     */
    public function setAmount(float $amount): NonRecurringExpense
    {
        $this->amount = $amount;
        return $this;
    }
    
    public function getDateToApply(): DateTimeInterface
    {
        return $this->dateToApply;
    }
    
    /**
     * @param DateTimeInterface $dateToApply
     * @return NonRecurringExpense
     */
    public function setDateToApply(DateTimeInterface $dateToApply): NonRecurringExpense
    {
        $this->dateToApply = $dateToApply;
        return $this;
    }
    
    public function getAccount(): Account
    {
        return $this->account;
    }
    
    /**
     * @param Account $account
     * @return NonRecurringExpense
     */
    public function setAccount(Account $account): NonRecurringExpense
    {
        $this->account = $account;
        return $this;
    }
    
    public function getCustomerAccount(): CustomersAccount
    {
        return $this->customerAccount;
    }
    
    /**
     * @param CustomersAccount $customerAccount
     * @return NonRecurringExpense
     */
    public function setCustomerAccount(CustomersAccount $customerAccount): NonRecurringExpense
    {
        $this->customerAccount = $customerAccount;
        return $this;
    }
    
    public function getLog(): Log
    {
        return $this->log;
    }
    
    /**
     * @param Log $log
     * @return NonRecurringExpense
     */
    public function setLog(Log $log): NonRecurringExpense
    {
        $this->log = $log;
        return $this;
    }
    
    public function getBudgetTrackingGroup(): BudgetTrackingGroup
    {
        return $this->budgetTrackingGroup;
    }
    
    /**
     * @param BudgetTrackingGroup $budgetTrackingGroup
     * @return NonRecurringExpense
     */
    public function setBudgetTrackingGroup(BudgetTrackingGroup $budgetTrackingGroup): NonRecurringExpense
    {
        $this->budgetTrackingGroup = $budgetTrackingGroup;
        return $this;
    }
    
    
}