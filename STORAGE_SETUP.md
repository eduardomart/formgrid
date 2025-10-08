# Multi-Storage File Upload Setup

This project supports multiple storage options for file uploads with Docker integration.

## Storage Options

### 1. Local Storage (Default)
Files are stored locally in the Docker container with volume persistence.

```bash
# Use local storage
docker-compose up
```

### 2. MinIO (S3-Compatible)
Self-hosted S3-compatible object storage included in Docker Compose.

```bash
# Use MinIO storage
FILE_STORAGE_TYPE=minio docker-compose up

# Setup MinIO bucket
docker-compose exec backend npm run setup:minio
```

**Access MinIO Console:**
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin123`

### 3. AWS S3
Use AWS S3 for cloud storage.

```bash
# Set environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_S3_BUCKET=your-bucket-name
export AWS_REGION=us-east-1

# Use S3 storage
FILE_STORAGE_TYPE=s3 docker-compose up

# Setup S3 bucket (optional)
docker-compose exec backend npm run setup:s3
```

### 4. Google Cloud Storage
Use Google Cloud Storage for cloud storage.

```bash
# Set environment variables
export GCS_PROJECT_ID=your-project-id
export GCS_BUCKET_NAME=your-bucket-name
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Use GCS storage
FILE_STORAGE_TYPE=gcs docker-compose up
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# File Storage Configuration
FILE_STORAGE_TYPE=local  # Options: local, s3, gcs, minio
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760   # 10MB in bytes
MAX_FILES=10

# AWS S3 Configuration (if using S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Google Cloud Storage Configuration (if using GCS)
GCS_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=your-gcs-bucket-name
GCS_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/app/gcs-credentials.json

# MinIO Configuration (if using MinIO)
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=file-uploads
```

## Docker Volumes

The setup includes the following volumes:

- `uploads_data`: Local file storage persistence
- `minio_data`: MinIO object storage data
- `mysql_data`: Database persistence
- `redis_data`: Redis persistence

## File Cleanup

Automatically clean up old uploaded files:

```bash
# Dry run (see what would be deleted)
FILE_CLEANUP_DRY_RUN=true docker-compose run --rm backend npm run cleanup

# Actual cleanup
FILE_CLEANUP_DRY_RUN=false docker-compose run --rm backend npm run cleanup

# Set cleanup age (default: 30 days)
FILE_CLEANUP_AGE_DAYS=7 docker-compose run --rm backend npm run cleanup
```

## Switching Storage Types

You can switch between storage types without data loss:

1. **Local → MinIO**: Files remain in local storage, new files go to MinIO
2. **MinIO → S3**: Files remain in MinIO, new files go to S3
3. **Any → Local**: Files remain in cloud storage, new files go to local

## Production Considerations

### Security
- Use environment variables for credentials
- Set appropriate bucket policies
- Enable HTTPS for all storage endpoints
- Implement file type validation
- Set up file size limits

### Performance
- Use CDN for file serving
- Implement file compression
- Set up proper caching headers
- Monitor storage usage

### Backup
- Enable versioning for S3/GCS buckets
- Set up cross-region replication
- Regular backup of local files
- Test restore procedures

## Troubleshooting

### MinIO Issues
```bash
# Check MinIO status
docker-compose logs minio

# Reset MinIO data
docker-compose down
docker volume rm formgrid_minio_data
docker-compose up
```

### S3 Issues
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Test bucket access
aws s3 ls s3://your-bucket-name
```

### File Upload Issues
```bash
# Check file permissions
docker-compose exec backend ls -la /app/uploads

# Check storage configuration
docker-compose exec backend node -e "
const config = require('./dist/config/storage').getStorageConfig();
console.log(config);
"
```

## Monitoring

### Storage Usage
```bash
# Local storage usage
docker-compose exec backend du -sh /app/uploads

# MinIO usage (via console)
# Visit http://localhost:9001

# S3 usage
aws s3 ls s3://your-bucket-name --recursive --human-readable --summarize
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f minio
```
