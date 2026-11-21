import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CalendarRange } from "lucide-react";
import { reportsApi } from "../api/reports";
import { getApiError } from "../api/client";
import type { ActiveCampaignReportItem, PeriodFundsReportResponse } from "../api/types";
import { useUser } from "../context/UserContext";
import { formatCurrency } from "../lib/campaignUtils";
import "./Reports.css";

const ACTIVE_COLUMNS = "minmax(0, 2fr) 1fr 1fr 0.7fr 0.8fr 1fr";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

/**
 * HU-18: campañas activas (el creador ve las suyas, el admin todas) con alerta si quedan 5 días o
 * menos y van por debajo del 50 %. HU-19: fondos recaudados entre dos fechas.
 */
export function Reports() {
  const { user, isBackendSession } = useUser();
  const isAdmin = user?.role === "admin";

  return (
    <main className="panel__main panel__main--wide">
      <div>
        <h1 className="panel__heading">Reportes</h1>
        <p className="panel__subheading">
          {isAdmin ? "Vista consolidada de toda la plataforma." : "Desempeño de tus campañas."}
        </p>
      </div>

      {!isBackendSession ? (
        <div className="panel__card empty-state">
          <CalendarRange size={28} />
          <p className="empty-state__title">Disponible con una cuenta real</p>
          <p className="empty-state__text">Los reportes se calculan con los datos del servidor.</p>
        </div>
      ) : (
        <>
          <ActiveCampaignsReport />
          <FundsByPeriodReport />
        </>
      )}
    </main>
  );
}

function ActiveCampaignsReport() {
  const [rows, setRows] = useState<ActiveCampaignReportItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    reportsApi
      .activeCampaigns()
      .then(setRows)
      .catch((err) => setError(getApiError(err, "No se pudo cargar el reporte de campañas activas.")));
  }, []);

  const alerts = rows?.filter((r) => r.alert).length ?? 0;

  return (
    <section className="panel__card" aria-labelledby="active-report-title">
      <div className="panel__section-header">
        <h2 id="active-report-title" className="panel__card-title" style={{ margin: 0 }}>
          Campañas activas
        </h2>
        {alerts > 0 && (
          <span className="alert-pill">
            <AlertTriangle size={13} /> {alerts} en riesgo
          </span>
        )}
      </div>

      {error ? (
        <div className="panel__alert panel__alert--error">
          <AlertCircle size={16} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      ) : !rows ? (
        <p className="muted-text">Cargando reporte…</p>
      ) : (
        <div className="data-table" style={{ "--data-table-columns": ACTIVE_COLUMNS } as React.CSSProperties}>
          <div className="data-table__row data-table__row--head">
            <span>Campaña</span>
            <span className="data-table__cell--right">Meta</span>
            <span className="data-table__cell--right">Recaudado</span>
            <span className="data-table__cell--right">Avance</span>
            <span className="data-table__cell--right">Días restantes</span>
            <span>Alerta</span>
          </div>
          {rows.length === 0 ? (
            <div className="empty-state data-table__empty">
              <p className="empty-state__title">No hay campañas activas</p>
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className={`data-table__row${r.alert ? " data-table__row--alert" : ""}`}>
                <span className="data-table__cell--strong">
                  <span className="data-table__label">Campaña</span>
                  {r.title}
                </span>
                <span className="data-table__cell--right">
                  <span className="data-table__label">Meta</span>
                  {formatCurrency(Number(r.goal))}
                </span>
                <span className="data-table__cell--right">
                  <span className="data-table__label">Recaudado</span>
                  {formatCurrency(Number(r.currentRaised))}
                </span>
                <span className="data-table__cell--right">
                  <span className="data-table__label">Avance</span>
                  {Math.round(r.percentage)}%
                </span>
                <span className="data-table__cell--right">
                  <span className="data-table__label">Días restantes</span>
                  {r.daysRemaining}
                </span>
                <span>
                  <span className="data-table__label">Alerta</span>
                  {r.alert ? (
                    <span className="alert-pill" title="Quedan 5 días o menos y lleva menos del 50 % de la meta">
                      <AlertTriangle size={13} /> En riesgo
                    </span>
                  ) : (
                    <span className="ok-pill">Sin alerta</span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function FundsByPeriodReport() {
  const [startDate, setStartDate] = useState(firstDayOfMonthIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [report, setReport] = useState<PeriodFundsReportResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReport(null);
    if (!startDate || !endDate) {
      setError("Selecciona la fecha inicial y la fecha final.");
      return;
    }
    if (endDate < startDate) {
      setError("La fecha final no puede ser anterior a la fecha inicial.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // El periodo incluye completos el día inicial y el final.
      setReport(await reportsApi.fundsByPeriod(`${startDate}T00:00:00Z`, `${endDate}T23:59:59Z`));
    } catch (err) {
      setError(getApiError(err, "No se pudo generar el reporte."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel__card" aria-labelledby="period-report-title">
      <h2 id="period-report-title" className="panel__card-title">
        Fondos recaudados por periodo
      </h2>

      <form className="filter-bar" onSubmit={handleSubmit}>
        <label className="filter-field">
          <span className="field-label">Fecha inicial</span>
          <input type="date" value={startDate} max={todayIso()} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="filter-field">
          <span className="field-label">Fecha final</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button type="submit" className="panel__submit" disabled={loading}>
          {loading ? "Generando…" : "Generar reporte"}
        </button>
      </form>

      {error && (
        <div className="panel__alert panel__alert--error" style={{ marginTop: "1rem" }}>
          <AlertCircle size={16} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {report &&
        (report.contributionCount === 0 ? (
          <p className="preference-preview">{report.message}</p>
        ) : (
          <div className="stat-grid" style={{ marginTop: "1rem" }}>
            <div className="panel__list-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <p className="panel__stat-label">Total recaudado</p>
              <p className="panel__stat-value" style={{ color: "#16a34a" }}>
                {formatCurrency(Number(report.totalFunds))}
              </p>
            </div>
            <div className="panel__list-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <p className="panel__stat-label">Aportes recibidos</p>
              <p className="panel__stat-value">{report.contributionCount}</p>
            </div>
            <div className="panel__list-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <p className="panel__stat-label">Promedio por aporte</p>
              <p className="panel__stat-value">{formatCurrency(Number(report.averageContribution))}</p>
            </div>
          </div>
        ))}
    </section>
  );
}
