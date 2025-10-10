import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { Form, CreateFormData, UpdateFormData, ApiSuccessResponse } from '../../types';

// State interface
interface FormsState {
    forms: Form[];
    currentForm: Form | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null; // Timestamp for cache invalidation
}

// Initial state
const initialState: FormsState = {
    forms: [],
    currentForm: null,
    loading: false,
    error: null,
    lastFetched: null,
};

// Async thunks

/**
 * Fetch all forms
 * Includes caching - only fetches if data is stale (older than 5 minutes)
 */
export const fetchForms = createAsyncThunk(
    'forms/fetchForms',
    async (forceRefresh: boolean = false, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { forms: FormsState };
            const now = Date.now();
            const cacheExpiry = 5 * 60 * 1000; // 5 minutes

            // Return cached data if it's fresh and not forcing refresh
            if (
                !forceRefresh &&
                state.forms.lastFetched &&
                now - state.forms.lastFetched < cacheExpiry &&
                state.forms.forms.length > 0
            ) {
                console.log('📦 Using cached forms data');
                return state.forms.forms;
            }

            console.log('🔄 Fetching forms from API');
            const response = await api.get<ApiSuccessResponse<{ forms: Form[] }>>('/api/forms');

            if (response.data.success) {
                return response.data.data.forms || [];
            } else {
                return rejectWithValue('Failed to fetch forms');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch forms');
        }
    }
);

/**
 * Fetch a single form by ID
 */
export const fetchFormById = createAsyncThunk(
    'forms/fetchFormById',
    async (id: string, { rejectWithValue }) => {
        try {
            console.log(`Fetching form ${id} from API`);
            const response = await api.get<ApiSuccessResponse<Form>>(`/api/forms/${id}`);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue('Failed to fetch form');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch form');
        }
    }
);

/**
 * Create a new form
 */
export const createForm = createAsyncThunk(
    'forms/createForm',
    async (formData: CreateFormData, { rejectWithValue }) => {
        try {
            console.log('Creating new form:', formData);
            const response = await api.post<ApiSuccessResponse<Form>>('/api/forms', formData);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue('Failed to create form');
            }
        } catch (error: any) {
            // Handle validation errors
            if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors
                    .map((e: any) => `${e.field}: ${e.message}`)
                    .join(', ');
                return rejectWithValue(`Validation failed: ${errorMessages}`);
            }
            return rejectWithValue(error.response?.data?.message || 'Failed to create form');
        }
    }
);

/**
 * Update an existing form
 */
export const updateForm = createAsyncThunk(
    'forms/updateForm',
    async ({ id, data }: { id: string; data: UpdateFormData }, { rejectWithValue }) => {
        try {
            console.log(`Updating form ${id}:`, data);
            const response = await api.put<ApiSuccessResponse<Form>>(`/api/forms/${id}`, data);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue('Failed to update form');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update form');
        }
    }
);

/**
 * Delete a form
 */
export const deleteForm = createAsyncThunk(
    'forms/deleteForm',
    async (id: string, { rejectWithValue }) => {
        try {
            console.log(`Deleting form ${id}`);
            const response = await api.delete<ApiSuccessResponse<void>>(`/api/forms/${id}`);

            if (response.data.success) {
                return id;
            } else {
                return rejectWithValue('Failed to delete form');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete form');
        }
    }
);

// Slice
const formsSlice = createSlice({
    name: 'forms',
    initialState,
    reducers: {
        // Clear error
        clearError: (state) => {
            state.error = null;
        },
        // Clear current form
        clearCurrentForm: (state) => {
            state.currentForm = null;
        },
        // Invalidate cache (force refresh on next fetch)
        invalidateCache: (state) => {
            state.lastFetched = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch all forms
        builder
            .addCase(fetchForms.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchForms.fulfilled, (state, action: PayloadAction<Form[]>) => {
                state.loading = false;
                state.forms = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchForms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch form by ID
        builder
            .addCase(fetchFormById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFormById.fulfilled, (state, action: PayloadAction<Form>) => {
                state.loading = false;
                state.currentForm = action.payload;

                // Update in forms array if it exists
                const index = state.forms.findIndex(f => f.id === action.payload.id);
                if (index !== -1) {
                    state.forms[index] = action.payload;
                }
            })
            .addCase(fetchFormById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create form
        builder
            .addCase(createForm.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createForm.fulfilled, (state, action: PayloadAction<Form>) => {
                state.loading = false;
                state.forms.unshift(action.payload); // Add to beginning
                state.currentForm = action.payload;
            })
            .addCase(createForm.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Update form
        builder
            .addCase(updateForm.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateForm.fulfilled, (state, action: PayloadAction<Form>) => {
                state.loading = false;

                // Update in forms array
                const index = state.forms.findIndex(f => f.id === action.payload.id);
                if (index !== -1) {
                    state.forms[index] = action.payload;
                }

                // Update current form if it's the same
                if (state.currentForm?.id === action.payload.id) {
                    state.currentForm = action.payload;
                }
            })
            .addCase(updateForm.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Delete form
        builder
            .addCase(deleteForm.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteForm.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.forms = state.forms.filter(f => f.id !== action.payload);

                // Clear current form if it's the deleted one
                if (state.currentForm?.id === action.payload) {
                    state.currentForm = null;
                }
            })
            .addCase(deleteForm.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// Export actions
export const { clearError, clearCurrentForm, invalidateCache } = formsSlice.actions;

// Export reducer
export default formsSlice.reducer;

// Selectors
export const selectAllForms = (state: { forms: FormsState }) => state.forms.forms;
export const selectCurrentForm = (state: { forms: FormsState }) => state.forms.currentForm;
export const selectFormsLoading = (state: { forms: FormsState }) => state.forms.loading;
export const selectFormsError = (state: { forms: FormsState }) => state.forms.error;
export const selectFormById = (id: string) => (state: { forms: FormsState }) =>
    state.forms.forms.find(form => form.id === id);


