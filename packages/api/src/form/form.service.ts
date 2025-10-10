import { FormRepository } from './form.repository';
import { Form } from '@prisma/client';

/**
 * Form service for business logic operations
 */
export class FormService {
    constructor(private formRepo: FormRepository) { }

    /**
     * Create a new form
     * @param data - Form creation data
     * @param userId - ID of the user creating the form
     * @returns Promise<Form> - The created form
     * @throws Error if creation fails
     */
    async create(data: {
        name: string;
        description?: string | null;
        endpointSlug?: string;
        settings?: any;
    }, userId: string): Promise<Form> {
        // Generate endpoint slug if not provided
        const endpointSlug = data.endpointSlug || await this.generateUniqueEndpointSlug(data.name, userId);

        // Check if endpoint slug is available
        const isSlugAvailable = await this.formRepo.isEndpointSlugAvailable(endpointSlug);
        if (!isSlugAvailable) {
            throw new Error('Endpoint slug is already taken');
        }

        try {
            return await this.formRepo.create({
                ...data,
                endpointSlug,
                ...(data.description !== undefined && { description: data.description || null }),
                userId,
            });
        } catch (error) {
            throw new Error('Failed to create form');
        }
    }

    /**
     * Get a form by ID
     * @param id - The form ID
     * @returns Promise<Form | null> - The form if found, null otherwise
     */
    async getById(id: string): Promise<Form | null> {
        return this.formRepo.findById(id);
    }

    /**
     * Get a form by ID with user verification
     * @param id - The form ID
     * @param userId - The user ID to verify ownership
     * @returns Promise<Form | null> - The form if found and owned by user, null otherwise
     */
    async getByIdWithUser(id: string, userId: string): Promise<Form | null> {
        const form = await this.formRepo.findById(id);
        if (!form || form.userId !== userId) {
            return null;
        }
        return form;
    }

    /**
     * Get a form by its endpoint slug (public access)
     * @param endpointSlug - The endpoint slug
     * @returns Promise<Form | null> - The form if found and active, null otherwise
     */
    async getByEndpointSlug(endpointSlug: string): Promise<Form | null> {
        const form = await this.formRepo.findByEndpointSlug(endpointSlug);

        if (!form || !form.isActive) {
            return null;
        }

        return form;
    }

    /**
     * Get all forms for a user
     * @param userId - The user ID
     * @returns Promise<Form[]> - Array of user's forms
     */
    async getByUserId(userId: string): Promise<Form[]> {
        return this.formRepo.findByUserId(userId);
    }

    /**
     * Get all forms with pagination
     * @param page - Page number (1-based)
     * @param limit - Number of items per page
     * @returns Promise<{ forms: Form[]; total: number; totalPages: number }> - Paginated results
     */
    async getAll(page: number = 1, limit: number = 10): Promise<{
        forms: Form[];
        total: number;
        totalPages: number;
    }> {
        return this.formRepo.findAll(page, limit);
    }

    /**
     * Update a form
     * @param id - The form ID to update
     * @param data - Partial form data to update
     * @param userId - ID of the user requesting the update
     * @returns Promise<Form> - The updated form
     * @throws Error if form not found or user not authorized
     */
    async update(id: string, data: Partial<{
        name: string;
        description: string | null;
        endpointSlug: string;
        settings: any;
        isActive: boolean;
    }>, userId: string): Promise<Form> {
        // Check if form exists
        const form = await this.formRepo.findById(id);
        if (!form) {
            throw new Error('Form not found');
        }

        // Check if user owns the form
        const isOwner = await this.formRepo.isOwner(id, userId);
        if (!isOwner) {
            throw new Error('You are not authorized to update this form');
        }

        // If endpoint slug is being updated, check if it's available
        if (data.endpointSlug && data.endpointSlug !== form.endpointSlug) {
            const isSlugAvailable = await this.formRepo.isEndpointSlugAvailable(data.endpointSlug, id);
            if (!isSlugAvailable) {
                throw new Error('Endpoint slug is already taken');
            }
        }

        try {
            const updateData = {
                ...data,
                ...(data.description !== undefined && { description: data.description || null }),
                ...(data.name !== undefined && { name: data.name }),
            };
            return await this.formRepo.update(id, updateData);
        } catch (error) {
            throw new Error('Failed to update form');
        }
    }

    /**
     * Delete a form
     * @param id - The form ID to delete
     * @param userId - ID of the user requesting the deletion
     * @returns Promise<Form> - The deleted form
     * @throws Error if form not found or user not authorized
     */
    async delete(id: string, userId: string): Promise<Form> {
        // Check if form exists
        const form = await this.formRepo.findById(id);
        if (!form) {
            throw new Error('Form not found');
        }

        // Check if user owns the form
        const isOwner = await this.formRepo.isOwner(id, userId);
        if (!isOwner) {
            throw new Error('You are not authorized to delete this form');
        }

        try {
            return await this.formRepo.delete(id);
        } catch (error) {
            throw new Error('Failed to delete form');
        }
    }

    /**
     * Check if a user owns a form
     * @param formId - The form ID to check
     * @param userId - The user ID to check ownership
     * @returns Promise<boolean> - True if user owns the form, false otherwise
     */
    async isOwner(formId: string, userId: string): Promise<boolean> {
        return this.formRepo.isOwner(formId, userId);
    }

    /**
     * Generate form endpoint URL
     * @param endpointSlug - The form's endpoint slug
     * @returns string - The form endpoint URL
     */
    getFormEndpointUrl(endpointSlug: string): string {
        return `/api/forms/${endpointSlug}/submit`;
    }

    /**
     * Generate a unique endpoint slug with random characters
     * @param name - The form name (ignored, kept for backward compatibility)
     * @param userId - The user ID (ignored, kept for backward compatibility)
     * @returns Promise<string> - A unique random endpoint slug
     */
    async generateUniqueEndpointSlug(name: string, userId: string): Promise<string> {
        // Generate a completely random string like Formspree (e.g., "mnqyprvo")
        // Ignore the form name completely and just generate unique random characters
        const generateRandomSlug = (length: number = 8): string => {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        // Try to generate a unique slug
        let attempts = 0;
        const maxAttempts = 20; // Increased attempts for better uniqueness

        while (attempts < maxAttempts) {
            const slug = generateRandomSlug();

            if (await this.formRepo.isEndpointSlugAvailable(slug)) {
                return slug;
            }

            attempts++;
        }

        // Fallback: if we can't generate a unique random slug, use crypto-based approach
        const crypto = require('crypto');
        const randomBytes = crypto.randomBytes(4);
        return randomBytes.toString('hex').substring(0, 8);
    }

    /**
     * Get submission count for a form
     * @param formId - The form ID
     * @returns Promise<number> - The number of submissions
     */
    async getSubmissionCount(formId: string): Promise<number> {
        return this.formRepo.getSubmissionCount(formId);
    }

    /**
     * Get submissions count since a specific date
     * @param formId - The form ID
     * @param since - The date to count from
     * @returns Promise<number> - The number of submissions since the date
     */
    async getSubmissionsCountSince(formId: string, since: Date): Promise<number> {
        return this.formRepo.getSubmissionsCountSince(formId, since);
    }

    /**
     * Get spam submissions count for a form
     * @param formId - The form ID
     * @returns Promise<number> - The number of spam submissions
     */
    async getSpamSubmissionsCount(formId: string): Promise<number> {
        return this.formRepo.getSpamSubmissionsCount(formId);
    }
}

