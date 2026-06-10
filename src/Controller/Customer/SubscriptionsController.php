<?php

namespace App\Controller\Customer;

use App\Entity\SubscriptionPlan;
use App\Entity\Subscriptions;
use App\Services\StripeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/subscriptions', name: 'subscriptions_')]
#[IsGranted('ROLE_USER')]
class SubscriptionsController extends AbstractController
{

}