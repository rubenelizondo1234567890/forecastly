<?php

// src/Form/NonRecurringExpenseType.php
namespace App\Form;

use App\Entity\Account;
use App\Entity\NonRecurringExpense;
use App\Entity\BudgetTrackingGroup;
use App\Repository\AccountRepository;
use Doctrine\ORM\EntityRepository;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\NumberType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;

class NonRecurringExpenseType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'attr' => ['class' => 'form-control'],
                'label' => 'Expense Name'
            ])
            ->add('description', TextareaType::class, [
                'required' => false,
                'attr' => ['class' => 'form-control', 'rows' => 3],
                'label' => 'Description'
            ])
            ->add('amount', NumberType::class, [
                'attr' => ['class' => 'form-control'],
                'label' => 'Amount ($)'
            ])
            ->add('dateToApply', DateType::class, [
                'widget' => 'single_text',
                'required' => true,
                'attr' => ['class' => 'form-control'],
                'label' => 'Date to Apply'
            ])
            ->add('account', EntityType::class, [
                'class' => Account::class,
                'choice_label' => function (Account $account) { return $account->getName() . ' -- ' . $account->getBudgetTrackingGroup()->getIsIncomeOrExpense(); },
                'attr' => ['class' => 'form-select'],
                'label' => 'Account to substract this expense',
                'query_builder' => function (AccountRepository|EntityRepository $er) use ($options) {
                    return $er->createQueryBuilder('a')
                        ->innerJoin('a.budgetTrackingGroup', 'b')
                        ->andWhere('a.customerAccount = :customerAccount')
                        ->setParameter('customerAccount', $options['customerAccount'])
                        ->orderBy('b.isIncomeOrExpense', 'ASC');
                },
            ])
            ->add('budgetTrackingGroup', EntityType::class, [
                'class' => BudgetTrackingGroup::class,
                'choice_label' => 'name',
                'attr' => ['class' => 'form-select'],
                'label' => 'Budget Group',
                'query_builder' => function (AccountRepository|EntityRepository $er) use ($options) {
                    return $er->createQueryBuilder('b')
                        ->andWhere('b.isIncomeOrExpense = :isIncomeOrExpense')
                        ->setParameter('isIncomeOrExpense', 'expense');
                },
            ]);
    }
    
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => NonRecurringExpense::class,
            'customerAccount' => null,
            'isIncomeOrExpense' => null
        ]);
    }
}