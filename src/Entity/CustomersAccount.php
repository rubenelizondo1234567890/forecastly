<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'customers_account')]
class CustomersAccount
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
    #[ORM\Column(name: 'account_name', type: Types::STRING, length: 255)]
    private string $accountName;
    
    /**
     * @var DateTimeInterface
     */
    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $createdAt;
    
    /**
     * @var bool
     */
    #[ORM\Column(name: 'is_active', type: Types::BOOLEAN, nullable: true)]
    private bool $isActive = false;
    
    /**
     * @var bool
     */
    #[ORM\Column(name: 'is_master_budget_tracking_group_loaded', type: Types::BOOLEAN, nullable: true)]
    private bool $isMasterBudgetTrackingGroupLoaded = false;
    
    /**
     * @var SubscriptionPlan
     */
    #[ORM\ManyToOne(targetEntity: SubscriptionPlan::class)]
    #[ORM\JoinColumn(name: 'subscription_plans_id', referencedColumnName: 'id')]
    private SubscriptionPlan $subscriptionPlan;
    
    /**
     * @var Subscriptions|null
     */
    #[ORM\OneToOne(mappedBy: 'customerAccount', targetEntity: Subscriptions::class)]
    private ?Subscriptions $subscription = null;
    
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
    
    /**
     * @return DateTimeInterface
     */
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
    
    /**
     * @return bool
     */
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
    
    /**
     * @return SubscriptionPlan
     */
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
    
    /**
     * @return Subscriptions|null
     */
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