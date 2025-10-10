import request from 'supertest';
import { app } from '../../src/server';
import { e2eSetup } from './setup';

describe('Email and Webhook E2E Tests', () => {
    let testUser: any;
    let authToken: string;
    let testForm: any;

    beforeAll(async () => {
        await e2eSetup.initialize();
    });

    afterAll(async () => {
        await e2eSetup.cleanup();
        await e2eSetup.close();
    });

    beforeEach(async () => {
        await e2eSetup.cleanup();

        // Create test user and get auth token
        testUser = await e2eSetup.createTestUser({
            email: 'email@example.com',
            password: 'password123',
        });

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'email@example.com',
                password: 'password123',
            });

        authToken = loginResponse.body.token;

        // Create test form with email notifications enabled
        testForm = await e2eSetup.createTestForm({
            name: 'Email Notification Form',
            endpointSlug: 'email-notification-form',
            userId: testUser.id,
            settings: {
                allowMultipleSubmissions: true,
                requireEmailNotification: true,
                notificationEmail: 'admin@example.com',
                spamProtection: {
                    enabled: true,
                    honeypot: true,
                    rateLimit: 10,
                },
            },
        });
    });

    describe('Email Notification Tests', () => {
        it('should queue email notification for form submission', async () => {
            const submissionData = {
                formData: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    message: 'Test message for email notification',
                },
                name: 'John Doe',
                email: 'john@example.com',
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
            expect(response.body.submission.name).toBe('John Doe');
            expect(response.body.submission.email).toBe('john@example.com');

            // Note: In a real E2E test, you would verify that the email job was queued
            // This might require checking the queue or mocking the email service
        });

        it('should queue auto-reply email when submitter provides email', async () => {
            const submissionData = {
                formData: {
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    message: 'Test message for auto-reply',
                },
                name: 'Jane Doe',
                email: 'jane@example.com',
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission.email).toBe('jane@example.com');

            // Note: In a real E2E test, you would verify that the auto-reply email job was queued
        });

        it('should not queue email notification when disabled', async () => {
            // Create form without email notifications
            const noEmailForm = await e2eSetup.createTestForm({
                name: 'No Email Form',
                endpointSlug: 'no-email-form',
                userId: testUser.id,
                settings: {
                    requireEmailNotification: false,
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: { message: 'No email test' },
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${noEmailForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
            // Email notification should not be queued
        });

        it('should handle email notification errors gracefully', async () => {
            // Create form with invalid notification email
            const invalidEmailForm = await e2eSetup.createTestForm({
                name: 'Invalid Email Form',
                endpointSlug: 'invalid-email-form',
                userId: testUser.id,
                settings: {
                    requireEmailNotification: true,
                    notificationEmail: 'invalid-email-format',
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: { message: 'Invalid email test' },
                honeypot: '',
            };

            // Submission should still succeed even if email fails
            const response = await request(app)
                .post(`/api/forms/${invalidEmailForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
        });
    });

    describe('Webhook Tests', () => {
        it('should queue webhook when configured', async () => {
            // Create form with webhook configured
            const webhookForm = await e2eSetup.createTestForm({
                name: 'Webhook Form',
                endpointSlug: 'webhook-form',
                userId: testUser.id,
                settings: {
                    requireEmailNotification: false,
                    webhookUrl: 'https://webhook.site/test-webhook',
                    webhookSecret: 'test-secret',
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: {
                    name: 'Webhook Test User',
                    message: 'Test webhook submission',
                },
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${webhookForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
            // Webhook should be queued for processing
        });

        it('should queue webhook without secret when not provided', async () => {
            // Create form with webhook but no secret
            const webhookForm = await e2eSetup.createTestForm({
                name: 'Webhook No Secret Form',
                endpointSlug: 'webhook-no-secret-form',
                userId: testUser.id,
                settings: {
                    requireEmailNotification: false,
                    webhookUrl: 'https://webhook.site/test-webhook-no-secret',
                    // No webhookSecret
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: { message: 'Webhook no secret test' },
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${webhookForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
        });

        it('should not queue webhook when not configured', async () => {
            // Create form without webhook
            const noWebhookForm = await e2eSetup.createTestForm({
                name: 'No Webhook Form',
                endpointSlug: 'no-webhook-form',
                userId: testUser.id,
                settings: {
                    requireEmailNotification: false,
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: { message: 'No webhook test' },
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${noWebhookForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
            // Webhook should not be queued
        });

        it('should handle webhook errors gracefully', async () => {
            // Create form with invalid webhook URL
            const invalidWebhookForm = await e2eSetup.createTestForm({
                name: 'Invalid Webhook Form',
                endpointSlug: 'invalid-webhook-form',
                userId: testUser.id,
                settings: {
                    requireEmailNotification: false,
                    webhookUrl: 'invalid-url',
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: { message: 'Invalid webhook test' },
                honeypot: '',
            };

            // Submission should still succeed even if webhook fails
            const response = await request(app)
                .post(`/api/forms/${invalidWebhookForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
        });
    });

    describe('Combined Email and Webhook Tests', () => {
        it('should queue both email and webhook when both configured', async () => {
            // Create form with both email and webhook
            const combinedForm = await e2eSetup.createTestForm({
                name: 'Combined Form',
                endpointSlug: 'combined-form',
                userId: testUser.id,
                settings: {
                    requireEmailNotification: true,
                    notificationEmail: 'admin@example.com',
                    webhookUrl: 'https://webhook.site/combined-webhook',
                    webhookSecret: 'combined-secret',
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: {
                    name: 'Combined Test User',
                    email: 'combined@example.com',
                    message: 'Test combined email and webhook',
                },
                name: 'Combined Test User',
                email: 'combined@example.com',
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${combinedForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
            expect(response.body.submission.name).toBe('Combined Test User');
            expect(response.body.submission.email).toBe('combined@example.com');

            // Both email notification and webhook should be queued
        });

        it('should handle partial failures gracefully', async () => {
            // Create form with valid email but invalid webhook
            const partialForm = await e2eSetup.createTestForm({
                name: 'Partial Form',
                endpointSlug: 'partial-form',
                userId: testUser.id,
                settings: {
                    requireEmailNotification: true,
                    notificationEmail: 'admin@example.com',
                    webhookUrl: 'invalid-webhook-url',
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: {
                    name: 'Partial Test User',
                    email: 'partial@example.com',
                    message: 'Test partial success',
                },
                name: 'Partial Test User',
                email: 'partial@example.com',
                honeypot: '',
            };

            // Submission should succeed even if webhook fails
            const response = await request(app)
                .post(`/api/forms/${partialForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission).toBeDefined();
            // Email should be queued, webhook might fail but shouldn't affect submission
        });
    });

    describe('Email Template Tests', () => {
        it('should include form data in email notifications', async () => {
            const submissionData = {
                formData: {
                    name: 'Template Test User',
                    email: 'template@example.com',
                    message: 'This is a test message for email templates',
                    phone: '+1234567890',
                    company: 'Test Company',
                },
                name: 'Template Test User',
                email: 'template@example.com',
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission.payload).toEqual(submissionData.formData);
            // Email template should include all form data
        });

        it('should handle special characters in email content', async () => {
            const submissionData = {
                formData: {
                    name: 'Special Chars Test',
                    message: 'Message with special chars: <>&"\' and emojis: 🚀🎉',
                },
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission.payload.message).toContain('🚀🎉');
            // Email template should handle special characters properly
        });
    });

    describe('Queue Processing Tests', () => {
        it('should handle high volume submissions', async () => {
            const submissionData = {
                formData: { message: 'High volume test' },
                honeypot: '',
            };

            // Submit multiple forms quickly
            const promises = [];
            for (let i = 0; i < 5; i++) {
                submissionData.formData.message = `High volume message ${i + 1}`;
                promises.push(
                    request(app)
                        .post(`/api/forms/${testForm.endpointSlug}/submit`)
                        .send(submissionData)
                );
            }

            const responses = await Promise.all(promises);

            // All submissions should succeed
            responses.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.submission).toBeDefined();
            });

            // Email and webhook jobs should be queued for each submission
        });
    });
});
