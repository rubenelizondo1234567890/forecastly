<?php

namespace App\Form;

use App\Entity\CustomersAccount;
use App\Entity\SubscriptionPlan;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\DateTimeType;

class CustomersAccountType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('accountName', TextType::class, [
                'label' => 'Account Name',
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter account name'
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
            ])
            ->add('subscriptionPlan', EntityType::class, [
                'class' => SubscriptionPlan::class,
                'choice_label' => 'planName',
                'label' => 'Subscription Plan',
                'placeholder' => 'Select a subscription plan',
                'attr' => ['class' => 'form-select'],
                'required' => true
            ]);
    }
    
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => CustomersAccount::class,
        ]);
    }
}