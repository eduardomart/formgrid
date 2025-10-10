import { useState } from 'react';
import api from '../lib/api';

interface Form {
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

interface CreateFormData {
    name: string;
    description?: string | null;
    settings?: any;
}

export function useForms() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createForm = async (formData: CreateFormData): Promise<Form | null> => {
        setLoading(true);
        setError(null);

        try {
            console.log('Sending form data:', formData);
            const response = await api.post('/api/forms', formData);

            if (response.data.success) {
                return response.data.data;
            } else {
                setError(response.data.message || 'Failed to create form');
                return null;
            }
        } catch (err: any) {
            console.error('Error creating form:', err);
            console.error('Error response:', err.response?.data);

            // Show detailed validation errors if available
            if (err.response?.data?.errors) {
                const errorMessages = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
                setError(`Validation failed: ${errorMessages}`);
            } else {
                setError(err.response?.data?.message || 'Failed to create form');
            }
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getForms = async (): Promise<Form[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/api/forms');

            if (response.data.success) {
                return response.data.data?.forms || [];
            } else {
                setError(response.data.message || 'Failed to fetch forms');
                return [];
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch forms');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getFormById = async (id: string): Promise<Form | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/api/forms/${id}`);

            if (response.data.success) {
                return response.data.data;
            } else {
                setError(response.data.message || 'Failed to fetch form');
                return null;
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch form');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateForm = async (id: string, formData: Partial<CreateFormData>): Promise<Form | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.put(`/api/forms/${id}`, formData);

            if (response.data.success) {
                return response.data.data;
            } else {
                setError(response.data.message || 'Failed to update form');
                return null;
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update form');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteForm = async (id: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.delete(`/api/forms/${id}`);

            if (response.data.success) {
                return true;
            } else {
                setError(response.data.message || 'Failed to delete form');
                return false;
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete form');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        createForm,
        getForms,
        getFormById,
        updateForm,
        deleteForm,
    };
}
