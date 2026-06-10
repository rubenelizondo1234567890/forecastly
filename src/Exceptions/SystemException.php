<?php

namespace App\Exceptions;

use App\Constants\ErrorCodes;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Class SystemException
 */
class SystemException extends HttpException
{
    public const MESSAGE_PREFIX = 'LMS -- System Error: ';

    /**
     * @param $message
     */
    public function __construct($message)
    {
        parent::__construct(500, self::MESSAGE_PREFIX . $message);
    }

    /**
     * @return mixed
     */
    public function getApiException()
    {
        return $this;
    }
}
