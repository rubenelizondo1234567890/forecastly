<?php
// src/Form/ContactSupportType.php

namespace App\Form;

use App\Entity\ContactSupport;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\TelType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;

class ContactSupportType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('fullName', TextType::class, [
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter your full name',
                    'id' => 'full_name',
                ],
                'label' => 'Full Name *',
                'required' => true,
            ])
            ->add('email', EmailType::class, [
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter your email address',
                    'id' => 'email',
                ],
                'label' => 'Email Address *',
                'required' => true,
            ])
            ->add('phone', TelType::class, [
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter your phone number (optional)',
                    'id' => 'phone',
                ],
                'label' => 'Phone Number',
                'required' => false,
            ])
            ->add('title', TextType::class, [
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter a brief title for your inquiry',
                    'id' => 'title',
                ],
                'label' => 'Title *',
                'required' => true,
            ])
            ->add('description', TextareaType::class, [
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Please describe your issue or question in detail (minimum 150 characters)',
                    'rows' => 6,
                    'minlength' => 150,
                    'id' => 'description',
                ],
                'label' => 'Description *',
                'required' => true,
            ])
            ->add('alreadyCustomer', CheckboxType::class, [
                'attr' => [
                    'id' => 'already_customer',
                ],
                'label' => 'I am already a Forecastly Customer',
                'required' => false,
            ])
            ->add('authorizeContact', CheckboxType::class, [
                'attr' => [
                    'id' => 'authorize_contact',
                ],
                'label' => 'I authorize Forecastly Team to contact me regarding this inquiry *',
                'required' => true,
            ])
        ;
    }
    
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => ContactSupport::class,
        ]);
    }
}