<?php

namespace App\Exceptions;

use App\Constants\ErrorCodes;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Class JsonEndpointException
 * A new class that will return a JsonResponse to the client when it's used.
 */
class JsonEndpointException extends HttpException
{
    public const MESSAGE_PREFIX = '';
    
    /**
     * @param $message
     */
    public function __construct($message, $statusCode = ErrorCodes::HTTP_400)
    {
        parent::__construct($statusCode, self::MESSAGE_PREFIX . $message);
    }

    /**
     * @return JsonEndpointException
     */
    public function getApiException(): self
    {
        return $this;
    }
}
