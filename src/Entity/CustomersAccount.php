<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'customers_account')]
class CustomersAccount
{
    // PHP 8.4: public read, private write — Doctrine sets via ReflectionProperty
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    public private(set) int $id;

    #[ORM\Column(name: 'account_name', type: Types::STRING, length: 255)]
    private string $accountName;

    // PHP 8.4: public read, private write
    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    public private(set) DateTimeInterface $createdAt;
    
    #[ORM\Column(name: 'is_active', type: Types::BOOLEAN, nullable: true)]
    private bool $isActive = false;
    
    #[ORM\Column(name: 'is_master_budget_tracking_group_loaded', type: Types::BOOLEAN, nullable: true)]
    private bool $isMasterBudgetTrackingGroupLoaded = false;
    
    #[ORM\ManyToOne(targetEntity: SubscriptionPlan::class)]
    #[ORM\JoinColumn(name: 'subscription_plans_id', referencedColumnName: 'id')]
    private SubscriptionPlan $subscriptionPlan;
    
    #[ORM\OneToOne(mappedBy: 'customerAccount', targetEntity: Subscriptions::class)]
    private ?Subscriptions $subscription = null;
    
    public function getId(): int
    {
        return $this->id;
    }
    
    public function getAccountName(): string
    {
        return $this->accountName;
    }
    
    /**
     * @param string $accountName
     * @return CustomersAccount
     */
    public function setAccountName(string $accountName): CustomersAccount
    {
        $this->accountName = $accountName;
        return $this;
    }
    
    public function getCreatedAt(): DateTimeInterface
    {
        return $this->createdAt;
    }
    
    /**
     * @param DateTimeInterface $createdAt
     * @return CustomersAccount
     */
    public function setCreatedAt(DateTimeInterface $createdAt): CustomersAccount
    {
        $this->createdAt = $createdAt;
        return $this;
    }
    
    public function isActive(): bool
    {
        return $this->isActive;
    }
    
    /**
     * @param bool $isActive
     * @return CustomersAccount
     */
    public function setIsActive(bool $isActive): CustomersAccount
    {
        $this->isActive = $isActive;
        return $this;
    }
    
    public function isMasterBudgetTrackingGroupLoaded(): bool
    {
        return $this->isMasterBudgetTrackingGroupLoaded;
    }
    
    public function setIsMasterBudgetTrackingGroupLoaded(bool $isMasterBudgetTrackingGroupLoaded): CustomersAccount
    {
        $this->isMasterBudgetTrackingGroupLoaded = $isMasterBudgetTrackingGroupLoaded;
        return $this;
    }
    
    public function getSubscriptionPlan(): SubscriptionPlan
    {
        return $this->subscriptionPlan;
    }
    
    /**
     * @param SubscriptionPlan $subscriptionPlan
     * @return CustomersAccount
     */
    public function setSubscriptionPlan(SubscriptionPlan $subscriptionPlan): CustomersAccount
    {
        $this->subscriptionPlan = $subscriptionPlan;
        return $this;
    }
    
    public function getSubscription(): ?Subscriptions
    {
        return $this->subscription;
    }
    
    /**
     * @param Subscriptions|null $subscription
     * @return CustomersAccount
     */
    public function setSubscription(?Subscriptions $subscription): CustomersAccount
    {
        // set the owning side of the relation if necessary
        if ($subscription !== null && $subscription->getCustomerAccount() !== $this) {
            $subscription->setCustomerAccount($this);
        }
        
        $this->subscription = $subscription;
        return $this;
    }
    
}