<?php

namespace App\Controller\Customer;

use App\Entity\Customer;
use App\Entity\CustomerQuizzes;
use App\Entity\Page;
use App\Form\CustomerContactInfoType;
use App\Services\CustomerService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Random\RandomException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/customer')]
class CustomerController extends AbstractController
{
    /**
     * @throws NotFoundExceptionInterface
     * @throws ContainerExceptionInterface
     * @throws RandomException
     */
    #[Route('/dashboard', name: 'customer_dash', methods: ['GET'])]
    public function customerDashboard(CustomerService $customerService): Response
    {
        $this->denyAccessUnlessGranted('ROLE_CUSTOMER');
        $token = $this->container->get('security.token_storage')->getToken();
        $user = $token->getUser();
        //dd($user);
        //Get Charts data
        $chartsData = $customerService->getDashboardChartsData($user);
        //dd($chartsData);
        return $this->render(
            'customer/dashboard/index.html.twig',
            [
                'incomes' => $chartsData['incomes'], 'totalIncomes' => $chartsData['totalIncomes'],
                'expenses' => $chartsData['expenses'], 'totalExpenses' => $chartsData['totalExpenses'],
                'netWorth' => $chartsData['netWorth'],
            ]
        );
    }

    #[Route('/contact-info', name: 'customer_contact_info', methods: ['GET', 'POST'])]
    public function contactInfo(Request $request, EntityManagerInterface $entityManager): Response
    {
        $customer = $this->getUser();
        if (!$customer instanceof Customer) {
            throw $this->createAccessDeniedException();
        }

        $form = $this->createForm(CustomerContactInfoType::class, $customer);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();
            $this->addFlash('success', 'Your contact information has been updated.');
            return $this->redirectToRoute('customer_dash');
        }

        return $this->render('customer/contact_info.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    #[Route('/quiz/submit', name: 'customer_quiz_submit', methods: ['POST'])]
    #[IsGranted('ROLE_CUSTOMER')]
    public function submitQuiz(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!$data || !isset($data['pageId']) || !isset($data['score'])) {
            return new JsonResponse(['success' => false, 'error' => 'Invalid data'], 400);
        }

        $page = $em->getRepository(Page::class)->find($data['pageId']);
        if (!$page) {
            return new JsonResponse(['success' => false, 'error' => 'Page not found'], 404);
        }

        $customer = $this->getUser();

        $quiz = $em->getRepository(CustomerQuizzes::class)->findOneBy(['customer' => $customer, 'page' => $page]);
        if ($quiz) {
            $quiz->setQuizzScore($data['score']);
            $quiz->setDateQuizzTaken(new DateTime());
        } else {
            // Create a new quiz record
            $quiz = new CustomerQuizzes();
            $quiz->setCustomer($customer);
            $quiz->setPage($page);
            $quiz->setQuizzScore($data['score']);
            $quiz->setDateQuizzTaken(new DateTime());

            $em->persist($quiz);
            $em->flush();
        }

        return new JsonResponse(['success' => true]);
    }

    #[Route('/education-progress', name: 'customer_education_progress', methods: ['GET'])]
    #[IsGranted('ROLE_CUSTOMER')]
    public function educationProgress(EntityManagerInterface $em): Response
    {
        $customer = $this->getUser();

        //Get Page Metadata
        $page = $em->getRepository(Page::class)->findOneBy(['slug' => 'education-progress']);

        $quizRepo = $em->getRepository(CustomerQuizzes::class);
        $quizzes = $quizRepo->createQueryBuilder('cq')
            ->select('cq, p, j')
            ->join('cq.page', 'p')
            ->join('p.journey', 'j')
            ->where('cq.customer = :customer')
            ->setParameter('customer', $customer)
            ->orderBy('j.name', 'ASC')
            ->addOrderBy('p.title', 'ASC')
            ->getQuery()
            ->getResult();

        // Group by journey
        $journeyMap = [];
        foreach ($quizzes as $quiz) {
            $journey = $quiz->getPage()->getJourney();
            if (!$journey) continue;

            $journeyId = $journey->getId();
            if (!isset($journeyMap[$journeyId])) {
                $journeyMap[$journeyId] = [
                    'journey' => $journey,
                    'quizzes' => [],
                    'totalScore' => 0,
                    'count' => 0,
                ];
            }
            $journeyMap[$journeyId]['quizzes'][] = [
                'page' => $quiz->getPage(),
                'score' => $quiz->getQuizzScore(),
                'date' => $quiz->getDateQuizzTaken(),
            ];
            $journeyMap[$journeyId]['totalScore'] += $quiz->getQuizzScore();
            $journeyMap[$journeyId]['count']++;
        }

        // Calculate averages and prepare final array
        $progressData = [];
        foreach ($journeyMap as $id => $data) {
            $data['average'] = $data['count'] > 0 ? round($data['totalScore'] / $data['count']) : 0;
            $progressData[] = $data;
        }

        return $this->render('customer/education_progress/index.html.twig', [
            'progressData' => $progressData,
            'page' => $page,
        ]);
    }

}
