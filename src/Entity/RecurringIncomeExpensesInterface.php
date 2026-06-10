<?php

namespace App\Entity;

use DateTime;
use DateTimeInterface;

interface RecurringIncomeExpensesInterface
{
    /**
     * @return int|null
     */
    public function getId(): ?int;
    
    /**
     * @return string
     */
    public function getName(): string;
    
    
    /**
     * @param string $name
     */
    public function setName(string $name);
    
    /**
     * @return string|null
     */
    public function getDescription(): ?string;
    
    /**
     * @param string|null $description
     */
    public function setDescription(?string $description);
    
    /**
     * @return float
     */
    public function getAmount(): float;
    
    /**
     * @param float $amount
     */
    public function setAmount(float $amount);
    
    /**
     * @return DateTimeInterface
     */
    public function getStartOn(): DateTimeInterface;
    
    /**
     * @param DateTimeInterface $startOn
     */
    public function setStartOn(DateTimeInterface $startOn);
    
    /**
     * @return Account
     */
    public function getAccount(): Account;
    
    /**
     * @param Account $account
     */
    public function setAccount(Account $account);
    
    /**
     * @return CustomersAccount
     */
    public function getCustomerAccount(): CustomersAccount;
    
    /**
     * @param CustomersAccount $customerAccount
     */
    public function setCustomerAccount(CustomersAccount $customerAccount);
    
    /**
     * @return Log
     */
    public function getLog(): Log;
    
    /**
     * @param Log $log
     */
    public function setLog(Log $log);
    
    /**
     * @return BudgetTrackingGroup
     */
    public function getBudgetTrackingGroup(): BudgetTrackingGroup;
    
    /**
     * @param BudgetTrackingGroup $budgetTrackingGroup
     */
    public function setBudgetTrackingGroup(BudgetTrackingGroup $budgetTrackingGroup);
}