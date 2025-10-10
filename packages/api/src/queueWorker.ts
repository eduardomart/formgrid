#!/usr/bin/env node

import { config } from 'dotenv';
import { emailQueue, webhookQueue, JobType, closeQueues } from './queue/queueConfig';
import { SendNotificationEmailJob } from './queue/jobs/sendNotificationEmailJob';
import { DispatchWebhookJob } from './queue/jobs/dispatchWebhookJob';
import { SendAutoReplyEmailJob } from './queue/jobs/sendAutoReplyEmailJob';

// Load environment variables
config();

/**
 * Queue Worker Script
 * Processes jobs from Redis queues using Bull
 */
class QueueWorker {
    private emailJobProcessor: SendNotificationEmailJob;
    private webhookJobProcessor: DispatchWebhookJob;
    private autoReplyJobProcessor: SendAutoReplyEmailJob;
    private isShuttingDown = false;

    constructor() {
        this.emailJobProcessor = new SendNotificationEmailJob();
        this.webhookJobProcessor = new DispatchWebhookJob();
        this.autoReplyJobProcessor = new SendAutoReplyEmailJob();
    }

    /**
     * Start processing jobs
     */
    async start(): Promise<void> {
        console.log('🚀 Starting Queue Worker...');
        console.log(`📧 Email queue: ${emailQueue.name}`);
        console.log(`🔗 Webhook queue: ${webhookQueue.name}`);

        // Process email notification jobs
        emailQueue.process(JobType.SEND_NOTIFICATION_EMAIL, async (job) => {
            console.log(`📧 Processing email job ${job.id}`);
            return this.emailJobProcessor.process(job);
        });

        // Process auto-reply email jobs
        emailQueue.process(JobType.SEND_AUTO_REPLY_EMAIL, async (job) => {
            console.log(`📧 Processing auto-reply email job ${job.id}`);
            return this.autoReplyJobProcessor.process(job);
        });

        // Process webhook jobs
        webhookQueue.process(JobType.DISPATCH_WEBHOOK, async (job) => {
            console.log(`🔗 Processing webhook job ${job.id}`);
            return this.webhookJobProcessor.process(job);
        });

        // Add event listeners
        this.setupEventListeners();

        console.log('✅ Queue Worker started successfully');
        console.log('⏳ Waiting for jobs...');
    }

    /**
     * Setup event listeners for monitoring
     */
    private setupEventListeners(): void {
        // Email queue events
        emailQueue.on('completed', (job) => {
            console.log(`✅ Email job ${job.id} completed`);
        });

        emailQueue.on('failed', (job, err) => {
            console.error(`❌ Email job ${job.id} failed:`, err.message);
        });

        emailQueue.on('stalled', (job) => {
            console.warn(`⚠️ Email job ${job.id} stalled`);
        });

        // Webhook queue events
        webhookQueue.on('completed', (job) => {
            console.log(`✅ Webhook job ${job.id} completed`);
        });

        webhookQueue.on('failed', (job, err) => {
            console.error(`❌ Webhook job ${job.id} failed:`, err.message);
        });

        webhookQueue.on('stalled', (job) => {
            console.warn(`⚠️ Webhook job ${job.id} stalled`);
        });

        // Global error handling
        emailQueue.on('error', (error) => {
            console.error('❌ Email queue error:', error);
        });

        webhookQueue.on('error', (error) => {
            console.error('❌ Webhook queue error:', error);
        });
    }

    /**
     * Get queue statistics
     */
    async getStats(): Promise<void> {
        try {
            const [emailStats, webhookStats] = await Promise.all([
                emailQueue.getJobCounts(),
                webhookQueue.getJobCounts(),
            ]);

            console.log('\n📊 Queue Statistics:');
            console.log('📧 Email Queue:', emailStats);
            console.log('🔗 Webhook Queue:', webhookStats);
        } catch (error) {
            console.error('❌ Failed to get queue stats:', error);
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        if (this.isShuttingDown) return;

        this.isShuttingDown = true;
        console.log('\n🛑 Shutting down Queue Worker...');

        try {
            // Wait for active jobs to complete
            await Promise.all([
                emailQueue.close(),
                webhookQueue.close(),
            ]);

            console.log('✅ Queue Worker shutdown complete');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Create and start worker
const worker = new QueueWorker();

// Start the worker
worker.start().catch((error) => {
    console.error('❌ Failed to start Queue Worker:', error);
    process.exit(1);
});

// Setup graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📡 Received SIGINT, shutting down gracefully...');
    worker.shutdown();
});

process.on('SIGTERM', () => {
    console.log('\n📡 Received SIGTERM, shutting down gracefully...');
    worker.shutdown();
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    worker.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    worker.shutdown();
});

// Log stats every 30 seconds
setInterval(() => {
    worker.getStats();
}, 30000);

// Export for testing
export { QueueWorker };
