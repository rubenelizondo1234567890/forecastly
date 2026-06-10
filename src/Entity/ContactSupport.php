<?php
// src/Entity/ContactSupport.php

namespace App\Entity;

use App\Repository\ContactSupportRepository;
use DateTimeImmutable;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ContactSupportRepository::class)]
#[ORM\Table(name: 'contact_support')]
#[ORM\Index(columns: ['email', 'created_at'], name: 'idx_email_created_at')]
#[ORM\Index(columns: ['email'], name: 'idx_email')]
#[ORM\Index(columns: ['created_at'], name: 'idx_created_at')]
#[ORM\HasLifecycleCallbacks]
class ContactSupport
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private ?int $id = null;
    
    #[ORM\Column(name: 'full_name', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\NotBlank(message: 'Full name is required')]
    #[Assert\Length(
        min: 2,
        max: 50,
        minMessage: 'Full name must be at least {{ limit }} characters long',
        maxMessage: 'Full name cannot be longer than {{ limit }} characters'
    )]
    private ?string $fullName = null;
    
    #[ORM\Column(name: 'email', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\NotBlank(message: 'Email address is required')]
    #[Assert\Email(message: 'The email {{ value }} is not a valid email.')]
    #[Assert\Length(max: 50)]
    private ?string $email = null;
    
    #[ORM\Column(name: 'phone', type: Types::STRING, length: 20, nullable: true)]
    #[Assert\Length(max: 20)]
    private ?string $phone = null;
    
    #[ORM\Column(name: 'title', type: Types::STRING, length: 100, nullable: true)]
    #[Assert\NotBlank(message: 'Title is required')]
    #[Assert\Length(
        min: 5,
        max: 100,
        minMessage: 'Title must be at least {{ limit }} characters long',
        maxMessage: 'Title cannot be longer than {{ limit }} characters'
    )]
    private ?string $title = null;
    
    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    #[Assert\NotBlank(message: 'Description is required')]
    #[Assert\Length(
        min: 150,
        minMessage: 'Description must be at least {{ limit }} characters long'
    )]
    private ?string $description = null;
    
    #[ORM\Column(name: 'already_customer', type: Types::BOOLEAN, nullable: false)]
    private bool $alreadyCustomer = false;
    
    #[ORM\Column(name: 'authorize_contact', type: Types::BOOLEAN, nullable: false)]
    #[Assert\IsTrue(message: 'You must authorize us to contact you')]
    private bool $authorizeContact = false;
    
    #[ORM\Column(name: 'created_at', type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?DateTimeImmutable $createdAt = null;
    
    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
    }
    
    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new DateTimeImmutable();
    }
    
    /**
     * @return int|null
     */
    public function getId(): ?int
    {
        return $this->id;
    }
    
    /**
     * @param int|null $id
     * @return ContactSupport
     */
    public function setId(?int $id): ContactSupport
    {
        $this->id = $id;
        return $this;
    }
    
    /**
     * @return string|null
     */
    public function getFullName(): ?string
    {
        return $this->fullName;
    }
    
    /**
     * @param string|null $fullName
     * @return ContactSupport
     */
    public function setFullName(?string $fullName): ContactSupport
    {
        $this->fullName = $fullName;
        return $this;
    }
    
    /**
     * @return string|null
     */
    public function getEmail(): ?string
    {
        return $this->email;
    }
    
    /**
     * @param string|null $email
     * @return ContactSupport
     */
    public function setEmail(?string $email): ContactSupport
    {
        $this->email = $email;
        return $this;
    }
    
    /**
     * @return string|null
     */
    public function getPhone(): ?string
    {
        return $this->phone;
    }
    
    /**
     * @param string|null $phone
     * @return ContactSupport
     */
    public function setPhone(?string $phone): ContactSupport
    {
        $this->phone = $phone;
        return $this;
    }
    
    /**
     * @return string|null
     */
    public function getTitle(): ?string
    {
        return $this->title;
    }
    
    /**
     * @param string|null $title
     * @return ContactSupport
     */
    public function setTitle(?string $title): ContactSupport
    {
        $this->title = $title;
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
     * @return ContactSupport
     */
    public function setDescription(?string $description): ContactSupport
    {
        $this->description = $description;
        return $this;
    }
    
    /**
     * @return bool
     */
    public function isAlreadyCustomer(): bool
    {
        return $this->alreadyCustomer;
    }
    
    /**
     * @param bool $alreadyCustomer
     * @return ContactSupport
     */
    public function setAlreadyCustomer(bool $alreadyCustomer): ContactSupport
    {
        $this->alreadyCustomer = $alreadyCustomer;
        return $this;
    }
    
    /**
     * @return bool
     */
    public function isAuthorizeContact(): bool
    {
        return $this->authorizeContact;
    }
    
    /**
     * @param bool $authorizeContact
     * @return ContactSupport
     */
    public function setAuthorizeContact(bool $authorizeContact): ContactSupport
    {
        $this->authorizeContact = $authorizeContact;
        return $this;
    }
    
    /**
     * @return DateTimeImmutable|null
     */
    public function getCreatedAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }
    
    /**
     * @param DateTimeImmutable|null $createdAt
     * @return ContactSupport
     */
    public function setCreatedAt(?DateTimeImmutable $createdAt): ContactSupport
    {
        $this->createdAt = $createdAt;
        return $this;
    }
    
    
}