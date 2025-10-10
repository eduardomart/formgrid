/**
 * Authentication token management utilities
 * 
 * Note: This implementation uses localStorage for token storage.
 * In production, consider using httpOnly cookies for better security.
 */

const AUTH_TOKEN_KEY = 'auth_token'

/**
 * Set the authentication token
 * @param token - The JWT token string, or null to clear the token
 */
export function setToken(token: string | null): void {
    if (token === null) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
    } else {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
    }
}

/**
 * Get the current authentication token
 * @returns The JWT token string, or null if no token exists
 */
export function getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * Check if the user is currently authenticated
 * @returns true if a valid token exists, false otherwise
 */
export function isAuthenticated(): boolean {
    const token = getToken()
    return token !== null && token.trim() !== ''
}

/**
 * Clear the authentication token
 */
export function clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY)
}

/**
 * Example usage:
 * 
 * import { setToken, getToken, isAuthenticated, clearToken } from './lib/auth'
 * 
 * // Set token after successful login
 * setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
 * 
 * // Check if user is authenticated
 * if (isAuthenticated()) {
 *   console.log('User is logged in')
 * }
 * 
 * // Get token for API calls
 * const token = getToken()
 * 
 * // Clear token on logout
 * clearToken()
 */

// Export types for better TypeScript support
export type AuthToken = string | null
export type AuthState = boolean
