<?php

namespace App\Constants;

final class AppConstants
{
    public const FORECASTLY_DOMAIN = 'https://forecastly.online';
    public const API_RESPONSE_TRANSFORMER_INTERFACE = 'App\ApiBundle\Dtos\ApiResponsesInterface';
    public const API_EXCEPTION_PARENT = 'Symfony\Component\HttpKernel\Exception\HttpException';
    public const API_EXCEPTION_ROUTE = 'App\ApiBundle\Exceptions';
    public const API_REQUEST_DTOS_ROUTE = '\Api\Dtos';
    public const APP_ROOT_FOR_BUNDLES = 'App\\';
    public const API_SERIALIZE_FORMAT = 'json';
    public const LOG_API_RESPONSE = false;

    public const INCOME_TYPE = 'income';
    public const EXPENSE_TYPE = 'expense';
    public const ASSET_TYPE = 'asset';
    public const INTERVAL_MAP = [
        2 => 'P7D',   // Weekly
        3 => 'P14D',  // Bi-weekly
        4 => 'P1M',   // Monthly
        5 => 'P3M',   // Quarterly
        6 => 'P6M',   // Semi-annually
        7 => 'P1Y'    // Annually
    ];
}
