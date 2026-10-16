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

  /** Confirma la contraseña actual sin cambiar la sesión (el token nuevo se descarta). */
  verifyPassword: async (email: string, password: string): Promise<boolean> => {
    try {
      await api.post('/auth/login', { email, password });
      return true;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 403) return false;
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};
