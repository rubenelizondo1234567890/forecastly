.PHONY: install demo test reset lint shell forecast watch

install:
	docker compose exec app composer install
	docker compose run --rm node sh -c "npm ci && npm run build"
	docker compose exec app php bin/console doctrine:schema:update --force --no-interaction
	docker compose exec app php bin/console messenger:setup-transports
	docker compose exec app php bin/console doctrine:fixtures:load --no-interaction

demo: install

test:
	docker compose exec app php bin/phpunit --testdox

reset:
	docker compose exec app php bin/console doctrine:schema:drop --force --no-interaction
	docker compose exec app php bin/console doctrine:schema:create --no-interaction
	docker compose exec app php bin/console messenger:setup-transports
	docker compose exec app php bin/console doctrine:fixtures:load --no-interaction

lint:
	docker compose exec app vendor/bin/php-cs-fixer fix --dry-run --diff
	docker compose exec app vendor/bin/phpstan analyse --level=8

shell:
	docker compose exec app sh

watch:
	docker compose run --rm node npm run watch

forecast:
	docker compose exec app php bin/console app:forecast:regenerate --all
