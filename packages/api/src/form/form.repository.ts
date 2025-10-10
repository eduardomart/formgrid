import { PrismaClient, Form } from '@prisma/client';
import { prisma } from '../config/prisma';

/**
 * Form repository for database operations
 * Handles form-specific database queries
 */
export class FormRepository {
    private prisma: PrismaClient;

    constructor(prismaClient?: PrismaClient) {
        this.prisma = prismaClient || prisma;
    }

    /**
     * Create a new form
     * @param data - Form creation data
     * @returns Promise<Form> - The created form
     */
    async create(data: {
        name: string;
        description?: string | null;
        endpointSlug: string;
        settings?: any;
        userId: string;
    }): Promise<Form> {
        return this.prisma.form.create({
            data: {
                name: data.name,
                description: data.description || null,
                endpointSlug: data.endpointSlug,
                settings: data.settings || {},
                userId: data.userId,
            },
        });
    }

    /**
     * Find a form by its ID
     * @param id - The form ID to search for
     * @returns Promise<Form | null> - The form if found, null otherwise
     */
    async findById(id: string): Promise<Form | null> {
        return this.prisma.form.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
        });
    }

    /**
     * Find a form by its endpoint slug
     * @param endpointSlug - The endpoint slug to search for
     * @returns Promise<Form | null> - The form if found, null otherwise
     */
    async findByEndpointSlug(endpointSlug: string): Promise<Form | null> {
        return this.prisma.form.findUnique({
            where: { endpointSlug },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Find all forms for a specific user
     * @param userId - The user ID to search for
     * @returns Promise<Form[]> - Array of forms
     */
    async findByUserId(userId: string): Promise<Form[]> {
        return this.prisma.form.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
        });
    }

    /**
     * Find all forms with pagination
     * @param page - Page number (1-based)
     * @param limit - Number of items per page
     * @returns Promise<{ forms: Form[]; total: number; totalPages: number }> - Paginated results
     */
    async findAll(page: number = 1, limit: number = 10): Promise<{
        forms: Form[];
        total: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;

        const [forms, total] = await Promise.all([
            this.prisma.form.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            submissions: true,
                        },
                    },
                },
            }),
            this.prisma.form.count(),
        ]);

        return {
            forms,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Update a form
     * @param id - The form ID to update
     * @param data - Partial form data to update
     * @returns Promise<Form> - The updated form
     */
    async update(id: string, data: Partial<{
        name: string;
        description: string | null;
        settings: any;
        isActive: boolean;
    }>): Promise<Form> {
        return this.prisma.form.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete a form
     * @param id - The form ID to delete
     * @returns Promise<Form> - The deleted form
     */
    async delete(id: string): Promise<Form> {
        return this.prisma.form.delete({
            where: { id },
        });
    }

    /**
     * Check if a form exists by ID
     * @param id - The form ID to check
     * @returns Promise<boolean> - True if form exists, false otherwise
     */
    async exists(id: string): Promise<boolean> {
        const form = await this.prisma.form.findUnique({
            where: { id },
            select: { id: true },
        });
        return form !== null;
    }

    /**
     * Check if a form belongs to a user
     * @param formId - The form ID to check
     * @param userId - The user ID to check ownership
     * @returns Promise<boolean> - True if user owns the form, false otherwise
     */
    async isOwner(formId: string, userId: string): Promise<boolean> {
        const form = await this.prisma.form.findFirst({
            where: {
                id: formId,
                userId: userId,
            },
            select: { id: true },
        });
        return form !== null;
    }

    /**
     * Check if an endpoint slug is available
     * @param endpointSlug - The endpoint slug to check
     * @param excludeId - Optional form ID to exclude from check (for updates)
     * @returns Promise<boolean> - True if slug is available, false otherwise
     */
    async isEndpointSlugAvailable(endpointSlug: string, excludeId?: string): Promise<boolean> {
        const form = await this.prisma.form.findFirst({
            where: {
                endpointSlug,
                ...(excludeId && { id: { not: excludeId } }),
            },
            select: { id: true },
        });
        return form === null;
    }

    /**
     * Get submission count for a form
     * @param formId - The form ID
     * @returns Promise<number> - The number of submissions
     */
    async getSubmissionCount(formId: string): Promise<number> {
        return this.prisma.submission.count({
            where: { formId },
        });
    }

    /**
     * Get submissions count since a specific date
     * @param formId - The form ID
     * @param since - The date to count from
     * @returns Promise<number> - The number of submissions since the date
     */
    async getSubmissionsCountSince(formId: string, since: Date): Promise<number> {
        return this.prisma.submission.count({
            where: {
                formId,
                createdAt: {
                    gte: since,
                },
            },
        });
    }

    /**
     * Get spam submissions count for a form
     * @param formId - The form ID
     * @returns Promise<number> - The number of spam submissions
     */
    async getSpamSubmissionsCount(formId: string): Promise<number> {
        return this.prisma.submission.count({
            where: {
                formId,
                status: 'spam',
            },
        });
    }
}

