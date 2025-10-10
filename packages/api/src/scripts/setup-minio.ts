// Script to setup MinIO bucket for file uploads
import { Client } from 'minio';
import { getStorageConfig } from '../config/storage';

const setupMinIO = async () => {
    const config = getStorageConfig();

    if (config.type !== 'minio') {
        console.log('MinIO setup skipped - not using MinIO storage');
        return;
    }

    if (!config.endpoint || !config.accessKey || !config.secretKey || !config.bucketName) {
        console.error('MinIO configuration incomplete');
        console.error('Required: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME');
        process.exit(1);
    }

    try {
        const url = new URL(config.endpoint);
        const minioClient = new Client({
            endPoint: url.hostname,
            port: parseInt(url.port) || 9000,
            useSSL: url.protocol === 'https:',
            accessKey: config.accessKey,
            secretKey: config.secretKey,
        });

        // Check if bucket exists
        const bucketExists = await minioClient.bucketExists(config.bucketName);

        if (!bucketExists) {
            console.log(`Creating MinIO bucket: ${config.bucketName}`);
            await minioClient.makeBucket(config.bucketName);
            console.log(`✅ MinIO bucket '${config.bucketName}' created successfully`);
        } else {
            console.log(`✅ MinIO bucket '${config.bucketName}' already exists`);
        }

        // Set bucket policy for public read access
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${config.bucketName}/uploads/*`
                }
            ]
        };

        await minioClient.setBucketPolicy(config.bucketName, JSON.stringify(policy));
        console.log(`✅ Bucket policy set for public read access`);

    } catch (error) {
        console.error('❌ Failed to setup MinIO:', error);
        process.exit(1);
    }
};

setupMinIO();
