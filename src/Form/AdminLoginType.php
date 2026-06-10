<?php

// src/Form/AdminLoginType.php
namespace App\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class AdminLoginType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            // Use '_username' as the field name
            ->add('_username', TextType::class, [
                'label' => 'Username',
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter your username',
                    'autocomplete' => 'username'
                ]
            ])
            // Use '_password' as the field name
            ->add('_password', PasswordType::class, [
                'label' => 'Password',
                'attr' => [
                    'class' => 'form-control',
                    'placeholder' => 'Enter your password',
                    'autocomplete' => 'current-password'
                ]
            ])
            ->add('login', SubmitType::class, [ // Add submit button
                'label' => 'Sign In',
                'attr' => [
                    'class' => 'btn btn-primary w-100'
                ]
            ]);
    }
    
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'csrf_protection' => true,
            'csrf_field_name' => '_csrf_token',
            'csrf_token_id'   => 'authenticate',
        ]);
    }
    
    public function getBlockPrefix(): string
    {
        return ''; // This removes the form name prefix from field names
    }
}