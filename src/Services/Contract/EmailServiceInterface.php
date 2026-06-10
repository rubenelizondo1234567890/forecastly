<?php

namespace App\Services\Contract;

use App\Entity\ContactSupport;
use App\Entity\Customer;
use App\Entity\WaitList;

interface EmailServiceInterface
{
    public function sendActivationEmail(Customer $customer): bool;

    public function sendContactSupportEmail(ContactSupport $contactSupport): bool;

    public function sendWaitListEmail(WaitList $waitListEntry, int $waitListPosition);
}
