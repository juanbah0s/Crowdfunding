import { api, TOKEN_KEY, SESSION_KEY } from './client';
import { toUser } from './mappers';

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await api.post('/auth/register', data);
    return { message: res.data.message };
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post('/auth/login', data);
    localStorage.setItem(TOKEN_KEY, res.data.token);
    return toUser(res.data);
  },

  // Reuse the existing login endpoint without replacing the active token/session.
  verifyPassword: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return toUser(res.data);
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};
