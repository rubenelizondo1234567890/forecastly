<?php

// src/Controller/SecurityController.php
namespace App\Controller;

use App\Form\AdminLoginType;
use App\Form\CustomerLoginType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

class SecurityController extends AbstractController
{
    #[Route('/admin/login', name: 'admin_login')]
    public function adminLogin(AuthenticationUtils $authenticationUtils): Response
    {
        if ($this->getUser()) {
            return $this->redirectToRoute('admin_dash');
        }

        $error = $authenticationUtils->getLastAuthenticationError();
        $lastUsername = $authenticationUtils->getLastUsername();

        // Create the login form
        $form = $this->createForm(AdminLoginType::class);

        return $this->render('security/admin_login.html.twig', [
            'last_username' => $lastUsername,
            'error' => $error,
            'loginForm' => $form->createView() // Pass the form to the template
        ]);
    }

    #[Route('/admin/logout', name: 'admin_logout')]
    public function adminLogout(): void
    {
        // Controller can be blank - it will be intercepted by the logout key on your firewall
    }

    #[Route('/customer/login', name: 'customer_login')]
    public function customerLogin(AuthenticationUtils $authenticationUtils, Request $request): Response
    {
        if ($this->getUser()) {
            return $this->redirectToRoute('customer_dash');
        }

        $error = $authenticationUtils->getLastAuthenticationError();
        $lastUsername = $authenticationUtils->getLastUsername();

        // Capture redirect_to parameter
        $redirectTo = $request->query->get('redirect_to');

        // Create the login form
        $form = $this->createForm(CustomerLoginType::class);

        return $this->render('security/customer_login.html.twig', [
            'last_username' => $lastUsername,
            'error' => $error,
            'loginForm' => $form->createView(),
            'redirect_to' => $redirectTo,
        ]);
    }

    #[Route('/customer/logout', name: 'customer_logout')]
    public function customerLogout(): void
    {
        // Controller can be blank - it will be intercepted by the logout key on your firewall
    }
}
