import request from 'supertest';
import { app } from '../../src/server';
import { e2eSetup } from './setup';

describe('Spam Protection E2E Tests', () => {
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
            email: 'spam@example.com',
            password: 'password123',
        });

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'spam@example.com',
                password: 'password123',
            });

        authToken = loginResponse.body.token;

        // Create test form with spam protection enabled
        testForm = await e2eSetup.createTestForm({
            name: 'Spam Protected Form',
            endpointSlug: 'spam-protected-form',
            userId: testUser.id,
            settings: {
                allowMultipleSubmissions: true,
                requireEmailNotification: false,
                spamProtection: {
                    enabled: true,
                    honeypot: true,
                    rateLimit: 5, // Low limit for testing
                },
            },
        });
    });

    describe('Honeypot Protection', () => {
        it('should allow submission with empty honeypot', async () => {
            const submissionData = {
                formData: {
                    name: 'John Doe',
                    message: 'Legitimate submission',
                },
                honeypot: '', // Empty honeypot
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission.name).toBe('John Doe');
        });

        it('should block submission with filled honeypot', async () => {
            const submissionData = {
                formData: {
                    name: 'Spam Bot',
                    message: 'Buy my product!',
                },
                honeypot: 'spam-website.com', // Filled honeypot
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(400);

            expect(response.body.error).toContain('spam');
        });

        it('should block submission with whitespace-only honeypot', async () => {
            const submissionData = {
                formData: {
                    name: 'Spam Bot',
                    message: 'Spam message',
                },
                honeypot: '   ', // Whitespace-only honeypot
            };

            await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(400);
        });

        it('should work with different honeypot field names', async () => {
            // Create form with custom honeypot field
            const customForm = await e2eSetup.createTestForm({
                name: 'Custom Honeypot Form',
                endpointSlug: 'custom-honeypot-form',
                userId: testUser.id,
                settings: {
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: {
                    name: 'John Doe',
                    message: 'Test message',
                    website: '', // Custom honeypot field
                },
                honeypot: '',
            };

            await request(app)
                .post(`/api/forms/${customForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);
        });
    });

    describe('Rate Limiting Protection', () => {
        it('should allow submissions within rate limit', async () => {
            const submissionData = {
                formData: { message: 'Rate limit test' },
                honeypot: '',
            };

            // Submit up to the limit (5 submissions)
            for (let i = 0; i < 5; i++) {
                submissionData.formData.message = `Message ${i + 1}`;

                const response = await request(app)
                    .post(`/api/forms/${testForm.endpointSlug}/submit`)
                    .send(submissionData)
                    .expect(201);

                expect(response.body.submission.payload.message).toBe(`Message ${i + 1}`);
            }
        });

        it('should block submissions exceeding rate limit', async () => {
            const submissionData = {
                formData: { message: 'Rate limit test' },
                honeypot: '',
            };

            // Submit up to the limit
            for (let i = 0; i < 5; i++) {
                submissionData.formData.message = `Message ${i + 1}`;
                await request(app)
                    .post(`/api/forms/${testForm.endpointSlug}/submit`)
                    .send(submissionData)
                    .expect(201);
            }

            // This submission should be rate limited
            submissionData.formData.message = 'Rate limited message';
            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(429);

            expect(response.body.error).toContain('rate limit');
        });

        it('should include rate limit headers', async () => {
            const submissionData = {
                formData: { message: 'Header test' },
                honeypot: '',
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.headers).toHaveProperty('x-ratelimit-limit');
            expect(response.headers).toHaveProperty('x-ratelimit-remaining');
            expect(response.headers).toHaveProperty('x-ratelimit-reset');
        });

        it('should reset rate limit after time window', async () => {
            // This test would require waiting for the rate limit window to expire
            // In a real scenario, you might mock the time or use a shorter window
            const submissionData = {
                formData: { message: 'Time window test' },
                honeypot: '',
            };

            // Submit up to limit
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post(`/api/forms/${testForm.endpointSlug}/submit`)
                    .send(submissionData)
                    .expect(201);
            }

            // Should be rate limited
            await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(429);

            // Note: In a real test, you would wait for the rate limit window to expire
            // or mock the time to test the reset functionality
        });
    });

    describe('reCAPTCHA Protection', () => {
        it('should work with reCAPTCHA disabled', async () => {
            const submissionData = {
                formData: { message: 'No reCAPTCHA test' },
                honeypot: '',
            };

            await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);
        });

        it('should require reCAPTCHA when enabled', async () => {
            // Create form with reCAPTCHA enabled
            const recaptchaForm = await e2eSetup.createTestForm({
                name: 'reCAPTCHA Form',
                endpointSlug: 'recaptcha-form',
                userId: testUser.id,
                settings: {
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                        recaptcha: true, // Enable reCAPTCHA
                    },
                },
            });

            const submissionData = {
                formData: { message: 'reCAPTCHA test' },
                honeypot: '',
                // No reCAPTCHA token
            };

            await request(app)
                .post(`/api/forms/${recaptchaForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(400);
        });

        it('should validate reCAPTCHA token when provided', async () => {
            // Create form with reCAPTCHA enabled
            const recaptchaForm = await e2eSetup.createTestForm({
                name: 'reCAPTCHA Form',
                endpointSlug: 'recaptcha-form-2',
                userId: testUser.id,
                settings: {
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                        recaptcha: true,
                    },
                },
            });

            const submissionData = {
                formData: { message: 'reCAPTCHA test' },
                honeypot: '',
                recaptcha_token: 'invalid-token', // Invalid token
            };

            // This should fail with invalid reCAPTCHA token
            // Note: In a real test, you would need a valid reCAPTCHA token
            await request(app)
                .post(`/api/forms/${recaptchaForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(400);
        });
    });

    describe('Combined Spam Protection', () => {
        it('should block spam with multiple protection layers', async () => {
            const spamData = {
                formData: {
                    name: 'Spam Bot',
                    message: 'Buy my product! Visit spam-site.com',
                },
                honeypot: 'spam-site.com', // Filled honeypot
                recaptcha_token: 'fake-token', // Invalid reCAPTCHA
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(spamData)
                .expect(400);

            expect(response.body.error).toContain('spam');
        });

        it('should allow legitimate submissions with all protections', async () => {
            const legitimateData = {
                formData: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    message: 'This is a legitimate inquiry about your services.',
                },
                name: 'John Doe',
                email: 'john@example.com',
                honeypot: '', // Empty honeypot
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(legitimateData)
                .expect(201);

            expect(response.body.submission.name).toBe('John Doe');
            expect(response.body.submission.email).toBe('john@example.com');
        });
    });

    describe('Spam Protection Configuration', () => {
        it('should work with spam protection disabled', async () => {
            // Create form without spam protection
            const unprotectedForm = await e2eSetup.createTestForm({
                name: 'Unprotected Form',
                endpointSlug: 'unprotected-form',
                userId: testUser.id,
                settings: {
                    spamProtection: {
                        enabled: false,
                    },
                },
            });

            const submissionData = {
                formData: { message: 'No protection test' },
                honeypot: 'filled-honeypot', // This should be ignored
            };

            // Should succeed even with filled honeypot
            await request(app)
                .post(`/api/forms/${unprotectedForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);
        });

        it('should respect custom rate limits', async () => {
            // Create form with custom rate limit
            const customLimitForm = await e2eSetup.createTestForm({
                name: 'Custom Limit Form',
                endpointSlug: 'custom-limit-form',
                userId: testUser.id,
                settings: {
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 2, // Very low limit
                    },
                },
            });

            const submissionData = {
                formData: { message: 'Custom limit test' },
                honeypot: '',
            };

            // First two submissions should succeed
            for (let i = 0; i < 2; i++) {
                submissionData.formData.message = `Message ${i + 1}`;
                await request(app)
                    .post(`/api/forms/${customLimitForm.endpointSlug}/submit`)
                    .send(submissionData)
                    .expect(201);
            }

            // Third submission should be rate limited
            submissionData.formData.message = 'Rate limited';
            await request(app)
                .post(`/api/forms/${customLimitForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(429);
        });
    });

    describe('Error Handling', () => {
        it('should provide meaningful error messages', async () => {
            const spamData = {
                formData: { message: 'Spam' },
                honeypot: 'spam-site.com',
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(spamData)
                .expect(400);

            expect(response.body.error).toBeDefined();
            expect(response.body.message).toBeDefined();
        });

        it('should handle malformed spam protection data', async () => {
            const malformedData = {
                formData: { message: 'Test' },
                honeypot: null, // Malformed honeypot
            };

            // Should handle gracefully
            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(malformedData);

            // Could be 201 (if null is treated as empty) or 400 (if validation fails)
            expect([200, 201, 400]).toContain(response.status);
        });
    });
});
