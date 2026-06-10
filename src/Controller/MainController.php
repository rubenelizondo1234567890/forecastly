<?php
// src/Controller/MainController.php

namespace App\Controller;

use App\Entity\ContactSupport;
use App\Entity\WaitList;
use App\Form\ContactSupportType;
use App\Form\WaitListType;
use App\Repository\WaitListRepository;
use App\Services\EmailService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Annotation\Route;

class MainController extends AbstractController
{
    #[Route('/', name: 'main_index')]
    public function index(): Response
    {
        return $this->render('main/main_index.html.twig', []);
    }
    
    #[Route('/contact-support', name: 'main_contact_support')]
    public function contactSupport(Request $request, EntityManagerInterface $entityManager, EmailServiceInterface $emailService): Response
    {
        $contactSupport = new ContactSupport();
        $form = $this->createForm(ContactSupportType::class, $contactSupport);
        
        $form->handleRequest($request);
        
        if ($form->isSubmitted() && $form->isValid()) {
            // The entity will automatically set createdAt via PrePersist
            $entityManager->persist($contactSupport);
            $entityManager->flush();
            
            $ok = $emailService->sendContactSupportEmail($contactSupport);
            
            // Add success flash message
            $this->addFlash('success', 'Thank you for contacting us! An Email has been sent to this address for confirmation. We will get back to you within 24 hours during business days.');
            
            // Redirect to prevent form resubmission
            return $this->redirectToRoute('main_contact_support');
        } elseif ($form->isSubmitted() && !$form->isValid()) {
            // Add error flash message
            $this->addFlash('error', 'Please correct the errors in the form below.');
        }
        
        return $this->render('main/contact_support.html.twig', [
            'form' => $form->createView(),
        ]);
    }
    
    #[Route('/privacy-policy', name: 'privacy_policy')]
    public function privacyPolicy(): Response
    {
        //...
        return $this->render('main/privacy_policy.html.twig', []);
    }
    
    #[Route('/terms-of-service', name: 'terms_of_service')]
    public function termsOfService(): Response
    {
        //...
        return $this->render('main/terms_of_service.html.twig', []);
    }
    
    #[Route('/unsubscribe/{token}', name: 'unsubscribe')]
    public function unsubscribe(string $token, EntityManagerInterface $entityManager, WaitListRepository $waitListRepository): Response
    {
        $waitListEntry = $waitListRepository->findByUnsubscribeToken($token);
        
        if (!$waitListEntry) {
            // Log this for debugging
            // $this->logger->error('Unsubscribe token not found: ' . $token);
            $this->addFlash('error', 'Invalid unsubscribe link or entry not found.');
            return $this->redirectToRoute('main_index');
        }
        
        if ($waitListEntry->isUnsubscribed()) {
            $this->addFlash('warning', 'You have already unsubscribed from our waitlist communications.');
            return $this->redirectToRoute('main_index');
        }
        
        // Unsubscribe the user
        $waitListEntry->setUnsubscribed(true);
        $waitListEntry->setNotifyEarlyAccess(false);
        $waitListEntry->setNotifyProductUpdates(false);
        
        $entityManager->flush();
        
        return $this->render('main/unsubscribe.html.twig', [
            'email' => $waitListEntry->getEmail(),
            'name' => $waitListEntry->getFullName(),
        ]);
    }
    
    #[Route('/waitlist', name: 'waitlist')]
    public function waitlist(Request $request, EntityManagerInterface $entityManager, WaitListRepository $waitListRepository, EmailServiceInterface $emailService): Response
    {
        $waitListEntry = new WaitList();
        $waitListEntry->setNotifyEarlyAccess(true);
        $waitListEntry->setNotifyProductUpdates(true);
        $form = $this->createForm(WaitListType::class, $waitListEntry);
        
        $form->handleRequest($request);
        
        if ($form->isSubmitted() && $form->isValid()) {
            // Check if email already exists in waitlist
            $existingEntry = $waitListRepository->countByEmail($waitListEntry->getEmail());
            
            if ($existingEntry > 0) {
                $this->addFlash('warning', 'You\'re already on our waitlist! We\'ll notify you when we launch.');
            } else {
                // Get position in waitlist
                $position = $waitListRepository->getTotalWaitlistCount() + 1;
                // Save to database
                $entityManager->persist($waitListEntry);
                $entityManager->flush();
                
                $ok = $emailService->sendWaitListEmail($waitListEntry, $position);
                
                $this->addFlash('success', sprintf(
                    'Welcome to the Forecastly waitlist! You\'re position #%d. We\'ll notify you when we launch.',
                    $position
                ));
            }
            
            // Redirect to prevent form resubmission
            return $this->redirectToRoute('waitlist_success');
        } elseif ($form->isSubmitted() && !$form->isValid()) {
            dd('not here');
            $this->addFlash('error', 'Please correct the errors in the form below.');
        }
        
        return $this->render('main/waitlist.html.twig', [
            'form' => $form->createView(),
            'waitlist_count' => $waitListRepository->getTotalWaitlistCount() + 50,
        ]);
    }
    
    #[Route('/waitlist/success', name: 'waitlist_success')]
    public function waitlistSuccess(WaitListRepository $waitListRepository): Response
    {
        $totalCount = $waitListRepository->getTotalWaitlistCount();
        
        return $this->render('main/waitlist_success.html.twig', [
            'waitlist_count' => $totalCount,
        ]);
    }
}