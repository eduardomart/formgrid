import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

/**
 * E2E Test Setup
 * Handles database setup and cleanup for end-to-end tests
 */
export class E2ETestSetup {
    private prisma: PrismaClient;
    private testUsers: any[] = [];
    private testForms: any[] = [];
    private testSubmissions: any[] = [];

    constructor() {
        this.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL || 'file:./test.db',
                },
            },
        });
    }

    /**
     * Initialize test database
     */
    async initialize(): Promise<void> {
        try {
            // Connect to database
            await this.prisma.$connect();

            // Clean up any existing test data
            await this.cleanup();

            console.log('E2E test database initialized');
        } catch (error) {
            console.error('Failed to initialize E2E test database:', error);
            throw error;
        }
    }

    /**
     * Create test user
     */
    async createTestUser(userData: {
        email: string;
        password: string;
        name?: string;
        isVerified?: boolean;
    }): Promise<any> {
        const user = await this.prisma.user.create({
            data: {
                email: userData.email,
                password: userData.password,
                name: userData.name || 'Test User',
                isVerified: userData.isVerified || true,
            },
        });

        this.testUsers.push(user);
        return user;
    }

    /**
     * Create test form
     */
    async createTestForm(formData: {
        name: string;
        description?: string;
        endpointSlug?: string;
        settings?: any;
        userId: string;
        isActive?: boolean;
    }): Promise<any> {
        const form = await this.prisma.form.create({
            data: {
                name: formData.name,
                description: formData.description || 'Test form description',
                endpointSlug: formData.endpointSlug || this.generateSlug(formData.name),
                settings: formData.settings || {
                    allowMultipleSubmissions: true,
                    requireEmailNotification: false,
                    spamProtection: {
                        enabled: true,
                        honeypot: true,
                        rateLimit: 10,
                    },
                },
                userId: formData.userId,
                isActive: formData.isActive !== false,
            },
        });

        this.testForms.push(form);
        return form;
    }

    /**
     * Create test submission
     */
    async createTestSubmission(submissionData: {
        formId: string;
        payload: any;
        name?: string;
        email?: string;
        ip?: string;
        userAgent?: string;
        status?: string;
    }): Promise<any> {
        const submission = await this.prisma.submission.create({
            data: {
                formId: submissionData.formId,
                payload: submissionData.payload,
                name: submissionData.name,
                email: submissionData.email,
                ip: submissionData.ip || '127.0.0.1',
                userAgent: submissionData.userAgent || 'Test Agent',
                status: submissionData.status || 'new',
            },
        });

        this.testSubmissions.push(submission);
        return submission;
    }

    /**
     * Generate unique slug
     */
    private generateSlug(name: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        return `${name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${random}`;
    }

    /**
     * Get test user by email
     */
    async getTestUser(email: string): Promise<any> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Get test form by slug
     */
    async getTestForm(slug: string): Promise<any> {
        return this.prisma.form.findUnique({
            where: { endpointSlug: slug },
        });
    }

    /**
     * Clean up test data
     */
    async cleanup(): Promise<void> {
        try {
            // Delete in reverse order to respect foreign key constraints
            await this.prisma.submission.deleteMany({
                where: {
                    id: {
                        in: this.testSubmissions.map(s => s.id),
                    },
                },
            });

            await this.prisma.form.deleteMany({
                where: {
                    id: {
                        in: this.testForms.map(f => f.id),
                    },
                },
            });

            await this.prisma.user.deleteMany({
                where: {
                    id: {
                        in: this.testUsers.map(u => u.id),
                    },
                },
            });

            // Clear arrays
            this.testUsers = [];
            this.testForms = [];
            this.testSubmissions = [];

            console.log('E2E test data cleaned up');
        } catch (error) {
            console.error('Failed to cleanup E2E test data:', error);
            throw error;
        }
    }

    /**
     * Close database connection
     */
    async close(): Promise<void> {
        await this.prisma.$disconnect();
    }

    /**
     * Get Prisma client for direct database access
     */
    getPrisma(): PrismaClient {
        return this.prisma;
    }
}

// Export singleton instance
export const e2eSetup = new E2ETestSetup();
