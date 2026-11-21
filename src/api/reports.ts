import { api } from "./client";
import type { ActiveCampaignReportItem, PeriodFundsReportResponse } from "./types";

export const reportsApi = {
  /** HU-18: el creador ve sus campañas activas y el admin todas; `alert` marca las que van atrasadas. */
  activeCampaigns: async (): Promise<ActiveCampaignReportItem[]> => {
    const res = await api.get<ActiveCampaignReportItem[]>("/reports/active-campaigns");
    return res.data;
  },

  /** HU-19: fechas en ISO-8601 (por ejemplo `2026-11-01T00:00:00Z`). */
  fundsByPeriod: async (startDate: string, endDate: string): Promise<PeriodFundsReportResponse> => {
    const res = await api.get<PeriodFundsReportResponse>("/reports/funds-by-period", {
      params: { startDate, endDate },
    });
    return res.data;
  },
};
