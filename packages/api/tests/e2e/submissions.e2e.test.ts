import request from 'supertest';
import { app } from '../../src/server';
import { e2eSetup } from './setup';

describe('Submissions E2E Tests', () => {
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
            email: 'submissions@example.com',
            password: 'password123',
        });

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'submissions@example.com',
                password: 'password123',
            });

        authToken = loginResponse.body.token;

        // Create test form
        testForm = await e2eSetup.createTestForm({
            name: 'Test Submission Form',
            endpointSlug: 'test-submission-form',
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

    describe('POST /api/forms/:endpointSlug/submit', () => {
        it('should submit form successfully', async () => {
            const submissionData = {
                formData: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    message: 'Hello, this is a test message',
                },
                name: 'John Doe',
                email: 'john@example.com',
                honeypot: '', // Empty honeypot
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body).toHaveProperty('submission');
            expect(response.body.submission.formId).toBe(testForm.id);
            expect(response.body.submission.name).toBe('John Doe');
            expect(response.body.submission.email).toBe('john@example.com');
            expect(response.body.submission.status).toBe('new');
            expect(response.body.submission.payload).toEqual(submissionData.formData);
        });

        it('should submit form with minimal data', async () => {
            const submissionData = {
                formData: {
                    message: 'Just a message',
                },
                honeypot: '', // Empty honeypot
            };

            const response = await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            expect(response.body.submission.formId).toBe(testForm.id);
            expect(response.body.submission.payload).toEqual(submissionData.formData);
        });

        it('should fail with non-existent form slug', async () => {
            const submissionData = {
                formData: { message: 'Test' },
                honeypot: '',
            };

            await request(app)
                .post('/api/forms/non-existent-slug/submit')
                .send(submissionData)
                .expect(404);
        });

        it('should fail with inactive form', async () => {
            // Create inactive form
            const inactiveForm = await e2eSetup.createTestForm({
                name: 'Inactive Form',
                endpointSlug: 'inactive-form',
                userId: testUser.id,
                isActive: false,
            });

            const submissionData = {
                formData: { message: 'Test' },
                honeypot: '',
            };

            await request(app)
                .post(`/api/forms/${inactiveForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(400);
        });

        it('should fail with filled honeypot (spam detection)', async () => {
            const submissionData = {
                formData: {
                    name: 'Spam Bot',
                    message: 'Buy my product!',
                },
                honeypot: 'spam-site.com', // Filled honeypot
            };

            await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(400);
        });

        it('should fail with invalid email format', async () => {
            const submissionData = {
                formData: {
                    name: 'John Doe',
                    email: 'invalid-email',
                    message: 'Test message',
                },
                email: 'invalid-email',
                honeypot: '',
            };

            await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(400);
        });

        it('should respect rate limiting', async () => {
            const submissionData = {
                formData: { message: 'Rate limit test' },
                honeypot: '',
            };

            // Submit multiple times quickly to trigger rate limiting
            for (let i = 0; i < 12; i++) { // Exceed the limit of 10
                const response = await request(app)
                    .post(`/api/forms/${testForm.endpointSlug}/submit`)
                    .send(submissionData);

                if (i < 10) {
                    expect(response.status).toBe(201);
                } else {
                    expect(response.status).toBe(429); // Rate limited
                }
            }
        });
    });

    describe('GET /api/submissions/:id', () => {
        let testSubmission: any;

        beforeEach(async () => {
            testSubmission = await e2eSetup.createTestSubmission({
                formId: testForm.id,
                payload: { message: 'Test submission' },
                name: 'Test User',
                email: 'test@example.com',
            });
        });

        it('should get submission by ID', async () => {
            const response = await request(app)
                .get(`/api/submissions/${testSubmission.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('submission');
            expect(response.body.submission.id).toBe(testSubmission.id);
            expect(response.body.submission.formId).toBe(testForm.id);
        });

        it('should fail without authentication', async () => {
            await request(app)
                .get(`/api/submissions/${testSubmission.id}`)
                .expect(401);
        });

        it('should fail with non-existent submission ID', async () => {
            await request(app)
                .get('/api/submissions/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('GET /api/forms/:formId/submissions', () => {
        beforeEach(async () => {
            // Create multiple test submissions
            await e2eSetup.createTestSubmission({
                formId: testForm.id,
                payload: { message: 'Submission 1' },
                name: 'User 1',
            });
            await e2eSetup.createTestSubmission({
                formId: testForm.id,
                payload: { message: 'Submission 2' },
                name: 'User 2',
            });
        });

        it('should get submissions for form', async () => {
            const response = await request(app)
                .get(`/api/forms/${testForm.id}/submissions`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('submissions');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.submissions)).toBe(true);
            expect(response.body.submissions.length).toBeGreaterThan(0);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get(`/api/forms/${testForm.id}/submissions?page=1&limit=1`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.submissions.length).toBeLessThanOrEqual(1);
        });

        it('should fail without authentication', async () => {
            await request(app)
                .get(`/api/forms/${testForm.id}/submissions`)
                .expect(401);
        });
    });

    describe('GET /api/user/submissions', () => {
        beforeEach(async () => {
            // Create submissions for the test user
            await e2eSetup.createTestSubmission({
                formId: testForm.id,
                payload: { message: 'User submission 1' },
                name: 'Test User',
            });
        });

        it('should get user submissions', async () => {
            const response = await request(app)
                .get('/api/user/submissions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('submissions');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.submissions)).toBe(true);
        });

        it('should fail without authentication', async () => {
            await request(app)
                .get('/api/user/submissions')
                .expect(401);
        });
    });

    describe('PUT /api/submissions/:id', () => {
        let testSubmission: any;

        beforeEach(async () => {
            testSubmission = await e2eSetup.createTestSubmission({
                formId: testForm.id,
                payload: { message: 'Original message' },
                name: 'Test User',
                status: 'new',
            });
        });

        it('should update submission status', async () => {
            const updateData = {
                status: 'read',
            };

            const response = await request(app)
                .put(`/api/submissions/${testSubmission.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('submission');
            expect(response.body.submission.status).toBe('read');
        });

        it('should update submission payload', async () => {
            const updateData = {
                payload: { message: 'Updated message' },
            };

            const response = await request(app)
                .put(`/api/submissions/${testSubmission.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.submission.payload).toEqual(updateData.payload);
        });

        it('should fail without authentication', async () => {
            const updateData = {
                status: 'read',
            };

            await request(app)
                .put(`/api/submissions/${testSubmission.id}`)
                .send(updateData)
                .expect(401);
        });

        it('should fail with invalid status', async () => {
            const updateData = {
                status: 'invalid-status',
            };

            await request(app)
                .put(`/api/submissions/${testSubmission.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);
        });
    });

    describe('Multiple submissions handling', () => {
        it('should allow multiple submissions when enabled', async () => {
            const submissionData = {
                formData: { message: 'First submission' },
                honeypot: '',
            };

            // First submission
            await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            // Second submission should also succeed
            submissionData.formData.message = 'Second submission';
            await request(app)
                .post(`/api/forms/${testForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);
        });

        it('should prevent multiple submissions when disabled', async () => {
            // Create form with multiple submissions disabled
            const restrictedForm = await e2eSetup.createTestForm({
                name: 'Restricted Form',
                endpointSlug: 'restricted-form',
                userId: testUser.id,
                settings: {
                    allowMultipleSubmissions: false,
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
            });

            const submissionData = {
                formData: { message: 'First submission' },
                honeypot: '',
            };

            // First submission should succeed
            await request(app)
                .post(`/api/forms/${restrictedForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(201);

            // Second submission should fail
            submissionData.formData.message = 'Second submission';
            await request(app)
                .post(`/api/forms/${restrictedForm.endpointSlug}/submit`)
                .send(submissionData)
                .expect(400);
        });
    });
});
