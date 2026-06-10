<?php

namespace App\Exceptions;

use App\Constants\ErrorCodes;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Class CustomValidationException
 */
class CustomValidationException extends HttpException
{
    public const MESSAGE_PREFIX = 'LMS -- Precondition failed: ';

    /**
     * @param $message
     */
    public function __construct($message)
    {
        parent::__construct(ErrorCodes::HTTP_412, self::MESSAGE_PREFIX . $message);
    }

    /**
     * @return mixed
     */
    public function getApiException()
    {
        return $this;
    }
}
