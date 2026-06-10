<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

final class RecurringIncomeForecastStrategy implements ForecastStrategyInterface
{
    public function applies(Account $account): bool
    {
        return $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'income';
    }

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money
    {
        $total = new Money(0);
        $dayOfMonth = (int) $date->format('j');

        foreach ($context->recurringIncomes as $income) {
            if ($income->getAccount()->getId() !== $account->getId()) {
                continue;
            }
            if ($income->getRecurringDay() === $dayOfMonth) {
                $total = $total->add(Money::fromFloat((float) $income->getAmount()));
            }
        }

        return $total;
    }
}
