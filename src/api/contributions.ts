import { api } from "./client";
import type {
  ContributionConfirmationRequest,
  ContributionConfirmationResponse,
  ContributionHistoryResponse,
} from "./types";

export const contributionsApi = {
  /** HU-11/HU-12; HU-S06: el body incluye la contraseña de la cuenta. */
  confirm: async (
    campaignId: string,
    data: ContributionConfirmationRequest,
  ): Promise<ContributionConfirmationResponse> => {
    const res = await api.post<ContributionConfirmationResponse>(
      `/campaigns/${campaignId}/contributions/confirm`,
      data,
    );
    return res.data;
  },

  /** HU-16: mis aportes con el estado actual de cada campaña y el total acumulado. */
  history: async (): Promise<ContributionHistoryResponse> => {
    const res = await api.get<ContributionHistoryResponse>("/contributions/history");
    return res.data;
  },
};
