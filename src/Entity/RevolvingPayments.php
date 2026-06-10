<?php

namespace App\Entity;

use DateTime;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'revolving_payments')]
class RevolvingPayments
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
    #[ORM\Column(name: 'payment_strategy', type: Types::STRING, length: 60)]
    private string $paymentStrategy = '';
    
    /**
     * @var float|null
     */
    #[ORM\Column(name: 'chosen_amount', type: Types::FLOAT, nullable: true)]
    private ?float $chosenAmount = null;
    /**
     * @var int|null
     */
    #[ORM\Column(name: 'day_of_month_to_make_payment', type: Types::INTEGER, nullable: true)]
    private ?int $dayOfMonthToMakePayment = null;//Day of the month will be restricted from 01 to 28
    
    /**
     * @var DateTimeInterface
     */
    #[ORM\Column(name: 'start_on', type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $startOn;
    
    /**
     * @var DateTimeInterface|null
     */
    #[ORM\Column(name: 'canceled_after', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?DateTimeInterface $canceledAfter;
    
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
    #[ORM\JoinColumn(name: 'account_to_pay_id', referencedColumnName: 'id')]
    private Account $accountToPay;
    
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
    public function setName(string $name): RevolvingPayments
    {
        $this->name = $name;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getPaymentStrategy(): string
    {
        return $this->paymentStrategy;
    }
    
    /**
     * @param string $paymentStrategy
     * @return RevolvingPayments
     */
    public function setPaymentStrategy(string $paymentStrategy): RevolvingPayments
    {
        $this->paymentStrategy = $paymentStrategy;
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
     * @return RevolvingPayments
     */
    public function setChosenAmount(?float $chosenAmount): RevolvingPayments
    {
        $this->chosenAmount = $chosenAmount;
        return $this;
    }
    
    /**
     * @return int|null
     */
    public function getDayOfMonthToMakePayment(): ?int
    {
        return $this->dayOfMonthToMakePayment;
    }
    
    /**
     * @param int|null $dayOfMonthToMakePayment
     * @return RevolvingPayments
     */
    public function setDayOfMonthToMakePayment(?int $dayOfMonthToMakePayment): RevolvingPayments
    {
        $this->dayOfMonthToMakePayment = $dayOfMonthToMakePayment;
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
     * @return RevolvingPayments
     */
    public function setStartOn(DateTimeInterface $startOn): RevolvingPayments
    {
        $this->startOn = $startOn;
        return $this;
    }
    
    /**
     * @return DateTimeInterface|null
     */
    public function getCanceledAfter(): ?DateTimeInterface
    {
        return $this->canceledAfter;
    }
    
    /**
     * @param DateTimeInterface|null $canceledAfter
     * @return RevolvingPayments
     */
    public function setCanceledAfter(?DateTimeInterface $canceledAfter): RevolvingPayments
    {
        $this->canceledAfter = $canceledAfter;
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
     * @return RevolvingPayments
     */
    public function setAccountToWithdraw(Account $accountToWithdraw): RevolvingPayments
    {
        $this->accountToWithdraw = $accountToWithdraw;
        return $this;
    }
    
    /**
     * @return Account
     */
    public function getAccountToPay(): Account
    {
        return $this->accountToPay;
    }
    
    /**
     * @param Account $accountToPay
     * @return RevolvingPayments
     */
    public function setAccountToPay(Account $accountToPay): RevolvingPayments
    {
        $this->accountToPay = $accountToPay;
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
    public function setCustomerAccount(CustomersAccount $customerAccount): RevolvingPayments
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
    public function setLog(?Log $log): RevolvingPayments
    {
        $this->log = $log;
        return $this;
    }
    
}