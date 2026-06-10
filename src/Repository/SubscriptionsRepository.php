<?php

namespace App\Repository;

use App\Entity\Customer;
use App\Entity\Subscriptions;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Subscription>
 */
class SubscriptionsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Subscriptions::class);
    }
    
    public function findActiveSubscriptionByUser(Customer $user): ?Subscriptions
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.user = :user')
            ->andWhere('s.status IN (:activeStatuses)')
            ->setParameter('user', $user)
            ->setParameter('activeStatuses', ['active', 'trialing'])
            ->orderBy('s.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
    
    public function findByStripeSubscriptionId(string $stripeSubscriptionId): ?Subscriptions
    {
        return $this->findOneBy(['stripeSubscriptionId' => $stripeSubscriptionId]);
    }
}