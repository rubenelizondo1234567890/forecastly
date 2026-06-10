<?php

namespace App\Entity;

use DateTime;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'recurring_savings')]
class RecurringSavings
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
     * @var string
     */
    #[ORM\Column(name: 'savings_strategy', type: Types::STRING, length: 60)]
    private string $savingsStrategy = '';

    /**
     * @var float|null
     */
    #[ORM\Column(name: 'chosen_amount', type: Types::FLOAT, nullable: true)]
    private ?float $chosenAmount = null;
    /**
     * @var int|null
     */
    #[ORM\Column(name: 'day_of_month_to_make_saving', type: Types::INTEGER, nullable: true)]
    private ?int $dayOfMonthToMakeSaving = null;//Day of the month will be restricted from 01 to 28

    /**
     * @var DateTimeInterface
     */
    #[ORM\Column(name: 'start_on', type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $startOn;

    /**
     * @var Account
     */
    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'account_to_withdraw_id', referencedColumnName: 'id')]
    private Account $accountToWithdraw;

    /**
     * @var Account
     */
    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'account_to_save_id', referencedColumnName: 'id')]
    private Account $accountToSave;

    /**
     * @var CustomersAccount
     */
    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customer_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customerAccount;

    /**
     * @var Log|null
     */
    #[ORM\ManyToOne(targetEntity: Log::class)]
    #[ORM\JoinColumn(name: 'log_id', referencedColumnName: 'id', nullable: true)]
    private ?Log $log = null;

    public function __construct()
    {
        $this->startOn = new DateTime('now');
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
     * @return RevolvingPayments
     */
    public function setName(string $name): RecurringSavings
    {
        $this->name = $name;
        return $this;
    }

    /**
     * @return string
     */
    public function getSavingsStrategy(): string
    {
        return $this->savingsStrategy;
    }

    /**
     * @param string $savingsStrategy
     * @return RecurringSavings
     */
    public function setSavingsStrategy(string $savingsStrategy): RecurringSavings
    {
        $this->savingsStrategy = $savingsStrategy;
        return $this;
    }

    /**
     * @return float|null
     */
    public function getChosenAmount(): ?float
    {
        return $this->chosenAmount;
    }

    /**
     * @param float|null $chosenAmount
     * @return RecurringSavings
     */
    public function setChosenAmount(?float $chosenAmount): RecurringSavings
    {
        $this->chosenAmount = $chosenAmount;
        return $this;
    }

    /**
     * @return int|null
     */
    public function getDayOfMonthToMakeSaving(): ?int
    {
        return $this->dayOfMonthToMakeSaving;
    }

    /**
     * @param int|null $dayOfMonthToMakeSaving
     * @return RecurringSavings
     */
    public function setDayOfMonthToMakeSaving(?int $dayOfMonthToMakeSaving): RecurringSavings
    {
        $this->dayOfMonthToMakeSaving = $dayOfMonthToMakeSaving;
        return $this;
    }

    /**
     * @return DateTimeInterface
     */
    public function getStartOn(): DateTimeInterface
    {
        return $this->startOn;
    }

    /**
     * @param DateTimeInterface $startOn
     * @return RecurringSavings
     */
    public function setStartOn(DateTimeInterface $startOn): RecurringSavings
    {
        $this->startOn = $startOn;
        return $this;
    }

    /**
     * @return Account
     */
    public function getAccountToWithdraw(): Account
    {
        return $this->accountToWithdraw;
    }

    /**
     * @param Account $accountToWithdraw
     * @return RecurringSavings
     */
    public function setAccountToWithdraw(Account $accountToWithdraw): RecurringSavings
    {
        $this->accountToWithdraw = $accountToWithdraw;
        return $this;
    }

    /**
     * @return Account
     */
    public function getAccountToSave(): Account
    {
        return $this->accountToSave;
    }

    /**
     * @param Account $accountToSave
     * @return RecurringSavings
     */
    public function setAccountToSave(Account $accountToSave): RecurringSavings
    {
        $this->accountToSave = $accountToSave;
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
     * @return RevolvingPayments
     */
    public function setCustomerAccount(CustomersAccount $customerAccount): RecurringSavings
    {
        $this->customerAccount = $customerAccount;
        return $this;
    }

    /**
     * @return Log|null
     */
    public function getLog(): ?Log
    {
        return $this->log;
    }

    /**
     * @param Log|null $log
     * @return RevolvingPayments
     */
    public function setLog(?Log $log): RecurringSavings
    {
        $this->log = $log;
        return $this;
    }

}
