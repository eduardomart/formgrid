import { useState, useEffect } from 'react';
import api from '../lib/api';

export interface Submission {
    id: string;
    payload: Record<string, any>;
    name?: string;
    email?: string;
    status: 'new' | 'read' | 'responded';
    createdAt: string;
    updatedAt: string;
}

export interface SubmissionsResponse {
    submissions: Submission[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function useSubmissions(formId: string, page: number = 1, limit: number = 10) {
    const [data, setData] = useState<SubmissionsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSubmissions = async () => {
        if (!formId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/api/forms/${formId}/submissions`, {
                params: { page, limit }
            });

            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch submissions');
            }
        } catch (err: any) {
            console.error('Failed to fetch submissions:', err);
            setError(err.response?.data?.message || 'Failed to fetch submissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [formId, page, limit]);

    const refetch = () => {
        fetchSubmissions();
    };

    return {
        data,
        loading,
        error,
        refetch
    };
}
