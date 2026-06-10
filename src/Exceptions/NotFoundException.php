<?php

namespace App\Exceptions;

use App\Constants\ErrorCodes;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Class NotFoundException
 */
class NotFoundException extends HttpException
{
    public const MESSAGE_PREFIX = 'LMS -- Resource not found: ';

    /**
     * @param $message
     */
    public function __construct($message)
    {
        parent::__construct(ErrorCodes::HTTP_404, self::MESSAGE_PREFIX . $message);
    }

    /**
     * @return mixed
     */
    public function getApiException()
    {
        return $this;
    }
}
