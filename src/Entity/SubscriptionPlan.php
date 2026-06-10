<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'subscription_plans')]

class SubscriptionPlan
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
    #[ORM\Column(name: 'plan_name', type: Types::STRING, length: 45)]
    private string $planName;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'stripe_interval', type: Types::STRING, length: 45)]
    private string $stripeInterval;//month , year
    
    /**
     * @var float
     */
    #[ORM\Column(name: 'price', type: Types::FLOAT)]
    private float $price;
    
    /**
     * @var int
     */
    #[ORM\Column(name: 'stripe_price', type: Types::INTEGER)]
    private int $stripePrice;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'plan_features', type: Types::TEXT)]
    private string $planFeatures;
    
    /**
     * @var DateTimeInterface
     */
    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $createdAt;
    
    /**
     * @var bool
     */
    #[ORM\Column(name: 'is_active', type: Types::BOOLEAN, nullable: true)]
    private bool $isActive;
    
    /**
     * @var bool
     */
    #[ORM\Column(name: 'is_stripe_use', type: Types::BOOLEAN, nullable: true)]
    private bool $isStripeUse;
    
    /**
     * @var int
     */
    #[ORM\Column(name: 'ordering', type: Types::INTEGER)]
    private int $ordering;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'stripe_price_id', type: Types::STRING, length: 45)]
    private string $stripePriceId;
    
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
    public function getPlanName(): string
    {
        return $this->planName;
    }
    
    /**
     * @param string $planName
     * @return SubscriptionPlan
     */
    public function setPlanName(string $planName): SubscriptionPlan
    {
        $this->planName = $planName;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getStripeInterval(): string
    {
        return $this->stripeInterval;
    }
    
    /**
     * @param string $stripeInterval
     * @return SubscriptionPlan
     */
    public function setStripeInterval(string $stripeInterval): SubscriptionPlan
    {
        $this->stripeInterval = $stripeInterval;
        return $this;
    }
    
    /**
     * @return float
     */
    public function getPrice(): float
    {
        return $this->price;
    }
    
    /**
     * @param float $price
     * @return SubscriptionPlan
     */
    public function setPrice(float $price): SubscriptionPlan
    {
        $this->price = $price;
        return $this;
    }
    
    /**
     * @return int
     */
    public function getStripePrice(): int
    {
        return $this->stripePrice;
    }

    /**
     * @param int $stripePrice
     * @return SubscriptionPlan
     */
    public function setStripePrice(int $stripePrice): SubscriptionPlan
    {
        $this->stripePrice = $stripePrice;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getPlanFeatures(): string
    {
        return $this->planFeatures;
    }
    
    /**
     * @param string $planFeatures
     * @return SubscriptionPlan
     */
    public function setPlanFeatures(string $planFeatures): SubscriptionPlan
    {
        $this->planFeatures = $planFeatures;
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
     * @return SubscriptionPlan
     */
    public function setCreatedAt(DateTimeInterface $createdAt): SubscriptionPlan
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
     * @return SubscriptionPlan
     */
    public function setIsActive(bool $isActive): SubscriptionPlan
    {
        $this->isActive = $isActive;
        return $this;
    }
    
    /**
     * @return bool
     */
    public function isStripeUse(): bool
    {
        return $this->isStripeUse;
    }
    
    /**
     * @param bool $isStripeUse
     * @return SubscriptionPlan
     */
    public function setIsStripeUse(bool $isStripeUse): SubscriptionPlan
    {
        $this->isStripeUse = $isStripeUse;
        return $this;
    }
    
    /**
     * @return int
     */
    public function getOrdering(): int
    {
        return $this->ordering;
    }
    
    /**
     * @param int $ordering
     * @return SubscriptionPlan
     */
    public function setOrdering(int $ordering): SubscriptionPlan
    {
        $this->ordering = $ordering;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getStripePriceId(): string
    {
        return $this->stripePriceId;
    }
    
    /**
     * @param string $stripePriceId
     * @return SubscriptionPlan
     */
    public function setStripePriceId(string $stripePriceId): SubscriptionPlan
    {
        $this->stripePriceId = $stripePriceId;
        return $this;
    }
    
}