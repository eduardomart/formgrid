# Docker Configuration

This directory contains Docker configuration files for the FormGrid monorepo.

## Files

- `docker-compose.yml` - Main Docker Compose configuration
- `docker-compose.override.yml` - Override configuration for different storage options

## Usage

All docker commands should be run from the root of the monorepo, referencing these files:

```bash
# Start all services
docker compose -f docker/docker-compose.yml up --build

# Stop all services
docker compose -f docker/docker-compose.yml down

# View logs
docker compose -f docker/docker-compose.yml logs -f
```

Or use the convenient Makefile commands from the root:

```bash
make run-local    # Start all services
make down-local   # Stop all services
make clean        # Stop and remove volumes
make logs         # View all logs
```

## Services

- **db** (MySQL 8.0) - Database service
- **redis** - Queue system and caching
- **minio** - S3-compatible object storage (optional)
- **backend** - Node.js API service
- **frontend** - React dashboard
- **queue-worker** - Background job processor
- **file-cleanup** - File cleanup service (maintenance profile)

## Storage Configuration

The configuration supports multiple storage backends:

### Local Storage (Default)
```bash
docker compose -f docker/docker-compose.yml up
```

### MinIO (S3-Compatible)
```bash
FILE_STORAGE_TYPE=minio docker compose -f docker/docker-compose.yml up
```

### AWS S3
```bash
FILE_STORAGE_TYPE=s3 AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx docker compose -f docker/docker-compose.yml up
```

### Google Cloud Storage
```bash
FILE_STORAGE_TYPE=gcs GCS_PROJECT_ID=xxx docker compose -f docker/docker-compose.yml up
```

For detailed storage setup instructions, see [STORAGE_SETUP.md](../STORAGE_SETUP.md) in the root directory.

