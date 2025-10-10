// Export email interfaces and providers
export { EmailProvider, EmailData, ExtendedEmailProvider } from './EmailProvider';
export { ConsoleEmailProvider } from './ConsoleEmailProvider';
export { SmtpEmailProvider } from './SmtpEmailProvider';

// Email provider factory function
import { EmailProvider } from './EmailProvider';
import { ConsoleEmailProvider } from './ConsoleEmailProvider';
import { SmtpEmailProvider } from './SmtpEmailProvider';
import { env } from '../../config/env';

/**
 * Create an email provider based on environment configuration
 * @returns EmailProvider - The appropriate email provider instance
 */
export function createEmailProvider(): EmailProvider {
  const provider = env.EMAIL_PROVIDER.toLowerCase();

  switch (provider) {
    case 'resend':
      try {
        // Dynamic import to avoid loading ResendEmailProvider when not needed
        const { ResendEmailProvider } = require('./ResendEmailProvider');
        if (!env.RESEND_API_KEY) {
          throw new Error('RESEND_API_KEY is not configured');
        }
        if (!env.EMAIL_FROM) {
          throw new Error('EMAIL_FROM is not configured');
        }
        return new ResendEmailProvider(env.RESEND_API_KEY);
      } catch (error) {
        console.warn('Resend configuration incomplete, falling back to console provider:', (error as Error).message);
        return new ConsoleEmailProvider();
      }
    case 'smtp':
      try {
        return new SmtpEmailProvider();
      } catch (error) {
        console.warn('SMTP configuration incomplete, falling back to console provider:', (error as Error).message);
        return new ConsoleEmailProvider();
      }
    case 'console':
    default:
      return new ConsoleEmailProvider();
  }
}

// Example usage:
/*
import { createEmailProvider, ConsoleEmailProvider, SmtpEmailProvider } from './infrastructure/email';

// Method 1: Use factory function (recommended)
const emailProvider = createEmailProvider();
await emailProvider.send('user@example.com', 'Welcome!', '<h1>Welcome to our app!</h1>');

// Method 2: Use specific providers directly
const consoleProvider = new ConsoleEmailProvider();
await consoleProvider.send('test@example.com', 'Test Email', '<p>This is a test email</p>');

// Method 3: SMTP provider (requires proper env configuration)
try {
  const smtpProvider = new SmtpEmailProvider();
  await smtpProvider.send('user@example.com', 'Welcome!', '<h1>Welcome!</h1>');
} catch (error) {
  console.error('SMTP not configured:', error.message);
}

// Method 4: Extended email with additional options
const extendedProvider = new ConsoleEmailProvider();
await extendedProvider.sendExtended({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome!</h1>',
  text: 'Welcome!',
  from: 'noreply@example.com'
});
*/
