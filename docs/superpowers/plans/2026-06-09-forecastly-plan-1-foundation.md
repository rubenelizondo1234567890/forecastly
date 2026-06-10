# Forecastly Portfolio Demo — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade to PHP 8.4 + Symfony 7.4, secure the environment, and produce a single-command Docker setup that runs the full stack in under 3 minutes.

**Architecture:** Multi-stage Dockerfile (deps → assets → app) produces a minimal PHP 8.4-FPM image. A single `docker-compose.yml` wires app, nginx, postgres, redis, mailpit, and messenger worker. A `Makefile` provides the `make demo` entry point recruiters will use.

**Tech Stack:** PHP 8.4-FPM Alpine, Symfony 7.4 LTS, PostgreSQL 16, Redis 7, Nginx Alpine, Mailpit, Composer 2, Node 20 + Webpack Encore.

**Prerequisite:** Plans 2–5 depend on this plan completing successfully.

---

## File Map

| Action | Path |
|---|---|
| Modify | `composer.json` |
| Modify | `.env` |
| Modify | `.gitignore` |
| Create | `.env.example` |
| Create | `Dockerfile` |
| Create | `nginx/default.conf` |
| Create | `docker-compose.yml` |
| Delete | `compose.yaml` |
| Delete | `compose.override.yaml` (if present) |
| Create | `Makefile` |
| Modify | `config/packages/cache.yaml` |

---

## Task 1: PHP 8.4 + Symfony 7.4 upgrade

**Files:**
- Modify: `composer.json`

- [ ] **Step 1: Update PHP and Symfony constraints in `composer.json`**

Replace the `require` block and the `extra.symfony.require` field:

```json
"require": {
    "php": "^8.4",
    "ext-ctype": "*",
    "ext-iconv": "*",
    "doctrine/dbal": "^4.3",
    "doctrine/doctrine-bundle": "^2.15",
    "doctrine/doctrine-migrations-bundle": "^3.4",
    "doctrine/orm": "^3.5",
    "jms/serializer-bundle": "^5.5",
    "lexik/jwt-authentication-bundle": "^3.1",
    "nyholm/psr7": "^1.8",
    "phpdocumentor/reflection-docblock": "^5.6",
    "phpstan/phpdoc-parser": "^2.2",
    "stripe/stripe-php": "^18.0",
    "symfony/asset": "7.4.*",
    "symfony/cache": "7.4.*",
    "symfony/console": "7.4.*",
    "symfony/dotenv": "7.4.*",
    "symfony/flex": "^2",
    "symfony/form": "7.4.*",
    "symfony/framework-bundle": "7.4.*",
    "symfony/http-client": "7.4.*",
    "symfony/mailer": "7.4.*",
    "symfony/messenger": "7.4.*",
    "symfony/mime": "7.4.*",
    "symfony/monolog-bundle": "^3.10",
    "symfony/property-access": "7.4.*",
    "symfony/property-info": "7.4.*",
    "symfony/rate-limiter": "*",
    "symfony/runtime": "7.4.*",
    "symfony/security-bundle": "7.4.*",
    "symfony/security-csrf": "7.4.*",
    "symfony/serializer": "7.4.*",
    "symfony/twig-bundle": "7.4.*",
    "symfony/ux-twig-component": "^2.30",
    "symfony/validator": "7.4.*",
    "symfony/web-link": "7.4.*",
    "symfony/webpack-encore-bundle": "^2.3",
    "symfony/yaml": "7.4.*",
    "twig/extra-bundle": "^3.21",
    "twig/intl-extra": "^3.21"
},
```

Update `require-dev` to add PHPStan and fixtures bundle:

```json
"require-dev": {
    "dama/doctrine-test-bundle": "^8.3",
    "doctrine/doctrine-fixtures-bundle": "^4.0",
    "friendsofphp/php-cs-fixer": "^3.86",
    "phpstan/extension-installer": "^1.4",
    "phpstan/phpstan": "^2.1",
    "phpstan/phpstan-doctrine": "^2.0",
    "phpstan/phpstan-symfony": "^2.0",
    "phpunit/php-code-coverage": "^12.3",
    "phpunit/phpunit": "^12.3",
    "rector/rector": "^2.1",
    "squizlabs/php_codesniffer": "^3.13",
    "symfony/browser-kit": "7.4.*",
    "symfony/css-selector": "7.4.*",
    "symfony/maker-bundle": "^1.64",
    "symfony/phpunit-bridge": "^7.4",
    "symfony/stopwatch": "7.4.*",
    "symfony/web-profiler-bundle": "7.4.*"
}
```

Update the `extra.symfony` block:

```json
"extra": {
    "symfony": {
        "allow-contrib": true,
        "require": "7.4.*",
        "docker": true
    }
}
```

- [ ] **Step 2: Run composer update**

```bash
composer update --no-scripts
```

Resolve any conflict messages. Common issues:
- `jms/serializer-bundle` may require a patch — check its changelog for Symfony 7.4 support
- If a package lacks 7.4 support, pin to the latest compatible version and note it

- [ ] **Step 3: Run deprecation check**

```bash
php bin/console debug:container --deprecations
php -d error_reporting=E_ALL bin/console cache:warmup 2>&1 | grep -i deprecat
```

Fix any deprecation notices. Typical Symfony 7.x deprecations:
- `AbstractController::json()` parameter order changes — check all controllers
- Service tags that changed format — check `config/services.yaml`

- [ ] **Step 4: Verify upgrade gate**

```bash
php -r "echo PHP_VERSION . PHP_EOL;"
# Expected: 8.4.x

composer show symfony/framework-bundle | grep "versions"
# Expected: versions : * 7.4.x

php bin/console cache:warmup
# Expected: [OK] Cache for the "dev" environment was successfully warmed up.

php bin/console doctrine:schema:validate
# Expected: [OK] The mapping files are correct. [OK] The database schema is in sync with the mapping files.
```

- [ ] **Step 5: Commit**

```bash
git add composer.json composer.lock
git commit -m "chore: upgrade to PHP 8.4 and Symfony 7.4 LTS"
```

---

## Task 2: .env security hygiene

**Files:**
- Modify: `.env`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Replace real credentials in `.env` with CHANGE_ME placeholders**

Edit `.env` — replace every real secret value:

```dotenv
APP_ENV=dev
APP_SECRET=CHANGE_ME

DATABASE_URL="postgresql://app:app@database:5432/forecastly?serverVersion=16&charset=utf8"

MESSENGER_TRANSPORT_DSN=doctrine://default?auto_setup=0

MAILER_DSN=smtp://mailer:1025

STRIPE_SECRET_KEY=CHANGE_ME
STRIPE_PUBLISHABLE_KEY=CHANGE_ME
STRIPE_WEBHOOK_SECRET=CHANGE_ME

JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=CHANGE_ME
```

- [ ] **Step 2: Create `.env.example` as the canonical template**

```bash
cp .env .env.example
```

`.env.example` should have the same content as the cleaned `.env` — all `CHANGE_ME` placeholders. Commit this file. Do NOT commit `.env.local`.

- [ ] **Step 3: Update `.gitignore`**

Ensure these lines exist in `.gitignore`:

```
.env.local
.env.*.local
config/jwt/private.pem
config/jwt/public.pem
```

- [ ] **Step 4: Verify no real secrets remain**

```bash
git diff HEAD .env | grep -v "CHANGE_ME" | grep -E "(sk_|pk_|whsec_|password)" || echo "Clean"
# Expected: Clean
```

- [ ] **Step 5: Commit**

```bash
git add .env .env.example .gitignore
git commit -m "security: replace committed credentials with CHANGE_ME placeholders"
```

---

## Task 3: Dockerfile (multi-stage, PHP 8.4-FPM)

**Files:**
- Create: `Dockerfile`
- Create: `nginx/default.conf`

- [ ] **Step 1: Create `nginx/default.conf`**

```nginx
server {
    listen 80;
    root /var/www/html/public;
    index index.php;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass app:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
        internal;
    }

    location ~ \.php$ {
        return 404;
    }

    error_log /var/log/nginx/error.log;
    access_log /var/log/nginx/access.log;
}
```

- [ ] **Step 2: Create `Dockerfile`**

```dockerfile
# Stage 1: Composer dependencies
FROM composer:2 AS deps
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
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

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    icu-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        zip \
        intl \
        opcache \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /var/www/html

COPY --from=deps /app/vendor ./vendor
COPY --from=assets /app/public/build ./public/build
COPY . .

RUN chown -R www-data:www-data var/

EXPOSE 9000
```

- [ ] **Step 3: Create `docker/php/opcache.ini`**

```ini
opcache.enable=1
opcache.revalidate_freq=0
opcache.validate_timestamps=0
opcache.max_accelerated_files=10000
opcache.memory_consumption=192
opcache.max_wasted_percentage=10
opcache.interned_strings_buffer=16
opcache.fast_shutdown=1
```

- [ ] **Step 4: Commit**

```bash
mkdir -p docker/php
git add Dockerfile nginx/default.conf docker/php/opcache.ini
git commit -m "feat: add multi-stage Dockerfile with PHP 8.4-FPM Alpine"
```

---

## Task 4: docker-compose.yml + Makefile

**Files:**
- Create: `docker-compose.yml`
- Delete: `compose.yaml`
- Create: `Makefile`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  app:
    build:
      context: .
      target: app
    volumes:
      - .:/var/www/html
      - /var/www/html/vendor
    environment:
      APP_ENV: dev
      DATABASE_URL: postgresql://app:app@database:5432/forecastly?serverVersion=16
      MESSENGER_TRANSPORT_DSN: doctrine://default?auto_setup=0
      REDIS_URL: redis://redis:6379
      MAILER_DSN: smtp://mailer:1025
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - forecastly

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - .:/var/www/html
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - forecastly

  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: forecastly
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d forecastly"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - forecastly

  redis:
    image: redis:7-alpine
    networks:
      - forecastly

  mailer:
    image: axllent/mailpit
    ports:
      - "8025:8025"
    networks:
      - forecastly

  worker:
    build:
      context: .
      target: app
    command: php bin/console messenger:consume async --time-limit=3600 --memory-limit=128M -vv
    volumes:
      - .:/var/www/html
      - /var/www/html/vendor
    environment:
      APP_ENV: dev
      DATABASE_URL: postgresql://app:app@database:5432/forecastly?serverVersion=16
      MESSENGER_TRANSPORT_DSN: doctrine://default?auto_setup=0
    depends_on:
      database:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - forecastly

volumes:
  postgres_data:

networks:
  forecastly:
    driver: bridge
```

- [ ] **Step 2: Delete old compose files**

```bash
git rm compose.yaml
git rm compose.override.yaml 2>/dev/null || true
```

- [ ] **Step 3: Create `Makefile`**

```makefile
.PHONY: install demo test reset lint shell forecast

install:
	docker compose exec app composer install
	docker compose exec app php bin/console doctrine:migrations:migrate --no-interaction
	docker compose exec app php bin/console messenger:setup-transports
	docker compose exec app php bin/console doctrine:fixtures:load --no-interaction
	docker compose exec app php bin/console messenger:consume async --limit=50 --no-interaction

demo: install

test:
	docker compose exec app php bin/phpunit --testdox

reset:
	docker compose exec app php bin/console doctrine:database:drop --force --no-interaction
	docker compose exec app php bin/console doctrine:database:create --no-interaction
	docker compose exec app php bin/console doctrine:migrations:migrate --no-interaction
	docker compose exec app php bin/console messenger:setup-transports
	docker compose exec app php bin/console doctrine:fixtures:load --no-interaction
	docker compose exec app php bin/console messenger:consume async --limit=50 --no-interaction

lint:
	docker compose exec app vendor/bin/php-cs-fixer fix --dry-run --diff
	docker compose exec app vendor/bin/phpstan analyse --level=8

shell:
	docker compose exec app sh

forecast:
	docker compose exec app php bin/console app:forecast:regenerate --all
```

- [ ] **Step 4: Verify `docker compose up` works**

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
# Expected: all services healthy/running

docker compose exec app php bin/console about
# Expected: Symfony version 7.4.x, PHP 8.4.x
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml Makefile
git commit -m "feat: add docker-compose.yml with all services and Makefile entry points"
```

---

## Task 5: Redis cache config

**Files:**
- Modify: `config/packages/cache.yaml`

- [ ] **Step 1: Wire Redis as the default cache pool**

Replace the content of `config/packages/cache.yaml`:

```yaml
framework:
    cache:
        app: cache.adapter.redis
        default_redis_provider: "%env(REDIS_URL)%"
```

- [ ] **Step 2: Add `REDIS_URL` to `.env` and `.env.example`**

Add to both files:

```dotenv
REDIS_URL=redis://redis:6379
```

- [ ] **Step 3: Verify cache warms using Redis**

```bash
docker compose exec app php bin/console cache:clear
docker compose exec app php bin/console cache:warmup
# Expected: [OK] Cache for the "dev" environment was successfully warmed up.

# Open Symfony profiler on any page — Cache panel should show Redis adapter
```

- [ ] **Step 4: Commit**

```bash
git add config/packages/cache.yaml .env .env.example
git commit -m "feat: wire Redis as default Symfony cache pool"
```

---

## Plan 1 Complete

Run the full verification before moving to Plan 2:

```bash
docker compose up -d
docker compose exec app php bin/console cache:warmup
docker compose exec app php bin/console doctrine:schema:validate
docker compose exec app php -r "echo PHP_VERSION . PHP_EOL;"
# Expected: 8.4.x
```

**Next:** `2026-06-09-forecastly-plan-2-core-architecture.md`
