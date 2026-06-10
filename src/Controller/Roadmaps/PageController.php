<?php

namespace App\Controller\Roadmaps;

use App\Entity\CustomerQuizzes;
use App\Entity\Page;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class PageController extends AbstractController
{
    #[Route('/roadmaps/{journey}/{slug}', name: 'app_page_show')]
    public function show(string $journey, string $slug, Request $request, EntityManagerInterface $em): Response
    {
        $page = $em->getRepository(Page::class)->findOneBy(['slug' => $slug, 'status' => true]);

        if (!$page) {
            throw $this->createNotFoundException('Page not found');
        }

        $customer = $this->getUser();
        $quiz = null;

        if ($customer) {
            $quiz = $em->getRepository(CustomerQuizzes::class)->findOneBy([
                'customer' => $customer,
                'page' => $page
            ]);

            // Handle retake request
            if ($request->query->get('retake') === '1' && $quiz) {
                $em->remove($quiz);
                $em->flush();
                // Redirect to same page without the retake parameter
                return $this->redirectToRoute('app_page_show', [
                    'journey' => $journey,
                    'slug' => $slug
                ]);
            }
        }

        return $this->render('roadmaps/' . $journey . '/' . $slug . '.html.twig', [
            'page' => $page,
            'journey' => $journey,
            'slug' => $slug,
            'quiz' => $quiz,              // pass the quiz entity (or null)
        ]);
    }
}
