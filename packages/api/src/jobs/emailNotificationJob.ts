import { EmailProvider } from '../infrastructure/email/EmailProvider';
import { createEmailProvider } from '../infrastructure/email';
import { Submission, Form } from '@prisma/client';

/**
 * Email notification job for form submissions
 */
export class EmailNotificationJob {
    private emailProvider: EmailProvider;

    constructor(emailProvider?: EmailProvider) {
        this.emailProvider = emailProvider || createEmailProvider();
    }

    /**
     * Process email notification job
     * @param submission - The submission data
     * @param form - The form data
     * @param notificationEmail - Email address to send notification to
     */
    async process(submission: Submission, form: Form, notificationEmail: string): Promise<void> {
        try {
            const subject = `New submission for form: ${form.name}`;
            const html = this.generateEmailHtml(submission, form);

            await this.emailProvider.send(
                notificationEmail,
                subject,
                html
            );

            console.log(`Email notification sent to ${notificationEmail} for submission ${submission.id}`);
        } catch (error) {
            console.error(`Failed to send email notification for submission ${submission.id}:`, error);
            throw error;
        }
    }

    /**
     * Generate HTML email content
     * @param submission - The submission data
     * @param form - The form data
     * @returns string - HTML email content
     */
    private generateEmailHtml(submission: Submission, form: Form): string {
        const submissionData = submission.payload as Record<string, any>;
        const fieldsHtml = Object.entries(submissionData)
            .map(([key, value]) => {
                const label = this.getFieldLabel(key, form);
                return `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f5f5f5;">${label}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${this.formatValue(value)}</td>
                    </tr>
                `;
            })
            .join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>New Form Submission</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        New Form Submission
                    </h2>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #2c3e50;">Form Details</h3>
                        <p><strong>Form Name:</strong> ${form.name}</p>
                        <p><strong>Form Description:</strong> ${form.description || 'No description'}</p>
                        <p><strong>Submission ID:</strong> ${submission.id}</p>
                        <p><strong>Submitted At:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
                        ${submission.name ? `<p><strong>Submitter Name:</strong> ${submission.name}</p>` : ''}
                        ${submission.email ? `<p><strong>Submitter Email:</strong> ${submission.email}</p>` : ''}
                        ${submission.ip ? `<p><strong>IP Address:</strong> ${submission.ip}</p>` : ''}
                    </div>

                    <h3 style="color: #2c3e50;">Submission Data</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #3498db; color: white;">
                                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Field</th>
                                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fieldsHtml}
                        </tbody>
                    </table>

                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #27ae60;">
                        <p style="margin: 0; color: #27ae60;">
                            <strong>Note:</strong> This is an automated notification. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Get field label from form settings or use field key
     * @param fieldKey - The field key
     * @param form - The form data
     * @returns string - Field label
     */
    private getFieldLabel(fieldKey: string, form: Form): string {
        const settings = form.settings as any;
        if (settings?.fields) {
            const field = settings.fields.find((f: any) => f.id === fieldKey);
            if (field?.label) {
                return field.label;
            }
        }
        return fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1);
    }

    /**
     * Format value for display
     * @param value - The value to format
     * @returns string - Formatted value
     */
    private formatValue(value: any): string {
        if (value === null || value === undefined) {
            return 'N/A';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        return String(value);
    }
}
