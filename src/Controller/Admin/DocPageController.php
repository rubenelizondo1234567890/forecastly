<?php

namespace App\Controller\Admin;

use App\Entity\DocPage;
use App\Form\DocPageType;
use App\Repository\DocPageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/doc')]
#[IsGranted('ROLE_ADMIN')]
class DocPageController extends AbstractController
{
    #[Route('/', name: 'admin_doc_index', methods: ['GET'])]
    public function index(DocPageRepository $docPageRepository): Response
    {
        return $this->render('admin/doc_page/index.html.twig', [
            'doc_pages' => $docPageRepository->findAll(),
        ]);
    }
    
    #[Route('/new', name: 'admin_doc_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $docPage = new DocPage();
        $form = $this->createForm(DocPageType::class, $docPage);
        $form->handleRequest($request);
        
        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($docPage);
            $entityManager->flush();
            
            $this->addFlash('success', 'Documentation page created successfully.');
            
            return $this->redirectToRoute('admin_doc_index', [], Response::HTTP_SEE_OTHER);
        }
        
        return $this->render('admin/doc_page/new.html.twig', [
            'doc_page' => $docPage,
            'form' => $form,
        ]);
    }
    
    #[Route('/{id}', name: 'admin_doc_show', methods: ['GET'])]
    public function show(DocPage $docPage): Response
    {
        return $this->render('admin/doc_page/show.html.twig', [
            'doc_page' => $docPage,
        ]);
    }
    
    #[Route('/{id}/edit', name: 'admin_doc_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, DocPage $docPage, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(DocPageType::class, $docPage);
        $form->handleRequest($request);
        
        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();
            
            $this->addFlash('success', 'Documentation page updated successfully.');
            
            return $this->redirectToRoute('admin_doc_index', [], Response::HTTP_SEE_OTHER);
        }
        
        return $this->render('admin/doc_page/edit.html.twig', [
            'doc_page' => $docPage,
            'form' => $form,
        ]);
    }
    
    #[Route('/{id}', name: 'admin_doc_delete', methods: ['POST'])]
    public function delete(Request $request, DocPage $docPage, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$docPage->getId(), $request->request->get('_token'))) {
            $entityManager->remove($docPage);
            $entityManager->flush();
            
            $this->addFlash('success', 'Documentation page deleted successfully.');
        }
        
        return $this->redirectToRoute('admin_doc_index', [], Response::HTTP_SEE_OTHER);
    }
}