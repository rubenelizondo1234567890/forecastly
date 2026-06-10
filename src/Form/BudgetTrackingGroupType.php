<?php

// src/Form/BudgetTrackingGroupType.php
namespace App\Form;

use App\Entity\BudgetTrackingGroup;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;

class BudgetTrackingGroupType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter group name'
                ],
                'label' => 'Group Name'
            ])
            ->add('isIncomeOrExpense', ChoiceType::class, [
                'choices' => [
                    'Income' => 'income',
                    'Expense' => 'expense',
                    'Asset' => 'asset'
                ],
                'attr' => ['class' => 'form-select'],
                'label' => 'Type'
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => BudgetTrackingGroup::class,
        ]);
    }
}
