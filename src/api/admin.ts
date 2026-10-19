import { api } from "./client";
import type {
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
};
