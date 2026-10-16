import { useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Megaphone,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  XCircle,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import type { Campaign, CampaignStatus } from "../context/UserContext";
import { formatCurrency, formatDate, getProgress, StatusBadge, CampaignCover } from "../lib/campaignUtils";
import "./Campaigns.css";

type Feedback = { campaignId: string; type: "success" | "error"; message: string } | null;

const STATUS_MESSAGES: Record<CampaignStatus, (c: Campaign) => string> = {
  active: () => "La campaña se reanudó y vuelve a recibir aportes.",
  paused: () => "Campaña pausada. Los aportes quedan inhabilitados temporalmente.",
  closed: (c) =>
    `Campaña cerrada de forma permanente. Se notificó por correo a ${c.backerEmails.length} patrocinador${
      c.backerEmails.length !== 1 ? "es" : ""
    }.`,
};

export function MyCampaigns() {
  const { user, campaigns, changeCampaignStatus } = useUser();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const managedCampaigns = isAdmin ? campaigns : campaigns.filter((c) => c.creatorEmail === user?.email);

  const handleStatusChange = (campaign: Campaign, status: CampaignStatus) => {
    setClosingId(null);
    const result = changeCampaignStatus(campaign.id, status);
    setFeedback(
      result.ok
        ? { campaignId: campaign.id, type: "success", message: STATUS_MESSAGES[status](campaign) }
        : { campaignId: campaign.id, type: "error", message: result.error },
    );
  };

  return (
    <main className="panel__main">
      <div className="panel__section-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="panel__heading">{isAdmin ? "Todas las campañas" : "Mis campañas"}</h1>
          <p className="panel__subheading">
            {isAdmin
              ? "Vista de administrador · gestiona cualquier campaña."
              : "Publica, edita, pausa o cierra tus proyectos."}
          </p>
        </div>
        <Link to="/campanas/nueva" className="panel__submit inline-icon" style={{ textDecoration: "none" }}>
          <Plus size={15} /> Publicar campaña
        </Link>
      </div>

      {managedCampaigns.length === 0 ? (
        <div className="panel__card empty-state">
          <Megaphone size={28} />
          <p className="empty-state__title">Aún no has publicado campañas</p>
          <p className="empty-state__text">Da a conocer tu iniciativa y empieza a recibir aportes.</p>
          <Link to="/campanas/nueva" className="text-link">
            Publicar mi primera campaña
          </Link>
        </div>
      ) : (
        <div className="panel__list">
          {managedCampaigns.map((c) => {
            const pct = getProgress(c);
            const rowFeedback = feedback?.campaignId === c.id ? feedback : null;
            return (
              <div key={c.id} className="managed-card">
                <div className="managed-row">
                  <CampaignCover campaign={c} className="managed-row__img" />
                  <div className="managed-row__body">
                    <div className="managed-row__top">
                      <p className="panel__list-label">{c.title}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="progress" style={{ marginTop: "0.5rem" }}>
                      <div className="progress__fill" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <p className="panel__list-sub" style={{ marginTop: "0.4rem" }}>
                      {formatCurrency(c.raised)} de {formatCurrency(c.goal)} · {pct}% · cierra{" "}
                      {formatDate(c.deadline)}
                      {isAdmin && ` · ${c.creatorName}`}
                    </p>
                  </div>
                </div>

                {rowFeedback && (
                  <div className={`panel__alert panel__alert--${rowFeedback.type}`}>
                    {rowFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <p style={{ margin: 0 }}>{rowFeedback.message}</p>
                  </div>
                )}

                {closingId === c.id ? (
                  <div className="confirm-box">
                    <p>
                      ¿Cerrar "{c.title}" definitivamente? No podrá reabrirse y se notificará a los{" "}
                      {c.backerEmails.length} patrocinadores.
                    </p>
                    <div className="action-row">
                      <button className="btn-ghost" onClick={() => setClosingId(null)}>
                        Cancelar
                      </button>
                      <button className="btn-danger" onClick={() => handleStatusChange(c, "closed")}>
                        Sí, cerrar campaña
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="action-row action-row--start">
                    <Link to={`/campanas/${c.id}`} className="btn-ghost">
                      <Eye size={14} /> Ver
                    </Link>
                    {c.status === "active" && (
                      <Link to={`/campanas/${c.id}/editar`} className="btn-outline">
                        <Pencil size={14} /> Editar
                      </Link>
                    )}
                    {c.status === "active" && (
                      <button className="btn-outline" onClick={() => handleStatusChange(c, "paused")}>
                        <PauseCircle size={14} /> Pausar
                      </button>
                    )}
                    {c.status === "paused" && (
                      <button className="btn-outline" onClick={() => handleStatusChange(c, "active")}>
                        <PlayCircle size={14} /> Reanudar
                      </button>
                    )}
                    {c.status !== "closed" ? (
                      <button className="btn-outline btn-outline--danger" onClick={() => setClosingId(c.id)}>
                        <XCircle size={14} /> Cerrar
                      </button>
                    ) : (
                      <span className="muted-text">Cerrada de forma permanente · no admite cambios.</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
