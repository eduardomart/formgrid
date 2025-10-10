#!/usr/bin/env node

import { config } from 'dotenv';
import { MailerService, EmailTemplateData } from './services/mailerService';

// Load environment variables
config();

/**
 * Test script for email functionality
 */
async function testEmail() {
    console.log('🧪 Testing email functionality...');

    const mailerService = new MailerService();

    // Test configuration
    try {
        const isConfigValid = await mailerService.verifyConfiguration();
        if (!isConfigValid) {
            console.error('❌ Email configuration is invalid');
            return;
        }
        console.log('✅ Email configuration verified');
    } catch (error) {
        console.error('❌ Email configuration verification failed:', error);
        return;
    }

    // Test template data
    const templateData: EmailTemplateData = {
        formName: 'Contact Form',
        formDescription: 'A simple contact form for testing',
        submissionId: 'test-submission-123',
        submittedAt: new Date().toLocaleString(),
        submitterName: 'John Doe',
        submitterEmail: 'john.doe@example.com',
        ipAddress: '192.168.1.1',
        formData: {
            message: 'This is a test message',
            subject: 'Test Subject',
            priority: 'high'
        },
        fields: [
            { id: 'message', label: 'Message', value: 'This is a test message' },
            { id: 'subject', label: 'Subject', value: 'Test Subject' },
            { id: 'priority', label: 'Priority', value: 'high' }
        ]
    };

    // Test notification email (only if EMAIL_FROM is configured)
    if (process.env.EMAIL_FROM && process.env.EMAIL_FROM !== 'your-app@example.com') {
        try {
            console.log('📧 Testing notification email...');
            await mailerService.sendFormNotificationEmail(
                process.env.EMAIL_FROM, // Send to self for testing
                templateData
            );
            console.log('✅ Notification email sent successfully');
        } catch (error) {
            console.error('❌ Failed to send notification email:', error);
        }
    } else {
        console.log('⚠️ Skipping notification email test - EMAIL_FROM not configured');
    }

    // Test auto-reply email (only if EMAIL_FROM is configured)
    if (process.env.EMAIL_FROM && process.env.EMAIL_FROM !== 'your-app@example.com') {
        try {
            console.log('📧 Testing auto-reply email...');
            await mailerService.sendAutoReplyEmail(
                process.env.EMAIL_FROM, // Send to self for testing
                templateData
            );
            console.log('✅ Auto-reply email sent successfully');
        } catch (error) {
            console.error('❌ Failed to send auto-reply email:', error);
        }
    } else {
        console.log('⚠️ Skipping auto-reply email test - EMAIL_FROM not configured');
    }

    console.log('🎉 Email testing completed');
}

// Run the test
testEmail().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
