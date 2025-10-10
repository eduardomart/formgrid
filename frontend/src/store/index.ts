/// <reference types="vite/client" />
import { configureStore } from '@reduxjs/toolkit';
import formsReducer from './slices/formsSlice';
import submissionsReducer from './slices/submissionsSlice';

/**
 * Configure Redux store with all reducers
 */
export const store = configureStore({
    reducer: {
        forms: formsReducer,
        submissions: submissionsReducer,
    },
    // Enable Redux DevTools in development
    devTools: import.meta.env.MODE !== 'production',
    // Middleware configuration (optional)
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for serializable check
                ignoredActions: ['forms/fetchForms/fulfilled'],
            },
        }),
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


