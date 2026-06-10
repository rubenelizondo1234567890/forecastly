<?php

namespace App\Entity;

use App\Repository\AccountsTrackingCalendarRepository;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AccountsTrackingCalendarRepository::class)]
#[ORM\Table(name: 'accounts_tracking_calendar')]
#[ORM\UniqueConstraint(name: 'UQ_IDX_CALENDAR_DATE', columns: ['customers_account_id', 'calendar_date'])]
class AccountsTrackingCalendar
{
    /**
     * @var int
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private int $id;

    /**
     * @var DateTimeInterface
     */
    #[ORM\Column(name: 'calendar_date', type: Types::DATETIME_MUTABLE, nullable: false)]
    private DateTimeInterface $calendarDate;

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'payments_account_to_pay', type: Types::TEXT, nullable: true)]
    private ?string $paymentsAccountToPay;//Json encoded string with an array of entries that corresponds to revolvingPayments Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'payments_account_to_withdraw', type: Types::TEXT, nullable: true)]
    private ?string $paymentsAccountToWithdraw;//Json encoded string with an array of entries that corresponds to revolvingPayments Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'savings_account_to_save', type: Types::TEXT, nullable: true)]
    private ?string $savingsAccountToSave;//Json encoded string with an array of entries that corresponds to recurringSavings Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'savings_account_to_withdraw', type: Types::TEXT, nullable: true)]
    private ?string $savingsAccountToWithdraw;//Json encoded string with an array of entries that corresponds to recurringSavings Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'recurring_savings_interest', type: Types::TEXT, nullable: true)]
    private ?string $recurringSavingsInterest;//Json encoded string with an array of entries that corresponds to recurringSavingsInterests Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'recurring_incomes', type: Types::TEXT, nullable: true)]
    private ?string $recurringIncomes;//Json encoded string with an array of entries that corresponds to recurringIncomes Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'recurring_income_interest', type: Types::TEXT, nullable: true)]
    private ?string $recurringIncomeInterest;//Json encoded string with an array of entries that corresponds to recurringIncomeInterests Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'non_recurring_incomes', type: Types::TEXT, nullable: true)]
    private ?string $nonRecurringIncomes;//Json encoded string with an array of entries that corresponds to nonRecurringIncomes, Entity name, Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'recurring_expenses', type: Types::TEXT, nullable: true)]
    private ?string $recurringExpenses;//Json encoded string with an array of entries that corresponds to recurringExpenses, Entity name and Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'recurring_expense_interest', type: Types::TEXT, nullable: true)]
    private ?string $recurringExpenseInterest;//Json encoded string with an array of entries that corresponds to recurringExpenseInterests Pk Id, Account Id and Amount

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'non_recurring_expenses', type: Types::TEXT, nullable: true)]
    private ?string $nonRecurringExpenses;//Json encoded string with an array of entries that corresponds to nonRecurringExpenses, Entity name and Pk Id, Account Id and Amount

    /**
     * @var string
     * Json encoded string with an array of entries that corresponds to Accounts
     * which BudgetTrackingCroup::isIncomeOrExpense = 'income', Entity name, Pk Id and
     * calculated current Balance that is the Balance of previous day plus/minus all amounts for this date's entries depending if the entry is an 'income' or an 'expense'
     */
    #[ORM\Column(name: 'accounts_balances', type: Types::TEXT, nullable: false)]
    private string $accountsBalances;

    /**
     * @var string|null
     */
    #[ORM\Column(name: 'metadata', type: Types::TEXT, nullable: true)]
    private ?string $metadata;//Json encoded string with an array of entries that corresponds to account balances Pk Id, and metadata like 'balance going to negative'

    /**
     * @var CustomersAccount
     */
    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customers_account_id', referencedColumnName: 'id')]
    private CustomersAccount $customersAccount;

    /**
     * @return int
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * @return DateTimeInterface
     */
    public function getCalendarDate(): DateTimeInterface
    {
        return $this->calendarDate;
    }

    /**
     * @param DateTimeInterface $calendarDate
     * @return AccountsTrackingCalendar
     */
    public function setCalendarDate(DateTimeInterface $calendarDate): AccountsTrackingCalendar
    {
        $this->calendarDate = $calendarDate;
        return $this;
    }

    /**
     * @return array
     */
    public function getPaymentsAccountToPay(): array
    {
        return json_decode($this->paymentsAccountToPay, true) ?? [];
    }

    /**
     * @param array $paymentsAccountToPay
     * @return AccountsTrackingCalendar
     */
    public function setPaymentsAccountToPay(array $paymentsAccountToPay): AccountsTrackingCalendar
    {
        $this->paymentsAccountToPay = json_encode($paymentsAccountToPay);
        return $this;
    }

    /**
     * @return array
     */
    public function getPaymentsAccountToWithdraw(): array
    {
        return json_decode($this->paymentsAccountToWithdraw, true) ?? [];
    }

    /**
     * @param array $paymentsAccountToWithdraw
     * @return AccountsTrackingCalendar
     */
    public function setPaymentsAccountToWithdraw(array $paymentsAccountToWithdraw): AccountsTrackingCalendar
    {
        $this->paymentsAccountToWithdraw = json_encode($paymentsAccountToWithdraw);
        return $this;
    }

    /**
     * @return array
     */
    public function getSavingsAccountToSave(): array
    {
        return json_decode($this->savingsAccountToSave, true) ?? [];
    }

    /**
     * @param string|null $savingsAccountToSave
     * @return AccountsTrackingCalendar
     */
    public function setSavingsAccountToSave(array $savingsAccountToSave): AccountsTrackingCalendar
    {
        $this->savingsAccountToSave = json_encode($savingsAccountToSave);
        return $this;
    }

    /**
     * @return array
     */
    public function getSavingsAccountToWithdraw(): array
    {
        return json_decode($this->savingsAccountToWithdraw, true) ?? [];
    }

    /**
     * @param string|null $savingsAccountToWithdraw
     * @return AccountsTrackingCalendar
     */
    public function setSavingsAccountToWithdraw(array $savingsAccountToWithdraw): AccountsTrackingCalendar
    {
        $this->savingsAccountToWithdraw = json_encode($savingsAccountToWithdraw);
        return $this;
    }

    /**
     * @return array
     */
    public function getRecurringIncomes(): array
    {
        return json_decode($this->recurringIncomes, true) ?? [];
    }

    /**
     * @param array $recurringIncomes
     * @return AccountsTrackingCalendar
     */
    public function setRecurringIncomes(array $recurringIncomes): AccountsTrackingCalendar
    {
        $this->recurringIncomes = json_encode($recurringIncomes);
        return $this;
    }

    /**
     * @return array
     */
    public function getNonRecurringIncomes(): array
    {
        return json_decode($this->nonRecurringIncomes, true) ?? [];
    }

    /**
     * @param array $nonRecurringIncomes
     * @return AccountsTrackingCalendar
     */
    public function setNonRecurringIncomes(array $nonRecurringIncomes): AccountsTrackingCalendar
    {
        $this->nonRecurringIncomes = json_encode($nonRecurringIncomes);
        return $this;
    }

    /**
     * @return array
     */
    public function getRecurringExpenses(): array
    {
        return json_decode($this->recurringExpenses, true) ?? [];
    }

    /**
     * @param array $recurringExpenses
     * @return AccountsTrackingCalendar
     */
    public function setRecurringExpenses(array $recurringExpenses): AccountsTrackingCalendar
    {
        $this->recurringExpenses = json_encode($recurringExpenses);
        return $this;
    }

    /**
     * @return array
     */
    public function getNonRecurringExpenses(): array
    {
        return json_decode($this->nonRecurringExpenses, true) ?? [];
    }

    /**
     * @param array $nonRecurringExpenses
     * @return AccountsTrackingCalendar
     */
    public function setNonRecurringExpenses(array $nonRecurringExpenses): AccountsTrackingCalendar
    {
        $this->nonRecurringExpenses = json_encode($nonRecurringExpenses);
        return $this;
    }

    /**
     * @return array
     */
    public function getRecurringIncomeInterest(): array
    {
        return json_decode($this->recurringIncomeInterest, true) ?? [];
    }

    /**
     * @param array $recurringIncomeInterest
     * @return $this
     */
    public function setRecurringIncomeInterest(array $recurringIncomeInterest): AccountsTrackingCalendar
    {
        $this->recurringIncomeInterest = json_encode($recurringIncomeInterest);
        return $this;
    }

    /**
     * @return array
     */
    public function getRecurringExpenseInterest(): array
    {
        return json_decode($this->recurringExpenseInterest, true) ?? [];
    }

    /**
     * @param array $recurringExpenseInterest
     * @return $this
     */
    public function setRecurringExpenseInterest(array $recurringExpenseInterest): AccountsTrackingCalendar
    {
        $this->recurringExpenseInterest = json_encode($recurringExpenseInterest);
        return $this;
    }

    /**
     * @return array
     */
    public function getRecurringSavingsInterest(): array
    {
        return json_decode($this->recurringSavingsInterest, true) ?? [];
    }

    /**
     * @param array $recurringSavingsInterest
     * @return AccountsTrackingCalendar
     */
    public function setRecurringSavingsInterest(array $recurringSavingsInterest): AccountsTrackingCalendar
    {
        $this->recurringSavingsInterest = json_encode($recurringSavingsInterest);
        return $this;
    }

    /**
     * @return array
     */
    public function getAccountsBalances(): array
    {
        return json_decode($this->accountsBalances, true) ?? [];
    }

    /**
     * @param array $accountsBalances
     * @return AccountsTrackingCalendar
     */
    public function setAccountsBalances(array $accountsBalances): AccountsTrackingCalendar
    {
        $this->accountsBalances = json_encode($accountsBalances);
        return $this;
    }

    /**
     * @return string|null
     */
    public function getMetadata(): array
    {
        return json_decode($this->metadata, true) ?? [];
    }

    /**
     * @param array $metadata
     * @return AccountsTrackingCalendar
     */
    public function setMetadata(array $metadata): AccountsTrackingCalendar
    {
        $this->metadata = json_encode($metadata);
        return $this;
    }

    /**
     * @return CustomersAccount
     */
    public function getCustomersAccount(): CustomersAccount
    {
        return $this->customersAccount;
    }

    /**
     * @param CustomersAccount $customersAccount
     * @return AccountsTrackingCalendar
     */
    public function setCustomersAccount(CustomersAccount $customersAccount): AccountsTrackingCalendar
    {
        $this->customersAccount = $customersAccount;
        return $this;
    }

}
