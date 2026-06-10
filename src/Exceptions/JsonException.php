<?php

namespace App\Exceptions;

use App\Constants\ErrorCodes;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Class JsonException
 */
class JsonException extends HttpException
{
    public const MESSAGE_PREFIX = 'LMS -- Request error: ';

    /**
     * @param $message
     */
    public function __construct($message)
    {
        parent::__construct(ErrorCodes::HTTP_400, self::MESSAGE_PREFIX . $message);
    }

    /**
     * @return mixed
     */
    public function getApiException()
    {
        return $this;
    }
}
