<?php

// src/Controller/Customer/BudgetTrackingGroupController.php
namespace App\Controller\Customer;

use App\Entity\Account;
use App\Entity\BudgetTrackingGroup;
use App\Entity\Customer;
use App\Entity\CustomersAccount;
use App\Entity\MasterBudgetTrackingGroup;
use App\Form\BudgetTrackingGroupType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer/budget-tracking-groups', name: 'customer_budget_')]
#[IsGranted('ROLE_CUSTOMER')]
class BudgetTrackingGroupController extends AbstractController
{
    #[Route('/', name: 'index')]
    public function index(EntityManagerInterface $em): Response
    {
        $customerAccount = $this->getUser()->getCustomersAccount();
        $groups = $em->getRepository(BudgetTrackingGroup::class)
            ->findBy(['customerAccount' => $customerAccount]);
        
        // Check which groups are in use
        $accountRepository = $em->getRepository(Account::class);
        $groupsInUse = [];
        
        foreach ($groups as $group) {
            $accountsUsingGroup = $accountRepository->findBy(['budgetTrackingGroup' => $group, 'customerAccount' => $customerAccount]);
            $groupsInUse[$group->getId()] = count($accountsUsingGroup) > 0;
        }
        
        $group = new BudgetTrackingGroup();
        $form = $this->createForm(BudgetTrackingGroupType::class, $group);
        
        return $this->render('customer/budget_tracking_groups/index.html.twig', [
            'groups' => $groups,
            'groupsInUse' => $groupsInUse,
            'form' => $form->createView(),
            'group' => null
        ]);
    }
    
    #[Route('/new', name: 'new', methods: ['POST'])]
    public function new(Request $request, EntityManagerInterface $em): Response
    {
        $group = new BudgetTrackingGroup();
        $form = $this->createForm(BudgetTrackingGroupType::class, $group);
        $form->handleRequest($request);
        
        if ($form->isSubmitted() && $form->isValid()) {
            try {
                $group->setCustomerAccount($this->getUser()->getCustomersAccount());
                $em->persist($group);
                $em->flush();
                
                $this->addFlash('success', 'Group created successfully!');
            } catch (\Exception $e) {
                $this->addFlash('error', 'Error creating group: ' . $e->getMessage());
            }
        } else {
            foreach ($form->getErrors(true) as $error) {
                $this->addFlash('error', $error->getMessage());
            }
        }
        
        return $this->redirectToRoute('customer_budget_index');
    }
    
    #[Route('/edit/{id}', name: 'edit', methods: ['POST'])]
    public function edit(Request $request, BudgetTrackingGroup $group, EntityManagerInterface $em): Response
    {
        // Check if group belongs to current user
        if ($group->getCustomerAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            $this->addFlash('error', 'You cannot edit this group.');
            return $this->redirectToRoute('customer_budget_index');
        }
        
        // Check if the group is being used by any accounts
        $accountRepository = $em->getRepository(Account::class);
        $accountsUsingGroup = $accountRepository->findBy(['budgetTrackingGroup' => $group]);
        $isInUse = count($accountsUsingGroup) > 0;
        
        // If in use, check if the type is being changed
        if ($isInUse) {
            $submittedData = $request->request->all();
            $formName = 'budget_tracking_group';
            $submittedType = $submittedData[$formName]['isIncomeOrExpense'] ?? null;
            
            if ($submittedType && $submittedType !== $group->getIsIncomeOrExpense()) {
                $this->addFlash('error', 'Cannot change the type of a group that is in use by accounts.');
                return $this->redirectToRoute('customer_budget_index');
            }
        }
        
        $form = $this->createForm(BudgetTrackingGroupType::class, $group);
        $form->handleRequest($request);
        
        if ($form->isSubmitted() && $form->isValid()) {
            try {
                $em->flush();
                $this->addFlash('success', 'Group updated successfully!');
            } catch (\Exception $e) {
                $this->addFlash('error', 'Error updating group: ' . $e->getMessage());
            }
        } else {
            foreach ($form->getErrors(true) as $error) {
                $this->addFlash('error', $error->getMessage());
            }
        }
        
        return $this->redirectToRoute('customer_budget_index');
    }
    
    #[Route('/edit-form/{id}', name: 'edit_form', methods: ['GET'])]
    public function getEditForm(BudgetTrackingGroup $group, EntityManagerInterface $em): Response
    {
        // Check if group belongs to current user
        if ($group->getCustomerAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }
        
        // Check if the group is in use
        $accountRepository = $em->getRepository(Account::class);
        $accountsUsingGroup = $accountRepository->findBy(['budgetTrackingGroup' => $group]);
        $isInUse = count($accountsUsingGroup) > 0;
        
        $form = $this->createForm(BudgetTrackingGroupType::class, $group);
        
        return new JsonResponse([
            'form' => $this->renderView('customer/budget_tracking_groups/_form.html.twig', [
                'form' => $form->createView(),
                'group' => $group,
                'isInUse' => $isInUse
            ])
        ]);
    }
    
    #[Route('/delete/{id}', name: 'delete', methods: ['POST'])]
    public function delete(Request $request, BudgetTrackingGroup $group, EntityManagerInterface $em): mixed
    {
        // Check if group belongs to current user
        if ($group->getCustomerAccount()->getId() !== $this->getUser()->getCustomersAccount()->getId()) {
            return new JsonResponse([
                'success' => false,
                'message' => 'You cannot delete this group.'
            ], 403);
        }
        
        // Check if the group is being used by any accounts
        $accountRepository = $em->getRepository(Account::class);
        $accountsUsingGroup = $accountRepository->findBy(['budgetTrackingGroup' => $group]);
        
        if (count($accountsUsingGroup) > 0) {
            $message = 'Cannot delete this group because it is being used by ' . count($accountsUsingGroup) . ' account(s).';
            
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => $message
                ], 400);
            }
            
            $this->addFlash('error', $message);
            return $this->redirectToRoute('customer_budget_index');
        }
        
        try {
            $em->remove($group);
            $em->flush();
            
            // If it's an AJAX request, return JSON response
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => true,
                    'message' => 'Group deleted successfully!'
                ]);
            }
            
            // For regular form submissions
            $this->addFlash('success', 'Group deleted successfully!');
            return $this->redirectToRoute('customer_budget_index');
        } catch (\Exception $e) {
            // If it's an AJAX request, return JSON response
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Error deleting group: ' . $e->getMessage()
                ], 500);
            }
            
            // For regular form submissions
            $this->addFlash('error', 'Error deleting group: ' . $e->getMessage());
            return $this->redirectToRoute('customer_budget_index');
        }
    }
    
    #[Route('/load-master', name: 'load_master', methods: ['POST'])]
    public function loadMasterGroups(EntityManagerInterface $em): Response
    {
        $customerAccount = $this->getUser()->getCustomersAccount();
        
        // Check if master groups have already been loaded
        if ($customerAccount->isMasterBudgetTrackingGroupLoaded()) {
            $this->addFlash('error', 'Master groups can only be loaded once per account.');
            return $this->redirectToRoute('customer_budget_index');
        }
        
        try {
            $masterGroups = $em->getRepository(MasterBudgetTrackingGroup::class)->findAll();
            $count = 0;
            
            foreach ($masterGroups as $masterGroup) {
                // Check if group already exists for this customer
                $existingGroup = $em->getRepository(BudgetTrackingGroup::class)->findOneBy([
                    'name' => $masterGroup->getName(),
                    'customerAccount' => $customerAccount
                ]);
                
                if (!$existingGroup) {
                    $group = new BudgetTrackingGroup();
                    $group->setName($masterGroup->getName());
                    $group->setIsIncomeOrExpense($masterGroup->getIsIncomeOrExpense());
                    $group->setCustomerAccount($customerAccount);
                    
                    $em->persist($group);
                    $count++;
                }
            }
            
            // Set the flag to true after loading
            $customerAccount->setIsMasterBudgetTrackingGroupLoaded(true);
            $em->flush();
            
            $this->addFlash('success', "Loaded $count master groups successfully!");
        } catch (\Exception $e) {
            $this->addFlash('error', 'Error loading master groups: ' . $e->getMessage());
        }
        
        return $this->redirectToRoute('customer_budget_index');
    }
    
}