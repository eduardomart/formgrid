import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentFormsTable } from '../components/dashboard/RecentFormsTable';
import { CreateFormModal } from '../components/dashboard/CreateFormModal';
import { useDashboard } from '../hooks/useDashboard';

export function DashboardPage() {
    const { data, loading, error, refetch } = useDashboard();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    if (error) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
                    <p className="text-gray-600">Welcome back! Here's what's happening with your forms.</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Forms Created"
                        value={loading ? '...' : (data?.stats.totalForms || 0)}
                        icon={
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        }
                        trend={data?.stats.totalForms ? { value: 'All time', isPositive: true } : undefined}
                    />
                    <StatCard
                        title="Submissions Received Today"
                        value={loading ? '...' : (data?.stats.submissionsToday || 0)}
                        icon={
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        }
                        trend={data?.stats.submissionsToday ? { value: 'Today', isPositive: true } : undefined}
                    />
                    <StatCard
                        title="Active Endpoints"
                        value={loading ? '...' : (data?.stats.activeEndpoints || 0)}
                        icon={
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        }
                        trend={data?.stats.activeEndpoints ? { value: 'Live', isPositive: true } : undefined}
                    />
                </div>

                {/* Recent Forms Table */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Recent Forms</h2>
                        <Link
                            to="/forms"
                            className="text-sm text-gray-600 hover:text-gray-500 font-medium"
                        >
                            View all forms →
                        </Link>
                    </div>
                    <RecentFormsTable
                        forms={data?.recentForms || []}
                        isLoading={loading}
                    />
                </div>

                {/* Create New Form CTA */}
                <div className="text-center">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create New Form
                    </button>
                </div>

                {/* Create Form Modal */}
                <CreateFormModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        refetch(); // Refresh dashboard data
                    }}
                />
            </div>
        </DashboardLayout>
    );
}
