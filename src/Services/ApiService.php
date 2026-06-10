<?php

namespace App\Services;

use App\Api\Dtos as DTO;
use App\Api\Transformers\CreateUsersTransformer;
use App\Entity\Users;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class ApiService
{
    private EntityManagerInterface $em;
    private PiiCryptoService $piiCryptoService;
    private UserPasswordHasherInterface $passwordHasher;
    
    public function __construct(
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $em,
        PiiCryptoService $piiCryptoService
    )
    {
        $this->passwordHasher = $passwordHasher;
        $this->em = $em;
        $this->piiCryptoService = $piiCryptoService;
    }
    
    /**
     * @param DTO\Users $userDto
     * @return bool
     */
    public function userIsRegistered(DTO\Users $userDto): bool
    {
        $user = $this->em->getRepository(Users::class)->findOneBy(['email' => $this->piiCryptoService->hashData($userDto->email)]);
        if ($user) {
            return true;
        } else {
            return false;
        }
    }
    
    /**
     * @param DTO\Users $userDto
     * @return array|string[]
     */
    public function registerNewUser(DTO\Users $userDto): array
    {
        try {
            $createUsersTransformer = new CreateUsersTransformer($userDto, $this->passwordHasher );
            $user = $createUsersTransformer->transform();
            
            $this->em->persist($user);
            $this->em->flush();
        } catch (\Throwable $e) {
            return ['error' => $e->getMessage()];
        }
        
        return ['response' => 'User created'];
    }
    
    
}