// Form Types
export interface Form {
    id: string;
    name: string;
    description: string | null;
    endpointSlug: string;
    endpointUrl: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    submissionCount: number;
}

export interface CreateFormData {
    name: string;
    description?: string | null;
    settings?: any;
}

export interface UpdateFormData {
    name?: string;
    description?: string | null;
    settings?: any;
    isActive?: boolean;
}

// Submission Types
export interface Submission {
    id: string;
    formId: string;
    payload: Record<string, any>;
    name?: string;
    email?: string;
    status: 'new' | 'read' | 'responded';
    createdAt: string;
    updatedAt: string;
}

export interface SubmissionsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface SubmissionsResponse {
    submissions: Submission[];
    pagination: SubmissionsPagination;
}

// API Response Types
export interface ApiSuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    error?: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;


