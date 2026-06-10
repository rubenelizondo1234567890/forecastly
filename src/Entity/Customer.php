<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity]
#[ORM\Table(name: 'customers')]
class Customer implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private int $id;

    #[ORM\Column(name: 'username', type: Types::STRING, length: 45, unique: true)]
    private string $username;

    #[ORM\Column(name: 'password', type: Types::STRING, length: 255)]
    private string $password;

    #[ORM\Column(name: 'first_name', type: Types::STRING, length: 255)]
    private string $firstName;

    #[ORM\Column(name: 'last_name', type: Types::STRING, length: 255)]
    private string $lastName;

    #[ORM\Column(name: 'email', type: Types::STRING, length: 255, unique: true)]
    private string $email;

    #[ORM\Column(name: 'phone_number', type: Types::STRING, length: 255, nullable: true)]
    private string $phoneNumber;

    #[ORM\Column(name: 'is_active', type: Types::BOOLEAN)]
    private bool $isActive = false;

    #[ORM\Column(name: 'is_confirmed', type: Types::BOOLEAN)]
    private bool $isConfirmed = false;

    #[ORM\Column(name: 'is_main', type: Types::BOOLEAN)]
    private bool $isMain = false;//If true, this is the customer for that customer Account responsible for the Subscription management

    #[ORM\Column(name: 'avatar_image', type: Types::STRING, length: 255, nullable: true)]
    private ?string $avatarImage = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?DateTimeInterface $updatedAt = null;

    #[ORM\Column(name: 'password_reset_token', type: Types::STRING, length: 45, nullable: true)]
    private ?string $passwordResetToken = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $createdAt;

    #[ORM\Column(name: 'roles', type: Types::JSON, length: 255)]
    private array $roles = [];

    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customers_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customersAccount;

    #[ORM\OneToMany(targetEntity: CustomerQuizzes::class, mappedBy: 'customer')]
    private Collection $customerQuizzes;

    public function getId(): int
    {
        return $this->id;
    }

    public function getUsername(): string
    {
        return $this->username;
    }

    /**
     * @param string $username
     * @return Customer
     */
    public function setUsername(string $username): Customer
    {
        $this->username = $username;
        return $this;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    /**
     * @param string $password
     * @return Customer
     */
    public function setPassword(string $password): Customer
    {
        $this->password = $password;
        return $this;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    /**
     * @param string $firstName
     * @return Customer
     */
    public function setFirstName(string $firstName): Customer
    {
        $this->firstName = $firstName;
        return $this;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    /**
     * @param string $lastName
     * @return Customer
     */
    public function setLastName(string $lastName): Customer
    {
        $this->lastName = $lastName;
        return $this;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    /**
     * @param string $email
     * @return Customer
     */
    public function setEmail(string $email): Customer
    {
        $this->email = $email;
        return $this;
    }

    public function getPhoneNumber(): string
    {
        return $this->phoneNumber;
    }

    /**
     * @param string $phoneNumber
     * @return Customer
     */
    public function setPhoneNumber(string $phoneNumber): Customer
    {
        $this->phoneNumber = $phoneNumber;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    /**
     * @param bool $isActive
     * @return Customer
     */
    public function setIsActive(bool $isActive): Customer
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function isConfirmed(): bool
    {
        return $this->isConfirmed;
    }

    /**
     * @param bool $isConfirmed
     * @return Customer
     */
    public function setIsConfirmed(bool $isConfirmed): Customer
    {
        $this->isConfirmed = $isConfirmed;
        return $this;
    }

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

    public function isMain(): bool
    {
        return $this->isMain;
    }

    /**
     * @param bool $isMain
     * @return Customer
     */
    public function setIsMain(bool $isMain): Customer
    {
        $this->isMain = $isMain;
        return $this;
    }

    public function getAvatarImage(): ?string
    {
        return $this->avatarImage;
    }

    /**
     * @param string|null $avatarImage
     * @return Customer
     */
    public function setAvatarImage(?string $avatarImage): Customer
    {
        $this->avatarImage = $avatarImage;
        return $this;
    }

    public function getUpdatedAt(): ?DateTimeInterface
    {
        return $this->updatedAt;
    }

    /**
     * @param DateTimeInterface|null $updatedAt
     * @return Customer
     */
    public function setUpdatedAt(?DateTimeInterface $updatedAt): Customer
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getCreatedAt(): DateTimeInterface
    {
        return $this->createdAt;
    }

    /**
     * @param DateTimeInterface $createdAt
     * @return Customer
     */
    public function setCreatedAt(DateTimeInterface $createdAt): Customer
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_CUSTOMER';
        return array_unique($roles);
    }

    /**
     * @param array $roles
     * @return Customer
     */
    public function setRoles(array $roles): Customer
    {
        $this->roles = $roles;
        return $this;
    }

    public function getCustomersAccount(): CustomersAccount
    {
        return $this->customersAccount;
    }

    /**
     * @param CustomersAccount $customersAccount
     * @return Customer
     */
    public function setCustomersAccount(CustomersAccount $customersAccount): Customer
    {
        $this->customersAccount = $customersAccount;
        return $this;
    }

    public function getCustomerQuizzes(): Collection
    {
        return $this->customerQuizzes;
    }

    public function addCustomerQuiz(CustomerQuizzes $customerQuiz): Customer
    {
        if (!$this->customerQuizzes->contains($customerQuiz)) {
            $this->customerQuizzes->add($customerQuiz);
            $customerQuiz->setCustomer($this);
        }
        return $this;
    }

    public function removeCustomerQuiz(CustomerQuizzes $customerQuiz): Customer
    {
        if ($this->customerQuizzes->removeElement($customerQuiz)) {
            // set the owning side to null (unless already changed)
            if ($customerQuiz->getCustomer() === $this) {
                $customerQuiz->setCustomer(null);
            }
        }
        return $this;
    }

    public function eraseCredentials(): void
    {
        // Not needed when using plaintext password storage
    }

    public function getSalt(): ?string
    {
        // Not needed when using modern hashing algorithms
        return null;
    }

    public function getUserIdentifier(): string
    {
        return $this->username;
    }

}
