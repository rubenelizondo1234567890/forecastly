<?php
// src/Form/WaitListType.php

namespace App\Form;

use App\Entity\WaitList;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\IsTrue;

class WaitListType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('fullName', TextType::class, [
                'label' => 'Full Name',
                'attr' => [
                    'placeholder' => 'Enter your full name',
                    'class' => 'form-control',
                ],
                'row_attr' => [
                    'class' => 'form-group'
                ]
            ])
            ->add('email', EmailType::class, [
                'label' => 'Email Address',
                'attr' => [
                    'placeholder' => 'Enter your email address',
                    'class' => 'form-control',
                ],
                'row_attr' => [
                    'class' => 'form-group'
                ]
            ])
            ->add('phone', TextType::class, [
                'label' => 'Phone Number (Optional)',
                'required' => false,
                'attr' => [
                    'placeholder' => 'Enter your phone number (optional)',
                    'class' => 'form-control',
                ],
                'row_attr' => [
                    'class' => 'form-group'
                ]
            ])
            ->add('notifyEarlyAccess', CheckboxType::class, [
                'label' => 'Notify me when early access becomes available',
                'required' => false,
                'row_attr' => [
                    'class' => 'checkbox-item'
                ]
            ])
            ->add('notifyProductUpdates', CheckboxType::class, [
                'label' => 'Send me product updates and financial tips',
                'required' => false,
                'row_attr' => [
                    'class' => 'checkbox-item'
                ]
            ]);
    }
    
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => WaitList::class,
        ]);
    }
}