import { api } from "./client";
import type { NotificationResponse, NotificationSummaryResponse } from "./types";

/** HU-15: notificaciones de la plataforma, como los hitos de financiación. */
export const notificationsApi = {
  list: async (): Promise<NotificationSummaryResponse> => {
    const res = await api.get<NotificationSummaryResponse>("/notifications");
    return res.data;
  },

  markAsRead: async (id: string): Promise<NotificationResponse> => {
    const res = await api.patch<NotificationResponse>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },
};
