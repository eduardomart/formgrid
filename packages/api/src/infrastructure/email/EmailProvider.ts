/**
 * Email provider interface for sending emails
 * Allows for pluggable email implementations (console, SMTP, etc.)
 */
export interface EmailProvider {
    /**
     * Send an email to the specified recipient
     * @param to - Email address of the recipient
     * @param subject - Subject line of the email
     * @param html - HTML content of the email
     * @returns Promise<void> - Resolves when email is sent
     */
    send(to: string, subject: string, html: string): Promise<void>;
}

/**
 * Email data structure for more detailed email sending
 */
export interface EmailData {
    to: string;
    subject: string;
    html: string;
    text?: string; // Plain text version
    from?: string; // Optional sender override
}

/**
 * Extended email provider interface with additional options
 */
export interface ExtendedEmailProvider extends EmailProvider {
    /**
     * Send an email with extended options
     * @param data - Email data with additional options
     * @returns Promise<void> - Resolves when email is sent
     */
    sendExtended(data: EmailData): Promise<void>;
}
