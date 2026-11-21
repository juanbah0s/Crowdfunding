import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertCircle, History } from "lucide-react";
import { contributionsApi } from "../api/contributions";
import { getApiError } from "../api/client";
import type { ContributionHistoryResponse } from "../api/types";
import { useUser } from "../context/UserContext";
import { BackendStatusBadge, formatCurrency, formatDate } from "../lib/campaignUtils";
import "./Reports.css";

const COLUMNS = "1fr minmax(0, 2fr) 1fr minmax(0, 1.4fr) 0.9fr";

/** HU-16: mis aportes con fecha, campaña, monto, recompensa, estado actual de la campaña y total acumulado. */
export function ContributionHistory() {
  const { isBackendSession } = useUser();
  const [history, setHistory] = useState<ContributionHistoryResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isBackendSession) return;
    contributionsApi
      .history()
      .then(setHistory)
      .catch((err) => setError(getApiError(err, "No se pudo cargar tu historial de aportes.")));
  }, [isBackendSession]);

  return (
    <main className="panel__main panel__main--wide">
      <div>
        <h1 className="panel__heading">Historial de contribuciones</h1>
        <p className="panel__subheading">Todos los aportes que has realizado en la plataforma.</p>
      </div>

      {!isBackendSession ? (
        <div className="panel__card empty-state">
          <History size={28} />
          <p className="empty-state__title">Disponible con una cuenta real</p>
          <p className="empty-state__text">Las cuentas de demostración no tienen aportes registrados en el servidor.</p>
        </div>
      ) : error ? (
        <div className="panel__alert panel__alert--error">
          <AlertCircle size={16} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      ) : !history ? (
        <p className="muted-text">Cargando historial…</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="panel__card">
              <p className="panel__stat-label">Total aportado</p>
              <p className="panel__stat-value" style={{ color: "var(--color-accent)" }}>
                {formatCurrency(history.totalContributed)}
              </p>
            </div>
            <div className="panel__card">
              <p className="panel__stat-label">Aportes realizados</p>
              <p className="panel__stat-value">{history.contributionsCount}</p>
            </div>
          </div>

          <section className="data-table" aria-label="Historial de aportes" style={{ "--data-table-columns": COLUMNS } as React.CSSProperties}>
            <div className="data-table__row data-table__row--head">
              <span>Fecha</span>
              <span>Campaña</span>
              <span className="data-table__cell--right">Monto</span>
              <span>Recompensa</span>
              <span>Estado</span>
            </div>
            {history.contributions.length === 0 ? (
              <div className="empty-state data-table__empty">
                <p className="empty-state__title">Aún no has realizado aportes</p>
                <Link to="/" className="text-link">
                  Explorar campañas
                </Link>
              </div>
            ) : (
              history.contributions.map((c) => (
                <div key={c.transactionId} className="data-table__row">
                  <span>
                    <span className="data-table__label">Fecha</span>
                    {formatDate(c.date)}
                  </span>
                  <span>
                    <span className="data-table__label">Campaña</span>
                    <Link to={`/campanas/${c.campaignId}`} className="data-table__link">
                      {c.campaignName}
                    </Link>
                  </span>
                  <span className="data-table__cell--right data-table__cell--strong">
                    <span className="data-table__label">Monto</span>
                    {formatCurrency(Number(c.amount))}
                  </span>
                  <span>
                    <span className="data-table__label">Recompensa</span>
                    {c.rewardName ?? <span className="data-table__cell--muted">Sin recompensa</span>}
                  </span>
                  <span>
                    <span className="data-table__label">Estado</span>
                    <BackendStatusBadge status={c.campaignStatus} />
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
