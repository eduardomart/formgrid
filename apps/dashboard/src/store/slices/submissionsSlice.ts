import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { Submission, SubmissionsResponse, ApiSuccessResponse } from '../../types';

// Cache key interface for form submissions
interface CacheKey {
    formId: string;
    page: number;
    limit: number;
}

// State interface
interface SubmissionsState {
    // Store submissions by formId and page
    cache: {
        [key: string]: {
            data: SubmissionsResponse;
            timestamp: number;
        };
    };
    currentSubmission: Submission | null;
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: SubmissionsState = {
    cache: {},
    currentSubmission: null,
    loading: false,
    error: null,
};

// Helper function to generate cache key
const getCacheKey = ({ formId, page, limit }: CacheKey): string => {
    return `${formId}-${page}-${limit}`;
};

// Async thunks

/**
 * Fetch submissions for a form with pagination
 * Includes caching - only fetches if data is stale (older than 2 minutes)
 */
export const fetchSubmissions = createAsyncThunk(
    'submissions/fetchSubmissions',
    async (
        { formId, page = 1, limit = 10, forceRefresh = false }: CacheKey & { forceRefresh?: boolean },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as { submissions: SubmissionsState };
            const cacheKey = getCacheKey({ formId, page, limit });
            const now = Date.now();
            const cacheExpiry = 2 * 60 * 1000; // 2 minutes

            // Return cached data if it's fresh and not forcing refresh
            if (
                !forceRefresh &&
                state.submissions.cache[cacheKey] &&
                now - state.submissions.cache[cacheKey].timestamp < cacheExpiry
            ) {
                console.log(` Using cached submissions for ${cacheKey}`);
                return {
                    ...state.submissions.cache[cacheKey].data,
                    cacheKey,
                };
            }

            console.log(`Fetching submissions for form ${formId}, page ${page}`);
            const response = await api.get<ApiSuccessResponse<SubmissionsResponse>>(
                `/api/forms/${formId}/submissions`,
                {
                    params: { page, limit },
                }
            );

            if (response.data.success) {
                return {
                    ...response.data.data,
                    cacheKey,
                };
            } else {
                return rejectWithValue('Failed to fetch submissions');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch submissions');
        }
    }
);

/**
 * Fetch a single submission by ID
 */
export const fetchSubmissionById = createAsyncThunk(
    'submissions/fetchSubmissionById',
    async (id: string, { rejectWithValue }) => {
        try {
            console.log(`Fetching submission ${id} from API`);
            const response = await api.get<ApiSuccessResponse<Submission>>(`/api/submissions/${id}`);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue('Failed to fetch submission');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch submission');
        }
    }
);

/**
 * Update submission status
 */
export const updateSubmissionStatus = createAsyncThunk(
    'submissions/updateStatus',
    async (
        { id, status }: { id: string; status: 'new' | 'read' | 'responded' },
        { rejectWithValue }
    ) => {
        try {
            console.log(`Updating submission ${id} status to ${status}`);
            const response = await api.put<ApiSuccessResponse<Submission>>(
                `/api/submissions/${id}`,
                { status }
            );

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue('Failed to update submission');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update submission');
        }
    }
);

/**
 * Delete a submission
 */
export const deleteSubmission = createAsyncThunk(
    'submissions/deleteSubmission',
    async (id: string, { rejectWithValue }) => {
        try {
            console.log(` Deleting submission ${id}`);
            const response = await api.delete<ApiSuccessResponse<void>>(`/api/submissions/${id}`);

            if (response.data.success) {
                return id;
            } else {
                return rejectWithValue('Failed to delete submission');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete submission');
        }
    }
);

/**
 * Bulk delete submissions
 */
export const bulkDeleteSubmissions = createAsyncThunk(
    'submissions/bulkDelete',
    async (ids: string[], { rejectWithValue }) => {
        try {
            console.log(`Bulk deleting ${ids.length} submissions`);
            const response = await api.post<ApiSuccessResponse<void>>(
                '/api/submissions/bulk/delete',
                { ids }
            );

            if (response.data.success) {
                return ids;
            } else {
                return rejectWithValue('Failed to bulk delete submissions');
            }
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to bulk delete submissions'
            );
        }
    }
);

/**
 * Bulk mark submissions as spam
 */
export const bulkMarkAsSpam = createAsyncThunk(
    'submissions/bulkMarkSpam',
    async (ids: string[], { rejectWithValue }) => {
        try {
            console.log(`Marking ${ids.length} submissions as spam`);
            const response = await api.post<ApiSuccessResponse<void>>(
                '/api/submissions/bulk/spam',
                { ids }
            );

            if (response.data.success) {
                return ids;
            } else {
                return rejectWithValue('Failed to mark submissions as spam');
            }
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to mark submissions as spam'
            );
        }
    }
);

// Slice
const submissionsSlice = createSlice({
    name: 'submissions',
    initialState,
    reducers: {
        // Clear error
        clearError: (state) => {
            state.error = null;
        },
        // Clear current submission
        clearCurrentSubmission: (state) => {
            state.currentSubmission = null;
        },
        // Invalidate cache for a specific form
        invalidateFormCache: (state, action: PayloadAction<string>) => {
            const formId = action.payload;
            Object.keys(state.cache).forEach((key) => {
                if (key.startsWith(`${formId}-`)) {
                    delete state.cache[key];
                }
            });
        },
        // Invalidate all cache
        invalidateAllCache: (state) => {
            state.cache = {};
        },
    },
    extraReducers: (builder) => {
        // Fetch submissions
        builder
            .addCase(fetchSubmissions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                fetchSubmissions.fulfilled,
                (state, action: PayloadAction<SubmissionsResponse & { cacheKey: string }>) => {
                    state.loading = false;
                    const { cacheKey, ...data } = action.payload;
                    state.cache[cacheKey] = {
                        data,
                        timestamp: Date.now(),
                    };
                }
            )
            .addCase(fetchSubmissions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch submission by ID
        builder
            .addCase(fetchSubmissionById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSubmissionById.fulfilled, (state, action: PayloadAction<Submission>) => {
                state.loading = false;
                state.currentSubmission = action.payload;

                // Update in cache if exists
                Object.keys(state.cache).forEach((key) => {
                    const cached = state.cache[key];
                    const index = cached.data.submissions.findIndex(
                        (s) => s.id === action.payload.id
                    );
                    if (index !== -1) {
                        cached.data.submissions[index] = action.payload;
                    }
                });
            })
            .addCase(fetchSubmissionById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Update submission status
        builder
            .addCase(updateSubmissionStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                updateSubmissionStatus.fulfilled,
                (state, action: PayloadAction<Submission>) => {
                    state.loading = false;

                    // Update current submission if it's the same
                    if (state.currentSubmission?.id === action.payload.id) {
                        state.currentSubmission = action.payload;
                    }

                    // Update in cache
                    Object.keys(state.cache).forEach((key) => {
                        const cached = state.cache[key];
                        const index = cached.data.submissions.findIndex(
                            (s) => s.id === action.payload.id
                        );
                        if (index !== -1) {
                            cached.data.submissions[index] = action.payload;
                        }
                    });
                }
            )
            .addCase(updateSubmissionStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Delete submission
        builder
            .addCase(deleteSubmission.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteSubmission.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;

                // Clear current submission if it's the deleted one
                if (state.currentSubmission?.id === action.payload) {
                    state.currentSubmission = null;
                }

                // Remove from cache
                Object.keys(state.cache).forEach((key) => {
                    const cached = state.cache[key];
                    cached.data.submissions = cached.data.submissions.filter(
                        (s) => s.id !== action.payload
                    );
                    // Update pagination total
                    cached.data.pagination.total = Math.max(0, cached.data.pagination.total - 1);
                });
            })
            .addCase(deleteSubmission.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Bulk delete submissions
        builder
            .addCase(bulkDeleteSubmissions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(bulkDeleteSubmissions.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.loading = false;
                const deletedIds = action.payload;

                // Remove from cache
                Object.keys(state.cache).forEach((key) => {
                    const cached = state.cache[key];
                    cached.data.submissions = cached.data.submissions.filter(
                        (s) => !deletedIds.includes(s.id)
                    );
                    // Update pagination total
                    cached.data.pagination.total = Math.max(
                        0,
                        cached.data.pagination.total - deletedIds.length
                    );
                });
            })
            .addCase(bulkDeleteSubmissions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Bulk mark as spam
        builder
            .addCase(bulkMarkAsSpam.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(bulkMarkAsSpam.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.loading = false;
                const spamIds = action.payload;

                // Remove spam submissions from cache
                Object.keys(state.cache).forEach((key) => {
                    const cached = state.cache[key];
                    cached.data.submissions = cached.data.submissions.filter(
                        (s) => !spamIds.includes(s.id)
                    );
                    cached.data.pagination.total = Math.max(
                        0,
                        cached.data.pagination.total - spamIds.length
                    );
                });
            })
            .addCase(bulkMarkAsSpam.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// Export actions
export const {
    clearError,
    clearCurrentSubmission,
    invalidateFormCache,
    invalidateAllCache,
} = submissionsSlice.actions;

// Export reducer
export default submissionsSlice.reducer;

// Selectors
export const selectSubmissionsByFormId = (formId: string, page: number, limit: number) => (
    state: { submissions: SubmissionsState }
) => {
    const cacheKey = getCacheKey({ formId, page, limit });
    return state.submissions.cache[cacheKey]?.data || null;
};

export const selectCurrentSubmission = (state: { submissions: SubmissionsState }) =>
    state.submissions.currentSubmission;

export const selectSubmissionsLoading = (state: { submissions: SubmissionsState }) =>
    state.submissions.loading;

export const selectSubmissionsError = (state: { submissions: SubmissionsState }) =>
    state.submissions.error;


