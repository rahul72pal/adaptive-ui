import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minutes timeout for LLM generation tasks
});

// Request Interceptor: Attach JWT Bearer Token if logged in
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adaptive_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Graceful error handling & 401 session expiration handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      const requestUrl = error?.config?.url || '';
      const isAuthAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      
      // If a regular authenticated endpoint returns 401, the token is invalid or expired
      if (!isAuthAttempt) {
        localStorage.removeItem('adaptive_access_token');
        localStorage.removeItem('adaptive_user_data');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('adaptive:auth_unauthorized', { detail: { error } }));
        }
      }
    }
    return Promise.reject(error);
  }
);
