import nodemailer from 'nodemailer';
import { env } from '../config/env';

/**
 * Email template data interface
 */
export interface EmailTemplateData {
    formName: string;
    formDescription?: string;
    submissionId: string;
    submittedAt: string;
    submitterName?: string;
    submitterEmail?: string;
    ipAddress?: string;
    formData: Record<string, any>;
    fields?: Array<{
        id: string;
        label: string;
        value: any;
    }>;
}

/**
 * Email options interface
 */
export interface EmailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

/**
 * MailerService for sending emails using nodemailer
 */
export class MailerService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = this.createTransporter();
    }

    /**
     * Create nodemailer transporter based on email provider
     */
    private createTransporter(): nodemailer.Transporter {
        if (env.EMAIL_PROVIDER === 'smtp') {
            return nodemailer.createTransport({
                host: env.SMTP_HOST,
                port: env.SMTP_PORT,
                secure: env.SMTP_PORT === 465,
                auth: {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                },
            });
        } else {
            // For Resend or other providers, use SMTP with their settings
            return nodemailer.createTransport({
                host: 'smtp.resend.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'resend',
                    pass: env.RESEND_API_KEY,
                },
            });
        }
    }

    /**
     * Send email
     * @param options - Email options
     * @returns Promise<boolean> - Success status
     */
    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            const mailOptions = {
                from: options.from || env.EMAIL_FROM,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                replyTo: options.replyTo,
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${options.to}:`, result.messageId);
            return true;
        } catch (error) {
            console.error(`Failed to send email to ${options.to}:`, error);
            throw error;
        }
    }

    /**
     * Send form notification email to form owner
     * @param notificationEmail - Email address to send notification to
     * @param data - Email template data
     * @returns Promise<boolean> - Success status
     */
    async sendFormNotificationEmail(notificationEmail: string, data: EmailTemplateData): Promise<boolean> {
        const subject = `New submission for form: ${data.formName}`;
        const html = this.generateNotificationEmailHtml(data);
        const text = this.generateNotificationEmailText(data);

        return this.sendEmail({
            to: notificationEmail,
            subject,
            html,
            text,
        });
    }

    /**
     * Send auto-reply email to form submitter
     * @param submitterEmail - Email address of the submitter
     * @param data - Email template data
     * @returns Promise<boolean> - Success status
     */
    async sendAutoReplyEmail(submitterEmail: string, data: EmailTemplateData): Promise<boolean> {
        const subject = `Thank you for your submission - ${data.formName}`;
        const html = this.generateAutoReplyEmailHtml(data);
        const text = this.generateAutoReplyEmailText(data);

        return this.sendEmail({
            to: submitterEmail,
            subject,
            html,
            text,
            replyTo: env.EMAIL_FROM,
        });
    }

    /**
     * Generate HTML for notification email
     * @param data - Email template data
     * @returns string - HTML content
     */
    private generateNotificationEmailHtml(data: EmailTemplateData): string {
        const fieldsHtml = data.fields?.map(field => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f5f5f5;">${field.label}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${this.formatValue(field.value)}</td>
            </tr>
        `).join('') || '';

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
                        <p><strong>Form Name:</strong> ${data.formName}</p>
                        <p><strong>Form Description:</strong> ${data.formDescription || 'No description'}</p>
                        <p><strong>Submission ID:</strong> ${data.submissionId}</p>
                        <p><strong>Submitted At:</strong> ${data.submittedAt}</p>
                        ${data.submitterName ? `<p><strong>Submitter Name:</strong> ${data.submitterName}</p>` : ''}
                        ${data.submitterEmail ? `<p><strong>Submitter Email:</strong> ${data.submitterEmail}</p>` : ''}
                        ${data.ipAddress ? `<p><strong>IP Address:</strong> ${data.ipAddress}</p>` : ''}
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
     * Generate text version for notification email
     * @param data - Email template data
     * @returns string - Text content
     */
    private generateNotificationEmailText(data: EmailTemplateData): string {
        const fieldsText = data.fields?.map(field =>
            `${field.label}: ${this.formatValue(field.value)}`
        ).join('\n') || '';

        return `
New Form Submission

Form Details:
- Form Name: ${data.formName}
- Form Description: ${data.formDescription || 'No description'}
- Submission ID: ${data.submissionId}
- Submitted At: ${data.submittedAt}
${data.submitterName ? `- Submitter Name: ${data.submitterName}` : ''}
${data.submitterEmail ? `- Submitter Email: ${data.submitterEmail}` : ''}
${data.ipAddress ? `- IP Address: ${data.ipAddress}` : ''}

Submission Data:
${fieldsText}

Note: This is an automated notification. Please do not reply to this email.
        `.trim();
    }

    /**
     * Generate HTML for auto-reply email
     * @param data - Email template data
     * @returns string - HTML content
     */
    private generateAutoReplyEmailHtml(data: EmailTemplateData): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Thank you for your submission</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
                        Thank you for your submission!
                    </h2>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <p>We have received your submission for <strong>${data.formName}</strong>.</p>
                        ${data.formDescription ? `<p>${data.formDescription}</p>` : ''}
                        <p><strong>Submission ID:</strong> ${data.submissionId}</p>
                        <p><strong>Submitted At:</strong> ${data.submittedAt}</p>
                    </div>

                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #27ae60;">
                        <p style="margin: 0; color: #27ae60;">
                            <strong>What happens next?</strong><br>
                            We will review your submission and get back to you if needed. 
                            If you have any questions, please don't hesitate to contact us.
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                        <p>This is an automated response. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Generate text version for auto-reply email
     * @param data - Email template data
     * @returns string - Text content
     */
    private generateAutoReplyEmailText(data: EmailTemplateData): string {
        return `
Thank you for your submission!

We have received your submission for "${data.formName}".
${data.formDescription ? `\n${data.formDescription}\n` : ''}
Submission ID: ${data.submissionId}
Submitted At: ${data.submittedAt}

What happens next?
We will review your submission and get back to you if needed. 
If you have any questions, please don't hesitate to contact us.

This is an automated response. Please do not reply to this email.
        `.trim();
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

    /**
     * Verify email configuration
     * @returns Promise<boolean> - Configuration validity
     */
    async verifyConfiguration(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('Email configuration verified successfully');
            return true;
        } catch (error) {
            console.error('Email configuration verification failed:', error);
            return false;
        }
    }
}
