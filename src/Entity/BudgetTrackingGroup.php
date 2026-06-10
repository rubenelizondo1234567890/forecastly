<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'budget_tracking_groups')]
class BudgetTrackingGroup
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private int $id;
    
    #[ORM\Column(name: 'name', type: Types::STRING, length: 45)]
    private string $name;
    
    #[ORM\Column(name: 'is_income_or_expense', type: Types::STRING, length: 10)]
    private string $isIncomeOrExpense;
    
    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customer_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customerAccount;
    
    public function getId(): int
    {
        return $this->id;
    }
    
    public function getName(): string
    {
        return $this->name;
    }
    
    /**
     * @param string $name
     * @return BudgetTrackingGroup
     */
    public function setName(string $name): BudgetTrackingGroup
    {
        $this->name = $name;
        return $this;
    }
    
    public function getIsIncomeOrExpense(): string
    {
        return $this->isIncomeOrExpense;
    }
    
    /**
     * @param string $isIncomeOrExpense
     * @return BudgetTrackingGroup
     */
    public function setIsIncomeOrExpense(string $isIncomeOrExpense): BudgetTrackingGroup
    {
        $this->isIncomeOrExpense = $isIncomeOrExpense;
        return $this;
    }
    
    public function getCustomerAccount(): CustomersAccount
    {
        return $this->customerAccount;
    }
    
    /**
     * @param CustomersAccount $customerAccount
     * @return BudgetTrackingGroup
     */
    public function setCustomerAccount(CustomersAccount $customerAccount): BudgetTrackingGroup
    {
        $this->customerAccount = $customerAccount;
        return $this;
    }
    
}