<?php
// Copyright (c) 2026 Ruben Elizondo. All Rights Reserved. See LICENSE.

namespace App\Services\Forecasting\Strategy;

use App\DTO\ProjectionContext;
use App\Entity\Account;
use App\ValueObject\Money;

interface ForecastStrategyInterface
{
    public function applies(Account $account): bool;

    public function project(Account $account, ProjectionContext $context, \DateTimeImmutable $date): Money;
}
