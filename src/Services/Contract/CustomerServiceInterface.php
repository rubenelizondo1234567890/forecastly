<?php

namespace App\Services\Contract;

use App\Entity\Customer;

interface CustomerServiceInterface
{
    public function getDashboardChartsData(Customer $user): array;
}
