<?php

// src/Form/ProspectAccountType.php
namespace App\Form;

use App\Entity\CustomersAccount;
use App\Entity\SubscriptionPlan;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;

class ProspectAccountType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('accountName', TextType::class, [
                'label' => 'Account Name',
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'e.g., Personal Account'
                ]
            ])
            ->add('subscriptionPlan', EntityType::class, [
                'class' => SubscriptionPlan::class,
                'choice_label' => 'planName',
                'label' => 'Choose Your Plan',
                'expanded' => true,
                'multiple' => false,
                'placeholder' => false,
            ])
            ->add('isActive', CheckboxType::class, [
                'label' => 'I agree to activate my account immediately',
                'required' => false,
                'data' => true,
                'attr' => ['class' => 'form-check-input'],
                'label_attr' => ['class' => 'form-check-label']
            ]);
    }
    
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => CustomersAccount::class,
        ]);
    }
}