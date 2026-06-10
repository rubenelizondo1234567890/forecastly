<?php

namespace App\Exceptions;

use App\Constants\ErrorCodes;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Class ForbiddenAccessException
 */
class ForbiddenAccessException extends HttpException
{
    public const MESSAGE_PREFIX = '';

    /**
     * @param $message
     */
    public function __construct($message)
    {
        parent::__construct(ErrorCodes::HTTP_403, self::MESSAGE_PREFIX . $message);
    }

    /**
     * @return mixed
     */
    public function getApiException()
    {
        return $this;
    }
}
