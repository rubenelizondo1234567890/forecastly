<?php

namespace App\Listeners;

use App\Constants\AppConstants;
use App\Exceptions\SystemException;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;

/**
 * Class ApiExceptionListener
 */
class ApiExceptionListener
{
    /**
     * @var LoggerInterface
     */
    private $logger;

    /**
     * ApiExceptionListener constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }
    
    /**
     * @param ExceptionEvent $event
     */
    public function onKernelException(ExceptionEvent $event)
    {
        $e = $event->getThrowable();
        //$e = $event->getException();
    dd($e);
        //Get the environment
        switch (strtoupper(getenv('APP_ENV'))) {
            case 'LOCAL':
                $env = 'Forecastly LOCAL -- ';
                break;
            case 'DEV':
                $env = 'Forecastly QA -- ';
                break;
            case 'TEST':
                $env = 'Forecastly TEST -- ';
                break;
            case 'PROD':
                $env = 'Forecastly PROD -- ';
                break;
            default:
                $env = 'Forecastly -- ';
        }
    
        if (get_parent_class($e) != AppConstants::API_EXCEPTION_PARENT) {
            throw new SystemException($env . $e->getMessage());
        }
    
        $apiExceptionResponse = method_exists($e, 'getApiException') ? $e->getApiException() : $e;
    
        $responseArr = [
            $env . $apiExceptionResponse->getMessage(),
            $apiExceptionResponse->getStatusCode()
        ];
    
        $response = new JsonResponse($responseArr);
    
        if (AppConstants::LOG_API_RESPONSE) {
            $responseArr = [
                $env . $apiExceptionResponse->getMessage(),
                $apiExceptionResponse->getStatusCode()
            ];
        }
    
        $response->headers->set('Content-Type', 'application/json');
    
        $event->setResponse($response);
    }
}
