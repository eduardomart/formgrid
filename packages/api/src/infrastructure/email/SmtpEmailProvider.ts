import nodemailer, { Transporter } from 'nodemailer';
import { EmailProvider, EmailData, ExtendedEmailProvider } from './EmailProvider';
import { env } from '../../config/env';

/**
 * SMTP email provider using nodemailer
 * Sends actual emails through SMTP configuration
 */
export class SmtpEmailProvider implements ExtendedEmailProvider {
    private transporter: Transporter;

    constructor() {
        this.validateSmtpConfiguration();
        this.transporter = this.createTransporter();
    }

    /**
     * Validate that all required SMTP configuration is present
     * @throws Error if SMTP configuration is incomplete
     */
    private validateSmtpConfiguration(): void {
        const requiredVars = [
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER',
            'SMTP_PASS',
        ];

        const missingVars = requiredVars.filter(
            (varName) => !env[varName as keyof typeof env] || env[varName as keyof typeof env] === ''
        );

        if (missingVars.length > 0) {
            throw new Error(
                `SMTP configuration incomplete. Missing: ${missingVars.join(', ')}. ` +
                'Please set these environment variables in your .env file.'
            );
        }
    }

    /**
     * Create nodemailer transporter with SMTP configuration
     * @returns Transporter - Configured nodemailer transporter
     */
    private createTransporter(): Transporter {
        return nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465, // true for 465, false for other ports
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false, // Allow self-signed certificates
            },
        });
    }

    /**
     * Send an email via SMTP
     * @param to - Email address of the recipient
     * @param subject - Subject line of the email
     * @param html - HTML content of the email
     * @returns Promise<void> - Resolves when email is sent
     * @throws Error if email sending fails
     */
    async send(to: string, subject: string, html: string): Promise<void> {
        try {
            const mailOptions = {
                from: env.SMTP_FROM || env.SMTP_USER,
                to,
                subject,
                html,
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${to}. Message ID: ${result.messageId}`);
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error(`Failed to send email to ${to}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Send an email with extended options via SMTP
     * @param data - Email data with additional options
     * @returns Promise<void> - Resolves when email is sent
     * @throws Error if email sending fails
     */
    async sendExtended(data: EmailData): Promise<void> {
        try {
            const mailOptions = {
                from: data.from || env.SMTP_FROM || env.SMTP_USER,
                to: data.to,
                subject: data.subject,
                html: data.html,
                text: data.text, // Plain text version if provided
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${data.to}. Message ID: ${result.messageId}`);
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error(`Failed to send email to ${data.to}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Verify SMTP connection
     * @returns Promise<boolean> - True if connection is successful
     */
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('SMTP connection verified successfully');
            return true;
        } catch (error) {
            console.error('SMTP connection verification failed:', error);
            return false;
        }
    }

    /**
     * Close the SMTP transporter connection
     * @returns Promise<void> - Resolves when connection is closed
     */
    async close(): Promise<void> {
        this.transporter.close();
    }
}
