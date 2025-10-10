import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { env } from '../config/env';

/**
 * Rate limit configuration interface
 */
interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    keyGenerator?: (req: Request) => string; // Custom key generator
    skipSuccessfulRequests?: boolean; // Skip counting successful requests
    skipFailedRequests?: boolean; // Skip counting failed requests
    message?: string; // Custom error message
}

/**
 * Rate limit result
 */
interface RateLimitResult {
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

/**
 * Enhanced rate limiting middleware using Redis
 */
export class EnhancedRateLimit {
    private redis: Redis;
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = {
            ...config,
            windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes default
            maxRequests: config.maxRequests || 100, // 100 requests default
            message: config.message || 'Too many requests, please try again later.',
        };

        // Initialize Redis connection
        this.redis = new Redis({
            host: env.REDIS_HOST,
            port: parseInt(env.REDIS_PORT),
            db: parseInt(env.REDIS_DB),
            ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
            maxRetriesPerRequest: 3,
        });

        // Handle Redis connection errors
        this.redis.on('error', (error) => {
            console.error('Redis connection error in rate limiter:', error);
        });
    }

    /**
     * Create rate limiting middleware
     */
    middleware() {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);
                const result = await this.checkRateLimit(key);

                // Set rate limit headers
                res.set({
                    'X-RateLimit-Limit': result.limit.toString(),
                    'X-RateLimit-Remaining': result.remaining.toString(),
                    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
                });

                if (result.remaining < 0) {
                    res.set('Retry-After', result.retryAfter?.toString() || '60');
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: this.config.message,
                        retryAfter: result.retryAfter,
                    });
                }

                next();
            } catch (error) {
                console.error('Rate limiting error:', error);
                // On error, allow the request to proceed
                return next();
            }
        };
    }

    /**
     * Check rate limit for a given key
     * @param key - Rate limit key
     * @returns Rate limit result
     */
    private async checkRateLimit(key: string): Promise<RateLimitResult> {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        const windowEnd = now;

        // Use Redis pipeline for atomic operations
        const pipeline = this.redis.pipeline();

        // Remove expired entries
        pipeline.zremrangebyscore(key, '-inf', windowStart);

        // Count current requests in window
        pipeline.zcard(key);

        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);

        // Set expiration
        pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

        const results = await pipeline.exec();

        if (!results) {
            throw new Error('Redis pipeline execution failed');
        }

        const currentCount = (results[1]?.[1] as number) || 0;
        const remaining = Math.max(0, this.config.maxRequests - currentCount - 1);
        const reset = now + this.config.windowMs;

        return {
            limit: this.config.maxRequests,
            remaining,
            reset,
            retryAfter: remaining < 0 ? Math.ceil(this.config.windowMs / 1000) : 0,
        };
    }

    /**
     * Get default key for rate limiting
     * @param req - Express request
     * @returns Rate limit key
     */
    private getDefaultKey(req: Request): string {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return `rate_limit:${ip}`;
    }

    /**
     * Get rate limit status for a key
     * @param key - Rate limit key
     * @returns Current rate limit status
     */
    async getStatus(key: string): Promise<RateLimitResult | null> {
        try {
            const now = Date.now();
            const windowStart = now - this.config.windowMs;

            // Remove expired entries and get count
            await this.redis.zremrangebyscore(key, '-inf', windowStart);
            const count = await this.redis.zcard(key);

            return {
                limit: this.config.maxRequests,
                remaining: Math.max(0, this.config.maxRequests - count),
                reset: now + this.config.windowMs,
            };
        } catch (error) {
            console.error('Error getting rate limit status:', error);
            return null;
        }
    }

    /**
     * Reset rate limit for a key
     * @param key - Rate limit key
     */
    async reset(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error('Error resetting rate limit:', error);
        }
    }

    /**
     * Close Redis connection
     */
    async close(): Promise<void> {
        await this.redis.quit();
    }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
    // General API rate limiting
    api: new EnhancedRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        keyGenerator: (req) => `api:${req.ip}`,
        message: 'API rate limit exceeded. Please try again later.',
    }),

    // Form submission rate limiting (per IP)
    formSubmission: new EnhancedRateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        keyGenerator: (req) => `form_submission:${req.ip}`,
        message: 'Too many form submissions. Please wait before submitting again.',
    }),

    // Form-specific rate limiting (per IP + Form)
    formSpecific: new EnhancedRateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5,
        keyGenerator: (req) => {
            const formId = req.params.formId || req.params.uuid || 'unknown';
            return `form_specific:${req.ip}:${formId}`;
        },
        message: 'Too many submissions to this form. Please wait before submitting again.',
    }),

    // Strict rate limiting for sensitive operations
    strict: new EnhancedRateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 3,
        keyGenerator: (req) => `strict:${req.ip}`,
        message: 'Too many requests. Please wait before trying again.',
    }),
};

/**
 * Middleware factory for creating custom rate limiters
 * @param config - Rate limit configuration
 * @returns Express middleware function
 */
export function createRateLimit(config: RateLimitConfig) {
    const limiter = new EnhancedRateLimit(config);
    return limiter.middleware();
}
