<?php
// src/Entity/WaitList.php

namespace App\Entity;

use App\Repository\WaitListRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: WaitListRepository::class)]
#[ORM\Table(name: 'wait_list')]
#[ORM\HasLifecycleCallbacks]
class WaitList
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    
    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Please enter your full name')]
    #[Assert\Length(
        min: 2,
        max: 255,
        minMessage: 'Your name must be at least {{ limit }} characters long',
        maxMessage: 'Your name cannot be longer than {{ limit }} characters'
    )]
    private ?string $fullName = null;
    
    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Please enter your email address')]
    #[Assert\Email(message: 'Please enter a valid email address')]
    #[Assert\Length(max: 255)]
    private ?string $email = null;
    
    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Length(max: 20)]
    private ?string $phone = null;
    
    #[ORM\Column]
    private ?bool $notifyEarlyAccess = false;
    
    #[ORM\Column]
    private ?bool $notifyProductUpdates = false;
    
    #[ORM\Column]
    private ?DateTimeImmutable $createdAt = null;
    
    #[ORM\Column(nullable: true)]
    private ?DateTimeImmutable $updatedAt = null;
    
    #[ORM\Column]
    private ?bool $unsubscribed = false;
    
    #[ORM\Column(length: 255, unique: true, nullable: true)]
    private ?string $unsubscribeToken = null;
    
    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
    }
    
    public function getId(): ?int
    {
        return $this->id;
    }
    
    public function getFullName(): ?string
    {
        return $this->fullName;
    }
    
    public function setFullName(string $fullName): static
    {
        $this->fullName = $fullName;
        
        return $this;
    }
    
    public function getEmail(): ?string
    {
        return $this->email;
    }
    
    public function setEmail(string $email): static
    {
        $this->email = $email;
        
        return $this;
    }
    
    public function getPhone(): ?string
    {
        return $this->phone;
    }
    
    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;
        
        return $this;
    }
    
    public function isNotifyEarlyAccess(): ?bool
    {
        return $this->notifyEarlyAccess;
    }
    
    public function setNotifyEarlyAccess(bool $notifyEarlyAccess): static
    {
        $this->notifyEarlyAccess = $notifyEarlyAccess;
        
        return $this;
    }
    
    public function isNotifyProductUpdates(): ?bool
    {
        return $this->notifyProductUpdates;
    }
    
    public function setNotifyProductUpdates(bool $notifyProductUpdates): static
    {
        $this->notifyProductUpdates = $notifyProductUpdates;
        
        return $this;
    }
    
    public function getCreatedAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }
    
    public function setCreatedAt(DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        
        return $this;
    }
    
    public function getUpdatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }
    
    public function setUpdatedAt(?DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        
        return $this;
    }
    
    public function isUnsubscribed(): ?bool
    {
        return $this->unsubscribed;
    }
    
    public function setUnsubscribed(bool $unsubscribed): static
    {
        $this->unsubscribed = $unsubscribed;
        
        return $this;
    }
    
    public function getUnsubscribeToken(): ?string
    {
        return $this->unsubscribeToken;
    }
    
    public function setUnsubscribeToken(?string $unsubscribeToken): static
    {
        $this->unsubscribeToken = $unsubscribeToken;
        
        return $this;
    }
    
    
    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
    
    #[ORM\PrePersist]
    public function generateUnsubscribeToken(): void
    {
        if (null === $this->unsubscribeToken) {
            $this->unsubscribeToken = bin2hex(random_bytes(32));
        }
    }
}