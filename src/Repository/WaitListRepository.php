<?php

namespace App\Repository;

use App\Entity\WaitList;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class WaitListRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WaitList::class);
    }
    
    public function countByEmail(string $email): int
    {
        return $this->createQueryBuilder('w')
            ->select('COUNT(w.id)')
            ->where('w.email = :email')
            ->andWhere('w.unsubscribed = false')
            ->setParameter('email', $email)
            ->getQuery()
            ->getSingleScalarResult();
    }
    
    public function getTotalWaitlistCount(): int
    {
        return $this->createQueryBuilder('w')
            ->select('COUNT(w.id)')
            ->where('w.unsubscribed = false')
            ->getQuery()
            ->getSingleScalarResult();
    }
    
    public function findByUnsubscribeToken(string $token): ?WaitList
    {
        return $this->createQueryBuilder('w')
            ->where('w.unsubscribeToken = :token')
            ->setParameter('token', $token)
            ->getQuery()
            ->getOneOrNullResult();
    }
}