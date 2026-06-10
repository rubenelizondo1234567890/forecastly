<?php

// src/Form/SubscriptionPlanType.php
namespace App\Form;

use App\Entity\SubscriptionPlan;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\DateTimeType;

class SubscriptionPlanType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('planName', TextType::class, [
                'label' => 'Plan Name',
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter plan name'
                ]
            ])
            ->add('isActive', CheckboxType::class, [
                'label' => 'Is Active?',
                'required' => false,
                'attr' => ['class' => 'form-check-input'],
                'label_attr' => ['class' => 'form-check-label']
            ])
            ->add('createdAt', DateTimeType::class, [
                'label' => 'Created At',
                'widget' => 'single_text',
                'attr' => ['class' => 'form-control'],
                'disabled' => true
            ]);
    }
    
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => SubscriptionPlan::class,
        ]);
    }
}