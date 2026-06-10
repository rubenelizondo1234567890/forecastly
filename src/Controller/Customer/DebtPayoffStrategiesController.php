<?php

namespace App\Controller\Customer;

use App\Entity\Account;
use App\Entity\AccountsTrackingCalendar;
use App\Entity\Log;
use App\Entity\NonRecurringExpense;
use App\Entity\NonRecurringIncome;
use App\Entity\NonRecurringIncomeExpensesInterface;
use App\Entity\RevolvingPayments;
use App\Form\AccountType;
use App\Form\RevolvingPaymentsType;
use App\Services\AccountsService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/debt-payoff-strategies', name: 'customer_debt_payoff_strategies_')]
#[IsGranted('ROLE_CUSTOMER')]
class DebtPayoffStrategiesController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        //Logic here to create view for Debt Payoff Strategies
        return $this->render('customer/interest/index.html.twig', []);
    }
}