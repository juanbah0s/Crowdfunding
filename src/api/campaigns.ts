import { api } from "./client";
import type {
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  UpdateCampaignStatusRequest,
} from "./types";

export const campaignsApi = {
  list: async (params?: {
    nombre?: string;
    categoria?: string;
    orden?: string;
  }): Promise<CampaignResponse[]> => {
    const res = await api.get<CampaignResponse[]>("/campaigns", { params });
    return res.data;
  },

  listManaged: async (): Promise<CampaignResponse[]> => {
    const res = await api.get<CampaignResponse[]>("/campaigns/mine");
    return res.data;
  },

  getById: async (id: string): Promise<CampaignResponse> => {
    const res = await api.get<CampaignResponse>(`/campaigns/${id}`);
    return res.data;
  },

  publish: async (data: CreateCampaignRequest): Promise<CampaignResponse> => {
    const res = await api.post<CampaignResponse>("/campaigns", data);
    return res.data;
  },

  update: async (id: string, data: UpdateCampaignRequest): Promise<CampaignResponse> => {
    const res = await api.put<CampaignResponse>(`/campaigns/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<CampaignResponse> => {
    const res = await api.patch<CampaignResponse>(`/campaigns/${id}/status`, { status });
    return res.data;
  },
};
