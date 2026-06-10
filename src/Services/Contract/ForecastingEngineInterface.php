<?php

namespace App\Services\Contract;

use App\Entity\CustomersAccount;

interface ForecastingEngineInterface
{
    public function generateFutureProjections(CustomersAccount $customerAccount, int $monthsToProject = 12): void;
}
