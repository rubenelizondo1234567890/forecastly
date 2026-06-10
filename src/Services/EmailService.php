<?php

namespace App\Services;

use App\Entity\ContactSupport;
use App\Entity\Customer;
use App\Entity\WaitList;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use App\Services\Contract\EmailServiceInterface;
use Twig\Environment;

class EmailService implements EmailServiceInterface
{
    const string MAILTRAP_API_KEY = 'e08136967ed8cdf32a94f2ba4ae746f2';
    private MailerInterface $mailer;
    private Environment $twig;
    private string $fromEmail;
    private string $projectDir;
    private string $fromName;
    private UrlGeneratorInterface $urlGenerator;
    
    public function __construct(MailerInterface $mailer, Environment $twig, ParameterBagInterface $params, UrlGeneratorInterface $urlGenerator)
    {
        $this->mailer = $mailer;
        $this->twig = $twig;
        $this->fromEmail = $params->get('from_email');
        $this->fromName = $params->get('from_name');
        $this->projectDir = $params->get('kernel.project_dir');
        $this->urlGenerator = $urlGenerator;
    }
    
    private function getLogoBase64(): string
    {
        try {
            $logoPath = $this->projectDir . '/public/template/img/forecastly_logo_64x64.png';
            if (file_exists($logoPath)) {
                $imageData = file_get_contents($logoPath);
                return base64_encode($imageData);
            }
        } catch (\Exception $e) {
            // Log error if needed
        }
        
        return '';
    }
    
    public function sendActivationEmail(Customer $customer): bool
    {
        try {
            $email = (new Email())
                ->from($this->fromEmail)
                ->to($customer->getEmail())
                ->subject('Activate Your Forecastly Account')
                ->html($this->twig->render('emails/activation.html.twig', [
                    'customer' => $customer,
                    'activationToken' => $customer->getPasswordResetToken()
                ]));
            
            $this->mailer->send($email);
            
            return true;
        } catch (\Exception $e) {
            dd($e);
            // Log error here if needed
            return false;
        }
    }
    
    public function sendContactSupportEmail(ContactSupport $contactSupport): bool
    {
        try {
            $email = (new Email())
                ->from(new Address($this->fromEmail, $this->fromName))
                ->to(new Address($contactSupport->getEmail(), $contactSupport->getFullName()))
                ->subject('You just contacted us.')
                ->html($this->twig->render('emails/contact_support_confirmation.html.twig', [
                    'contactSupport' => $contactSupport
                ]));
            
            $this->mailer->send($email);
            
            return true;
        } catch (\Exception $e) {
            // Log error here if needed
            return false;
        }
    }

    public function sendWaitListEmail(WaitList $waitListEntry, int $waitListPosition)
    {
        try {
            $unsubscribeUrl = $this->urlGenerator->generate('unsubscribe', [
                'token' => $waitListEntry->getUnsubscribeToken()
            ], UrlGeneratorInterface::ABSOLUTE_URL);

            $email = (new Email())
                ->from(new Address($this->fromEmail, $this->fromName))
                ->to(new Address($waitListEntry->getEmail(), $waitListEntry->getFullName()))
                ->subject('You just contacted us.')
                ->html($this->twig->render('emails/wait_list_confirmation.html.twig', [
                    'waitList' => $waitListEntry,
                    'waitlist_position' => $waitListPosition,
                    'unsubscribeUrl' => $unsubscribeUrl
                ]));

            $this->mailer->send($email);

            return true;
        } catch (\Exception $e) {
            // Log error here if needed
            return false;
        }
    }
    
}