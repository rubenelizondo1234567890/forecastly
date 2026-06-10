<?php

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

final class RevolvingInterestForecastStrategy implements ForecastStrategyInterface
{
    public function applies(Account $account): bool
    {
        return $account->isRevolvingAccount();
    }

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money
    {
        $currentBalance = Money::fromFloat((float) ($account->getProjectedBalance() ?? 0));

        if (!$currentBalance->isNegative()) {
            return new Money(0);
        }

        // Daily interest: APR / 365, applied to negative (debt) balance
        $dailyRate = (float) $account->getAnnualInterestRate() / 36500;
        $dailyInterestCents = (int) round(abs($currentBalance->getAmount()) * $dailyRate);

        return new Money(-$dailyInterestCents);
    }
}
