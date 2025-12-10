// web/src/lib/api/api-client.ts
import axios from 'axios';

/**
 * Axios client with default configuration
 * - Base URL: /api (relative to app)
 * - Credentials included (for cookies)
 * - JSON content type
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for auth
});

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Return error for handling in components
    return Promise.reject(error);
  }
);

/**
 * Generic API error handler
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.message;
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}