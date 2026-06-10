<?php

namespace App\Repository;

use App\Entity\AccountsTrackingCalendar;
use App\Entity\CustomersAccount;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AccountsTrackingCalendarRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AccountsTrackingCalendar::class);
    }

    /**
     * @return AccountsTrackingCalendar[]
     */
    public function findByCustomerAccountInDateRange(
        CustomersAccount $customerAccount,
        \DateTimeInterface $from,
        \DateTimeInterface $to,
    ): array {
        return $this->createQueryBuilder('atc')
            ->where('atc.customersAccount = :account')
            ->andWhere('atc.calendarDate BETWEEN :from AND :to')
            ->setParameter('account', $customerAccount)
            ->setParameter('from', $from->format('Y-m-d'))
            ->setParameter('to', $to->format('Y-m-d'))
            ->orderBy('atc.calendarDate', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
