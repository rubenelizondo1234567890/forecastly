<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity]
#[ORM\Table(name: 'admin_users')]
class AdminUser implements UserInterface, PasswordAuthenticatedUserInterface
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
    #[ORM\Column(name: 'username', type: Types::STRING, length: 255, unique: true)]
    private string $username;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'password', type: Types::STRING, length: 255)]
    private string $password;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'first_name', type: Types::STRING, length: 255)]
    private string $firstName;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'last_name', type: Types::STRING, length: 255)]
    private string $lastName;
    
    /**
     * @var bool
     */
    #[ORM\Column(name: 'is_active', type: Types::BOOLEAN)]
    private bool $isActive = false;
    
    /**
     * @var bool
     */
    #[ORM\Column(name: 'is_confirmed', type: Types::BOOLEAN)]
    private bool $isConfirmed = false;
    
    /**
     * @var string|null
     */
    #[ORM\Column(name: 'password_reset_token', type: Types::STRING, length: 45, nullable: true)]
    private ?string $passwordResetToken;
    
    /**
     * @var DateTimeInterface
     */
    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $createdAt;
    
    /**
     * @var array
     */
    #[ORM\Column(name: 'roles', type: Types::JSON, length: 255)]
    private array $roles = [];
    
    /**
     * @var string|null
     */
    #[ORM\Column(name: 'display_name', type: Types::STRING, length: 255, nullable: true)]
    private ?string $displayName;
    
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
    public function getPassword(): string
    {
        return $this->password;
    }
    
    /**
     * @param string $password
     * @return Customer
     */
    public function setPassword(string $password): AdminUser
    {
        $this->password = $password;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getFirstName(): string
    {
        return $this->firstName;
    }
    
    /**
     * @param string $firstName
     * @return Customer
     */
    public function setFirstName(string $firstName): AdminUser
    {
        $this->firstName = $firstName;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getLastName(): string
    {
        return $this->lastName;
    }
    
    /**
     * @param string $lastName
     * @return Customer
     */
    public function setLastName(string $lastName): AdminUser
    {
        $this->lastName = $lastName;
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
     * @return Customer
     */
    public function setIsActive(bool $isActive): AdminUser
    {
        $this->isActive = $isActive;
        return $this;
    }
    
    /**
     * @return bool
     */
    public function isConfirmed(): bool
    {
        return $this->isConfirmed;
    }
    
    /**
     * @param bool $isConfirmed
     * @return Customer
     */
    public function setIsConfirmed(bool $isConfirmed): AdminUser
    {
        $this->isConfirmed = $isConfirmed;
        return $this;
    }
    
    /**
     * @return string|null
     */
    public function getPasswordResetToken(): ?string
    {
        return $this->passwordResetToken;
    }
    
    /**
     * @param string|null $passwordResetToken
     * @return Customer
     */
    public function setPasswordResetToken(?string $passwordResetToken): Customer
    {
        $this->passwordResetToken = $passwordResetToken;
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
     * @return Customer
     */
    public function setCreatedAt(DateTimeInterface $createdAt): AdminUser
    {
        $this->createdAt = $createdAt;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getUsername(): string
    {
        return $this->username;
    }
    
    /**
     * @param string $username
     * @return AdminUser
     */
    public function setUsername(string $username): AdminUser
    {
        $this->username = $username;
        return $this;
    }
    
    /**
     * @return array
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_ADMIN';
        return array_unique($roles);
    }
    
    /**
     * @param array $roles
     * @return AdminUser
     */
    public function setRoles(array $roles): AdminUser
    {
        $this->roles = $roles;
        return $this;
    }
    
    /**
     * @return string|null
     */
    public function getDisplayName(): ?string
    {
        return $this->displayName;
    }
    
    /**
     * @param string|null $displayName
     * @return AdminUser
     */
    public function setDisplayName(?string $displayName): AdminUser
    {
        $this->displayName = $displayName;
        return $this;
    }
    
    /**
     * @return void
     */
    public function eraseCredentials(): void
    {
        // Not needed when using plaintext password storage
    }
    
    /**
     * @return string|null
     */
    public function getSalt(): ?string
    {
        // Not needed when using modern hashing algorithms
        return null;
    }
    
    /**
     * @return string
     */
    public function getUserIdentifier(): string
    {
        return $this->username;
    }
}