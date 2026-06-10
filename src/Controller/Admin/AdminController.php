<?php

namespace App\Controller\Admin;

use App\Entity\Customer;
use App\Form\CustomerContactInfoType;
use App\Services\AdminService;
use App\Services\CustomerService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Random\RandomException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin')]
class AdminController extends AbstractController
{
    /**
     * @throws NotFoundExceptionInterface
     * @throws ContainerExceptionInterface
     */
    #[Route('/dashboard', name: 'admin_dash', methods: ['GET'])]
    public function customerDashboard(AdminService $adminService): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $token = $this->container->get('security.token_storage')->getToken();
        $user = $token->getUser();
        
        //implement required logic in the AdminService to pass to the dashboard
        
        return $this->render(
            'admin/dashboard/index.html.twig', []
        );
    }
    
}