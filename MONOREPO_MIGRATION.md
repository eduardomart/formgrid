# Monorepo Migration Guide

## Overview

FormGrid has been restructured from a simple multi-package setup to an industry-standard **pnpm workspace monorepo**. This document outlines the changes and how to work with the new structure.

## What Changed

### Directory Structure

**Before:**
```
formgrid/
├── backend/
├── frontend/
├── docker-compose.yml
└── docker-compose.override.yml
```

**After:**
```
formgrid/
├── apps/
│   └── dashboard/              # Renamed from frontend
├── packages/
│   └── api/                    # Renamed from backend
├── docker/
│   ├── docker-compose.yml
│   └── docker-compose.override.yml
├── package.json                # Root workspace configuration
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### Key Changes

1. **Workspace Structure**
   - `frontend/` → `apps/dashboard/`
   - `backend/` → `packages/api/`
   - Docker files moved to `docker/` directory

2. **Package Names**
   - Frontend: `formgrid-frontend` → `@formgrid/dashboard`
   - Backend: `formgrid-backend` → `@formgrid/api`

3. **Package Manager**
   - Now using **pnpm** with workspace support
   - All dependencies managed at root level

4. **Configuration Files**
   - Added `pnpm-workspace.yaml` for workspace definition
   - Added `tsconfig.base.json` for shared TypeScript config
   - Added root `package.json` with workspace scripts
   - Added `.npmrc` for pnpm configuration

## Migration Steps for Existing Installations

If you have an existing installation, follow these steps:

### 1. Backup Your Data
```bash
# Backup your .env files
cp backend/.env packages/api/.env.backup

# Backup your database (if not using Docker)
# mysqldump -u user -p formgrid > formgrid_backup.sql
```

### 2. Pull the Changes
```bash
git pull origin main
```

### 3. Install pnpm
```bash
npm install -g pnpm
```

### 4. Clean Old Dependencies
```bash
# Remove old node_modules
rm -rf frontend/node_modules backend/node_modules node_modules
```

### 5. Install New Dependencies
```bash
pnpm install
```

### 6. Update Your .env File
```bash
# Copy your backed up .env
cp packages/api/.env.backup packages/api/.env
```

### 7. Restart Services
```bash
# Stop old Docker containers
docker compose down

# Start with new configuration
make run-local
```

## New Commands

### Root Level (Preferred)

```bash
# Development
pnpm install              # Install all dependencies
pnpm run dev              # Start all services
pnpm run build            # Build all workspaces
pnpm run test             # Run all tests

# Individual services
pnpm run dashboard:dev    # Dashboard only
pnpm run api:dev          # API only
```

### Make Commands

```bash
make install              # Install dependencies
make dev                  # Start all services locally
make build                # Build all workspaces
make run-local            # Start with Docker
make down-local           # Stop Docker
make clean                # Clean everything
make test                 # Run tests
make migrate              # Database migrations
```

### Docker Commands

```bash
# Note: Docker Compose files are now in docker/
docker compose -f docker/docker-compose.yml up --build
docker compose -f docker/docker-compose.yml down

# Or use Make
make run-local
make down-local
```

## Path Updates

### Environment Variables

No changes needed - paths inside containers remain the same.

### Import Paths

No changes needed - internal imports remain the same within each workspace.

### Docker Volumes

Updated to use new paths:
- `./backend` → `../packages/api`
- `./frontend` → `../apps/dashboard`

### Database Migrations

Run migrations from the API directory:
```bash
cd packages/api
npx prisma migrate dev
```

## Benefits of New Structure

1. **Better Organization** - Clear separation between apps and packages
2. **Scalability** - Easy to add new apps or packages
3. **Dependency Management** - Shared dependencies managed at root
4. **Industry Standard** - Follows best practices for open-source monorepos
5. **Better Tooling** - Improved support for monorepo tools and workflows
6. **Faster Installs** - pnpm's efficient dependency management
7. **Workspace Scripts** - Run commands across all workspaces

## Troubleshooting

### pnpm not found
```bash
npm install -g pnpm
```

### Docker can't find files
```bash
# Make sure you're using the new docker path
docker compose -f docker/docker-compose.yml up
```

### Old containers still running
```bash
# Stop and remove old containers
docker compose down
docker system prune -f
```

### Module not found errors
```bash
# Reinstall dependencies
pnpm install --force
```

### Database connection issues
```bash
# Make sure .env file is in packages/api/
cd packages/api
cat .env
```

## CI/CD Updates

If you have CI/CD pipelines, update them:

### Before
```yaml
- cd backend && npm install
- cd frontend && npm install
```

### After
```yaml
- npm install -g pnpm
- pnpm install
- pnpm run build
- pnpm run test
```

## Future Enhancements

With the new monorepo structure, we can easily add:

- `packages/react-sdk/` - React SDK for embedding forms
- `packages/js-sdk/` - Vanilla JavaScript SDK
- `packages/cli/` - CLI tool for FormGrid
- `apps/docs/` - Documentation site
- `packages/shared/` - Shared utilities and types

## Questions?

- Check the [README.md](./README.md) for general documentation
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub for support

---

**Last Updated:** October 2025

