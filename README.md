# Forecastly

A portfolio demo application. Full stack runs locally via Docker — no local PHP, Node, or database installation required.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and **running**
- `make` available in your terminal *(optional — raw commands are listed for every step)*
  - **Mac/Linux:** already available
  - **Windows:** install via Chocolatey (`choco install make`) or use Git Bash

---

## First-Time Setup

### With `make` (recommended)

```bash
# 1. Clone the repo
git clone <repo-url>
cd forecastly_ovh

# 2. Build images and start all containers (~2 min on first run)
docker compose build --no-cache
docker compose up -d

# 3. Install dependencies, create the schema, seed demo data
make demo
```

### Without `make`

```bash
# 1. Clone the repo
git clone <repo-url>
cd forecastly_ovh

# 2. Build images and start all containers
docker compose build --no-cache
docker compose up -d

# 3. Run each step manually
docker compose exec app composer install
docker compose run --rm node sh -c "npm ci && npm run build"
docker compose exec app php bin/console doctrine:schema:update --force --no-interaction
docker compose exec app php bin/console messenger:setup-transports
docker compose exec app php bin/console doctrine:fixtures:load --no-interaction
```

Once setup completes, open:

| URL | What it is |
|---|---|
| http://localhost:8080 | Application |
| http://localhost:8025 | Mailpit — catches all outgoing email |

---

## Returning User

Containers and database already exist. Just start them:

```bash
docker compose up -d
```

That's it — your data is preserved in the `postgres_data` volume.

To stop the containers when you're done:

```bash
docker compose stop
```

---

## Full Teardown and Rebuild

Use this to reset everything to a clean slate (wipes the database volume).

### With `make`

```bash
# 1. Stop all containers and delete volumes (database wiped)
docker compose down -v

# 2. Rebuild images from scratch (no layer cache)
docker compose build --no-cache

# 3. Start fresh containers
docker compose up -d

# 4. Reinstall all dependencies and reseed data
make demo
```

### Without `make`

```bash
# 1. Stop all containers and delete volumes
docker compose down -v

# 2. Rebuild images from scratch
docker compose build --no-cache

# 3. Start fresh containers
docker compose up -d

# 4. Reinstall everything manually
docker compose exec app composer install
docker compose run --rm node sh -c "npm ci && npm run build"
docker compose exec app php bin/console doctrine:schema:update --force --no-interaction
docker compose exec app php bin/console messenger:setup-transports
docker compose exec app php bin/console doctrine:fixtures:load --no-interaction
```

---

## Stack

| Service | Technology |
|---|---|
| Web server | Nginx Alpine |
| Application | PHP 8.4-FPM Alpine + Symfony 7.3 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Email (dev) | Mailpit |
| Async worker | Symfony Messenger |

---

## Make Commands

```bash
make demo       # Install deps + build assets + create schema + seed fixtures (first-time setup)
make reset      # Drop DB, recreate schema, reseed fixtures (keeps containers running)
make test       # Run the test suite
make shell      # Open a shell inside the app container
make lint       # PHP-CS-Fixer dry-run + PHPStan static analysis (level 8)
make watch      # Start Webpack Encore in watch/hot-reload mode
make forecast   # Regenerate all forecast data
```

---

## Troubleshooting

**`docker compose` command not found**
Make sure Docker Desktop is running. Look for the whale icon in your system tray / menu bar.

**`make: command not found` on Windows**
Install make via Chocolatey (open PowerShell as Administrator):
```powershell
choco install make
```
Restart your terminal and retry. Alternatively, use the raw commands listed in each section above.

**Port 8080 or 8025 already in use**
Edit `docker-compose.yml` — change the left side of the port mapping for `nginx` (`"8081:80"`) or `mailer` (`"8026:8025"`), then restart:
```bash
docker compose down && docker compose up -d
```

**`doctrine:fixtures` namespace not found**
The fixtures bundle is a dev dependency. Make sure you ran `composer install` (not `composer install --no-dev`):
```bash
docker compose exec app composer install
```

**Build fails on first run**
Check the logs:
```bash
docker compose logs app
```
Most common cause: Docker Desktop does not have enough memory. Open Docker Desktop → Settings → Resources → set Memory to at least **4 GB**.

**Database is empty after `make demo`**
Fixtures require the bundle to be registered. Verify `DoctrineFixturesBundle` appears in `config/bundles.php`, then retry:
```bash
make reset
```
