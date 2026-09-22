import { api } from './client';
import { toUser, toBalanceResponse } from './mappers';

export const usersApi = {
  getBalance: async () => {
    const res = await api.get('/users/balance');
    return res.data;
  },

  updateProfile: async (data: { name: string; email: string }) => {
    const res = await api.put('/users/profile', data);
    return res.data;
  },

  recharge: async (amount: number) => {
    const res = await api.post('/users/recharge', { amount });
    return res.data;
  },
};