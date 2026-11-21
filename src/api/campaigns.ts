import { api } from "./client";
import type {
  CampaignEarningsResponse,
  CampaignResponse,
  CreateCampaignRequest,
  SponsorContributionsSummaryResponse,
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

  /** HU-S05: cerrar exige `pin` y `password`; pausar o reactivar no. */
  updateStatus: async (
    id: string,
    status: UpdateCampaignStatusRequest["status"],
    credentials?: { pin: string; password: string },
  ): Promise<CampaignResponse> => {
    const body: UpdateCampaignStatusRequest = { status, ...credentials };
    const res = await api.patch<CampaignResponse>(`/campaigns/${id}/status`, body);
    return res.data;
  },

  /** HU-14: recaudo y patrocinadores de una campaña propia, con filtros opcionales. */
  earnings: async (
    id: string,
    filters?: { contributor?: string; reward?: string },
  ): Promise<CampaignEarningsResponse> => {
    const res = await api.get<CampaignEarningsResponse>(`/campaigns/${id}/earnings`, { params: filters });
    return res.data;
  },

  /** HU-14: total aportado por el patrocinador y detalle por campaña. */
  sponsorSummary: async (): Promise<SponsorContributionsSummaryResponse> => {
    const res = await api.get<SponsorContributionsSummaryResponse>("/campaigns/contributions/summary");
    return res.data;
  },
};
