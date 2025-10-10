# Contributing to FormGrid

Thank you for your interest in contributing to FormGrid! This guide will help you get started with our monorepo structure.

## Monorepo Structure

FormGrid uses a **pnpm workspace** monorepo structure:

```
formgrid/
├── apps/           # End-user applications
│   └── dashboard/  # React dashboard (@formgrid/dashboard)
├── packages/       # Reusable packages
│   └── api/        # Backend API (@formgrid/api)
└── docker/         # Docker configurations
```

## Prerequisites

- Node.js 18+
- pnpm 8+ - Install with `npm install -g pnpm`
- Docker and Docker Compose (for running services)
- MySQL (or use Docker)

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/formgrid.git
cd formgrid
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install dependencies for all workspaces.

### 3. Set Up Environment

```bash
cd packages/api
cp .env.example .env
# Edit .env with your configuration
```

### 4. Set Up Database

```bash
cd packages/api
npx prisma migrate dev
npx prisma generate
cd ../..
```

### 5. Start Development

```bash
# Start all services
pnpm run dev

# Or start individually
pnpm run dashboard:dev  # Dashboard only
pnpm run api:dev        # API only
```

## Workspace Commands

### Root Level Commands

```bash
pnpm install              # Install all dependencies
pnpm run dev              # Start all services
pnpm run build            # Build all workspaces
pnpm run test             # Run all tests
pnpm run clean            # Clean all build artifacts

# Individual workspace commands
pnpm run dashboard:dev    # Start dashboard
pnpm run dashboard:build  # Build dashboard
pnpm run api:dev          # Start API
pnpm run api:build        # Build API
pnpm run api:test         # Test API
```

### Working in a Specific Workspace

```bash
# Dashboard (apps/dashboard)
cd apps/dashboard
pnpm run dev
pnpm run build

# API (packages/api)
cd packages/api
pnpm run dev
pnpm run build
pnpm run test
```

## Making Changes

### Creating a New Feature

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the appropriate workspace:
   - UI changes: `apps/dashboard/`
   - API changes: `packages/api/`

3. Test your changes:
   ```bash
   pnpm run test
   ```

4. Build to ensure no errors:
   ```bash
   pnpm run build
   ```

5. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat(dashboard): add dark mode toggle
fix(api): resolve file upload memory leak
docs: update installation instructions
```

## Testing

### Running Tests

```bash
# All tests
pnpm run test

# API tests only
pnpm run api:test

# Watch mode
cd packages/api
pnpm run test:watch
```

### Writing Tests

- Place tests in `__tests__` directories or next to the files with `.test.ts` or `.spec.ts` extension
- Use descriptive test names
- Follow existing test patterns in the codebase

## Docker Development

### Using Docker

```bash
# Start all services with Docker
make run-local

# Stop services
make down-local

# Clean up
make clean

# View logs
make logs
make backend-logs
make frontend-logs
```

### Docker Compose Files

- `docker/docker-compose.yml` - Main configuration
- `docker/docker-compose.override.yml` - Override for different storage options

## Code Style

- TypeScript for all code
- Use existing ESLint and Prettier configurations
- Follow the existing code patterns
- Add comments for complex logic

## Adding Dependencies

### Root Dependencies
```bash
pnpm add -w <package-name>
```

### Workspace Dependencies
```bash
# Dashboard
pnpm add <package-name> --filter @formgrid/dashboard

# API
pnpm add <package-name> --filter @formgrid/api
```

### Dev Dependencies
```bash
pnpm add -D <package-name> --filter @formgrid/dashboard
```

## Database Changes

### Creating a Migration

```bash
cd packages/api
npx prisma migrate dev --name your-migration-name
```

### Applying Migrations

```bash
cd packages/api
npx prisma migrate deploy
```

### Database Studio

```bash
cd packages/api
npx prisma studio
```

## Pull Request Process

1. **Update Documentation**: If you've added new features, update the README.md
2. **Test Thoroughly**: Ensure all tests pass and add new tests if needed
3. **Update Changelog**: Add your changes to CHANGELOG.md (if it exists)
4. **Create PR**: Push your branch and create a Pull Request
5. **Describe Changes**: Provide a clear description of what you've changed and why
6. **Link Issues**: Reference any related issues in your PR description

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventional commits
- [ ] No merge conflicts
- [ ] PR description clearly explains the changes

## Common Issues

### pnpm Installation Issues

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
rm -rf node_modules
pnpm install
```

### Docker Issues

```bash
# Rebuild containers
make clean
make run-local

# Check logs
make logs
```

### Database Issues

```bash
# Reset database
cd packages/api
npx prisma migrate reset
```

## Getting Help

- Open an issue on GitHub
- Join our community discussions
- Check existing issues and PRs

## License

By contributing to FormGrid, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to FormGrid! 🎉

