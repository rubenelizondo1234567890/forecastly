<?php

namespace App\Form;

use App\Entity\Account;
use App\Entity\RecurringSavings;
use App\Repository\AccountRepository;
use Doctrine\ORM\EntityRepository;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\NumberType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\OptionsResolver\OptionsResolver;

class RecurringSavingsType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'attr' => ['class' => 'form-control'],
                'label' => 'Savings Name'
            ])
            ->add('savingsStrategy', ChoiceType::class, [
                'required' => true,
                'choices' => [
                    'Min. Savings (2%)' => 'Min. Savings (2%)',
                    'Min. Savings (2%) + given % of projected balance' => 'Min. Savings (2%) + given % of projected balance',
                    'Fixed Amount' => 'Fixed Amount',
                ],
                'attr' => [
                    'class' => 'form-control payment-strategy-select'
                ],
                'label' => 'Savings Strategy',
                'placeholder' => 'Select strategy...',
            ])
            ->add('dayOfMonthToMakeSaving', ChoiceType::class, [
                'required' => true,
                'choices' => $this->getDayOfMonthChoices(),
                'attr' => ['class' => 'form-control'],
                'label' => 'Day of Month to Make Saving',
                'placeholder' => 'Select day of month...',
            ])
            ->add('chosenAmount', NumberType::class, [
                'required' => false,
                'attr' => [
                    'class' => 'form-control chosen-amount-field',
                    'style' => 'display: none;'
                ],
                'label' => false,
            ])
            ->add('startOn', DateType::class, [
                'widget' => 'single_text',
                'required' => false,
                'attr' => ['class' => 'form-control'],
                'label' => 'Start On Date (optional, defaults to today)'
            ])
            ->add('accountToSave', EntityType::class, [
                'class' => Account::class,
                'choice_label' => function (Account $account) {
                    return $account->getName() . ' -- ' . $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
                },
                'attr' => ['class' => 'form-select'],
                'label' => 'Account to apply monthly savings',
                'query_builder' => function (AccountRepository|EntityRepository $er) use ($options) {
                    return $er->createQueryBuilder('a')
                        ->innerJoin('a.budgetTrackingGroup', 'b')
                        ->andWhere('a.customerAccount = :customerAccount')
                        ->andWhere('b.isIncomeOrExpense = :assetType')
                        ->setParameter('customerAccount', $options['customerAccount'])
                        ->setParameter('assetType', 'asset');
                },
            ])
            ->add('accountToWithdraw', EntityType::class, [
                'class' => Account::class,
                'choice_label' => function (Account $account) {
                    return $account->getName() . ' -- ' . $account->getBudgetTrackingGroup()->getIsIncomeOrExpense();
                },
                'attr' => ['class' => 'form-select'],
                'label' => 'Account to Withdraw funds from',
                'query_builder' => function (AccountRepository|EntityRepository $er) use ($options) {
                    return $er->createQueryBuilder('a')
                        ->innerJoin('a.budgetTrackingGroup', 'b')
                        ->andWhere('a.customerAccount = :customerAccount')
                        ->andWhere('b.isIncomeOrExpense = :incomeType')
                        ->setParameter('customerAccount', $options['customerAccount'])
                        ->setParameter('incomeType', 'income');
                },
            ]);

        // Modify the chosenAmount field based on strategy after form is built
        $builder->addEventListener(FormEvents::POST_SET_DATA, function (FormEvent $event) {
            $form = $event->getForm();
            $data = $event->getData();

            $strategy = $data ? $data->getSavingsStrategy() : null;
            $this->updateChosenAmountField($form, $strategy);
        });

        // Handle strategy changes after form submission
        $builder->addEventListener(FormEvents::PRE_SUBMIT, function (FormEvent $event) {
            $data = $event->getData();
            $form = $event->getForm();

            $strategy = $data['savingsStrategy'] ?? null;
            $this->updateChosenAmountField($form, $strategy, true);
        });
    }

    private function updateChosenAmountField($form, ?string $strategy, bool $isPreSubmit = false)
    {
        $form->remove('chosenAmount');

        if ($strategy === 'Min. Savings (2%) + given % of projected balance') {
            $form->add('chosenAmount', ChoiceType::class, [
                'required' => true,
                'choices' => [
                    '1%' => 1.0,
                    '2%' => 2.0,
                    '3%' => 3.0,
                    '4%' => 4.0,
                    '5%' => 5.0,
                    '10%' => 10.0,
                    '15%' => 15.0,
                    '20%' => 20.0,
                    '25%' => 25.0,
                    '50%' => 50.0,
                ],
                'attr' => ['class' => 'form-control chosen-amount-field'],
                'label' => 'Additional Percentage',
                'placeholder' => 'Select additional percentage...',
            ]);
        } elseif ($strategy === 'Fixed Amount') {
            $form->add('chosenAmount', NumberType::class, [
                'required' => true,
                'attr' => [
                    'class' => 'form-control chosen-amount-field',
                    'step' => '0.01',
                    'min' => '0.01',
                    'placeholder' => '0.00'
                ],
                'label' => 'Fixed Amount',
                'html5' => true,
            ]);
        } else {
            // For 'Min. Payment (2%)' or no strategy selected
            $form->add('chosenAmount', NumberType::class, [
                'required' => false,
                'attr' => [
                    'class' => 'chosen-amount-field',
                    'style' => 'display: none;'
                ],
                'label' => false,
            ]);
        }
    }

    private function getDayOfMonthChoices(): array
    {
        $choices = [];
        for ($i = 1; $i <= 28; $i++) {
            $choices[$i] = $i;
        }
        return $choices;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => RecurringSavings::class,
            'customerAccount' => null,
        ]);
    }
}
