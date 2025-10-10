import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment configuration interface
interface EnvConfig {
    // App configuration
    APP_URL: string;
    PORT: number;
    NODE_ENV: string;

    // Database
    DATABASE_URL: string;

    // JWT
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;

    // Email
    EMAIL_PROVIDER: string;
    EMAIL_FROM: string;
    RESEND_API_KEY: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_FROM: string;

    // Google OAuth
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;

    // Redis
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_DB: string;
    REDIS_PASSWORD?: string;

    // reCAPTCHA
    RECAPTCHA_SECRET_KEY?: string;
    RECAPTCHA_SITE_KEY?: string;
}

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
] as const;

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
}

// Export typed environment configuration
export const env: EnvConfig = {
    // App configuration
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database
    DATABASE_URL: process.env.DATABASE_URL!,

    // JWT
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Email
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'resend',
    EMAIL_FROM: process.env.EMAIL_FROM || 'Auth Starter <onboarding@resend.dev>',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || '',

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

    // Redis
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || '6379',
    REDIS_DB: process.env.REDIS_DB || '0',
    ...(process.env.REDIS_PASSWORD && { REDIS_PASSWORD: process.env.REDIS_PASSWORD }),

    // reCAPTCHA
    ...(process.env.RECAPTCHA_SECRET_KEY && { RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY }),
    ...(process.env.RECAPTCHA_SITE_KEY && { RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY }),
};

// Export individual constants for convenience
export const {
    APP_URL,
    PORT,
    NODE_ENV,
    DATABASE_URL,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    EMAIL_PROVIDER,
    EMAIL_FROM,
    RESEND_API_KEY,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    RECAPTCHA_SECRET_KEY,
    RECAPTCHA_SITE_KEY,
} = env;

// Export default
export default env;
