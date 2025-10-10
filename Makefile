# Makefile for FormGrid Monorepo

.PHONY: run-local down-local clean logs backend-logs frontend-logs db-logs migrate test install dev build

# Install dependencies for all workspaces
install:
	@echo "Installing dependencies with pnpm..."
	pnpm install

# Start development servers for all workspaces
dev:
	@echo "Starting all development servers..."
	pnpm run dev

# Build all workspaces
build:
	@echo "Building all workspaces..."
	pnpm run build

# Start all services in development mode with Docker
run-local:
	@echo "Starting fullstack app with Docker..."
	docker compose -f docker/docker-compose.yml up --build

# Stop all services
down-local:
	@echo "Stopping all services..."
	docker compose -f docker/docker-compose.yml down

# Stop all services and remove volumes
clean:
	@echo "Cleaning up containers and volumes..."
	docker compose -f docker/docker-compose.yml down -v
	docker system prune -f

# View logs for all services
logs:
	@echo "Viewing logs for all services..."
	docker compose -f docker/docker-compose.yml logs -f

# View backend logs only
backend-logs:
	@echo "Viewing backend logs..."
	docker compose -f docker/docker-compose.yml logs -f backend

# View frontend logs only
frontend-logs:
	@echo "Viewing frontend logs..."
	docker compose -f docker/docker-compose.yml logs -f frontend

# View database logs only
db-logs:
	@echo "Viewing database logs..."
	docker compose -f docker/docker-compose.yml logs -f db

# Run database migrations
migrate:
	@echo "Running database migrations..."
	docker compose -f docker/docker-compose.yml exec backend npx prisma migrate dev

# Run tests
test:
	@echo "Running tests..."
	pnpm run test

# Help command
help:
	@echo "Available commands:"
	@echo "  install        - Install dependencies for all workspaces"
	@echo "  dev            - Start development servers for all workspaces"
	@echo "  build          - Build all workspaces"
	@echo "  run-local      - Start all services in development mode with Docker"
	@echo "  down-local     - Stop all services"
	@echo "  clean          - Stop services and remove volumes"
	@echo "  logs           - View logs for all services"
	@echo "  backend-logs   - View backend logs only"
	@echo "  frontend-logs  - View frontend logs only"
	@echo "  db-logs        - View database logs only"
	@echo "  migrate        - Run database migrations"
	@echo "  test           - Run tests for all workspaces"
	@echo "  help           - Show this help message"

