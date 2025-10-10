import { Submission, Form } from '@prisma/client';

/**
 * Webhook job for form submissions
 */
export class WebhookJob {
    /**
     * Process webhook job
     * @param submission - The submission data
     * @param form - The form data
     * @param webhookUrl - Webhook URL to send data to
     * @param secret - Optional webhook secret for signature verification
     */
    async process(submission: Submission, form: Form, webhookUrl: string, secret?: string): Promise<void> {
        try {
            const payload = this.generateWebhookPayload(submission, form);
            const headers = this.generateHeaders(payload, secret);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
            }

            console.log(`Webhook sent successfully to ${webhookUrl} for submission ${submission.id}`);
        } catch (error) {
            console.error(`Failed to send webhook for submission ${submission.id}:`, error);
            throw error;
        }
    }

    /**
     * Generate webhook payload
     * @param submission - The submission data
     * @param form - The form data
     * @returns object - Webhook payload
     */
    private generateWebhookPayload(submission: Submission, form: Form): object {
        return {
            event: 'submission.created',
            timestamp: new Date().toISOString(),
            data: {
                submission: {
                    id: submission.id,
                    formId: submission.formId,
                    payload: submission.payload,
                    name: submission.name,
                    email: submission.email,
                    status: submission.status,
                    ip: submission.ip,
                    userAgent: submission.userAgent,
                    createdAt: submission.createdAt,
                    updatedAt: submission.updatedAt,
                },
                form: {
                    id: form.id,
                    name: form.name,
                    description: form.description,
                    endpointSlug: form.endpointSlug,
                    settings: form.settings,
                    isActive: form.isActive,
                    createdAt: form.createdAt,
                    updatedAt: form.updatedAt,
                },
            },
        };
    }

    /**
     * Generate webhook headers
     * @param payload - The webhook payload
     * @param secret - Optional webhook secret
     * @returns object - Headers for the webhook request
     */
    private generateHeaders(payload: object, secret?: string): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'FormAPI-Webhook/1.0',
        };

        if (secret) {
            const signature = this.generateSignature(JSON.stringify(payload), secret);
            headers['X-Webhook-Signature'] = signature;
        }

        return headers;
    }

    /**
     * Generate HMAC signature for webhook verification
     * @param payload - The webhook payload as string
     * @param secret - The webhook secret
     * @returns string - HMAC signature
     */
    private generateSignature(payload: string, secret: string): string {
        // Simple HMAC-SHA256 implementation
        // In production, use crypto.createHmac('sha256', secret).update(payload).digest('hex')
        const crypto = require('crypto');
        return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    /**
     * Verify webhook signature
     * @param payload - The webhook payload as string
     * @param signature - The received signature
     * @param secret - The webhook secret
     * @returns boolean - True if signature is valid
     */
    static verifySignature(payload: string, signature: string, secret: string): boolean {
        const crypto = require('crypto');
        const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
}
