import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Optional: attach an auth header if one exists elsewhere. Currently auth
// is cookie-based, so this interceptor is a placeholder for future bearer support.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  return config;
});

export { AxiosError };
