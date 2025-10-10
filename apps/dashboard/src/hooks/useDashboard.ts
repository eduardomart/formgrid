import { useState, useEffect } from 'react';
import api from '../lib/api';

interface DashboardStats {
    totalForms: number;
    submissionsToday: number;
    activeEndpoints: number;
}

interface Form {
    id: string;
    name: string;
    endpointSlug: string;
    submissionCount: number;
    lastSubmission?: string;
    isActive: boolean;
    createdAt: string;
}

interface DashboardData {
    stats: DashboardStats;
    recentForms: Form[];
}

export function useDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch forms data
            const formsResponse = await api.get('/api/forms');
            const forms = formsResponse.data.data?.forms || [];

            // Calculate stats
            const totalForms = forms.length;
            const activeEndpoints = forms.filter((form: Form) => form.isActive).length;

            // For now, we'll calculate submissions today from the forms data
            // In a real app, you might want a separate endpoint for this
            const submissionsToday = forms.reduce((sum: number, form: Form) => {
                // This is a simplified calculation - in reality you'd want actual submission counts for today
                return sum + (form.submissionCount || 0);
            }, 0);

            const stats: DashboardStats = {
                totalForms,
                submissionsToday,
                activeEndpoints,
            };

            // Get recent forms (last 5)
            const recentForms = forms
                .sort((a: Form, b: Form) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);

            setData({
                stats,
                recentForms,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchDashboardData,
    };
}
