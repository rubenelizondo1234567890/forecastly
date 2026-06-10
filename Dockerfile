# Stage 1: Composer dependencies
FROM composer:2 AS deps
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-scripts \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# Stage 2: Node assets
FROM node:20-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json* webpack.config.js ./
RUN npm ci
COPY assets/ assets/
COPY --from=deps /app/vendor/symfony/ux-twig-component ./vendor/symfony/ux-twig-component
RUN npm run build

# Stage 3: PHP-FPM application
FROM php:8.4-fpm-alpine AS app

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN install-php-extensions \
    pdo_pgsql \
    zip \
    intl \
    opcache \
    redis

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /var/www/html

COPY --from=deps /app/vendor ./vendor
COPY --from=assets /app/public/build ./public/build
COPY . .

RUN mkdir -p var && chown -R www-data:www-data var/

EXPOSE 9000
