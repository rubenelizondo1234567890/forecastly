<?php
// src/Repository/ContactSupportRepository.php

namespace App\Repository;

use App\Entity\ContactSupport;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ContactSupport>
 */
class ContactSupportRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContactSupport::class);
    }
    
    public function save(ContactSupport $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
    
    public function remove(ContactSupport $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}