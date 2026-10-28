import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Attach the JWT as a Bearer Authorization header on every API request.
 *
 * The token is stored in sessionStorage by AuthContext after login/register
 * (key: `connectly_token`). This is required because:
 *   1. The `token` cookie is httpOnly, so JS cannot read it directly.
 *   2. `withCredentials: true` sends the cookie automatically for same-origin
 *      requests (which is the primary auth mechanism), but an explicit
 *      Authorization header is a robust fallback and is what Socket.IO uses
 *      via its `auth` handshake option.
 *   3. The httpOnly cookie remains the source of truth for REST endpoints; the
 *      Bearer header is only attached when a token exists in sessionStorage.
 */
const TOKEN_KEY = 'connectly_token';
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  try {
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      config.headers.Authorization = `Bearer ${stored}`;
    }
  } catch {
    // sessionStorage may be unavailable (e.g. private mode or blocked); ignore.
  }
  return config;
});

export { AxiosError };
