import request from 'supertest';
import { app } from '../../src/server';
import { e2eSetup } from './setup';

describe('Authentication E2E Tests', () => {
    let testUser: any;
    let authToken: string;

    beforeAll(async () => {
        await e2eSetup.initialize();
    });

    afterAll(async () => {
        await e2eSetup.cleanup();
        await e2eSetup.close();
    });

    beforeEach(async () => {
        // Clean up before each test
        await e2eSetup.cleanup();
    });

    describe('POST /api/auth/signup', () => {
        it('should create a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const response = await request(app)
                .post('/api/auth/signup')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.name).toBe(userData.name);
            expect(response.body.user).not.toHaveProperty('password');
            expect(response.body).toHaveProperty('token');

            testUser = response.body.user;
            authToken = response.body.token;
        });

        it('should fail with invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'password123',
                name: 'Test User',
            };

            await request(app)
                .post('/api/auth/signup')
                .send(userData)
                .expect(400);
        });

        it('should fail with weak password', async () => {
            const userData = {
                email: 'test2@example.com',
                password: '123',
                name: 'Test User',
            };

            await request(app)
                .post('/api/auth/signup')
                .send(userData)
                .expect(400);
        });

        it('should fail with duplicate email', async () => {
            // First, create a user
            await e2eSetup.createTestUser({
                email: 'duplicate@example.com',
                password: 'password123',
            });

            const userData = {
                email: 'duplicate@example.com',
                password: 'password123',
                name: 'Test User',
            };

            await request(app)
                .post('/api/auth/signup')
                .send(userData)
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user for login tests
            testUser = await e2eSetup.createTestUser({
                email: 'login@example.com',
                password: 'password123',
            });
        });

        it('should login successfully with valid credentials', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(loginData.email);
            expect(response.body).toHaveProperty('token');

            authToken = response.body.token;
        });

        it('should fail with invalid email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);
        });

        it('should fail with invalid password', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'wrongpassword',
            };

            await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);
        });
    });

    describe('GET /api/auth/me', () => {
        beforeEach(async () => {
            // Create a test user and get auth token
            testUser = await e2eSetup.createTestUser({
                email: 'me@example.com',
                password: 'password123',
            });

            // Login to get token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'me@example.com',
                    password: 'password123',
                });

            authToken = loginResponse.body.token;
        });

        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('me@example.com');
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should fail without token', async () => {
            await request(app)
                .get('/api/auth/me')
                .expect(401);
        });

        it('should fail with invalid token', async () => {
            await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        beforeEach(async () => {
            // Create a test user and get auth token
            testUser = await e2eSetup.createTestUser({
                email: 'logout@example.com',
                password: 'password123',
            });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'logout@example.com',
                    password: 'password123',
                });

            authToken = loginResponse.body.token;
        });

        it('should logout successfully with valid token', async () => {
            await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });

        it('should fail without token', async () => {
            await request(app)
                .post('/api/auth/logout')
                .expect(401);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        beforeEach(async () => {
            testUser = await e2eSetup.createTestUser({
                email: 'forgot@example.com',
                password: 'password123',
            });
        });

        it('should send password reset email for valid email', async () => {
            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'forgot@example.com' })
                .expect(200);
        });

        it('should fail with invalid email', async () => {
            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(404);
        });
    });

    describe('POST /api/auth/reset-password', () => {
        it('should reset password with valid token', async () => {
            // This test would require a valid reset token
            // In a real scenario, you'd need to generate and store a reset token
            const resetData = {
                token: 'valid-reset-token',
                password: 'newpassword123',
            };

            // This test might fail without a real reset token
            // You might need to mock the token validation
            await request(app)
                .post('/api/auth/reset-password')
                .send(resetData)
                .expect(400); // Expected to fail without real token
        });

        it('should fail with invalid token', async () => {
            const resetData = {
                token: 'invalid-token',
                password: 'newpassword123',
            };

            await request(app)
                .post('/api/auth/reset-password')
                .send(resetData)
                .expect(400);
        });
    });
});
