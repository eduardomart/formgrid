import Bull from 'bull';
import { env } from '../config/env';

/**
 * Queue configuration for Bull
 */
export interface QueueConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    };
    defaultJobOptions: Bull.JobOptions;
}

/**
 * Get queue configuration from environment variables
 */
export function getQueueConfig(): QueueConfig {
    return {
        redis: {
            host: env.REDIS_HOST || 'localhost',
            port: parseInt(env.REDIS_PORT || '6379'),
            ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
            db: parseInt(env.REDIS_DB || '0'),
        },
        defaultJobOptions: {
            removeOnComplete: 100, // Keep last 100 completed jobs
            removeOnFail: 50, // Keep last 50 failed jobs
            attempts: 3, // Retry failed jobs 3 times
            backoff: {
                type: 'exponential',
                delay: 2000, // Start with 2 second delay
            },
        },
    };
}

/**
 * Create a Bull queue with configuration
 * @param queueName - Name of the queue
 * @returns Bull.Queue instance
 */
export function createQueue(queueName: string): Bull.Queue {
    const config = getQueueConfig();

    const queue = new Bull(queueName, {
        redis: config.redis,
        defaultJobOptions: config.defaultJobOptions,
    });

    // Add event listeners for monitoring
    queue.on('completed', (job) => {
        console.log(`Job ${job.id} completed in queue ${queueName}`);
    });

    queue.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed in queue ${queueName}:`, err.message);
    });

    queue.on('stalled', (job) => {
        console.warn(`Job ${job.id} stalled in queue ${queueName}`);
    });

    return queue;
}

/**
 * Job types for type safety
 */
export enum JobType {
    SEND_NOTIFICATION_EMAIL = 'send-notification-email',
    DISPATCH_WEBHOOK = 'dispatch-webhook',
    SEND_AUTO_REPLY_EMAIL = 'send-auto-reply-email',
}

/**
 * Job data interfaces
 */
export interface SendNotificationEmailData {
    submissionId: string;
    formId: string;
    notificationEmail: string;
    submissionData: any;
    formData: any;
}

export interface DispatchWebhookData {
    submissionId: string;
    formId: string;
    webhookUrl: string;
    webhookSecret?: string;
    submissionData: any;
    formData: any;
}

export interface SendAutoReplyEmailData {
    submissionId: string;
    formId: string;
    submitterEmail: string;
    submissionData: any;
    formData: any;
}

/**
 * Queue instances
 */
export const emailQueue = createQueue('email-notifications');
export const webhookQueue = createQueue('webhooks');

/**
 * Add job to email queue
 * @param data - Email notification job data
 * @param options - Optional job options
 */
export async function addEmailJob(
    data: SendNotificationEmailData,
    options?: Bull.JobOptions
): Promise<Bull.Job> {
    return emailQueue.add(JobType.SEND_NOTIFICATION_EMAIL, data, options);
}

/**
 * Add job to webhook queue
 * @param data - Webhook job data
 * @param options - Optional job options
 */
export async function addWebhookJob(
    data: DispatchWebhookData,
    options?: Bull.JobOptions
): Promise<Bull.Job> {
    return webhookQueue.add(JobType.DISPATCH_WEBHOOK, data, options);
}

/**
 * Add auto-reply email job to email queue
 * @param data - Auto-reply email job data
 * @param options - Optional job options
 */
export async function addAutoReplyEmailJob(
    data: SendAutoReplyEmailData,
    options?: Bull.JobOptions
): Promise<Bull.Job> {
    return emailQueue.add(JobType.SEND_AUTO_REPLY_EMAIL, data, options);
}

/**
 * Get queue statistics
 * @returns Promise with queue stats
 */
export async function getQueueStats(): Promise<{
    email: any;
    webhook: any;
}> {
    const [emailStats, webhookStats] = await Promise.all([
        emailQueue.getJobCounts(),
        webhookQueue.getJobCounts(),
    ]);

    return {
        email: emailStats,
        webhook: webhookStats,
    };
}

/**
 * Clean up queues on shutdown
 */
export async function closeQueues(): Promise<void> {
    await Promise.all([
        emailQueue.close(),
        webhookQueue.close(),
    ]);
}
