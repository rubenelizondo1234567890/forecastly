<?php

namespace App\Services;

use Doctrine\ORM\EntityManagerInterface;

class AdminService
{
    private EntityManagerInterface $em;
    
    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }
    
}