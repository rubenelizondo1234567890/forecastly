<?php

namespace App\Entity;

use DateTime;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'recurring_interest')]
#[ORM\UniqueConstraint(name: 'unique_recurring_interest_per_account', columns: ['customer_account_id', 'account_id'])]
class RecurringInterest
{
    /**
     * @var int|null
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private ?int $id = null;

    /**
     * @var string
     */
    #[ORM\Column(name: 'name', type: Types::STRING, length: 45)]
    private string $name;

    /**
     * @var Account
     */
    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'account_id', referencedColumnName: 'id')]
    private Account $account;

    /**
     * @var CustomersAccount
     */
    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customer_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customerAccount;

    /**
     * @var Log
     */
    #[ORM\ManyToOne(targetEntity: Log::class)]
    #[ORM\JoinColumn(name: 'log_id', referencedColumnName: 'id')]
    private Log $log;

    public function __construct()
    {
        $this->startOn  = new DateTime('now');
    }
    /**
     * @return int|null
     */
    public function getId(): ?int
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
     * @return RecurringInterest
     */
    public function setName(string $name): RecurringInterest
    {
        $this->name = $name;
        return $this;
    }

    /**
     * @return Account
     */
    public function getAccount(): Account
    {
        return $this->account;
    }

    /**
     * @param Account $account
     * @return RecurringInterest
     */
    public function setAccount(Account $account): RecurringInterest
    {
        $this->account = $account;
        return $this;
    }

    /**
     * @return CustomersAccount
     */
    public function getCustomerAccount(): CustomersAccount
    {
        return $this->customerAccount;
    }

    /**
     * @param CustomersAccount $customerAccount
     * @return RecurringInterest
     */
    public function setCustomerAccount(CustomersAccount $customerAccount): RecurringInterest
    {
        $this->customerAccount = $customerAccount;
        return $this;
    }

    /**
     * @return Log
     */
    public function getLog(): Log
    {
        return $this->log;
    }

    /**
     * @param Log $log
     * @return RecurringInterest
     */
    public function setLog(Log $log): RecurringInterest
    {
        $this->log = $log;
        return $this;
    }

}
