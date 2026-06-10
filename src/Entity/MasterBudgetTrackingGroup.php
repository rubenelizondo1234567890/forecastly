<?php

namespace App\Entity;

use App\Repository\MasterBudgetTrackingGroupRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MasterBudgetTrackingGroupRepository::class)]
#[ORM\Table(name: 'master_budget_tracking_groups')]
class MasterBudgetTrackingGroup
{
    /**
     * @var int
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private int $id;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'name', type: Types::STRING, length: 45)]
    private string $name;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'is_income_or_expense', type: Types::STRING, length: 10)]
    private string $isIncomeOrExpense;
    
    
    /**
     * @return int
     */
    public function getId(): int
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
     * @return BudgetTrackingGroup
     */
    public function setName(string $name): MasterBudgetTrackingGroup
    {
        $this->name = $name;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getIsIncomeOrExpense(): string
    {
        return $this->isIncomeOrExpense;
    }
    
    /**
     * @param string $isIncomeOrExpense
     * @return BudgetTrackingGroup
     */
    public function setIsIncomeOrExpense(string $isIncomeOrExpense): MasterBudgetTrackingGroup
    {
        $this->isIncomeOrExpense = $isIncomeOrExpense;
        return $this;
    }
    
}