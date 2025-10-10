import { EmailNotificationJob } from './emailNotificationJob';
import { WebhookJob } from './webhookJob';
import { Submission, Form } from '@prisma/client';

/**
 * Simple in-memory job queue
 * In production, this should use Redis, RabbitMQ, or similar
 */
interface Job {
    id: string;
    type: 'email' | 'webhook';
    data: any;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    scheduledFor: Date;
}

class JobQueue {
    private jobs: Job[] = [];
    private processing = false;
    private emailJob: EmailNotificationJob;
    private webhookJob: WebhookJob;

    constructor() {
        this.emailJob = new EmailNotificationJob();
        this.webhookJob = new WebhookJob();
        this.startProcessing();
    }

    /**
     * Add email notification job to queue
     * @param submission - The submission data
     * @param form - The form data
     * @param notificationEmail - Email address to send notification to
     */
    async queueEmailNotification(submission: Submission, form: Form, notificationEmail: string): Promise<void> {
        const job: Job = {
            id: `email-${submission.id}-${Date.now()}`,
            type: 'email',
            data: { submission, form, notificationEmail },
            attempts: 0,
            maxAttempts: 3,
            createdAt: new Date(),
            scheduledFor: new Date(),
        };

        this.jobs.push(job);
        console.log(`Email notification job queued: ${job.id}`);
    }

    /**
     * Add webhook job to queue
     * @param submission - The submission data
     * @param form - The form data
     * @param webhookUrl - Webhook URL
     * @param secret - Optional webhook secret
     */
    async queueWebhook(submission: Submission, form: Form, webhookUrl: string, secret?: string): Promise<void> {
        const job: Job = {
            id: `webhook-${submission.id}-${Date.now()}`,
            type: 'webhook',
            data: { submission, form, webhookUrl, secret },
            attempts: 0,
            maxAttempts: 3,
            createdAt: new Date(),
            scheduledFor: new Date(),
        };

        this.jobs.push(job);
        console.log(`Webhook job queued: ${job.id}`);
    }

    /**
     * Start processing jobs
     */
    private startProcessing(): void {
        if (this.processing) return;

        this.processing = true;
        this.processJobs();
    }

    /**
     * Process jobs in the queue
     */
    private async processJobs(): Promise<void> {
        while (this.processing) {
            const now = new Date();
            const readyJobs = this.jobs.filter(job => job.scheduledFor <= now);

            for (const job of readyJobs) {
                try {
                    await this.processJob(job);
                    this.removeJob(job.id);
                } catch (error) {
                    console.error(`Job ${job.id} failed:`, error);
                    await this.handleJobFailure(job);
                }
            }

            // Wait before checking for more jobs
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    /**
     * Process a single job
     * @param job - The job to process
     */
    private async processJob(job: Job): Promise<void> {
        console.log(`Processing job: ${job.id}`);

        switch (job.type) {
            case 'email':
                await this.emailJob.process(
                    job.data.submission,
                    job.data.form,
                    job.data.notificationEmail
                );
                break;
            case 'webhook':
                await this.webhookJob.process(
                    job.data.submission,
                    job.data.form,
                    job.data.webhookUrl,
                    job.data.secret
                );
                break;
            default:
                throw new Error(`Unknown job type: ${job.type}`);
        }

        console.log(`Job completed successfully: ${job.id}`);
    }

    /**
     * Handle job failure
     * @param job - The failed job
     */
    private async handleJobFailure(job: Job): Promise<void> {
        job.attempts++;

        if (job.attempts >= job.maxAttempts) {
            console.error(`Job ${job.id} failed permanently after ${job.maxAttempts} attempts`);
            this.removeJob(job.id);
            return;
        }

        // Schedule retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000; // 1s, 2s, 4s, etc.
        job.scheduledFor = new Date(Date.now() + delay);

        console.log(`Job ${job.id} will retry in ${delay}ms (attempt ${job.attempts}/${job.maxAttempts})`);
    }

    /**
     * Remove job from queue
     * @param jobId - The job ID to remove
     */
    private removeJob(jobId: string): void {
        this.jobs = this.jobs.filter(job => job.id !== jobId);
    }

    /**
     * Get queue status
     * @returns object - Queue status information
     */
    getStatus(): { totalJobs: number; pendingJobs: number; failedJobs: number } {
        const now = new Date();
        const pendingJobs = this.jobs.filter(job => job.scheduledFor <= now).length;
        const failedJobs = this.jobs.filter(job => job.attempts > 0).length;

        return {
            totalJobs: this.jobs.length,
            pendingJobs,
            failedJobs,
        };
    }

    /**
     * Stop processing jobs
     */
    stop(): void {
        this.processing = false;
    }
}

// Create singleton instance
export const jobQueue = new JobQueue();

// Cleanup on process exit
process.on('SIGINT', () => {
    jobQueue.stop();
});

process.on('SIGTERM', () => {
    jobQueue.stop();
});
