<?php

namespace App\Entity;

use App\Repository\SubscriptionsRepository;
use DateTime;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SubscriptionsRepository::class)]
#[ORM\Table(name: 'subscriptions')]
class Subscriptions
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    
    #[ORM\OneToOne(targetEntity: CustomersAccount::class, inversedBy: 'subscription')]
    #[ORM\JoinColumn(nullable: false)]
    private ?CustomersAccount $customerAccount = null;
    
    #[ORM\Column(length: 255)]
    private ?string $stripeSubscriptionId = null;
    
    #[ORM\Column(length: 255)]
    private ?string $stripeCustomerId = null;
    
    #[ORM\Column(length: 255)]
    private ?string $stripePriceId = null;
    
    #[ORM\Column(length: 50)]
    private ?string $status = null;
    
    #[ORM\Column]
    private ?DateTime $currentPeriodStart = null;
    
    #[ORM\Column]
    private ?DateTime $currentPeriodEnd = null;
    
    #[ORM\Column]
    private ?DateTime $createdAt = null;
    
    #[ORM\Column]
    private ?DateTime $updatedAt = null;
    
    #[ORM\Column(nullable: true)]
    private ?DateTime $canceledAt = null;
    
    public function __construct()
    {
        $this->createdAt = new DateTime();
        $this->updatedAt = new DateTime();
    }
    
    // Getters and Setters
    public function getId(): ?int
    {
        return $this->id;
    }
    
    /**
     * @return CustomersAccount|null
     */
    public function getCustomerAccount(): ?CustomersAccount
    {
        return $this->customerAccount;
    }
    
    /**
     * @param CustomersAccount|null $customerAccount
     * @return Subscriptions
     */
    public function setCustomerAccount(?CustomersAccount $customerAccount): self
    {
        $this->customerAccount = $customerAccount;
        return $this;
    }
    
    public function getStripeSubscriptionId(): ?string
    {
        return $this->stripeSubscriptionId;
    }
    
    public function setStripeSubscriptionId(string $stripeSubscriptionId): self
    {
        $this->stripeSubscriptionId = $stripeSubscriptionId;
        return $this;
    }
    
    public function getStripeCustomerId(): ?string
    {
        return $this->stripeCustomerId;
    }
    
    public function setStripeCustomerId(string $stripeCustomerId): self
    {
        $this->stripeCustomerId = $stripeCustomerId;
        return $this;
    }
    
    public function getStripePriceId(): ?string
    {
        return $this->stripePriceId;
    }
    
    public function setStripePriceId(string $stripePriceId): self
    {
        $this->stripePriceId = $stripePriceId;
        return $this;
    }
    
    public function getStatus(): ?string
    {
        return $this->status;
    }
    
    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }
    
    public function getCurrentPeriodStart(): ?DateTime
    {
        return $this->currentPeriodStart;
    }
    
    public function setCurrentPeriodStart(DateTime $currentPeriodStart): self
    {
        $this->currentPeriodStart = $currentPeriodStart;
        return $this;
    }
    
    public function getCurrentPeriodEnd(): ?DateTime
    {
        return $this->currentPeriodEnd;
    }
    
    public function setCurrentPeriodEnd(DateTime $currentPeriodEnd): self
    {
        $this->currentPeriodEnd = $currentPeriodEnd;
        return $this;
    }
    
    public function getCreatedAt(): ?DateTime
    {
        return $this->createdAt;
    }
    
    public function getUpdatedAt(): ?DateTime
    {
        return $this->updatedAt;
    }
    
    public function setUpdatedAt(DateTime $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
    
    public function getCanceledAt(): ?DateTime
    {
        return $this->canceledAt;
    }
    
    public function setCanceledAt(?DateTime $canceledAt): self
    {
        $this->canceledAt = $canceledAt;
        return $this;
    }
    
    public function isActive(): bool
    {
        return in_array($this->status, ['active', 'trialing']);
    }
    
    public function isCanceled(): bool
    {
        return $this->canceledAt !== null;
    }
}