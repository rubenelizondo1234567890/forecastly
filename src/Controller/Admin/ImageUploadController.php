<?php

namespace App\Controller\Admin;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/doc/images')]
#[IsGranted('ROLE_ADMIN')]
class ImageUploadController extends AbstractController
{
    #[Route('/upload', name: 'admin_doc_image_upload', methods: ['POST'])]
    public function uploadImage(Request $request, CsrfTokenManagerInterface $csrfTokenManager): JsonResponse
    {
        // Verify CSRF token
        $token = $request->headers->get('X-CSRF-Token');
        if (!$csrfTokenManager->isTokenValid(new CsrfToken('doc_image_upload', $token))) {
            return new JsonResponse([
                'error' => [
                    'message' => 'Invalid CSRF token'
                ]
            ], 403);
        }
        
        $image = $request->files->get('upload');
        
        if (!$image) {
            return new JsonResponse([
                'error' => [
                    'message' => 'No image uploaded'
                ]
            ], 400);
        }
        
        // Validate image
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($image->getMimeType(), $allowedMimeTypes)) {
            return new JsonResponse([
                'error' => [
                    'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
                ]
            ], 400);
        }
        
        // Generate a unique filename
        $originalFilename = pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME);
        $newFilename = $originalFilename.'-'.uniqid().'.'.$image->guessExtension();
        
        // Move the file to the public uploads directory
        try {
            $image->move(
                $this->getParameter('kernel.project_dir').'/public/uploads/doc_images',
                $newFilename
            );
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => [
                    'message' => 'Could not upload file: '.$e->getMessage()
                ]
            ], 500);
        }
        
        // Return the image location for CKEditor's SimpleUploadAdapter
        return new JsonResponse([
            'url' => '/uploads/doc_images/'.$newFilename
        ]);
    }
}