<?php
// Copyright (c) 2026 Ruben Elizondo. All Rights Reserved. See LICENSE.

namespace App\Services\Contract;

use App\Entity\CustomersAccount;

interface ForecastingEngineInterface
{
    public function generateFutureProjections(CustomersAccount $customerAccount, int $monthsToProject = 12): void;
}
