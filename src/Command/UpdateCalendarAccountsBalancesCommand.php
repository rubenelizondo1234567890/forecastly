<?php

namespace App\Command;

use App\Entity\CustomersAccount;
use App\Services\AccountsService;
use Doctrine\DBAL\Exception;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:update-calendar-accounts-balances',
    description: 'Update calendar accounts balances for all customer accounts using raw MySQL'
)]
class UpdateCalendarAccountsBalancesCommand extends Command
{
    private EntityManagerInterface $em;
    private LoggerInterface $logger;
    private AccountsService $accountsService;
    
    public function __construct(EntityManagerInterface $em, LoggerInterface $logger, AccountsService $accountsService)
    {
        $this->em = $em;
        $this->logger = $logger;
        $this->accountsService = $accountsService;
        parent::__construct();
    }
    
    /**
     * @param InputInterface $input
     * @param OutputInterface $output
     * @return int
     * @throws Exception
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        //TODO: This cron must be implemented to scale horizontally in such way that one cron per one DB shard and all of these must be running in the master node
        dump('--- Process Started ---');
        $customerAccounts = $this->em->getRepository(CustomersAccount::class)->findAll();
        
        foreach ($customerAccounts as $customerAccount) {
            dump(' *** Customer Account: ' . $customerAccount->getAccountName() . ' *** ');
            if (!$customerAccount->isDataUpdatedSinceLastCron()) {
                dump('Skipping this Customer Acct. as no changes since last run.');
                continue;
            }
            try {
                $this->em->getConnection()->beginTransaction();
                $this->accountsService->updateCalendarAccountsBalances($customerAccount);
                //Set flag as false so to not process next run if no acct or trx updates
                $customerAccount->setIsDataUpdatedSinceLastCron(false);
                $this->em->flush();
                $this->em->getConnection()->commit();
                $output->writeln(sprintf('Processed customer account %d', $customerAccount->getId()));
            } catch (\Exception $e) {
                dd($e);
                $errorMessage = sprintf(
                    'Error processing customer account %d: %s',
                    $customerAccount->getId(),
                    $e->getMessage()
                );
                $this->logger->error($errorMessage);
                $output->writeln('<error>' . $errorMessage . '</error>');
                $this->em->getConnection()->rollBack();
                // Continue with next account
            }
        }
        
        return Command::SUCCESS;
    }
}