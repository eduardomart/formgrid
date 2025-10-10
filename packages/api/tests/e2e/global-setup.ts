import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables
config({ path: '.env.test' });

/**
 * Global setup for E2E tests
 * Runs once before all tests
 */
export default async function globalSetup() {
    console.log('Setting up E2E test environment...');

    try {
        // Initialize test database
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL || 'file:./test.db',
                },
            },
        });

        await prisma.$connect();
        console.log('✅ Database connected');

        // Run database migrations or ensure schema is up to date
        // Note: In a real scenario, you might want to run migrations here
        // or ensure the test database schema is properly set up

        await prisma.$disconnect();
        console.log('E2E test environment ready');
    } catch (error) {
        console.error('Failed to setup E2E test environment:', error);
        throw error;
    }
}
