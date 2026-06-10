<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

final class RecurringExpenseForecastStrategy implements ForecastStrategyInterface
{
    public function applies(Account $account): bool
    {
        return $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'expense';
    }

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money
    {
        $total = new Money(0);
        $dayOfMonth = (int) $date->format('j');

        foreach ($context->recurringExpenses as $expense) {
            if ($expense->getAccount()->getId() !== $account->getId()) {
                continue;
            }
            if ($expense->getRecurringDay() === $dayOfMonth) {
                $total = $total->add(Money::fromFloat((float) $expense->getAmount()));
            }
        }

        return $total;
    }
}
