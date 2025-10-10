import { z } from 'zod';

/**
 * Validation schemas for user profile endpoints
 */

// Update profile validation
export const updateProfileSchema = z.object({
    name: z.string().max(100, 'Name must be 100 characters or less').nullable().optional(),
    bio: z.string().max(500, 'Bio must be 500 characters or less').nullable().optional(),
    avatarUrl: z.string().url('Invalid avatar URL format').nullable().optional(),
    website: z.string().url('Invalid website URL format').max(200, 'Website URL must be 200 characters or less').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

