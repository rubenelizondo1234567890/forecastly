<?php

namespace App\Repository;

use App\Entity\Account;
use App\Entity\CustomersAccount;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AccountRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Account::class);
    }

    /**
     * @return array<string, Account[]> keyed by account_type
     */
    public function findByCustomerAccountGroupedByType(CustomersAccount $customerAccount): array
    {
        $accounts = $this->createQueryBuilder('a')
            ->where('a.customerAccount = :account')
            ->setParameter('account', $customerAccount)
            ->orderBy('a.name', 'ASC')
            ->getQuery()
            ->getResult();

        $grouped = [];
        foreach ($accounts as $account) {
            $type = $account->getAccountType() ?? 'uncategorized';
            $grouped[$type][] = $account;
        }
        return $grouped;
    }

    /**
     * @return Account[]
     */
    public function findByTypeAndCustomerAccount(CustomersAccount $customerAccount, string $incomeOrExpense): array
    {
        return $this->createQueryBuilder('a')
            ->innerJoin('a.budgetTrackingGroup', 'b')
            ->where('b.isIncomeOrExpense = :type')
            ->andWhere('a.customerAccount = :account')
            ->setParameter('type', $incomeOrExpense)
            ->setParameter('account', $customerAccount)
            ->orderBy('a.name', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
