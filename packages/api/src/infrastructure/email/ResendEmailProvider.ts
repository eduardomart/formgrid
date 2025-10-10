import { Resend } from 'resend';
import { EmailProvider } from './EmailProvider';
import { env } from '../../config/env';

export class ResendEmailProvider implements EmailProvider {
    private resend: Resend;

    constructor(apiKey: string) {
        this.resend = new Resend(apiKey);
    }

    async send(to: string, subject: string, html: string): Promise<void> {
        try {
            const { data, error } = await this.resend.emails.send({
                from: env.EMAIL_FROM,
                to: [to],
                subject,
                html,
            });

            if (error) {
                console.error('Resend error:', error);
                throw new Error(`Failed to send email: ${error.message}`);
            }

            console.log('Email sent successfully via Resend:', data);
        } catch (error) {
            console.error('Failed to send email via Resend:', error);
            throw new Error('Failed to send email');
        }
    }
}
