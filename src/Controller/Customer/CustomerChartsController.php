<?php

// src/Controller/ProspectController.php
namespace App\Controller\Customer;

use App\Entity\Customer;
use App\Entity\CustomersAccount;
use App\Form\ProspectAccountType;
use App\Form\ProspectCustomerType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

class CustomerChartsController extends AbstractController
{
    #[Route('/get-dashboard-income-breakdown', name: 'dashboard_income_breakdown')]
    public function dashboardIncomeBreakdown(): Response
    {
        dd('here');
        //return $this->render('prospect/landing.html.twig');
    }
}