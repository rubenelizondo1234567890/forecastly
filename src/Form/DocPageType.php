<?php

namespace App\Form;

use App\Entity\DocPage;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;

class DocPageType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('title', TextType::class, [
                'attr' => ['class' => 'form-control']
            ])
            ->add('slug', TextType::class, [
                'attr' => ['class' => 'form-control'],
                'help' => 'URL-friendly version of the title (lowercase, hyphens instead of spaces)'
            ])
            ->add('content', TextareaType::class, [
                'attr' => ['class' => 'tinymce form-control', 'rows' => 15], // Added form-control class
                'required' => false
            ]);
    }
    
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => DocPage::class,
        ]);
    }
}