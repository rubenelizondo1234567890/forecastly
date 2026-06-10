<?php

// src/Form/AccountType.php
namespace App\Form;

use App\Entity\Account;
use App\Entity\Asset;
use App\Entity\BudgetTrackingGroup;
use App\Repository\BudgetTrackingGroupRepository;
use DateTime;
use Doctrine\ORM\EntityRepository;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\NumberType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;

class AccountType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        if ($options['isIncomeOrExpense'] == 'income') {
            $label = 'Asset Name';
        } else {
            $label = 'Liability Name';
        }

        $projectedBalanceOptions = [
            'required' => false,
            'attr' => ['class' => 'form-control'],
            'label' => 'Projected Balance ($)'
        ];

        // Check if we're editing an existing account
        if ($builder->getData() && $builder->getData()->getId()) {
            $projectedBalanceOptions['attr']['readonly'] = 'readonly';
            $projectedBalanceOptions['attr']['class'] = 'form-control readonly-field';
        }

        $builder
            ->add('name', TextType::class, [
                'attr' => ['class' => 'form-control'],
                'label' => $label
            ])
            ->add('description', TextareaType::class, [
                'required' => false,
                'attr' => ['class' => 'form-control', 'rows' => 3],
                'label' => 'Description'
            ])
            ->add('projectedBalance', NumberType::class, array_merge($projectedBalanceOptions, [
                'attr' => array_merge(
                    $projectedBalanceOptions['attr'] ?? [],
                    ['min' => '0'] // Add minimum value constraint
                ),
            ]))
            ->add('realBalance', NumberType::class, [
                'required' => false,
                'attr' => [
                    'class' => 'form-control readonly-field',
                    'readonly' => true
                ],
                'label' => 'Actual Balance ($)',
                'empty_data' => '0.00' // Set default value
            ])
            ->add('lastReconciliationDate', DateType::class, [
                'widget' => 'single_text',
                'required' => false,
                'attr' => [
                    'class' => 'form-control readonly-field',
                    'readonly' => true
                ],
                'label' => 'Last Reconciliation Date',
                'html5' => false, // Disable HTML5 to use custom formatting
                'format' => 'MM-dd-yyyy', // Set the format for display
            ])
            ->add('accountType', ChoiceType::class, [
                'required' => true,
                'choices' => [
                    'No Interest Earned' => 'No Interest Earned',
                    'Credit Card - Revolving' => 'Credit Card - Revolving',
                    'Interest on outstanding bal. Loan' => 'Interest on outstanding bal. Loan',
                    'Interest on avg. bal. checking-savings' => 'Interest on avg. bal. checking-savings',
                ],
                'attr' => [
                    'class' => 'form-control'
                ],
                'label' => 'Account Type',
                'placeholder' => 'Select account type...',
            ])
            ->add('annualInterestRate', NumberType::class, [
                'required' => false,
                'attr' => ['class' => 'form-control'],
                'label' => 'Annual Interest Rate (%)'
            ])
            ->add('hasMaxLimit', CheckboxType::class, [
                'required' => false,
                'attr' => [
                    'class' => 'form-check-input',
                    'onchange' => 'toggleMaxLimit(this)'
                ],
                'label' => 'Enable Max Limit',
                'label_attr' => ['class' => 'form-check-label']
            ])
            ->add('maxLimit', NumberType::class, [
                'required' => false,
                'attr' => [
                    'class' => 'form-control max-limit-field',
                ],
                'label' => 'Max Limit ($)'
            ])
            ->add('budgetTrackingGroup', EntityType::class, [
                'class' => BudgetTrackingGroup::class,
                'choice_label' => 'name',
                'attr' => ['class' => 'form-select'],
                'label' => 'Budget Group',
                'query_builder' => function (BudgetTrackingGroupRepository|EntityRepository $er) use ($options) {
                    $qb = $er->createQueryBuilder('b');
                    $qb->where('b.customerAccount = :customerAccount')
                        ->andWhere('b.isIncomeOrExpense = :type')
                        ->setParameter('customerAccount', $options['customerAccount'])
                        ->setParameter('type', $options['isIncomeOrExpense']);
                    return $qb;
                },
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Account::class,
            'isIncomeOrExpense' => null,
            'customerAccount' => null,
            'validation_groups' => function (FormInterface $form) {
                $data = $form->getData();
                $groups = ['Default'];

                if ($data->getAccountType() !== null) {
                    $groups[] = 'account_type_interest';
                }

                // Add Create group for new accounts only
                if ($data->getId() === null) {
                    $groups[] = 'Create';
                }

                return $groups;
            },
        ]);
    }
}
