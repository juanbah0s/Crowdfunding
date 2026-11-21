import type { Campaign, CampaignStatus } from "../context/UserContext";
import type { CampaignStatusBackend } from "../api/types";

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);
}

export function formatDate(d: string) {
  const date = d.length === 10 ? new Date(d + "T00:00:00") : new Date(d);
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: string) {
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Estado tal como lo devuelve el servidor; FINISHED (fecha límite cumplida, HU-13) se muestra aparte de CLOSED. */
export function BackendStatusBadge({ status }: { status: CampaignStatusBackend | null }) {
  if (!status) return <span className="muted-text">—</span>;
  const variant: CampaignStatus = status === "ACTIVE" ? "active" : status === "PAUSED" ? "paused" : "closed";
  const label = { ACTIVE: "Activa", PAUSED: "Pausada", CLOSED: "Cerrada", FINISHED: "Finalizada" }[status];
  return <span className={`status-badge status-badge--${variant}`}>{label}</span>;
}

export function getDaysLeft(deadline: string) {
  const end = new Date(deadline + "T23:59:59").getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

export function getProgress(campaign: Campaign) {
  return campaign.goal > 0 ? Math.round((campaign.raised / campaign.goal) * 100) : 0;
}

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  active: "Activa",
  paused: "Pausada",
  closed: "Cerrada",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{STATUS_LABELS[status]}</span>;
}

export function CampaignCover({ campaign, className }: { campaign: Campaign; className?: string }) {
  if (campaign.images[0]) {
    return <img src={campaign.images[0]} alt={campaign.title} className={className} />;
  }
  return (
    <div className={`${className ?? ""} campaign-cover--empty`}>
      <span>{campaign.title.charAt(0)}</span>
    </div>
  );
}
