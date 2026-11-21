import { api } from './client';
import { toBalanceResponse } from './mappers';
import type { PreferencesResponse, UpdateProfileRequest } from './types';

export const usersApi = {
  getBalance: async () => {
    const res = await api.get('/users/balance');
    return toBalanceResponse(res.data);
  },

  /** HU-03; HU-S01: el body incluye la contraseña actual. */
  updateProfile: async (data: UpdateProfileRequest) => {
    const res = await api.put('/users/profile', data);
    return res.data;
  },

  recharge: async (amount: number) => {
    const res = await api.post('/users/recharge', { amount });
    return res.data as { id?: string; balance?: number | string; newBalance?: number | string; message?: string };
  },

  /** HU-22 / HU-23: tamaño de texto, tema e idioma guardados en el servidor. */
  getPreferences: async (): Promise<PreferencesResponse> => {
    const res = await api.get<PreferencesResponse>('/users/preferences');
    return res.data;
  },

  /** HU-22 / HU-23: cada campo es opcional; el que no se envía conserva su valor. */
  updatePreferences: async (data: Partial<PreferencesResponse>): Promise<PreferencesResponse> => {
    const res = await api.put<PreferencesResponse>('/users/preferences', data);
    return res.data;
  },
};
