# @formgrid/cli

A Supabase-like CLI for managing and running Formgrid locally with Docker.

## Installation

### Global Installation (Recommended)

```bash
# Install from npm
npm install -g formgrid-cli

# Now use from anywhere
formgrid start
formgrid status
```

### Local Usage (Development)

```bash
# From the monorepo root
pnpm cli:dev -- <command>

# Or directly
cd packages/cli
pnpm dev -- <command>
```

## Commands

### `formgrid start`

Start Formgrid locally using Docker Compose.

```bash
formgrid start              # Start all services (interactive)
formgrid start --detached   # Start in background (detached mode)
formgrid start -d           # Same as above
```

**What it does:**
- Starts MySQL database
- Starts Redis
- Starts MinIO (S3-compatible storage)
- Starts backend API
- Starts frontend dashboard
- Starts queue worker

**Access your services:**
- Dashboard: http://localhost:5173
- API: http://localhost:4001
- MinIO Console: http://localhost:9001

---

### `formgrid stop`

Stop all Formgrid Docker containers.

```bash
formgrid stop
```

---

### `formgrid restart`

Restart all Formgrid Docker containers.

```bash
formgrid restart
```

---

### `formgrid logs`

View logs for running Formgrid containers.

```bash
formgrid logs                      # Follow all logs
formgrid logs --service backend    # Backend logs only
formgrid logs --service frontend   # Frontend logs only
formgrid logs --service db         # Database logs only
formgrid logs -s redis             # Redis logs only
```

Available services: `backend`, `frontend`, `db`, `redis`, `minio`, `queue-worker`

---

### `formgrid ps`

List all running Formgrid containers.

```bash
formgrid ps
```

---

### `formgrid status`

Check the status of all Formgrid services.

```bash
formgrid status
```

Shows which services are running, stopped, or healthy.

---

### `formgrid clean`

Stop containers and remove volumes (clean slate).

```bash
formgrid clean
```

**Warning:** This will delete all data including:
- Database data
- Redis cache
- MinIO files
- Uploaded files

---

### `formgrid migrate`

Run database migrations.

```bash
formgrid migrate
```

Runs Prisma migrations inside the backend container.

---

## Quick Start

```bash
# 1. Start Formgrid
formgrid start -d

# 2. Check status
formgrid status

# 3. View logs
formgrid logs

# 4. Stop when done
formgrid stop
```

## Development

### Running the CLI in Development

```bash
# From monorepo root
pnpm cli:dev -- start

# Or from packages/cli
pnpm dev -- start
```

### Building the CLI

```bash
# From monorepo root
pnpm cli:build

# Or from packages/cli
pnpm build
```

## Architecture

The CLI is built with:
- **Commander.js** - CLI framework
- **Chalk** - Colorful terminal output
- **Ora** - Elegant terminal spinners
- **Execa** - Better child_process
- **TypeScript** - Type safety
- **tsup** - Fast TypeScript bundler

## Examples

### Start Formgrid for development

```bash
formgrid start
```

### Start in background and check logs

```bash
formgrid start -d
formgrid logs --service backend
```

### Reset everything and start fresh

```bash
formgrid clean
formgrid start
```

### Check what's running

```bash
formgrid status
formgrid ps
```

## Troubleshooting

### "docker: command not found"

Make sure Docker is installed and running:
```bash
docker --version
docker ps
```

### "Cannot connect to the Docker daemon"

Start Docker Desktop or the Docker daemon.

### Services not starting

Check logs for specific service:
```bash
formgrid logs --service backend
```

Clean and restart:
```bash
formgrid clean
formgrid start
```

## Environment Variables

The CLI uses the Docker Compose configuration in `docker/docker-compose.yml`.

Make sure you have:
- `docker/.env` with required environment variables
- Docker and Docker Compose installed

## Publishing

To publish to npm (for maintainers):

```bash
cd packages/cli
pnpm build
npm publish --access public
```

## License

MIT

---

**FormGrid CLI** - Manage your local Formgrid instance with ease! 🚀


