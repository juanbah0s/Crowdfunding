import { api } from "./client";
import type {
  AdminTransactionResponse,
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUserActionRequest,
  AdminUserDetailResponse,
  AdminUserListResponse,
} from "./types";

export const adminApi = {
  listUsers: async (params?: {
    page?: number;
    size?: number;
    sort?: string;
    email?: string;
    role?: string;
    status?: string;
  }): Promise<AdminUserListResponse> => {
    const res = await api.get<AdminUserListResponse>("/admin/users", { params });
    return res.data;
  },

  getUser: async (id: string): Promise<AdminUserDetailResponse> => {
    const res = await api.get<AdminUserDetailResponse>(`/admin/users/${id}`);
    return res.data;
  },

  createUser: async (data: AdminCreateUserRequest): Promise<AdminUserDetailResponse> => {
    const res = await api.post<AdminUserDetailResponse>("/admin/users", data);
    return res.data;
  },

  updateUser: async (id: string, data: AdminUpdateUserRequest): Promise<AdminUserDetailResponse> => {
    const res = await api.put<AdminUserDetailResponse>(`/admin/users/${id}`, data);
    return res.data;
  },

  changeUserStatus: async (id: string, action: "DISABLE" | "ENABLE"): Promise<void> => {
    await api.patch(`/admin/users/${id}/status`, { action });
  },

  /** HU-17: registro general de transacciones, de solo lectura. Fechas en ISO-8601. */
  listTransactions: async (filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    userId?: string;
  }): Promise<AdminTransactionResponse[]> => {
    const res = await api.get<AdminTransactionResponse[]>("/admin/transactions", { params: filters });
    return res.data;
  },
};
