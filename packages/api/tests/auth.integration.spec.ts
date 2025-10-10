import request from 'supertest';
import { app } from '../src/server';
import { getTestPrisma, resetDatabase } from './database';
import { testUtils } from './setup';

describe('Authentication Integration Tests', () => {
    const prisma = getTestPrisma();
    let testUser: { email: string; password: string };
    let createdUserId: string;
    let verificationToken: string;
    let authToken: string;

    beforeAll(async () => {
        // Reset database before each test suite
        await resetDatabase();
    });

    beforeEach(() => {
        // Generate fresh test user for each test
        testUser = testUtils.generateTestUser();
    });

    afterAll(async () => {
        // Clean up after all tests
        await resetDatabase();
    });

    describe('POST /api/auth/signup', () => {
        it('should create a new user and return 201 with user data', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(201);

            // Assert response structure
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('email', testUser.email);

            // Store created user ID for later tests
            createdUserId = response.body.data.id;

            // Assert user was created in database
            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
                include: { profile: true },
            });

            expect(userInDb).toBeTruthy();
            expect(userInDb?.email).toBe(testUser.email);
            expect(userInDb?.isEmailVerified).toBe(false);
            expect(userInDb?.verificationToken).toBeTruthy();
            expect(userInDb?.profile).toBeTruthy();

            // Store verification token for later tests
            verificationToken = userInDb?.verificationToken || '';
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'invalid-email',
                    password: testUser.password,
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
        });

        it('should return 400 for weak password', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: '123',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
        });

        it('should return 400 for duplicate email', async () => {
            // First signup
            await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(201);

            // Second signup with same email
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /api/auth/verify', () => {
        beforeEach(async () => {
            // Create a user first
            const signupResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            createdUserId = signupResponse.body.data.id;

            // Get verification token from database
            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
            });
            verificationToken = userInDb?.verificationToken || '';
        });

        it('should verify email successfully with valid token', async () => {
            const response = await request(app)
                .get(`/api/auth/verify?token=${verificationToken}`)
                .expect(200);

            // Assert response structure
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id', createdUserId);
            expect(response.body.data).toHaveProperty('email', testUser.email);
            expect(response.body.data).toHaveProperty('isEmailVerified', true);

            // Assert user is verified in database
            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
            });

            expect(userInDb?.isEmailVerified).toBe(true);
            expect(userInDb?.verificationToken).toBeNull();
        });

        it('should return 400 for invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/verify?token=invalid-token')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 for missing token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create and verify a user first
            const signupResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            createdUserId = signupResponse.body.data.id;

            // Get verification token and verify email
            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
            });
            verificationToken = userInDb?.verificationToken || '';

            await request(app)
                .get(`/api/auth/verify?token=${verificationToken}`)
                .expect(200);
        });

        it('should login successfully with verified email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            // Assert response structure
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('token');

            // Store token for later tests
            authToken = response.body.data.token;
        });

        it('should return 401 for unverified email', async () => {
            // Create a new user without verifying
            const newTestUser = testUtils.generateTestUser();
            await request(app)
                .post('/api/auth/signup')
                .send({
                    email: newTestUser.email,
                    password: newTestUser.password,
                });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: newTestUser.email,
                    password: newTestUser.password,
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 for missing email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: testUser.password,
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
        });
    });

    describe('GET /api/auth/me', () => {
        beforeEach(async () => {
            // Create, verify, and login a user first
            const signupResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            createdUserId = signupResponse.body.data.id;

            // Get verification token and verify email
            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
            });
            verificationToken = userInDb?.verificationToken || '';

            await request(app)
                .get(`/api/auth/verify?token=${verificationToken}`)
                .expect(200);

            // Login to get token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            authToken = loginResponse.body.data.token;
        });

        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Assert response structure
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id', createdUserId);
            expect(response.body.data).toHaveProperty('email', testUser.email);
        });

        it('should return 401 for missing token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        it('should return 401 for invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        it('should return 401 for malformed authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'InvalidFormat token')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/user/me', () => {
        beforeEach(async () => {
            // Create, verify, and login a user first
            const signupResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            createdUserId = signupResponse.body.data.id;

            // Get verification token and verify email
            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
            });
            verificationToken = userInDb?.verificationToken || '';

            await request(app)
                .get(`/api/auth/verify?token=${verificationToken}`)
                .expect(200);

            // Login to get token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            authToken = loginResponse.body.data.token;
        });

        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/user/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Assert response structure
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id', createdUserId);
            expect(response.body.data).toHaveProperty('email', testUser.email);
            expect(response.body.data).toHaveProperty('profile');
            expect(response.body.data.profile).toHaveProperty('name');
            expect(response.body.data.profile).toHaveProperty('bio');
            expect(response.body.data.profile).toHaveProperty('avatarUrl');
            expect(response.body.data.profile).toHaveProperty('website');
        });

        it('should return 401 for missing token', async () => {
            const response = await request(app)
                .get('/api/user/me')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });
});
