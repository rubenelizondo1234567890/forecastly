<?php

// src/Command/CreateAdminUserCommand.php
namespace App\Command;

use App\Entity\AdminUser;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-admin-user',
    description: 'Creates a new admin user',
)]
class CreateAdminUserCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
    ) {
        parent::__construct();
    }
    
    protected function configure(): void
    {
        $this
            ->addArgument('username', InputArgument::REQUIRED, 'Username')
            ->addArgument('password', InputArgument::REQUIRED, 'Password')
            ->addArgument('first_name', InputArgument::REQUIRED, 'First Name')
            ->addArgument('last_name', InputArgument::REQUIRED, 'Last Name')
            ->addOption('role', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Roles to assign', ['ROLE_ADMIN'])
        ;
    }
    
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        
        $username = $input->getArgument('username');
        $password = $input->getArgument('password');
        $firstName = $input->getArgument('first_name');
        $lastName = $input->getArgument('last_name');
        $roles = $input->getOption('role');
        
        if (!$username) {
            $username = $io->ask('Enter username:');
        }
        
        if (!$password) {
            $question = new Question('Enter password:');
            $question->setHidden(true);
            $password = $io->askQuestion($question);
        }
        
        if (!$firstName) {
            $firstName = $io->ask('Enter first name:');
        }
        
        if (!$lastName) {
            $lastName = $io->ask('Enter last name:');
        }
        
        $displayName = $firstName.' '.$lastName;
        
        $user = new AdminUser();
        $user->setUsername($username);
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setDisplayName($displayName);
        $user->setCreatedAt(new \DateTime('now'));
        $user->setRoles($roles);
        
        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            $password
        );
        $user->setPassword($hashedPassword);
        
        $this->entityManager->persist($user);
        $this->entityManager->flush();
        
        $io->success(sprintf('Admin user %s was successfully created!', $username));
        
        return Command::SUCCESS;
    }
}