import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { campaignsApi } from "../api/campaigns";
import { getApiError } from "../api/client";
import type { CampaignEarningsResponse } from "../api/types";
import { useUser } from "../context/UserContext";
import { formatCurrency, formatDate, getProgress } from "../lib/campaignUtils";
import "./Reports.css";

const COLUMNS = "1fr minmax(0, 2fr) 1fr minmax(0, 1.5fr)";
const FILTER_DELAY_MS = 350;

/** HU-14: recaudo de una campaña propia y sus patrocinadores, filtrable por patrocinador o recompensa. */
export function CampaignEarnings() {
  const { id = "" } = useParams();
  const { campaigns } = useUser();
  const campaign = campaigns.find((c) => c.id === id);

  const [contributor, setContributor] = useState("");
  const [reward, setReward] = useState("");
  const [earnings, setEarnings] = useState<CampaignEarningsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Espera a que el usuario deje de escribir para no consultar en cada tecla.
    const timer = setTimeout(() => {
      campaignsApi
        .earnings(id, {
          contributor: contributor.trim() || undefined,
          reward: reward.trim() || undefined,
        })
        .then((data) => {
          setEarnings(data);
          setError("");
        })
        .catch((err) => setError(getApiError(err, "No se pudo cargar el recaudo de la campaña.")));
    }, FILTER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [id, contributor, reward]);

  const filtering = contributor.trim() !== "" || reward.trim() !== "";

  return (
    <main className="panel__main panel__main--wide">
      <Link to="/mis-campanas" className="back-link">
        <ArrowLeft size={15} /> Mis campañas
      </Link>
      <div>
        <h1 className="panel__heading">Recaudo{earnings ? ` · ${earnings.campaignName}` : ""}</h1>
        <p className="panel__subheading">Fondos recaudados y detalle de los patrocinadores.</p>
      </div>

      {error && (
        <div className="panel__alert panel__alert--error">
          <AlertCircle size={16} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {earnings && (
        <>
          <div className="stat-grid">
            <div className="panel__card">
              <p className="panel__stat-label">Recaudado</p>
              <p className="panel__stat-value" style={{ color: "#16a34a" }}>
                {formatCurrency(Number(earnings.totalRaised))}
              </p>
              {campaign && (
                <p className="panel__list-sub">
                  {getProgress(campaign)}% de {formatCurrency(campaign.goal)}
                </p>
              )}
            </div>
            <div className="panel__card">
              <p className="panel__stat-label">Patrocinadores</p>
              <p className="panel__stat-value">{earnings.contributorsCount}</p>
            </div>
          </div>

          <div className="filter-bar">
            <label className="filter-field">
              <span className="field-label">Patrocinador</span>
              <input
                type="search"
                placeholder="Correo del patrocinador"
                value={contributor}
                onChange={(e) => setContributor(e.target.value)}
              />
            </label>
            <label className="filter-field">
              <span className="field-label">Recompensa</span>
              <input
                type="search"
                placeholder="Nombre de la recompensa"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
              />
            </label>
          </div>

          <section className="data-table" aria-label="Aportes de la campaña" style={{ "--data-table-columns": COLUMNS } as React.CSSProperties}>
            <div className="data-table__row data-table__row--head">
              <span>Fecha</span>
              <span>Patrocinador</span>
              <span className="data-table__cell--right">Monto</span>
              <span>Recompensa</span>
            </div>
            {earnings.contributions.length === 0 ? (
              <div className="empty-state data-table__empty">
                <p className="empty-state__title">
                  {filtering ? "Ningún aporte coincide con el filtro" : "Esta campaña aún no tiene aportes"}
                </p>
              </div>
            ) : (
              earnings.contributions.map((c) => (
                <div key={c.transactionId} className="data-table__row">
                  <span>
                    <span className="data-table__label">Fecha</span>
                    {formatDate(c.date)}
                  </span>
                  <span>
                    <span className="data-table__label">Patrocinador</span>
                    {c.contributorName ?? c.contributorEmail ?? "Usuario eliminado"}
                  </span>
                  <span className="data-table__cell--right data-table__cell--strong">
                    <span className="data-table__label">Monto</span>
                    {formatCurrency(Number(c.amount))}
                  </span>
                  <span>
                    <span className="data-table__label">Recompensa</span>
                    {c.rewardName ?? <span className="data-table__cell--muted">Sin recompensa</span>}
                  </span>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}
