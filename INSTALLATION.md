# FormGrid Installation Guide

## For End Users

### Quick Start (Using npx - No Installation)

The easiest way to use FormGrid is with the CLI:

```bash
# Option 1: Install globally (recommended)
npm install -g formgrid-cli
formgrid start

# Option 2: Use with npx (no installation)
npx formgrid-cli start

# Option 3: Clone and use from monorepo
git clone https://github.com/allenarduino/formgrid.git
cd formgrid
pnpm install
pnpm formgrid start
```

### Global Installation (Recommended)

Install the CLI globally to use it from anywhere:

```bash
npm install -g formgrid-cli

# Now use from anywhere
formgrid start
formgrid status
formgrid logs
```

### Using with npx (No Installation)

Run commands without installing:

```bash
npx formgrid-cli start
npx formgrid-cli status
npx formgrid-cli logs
```

### Local Installation

Install in your project:

```bash
npm install --save-dev formgrid-cli

# Use with npx
npx formgrid start

# Or add to package.json scripts:
{
  "scripts": {
    "formgrid": "formgrid"
  }
}
```

## For Self-Hosting

If you want to self-host FormGrid:

### Prerequisites

- Node.js 18+
- pnpm 8+ (or npm)
- Docker & Docker Compose
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/formgrid.git
cd formgrid
```

### Step 2: Install Dependencies

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Step 3: Set Up Environment Variables

```bash
# Copy example environment file
cd packages/api
cp .env.example .env

# Edit the .env file with your settings
nano .env  # or use your favorite editor
```

**Required variables:**
- `JWT_SECRET` - A strong random string
- `DATABASE_URL` - Provided by Docker (no change needed)
- `EMAIL_FROM` - Your email address
- `RESEND_API_KEY` - Get from https://resend.com (optional for local dev)

### Step 4: Start FormGrid

Using the CLI (recommended):

```bash
# Build the CLI first
pnpm cli:build

# Start everything
pnpm formgrid start -d

# Check status
pnpm formgrid status
```

Or using Make:

```bash
make run-local
```

Or using Docker Compose directly:

```bash
docker compose -f docker/docker-compose.yml up --build
```

### Step 5: Access Your Instance

- **Dashboard:** http://localhost:5173
- **API:** http://localhost:4001
- **MinIO Console:** http://localhost:9001

### Step 6: Create Your First Account

1. Open http://localhost:5173
2. Click "Sign Up"
3. Create your account
4. Start creating forms!

## For Contributors

If you want to contribute to FormGrid:

### Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/your-username/formgrid.git
cd formgrid

# 2. Install dependencies
pnpm install

# 3. Set up environment
cd packages/api
cp .env.example .env
cd ../..

# 4. Start development servers
pnpm run dev

# This starts both:
# - Dashboard at http://localhost:5173
# - API at http://localhost:4001
```

### Using the CLI in Development

```bash
# Build the CLI
pnpm cli:build

# Run CLI commands
pnpm formgrid start
pnpm formgrid logs
pnpm formgrid status

# Or run without building
pnpm cli:dev -- start
```

### CLI Development

To work on the CLI itself:

```bash
cd packages/cli

# Install dependencies
pnpm install

# Run in development mode
pnpm dev -- start

# Build
pnpm build

# Test the built CLI
node dist/index.js --help
```

## Publishing the CLI (For Maintainers)

To publish `@formgrid/cli` to npm:

```bash
cd packages/cli

# 1. Build the package
pnpm build

# 2. Test it locally
npm link
formgrid --help

# 3. Publish to npm
npm login
npm publish --access public

# 4. Unlink after testing
npm unlink -g @formgrid/cli
```

After publishing, users can install with:

```bash
npm install -g @formgrid/cli
formgrid start
```

## Docker-Only Installation

If you just want to run FormGrid without the monorepo:

```bash
# Clone the repo
git clone https://github.com/your-username/formgrid.git
cd formgrid

# Create docker/.env file
cp docker/.env.example docker/.env
nano docker/.env

# Start with Docker Compose
docker compose -f docker/docker-compose.yml up -d

# Check logs
docker compose -f docker/docker-compose.yml logs -f
```

## Troubleshooting

### "pnpm: command not found"

```bash
npm install -g pnpm
```

### "Docker: command not found"

Install Docker Desktop:
- Mac: https://docs.docker.com/desktop/install/mac-install/
- Windows: https://docs.docker.com/desktop/install/windows-install/
- Linux: https://docs.docker.com/desktop/install/linux-install/

### "Cannot connect to Docker daemon"

Make sure Docker Desktop is running.

### Services not starting

```bash
# Clean everything and start fresh
pnpm formgrid clean
pnpm formgrid start
```

### Port already in use

Check if something is using ports 5173, 4001, 3307, 6379, or 9000:

```bash
# On Mac/Linux
lsof -i :5173
lsof -i :4001

# Kill the process
kill -9 <PID>
```

## Updating FormGrid

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pnpm install

# Rebuild
pnpm build

# Restart services
pnpm formgrid restart
```

## Uninstalling

### Global CLI

```bash
npm uninstall -g @formgrid/cli
```

### Docker Cleanup

```bash
# Remove all FormGrid containers and volumes
pnpm formgrid clean

# Or manually
docker compose -f docker/docker-compose.yml down -v
docker system prune -f
```

## Getting Help

- 📖 Documentation: Check README.md and packages/cli/README.md
- 🐛 Issues: https://github.com/your-username/formgrid/issues
- 💬 Discussions: https://github.com/your-username/formgrid/discussions

---

**Need help?** Open an issue or join our community discussions!

