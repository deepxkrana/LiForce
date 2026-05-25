export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/**
 * A wrapper around native fetch that automatically includes credentials (cookies)
 * for authenticated requests. Replaces manual Authorization header injection.
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include', // Automatically sends and receives HttpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
