import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8081';

export const TOKEN_KEY = 'token';
export const SESSION_KEY = 'catalyst-session';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Un 401 en login/registro es "credenciales inválidas", no una sesión vencida:
    // se deja que la pantalla muestre el error en lugar de recargar la página.
    const isAuthRequest = String(err.config?.url ?? '').startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  },
);

/** Extrae el mensaje de error del backend (formato { message, details }). */
export function getApiError(err: unknown, fallback = 'Error inesperado'): string {
  const e = err as { response?: { data?: { message?: string; details?: Record<string, string> } }; message?: string };
  const data = e.response?.data;
  const firstDetail = data?.details ? Object.values(data.details)[0] : undefined;
  return firstDetail ?? data?.message ?? (e.response ? fallback : 'No se pudo conectar con el servidor.');
}
