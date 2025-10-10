import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

/**
 * Global teardown for E2E tests
 * Runs once after all tests complete
 */
export default async function globalTeardown() {
    console.log('Cleaning up E2E test environment...');

    try {
        // Clean up test database
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL || 'file:./test.db',
                },
            },
        });

        await prisma.$connect();

        // Clean up all test data
        await prisma.submission.deleteMany({});
        await prisma.form.deleteMany({});
        await prisma.user.deleteMany({});

        await prisma.$disconnect();
        console.log('E2E test environment cleaned up');
    } catch (error) {
        console.error('Failed to cleanup E2E test environment:', error);
        // Don't throw error in teardown to avoid masking test failures
    }
}
