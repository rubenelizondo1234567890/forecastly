<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

final class RecurringSavingsForecastStrategy implements ForecastStrategyInterface
{
    public function applies(Account $account): bool
    {
        return $account->getBudgetTrackingGroup()->getIsIncomeOrExpense() === 'savings';
    }

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money
    {
        $total = new Money(0);
        $dayOfMonth = (int) $date->format('j');

        foreach ($context->recurringSavings as $saving) {
            if ($saving->getAccountToWithdraw()->getId() !== $account->getId()) {
                continue;
            }
            if ($saving->getDayOfMonthToMakeSaving() === $dayOfMonth) {
                $total = $total->add(Money::fromFloat((float) ($saving->getChosenAmount() ?? 0.0)));
            }
        }

        return $total;
    }
}
