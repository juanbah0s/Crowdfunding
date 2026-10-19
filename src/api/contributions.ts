import { api } from "./client";
import type {
  ContributionConfirmationRequest,
  ContributionConfirmationResponse,
} from "./types";

export const contributionsApi = {
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
};
