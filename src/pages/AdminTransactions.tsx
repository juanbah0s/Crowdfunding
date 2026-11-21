import { useEffect, useState } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { adminApi } from "../api/admin";
import { getApiError } from "../api/client";
import type { AdminTransactionResponse } from "../api/types";
import { useUser } from "../context/UserContext";
import { formatCurrency, formatDateTime } from "../lib/campaignUtils";
import "./Reports.css";

const COLUMNS = "1.3fr 0.9fr minmax(0, 1.6fr) 1fr 0.8fr";

const TYPE_LABELS: Record<string, string> = {
  recharge: "Recarga",
  contribution: "Aporte",
  refund: "Devolución",
};

function typeLabel(type: string) {
  return TYPE_LABELS[type.toLowerCase()] ?? type;
}

/** HU-17: registro general de transacciones para el admin; es de solo lectura, sin edición ni borrado. */
export function AdminTransactions() {
  const { accounts, isBackendSession } = useUser();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("");
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<AdminTransactionResponse[] | null>(null);
  const [error, setError] = useState("");

  const invalidRange = !!startDate && !!endDate && endDate < startDate;

  useEffect(() => {
    if (!isBackendSession || invalidRange) return;
    adminApi
      .listTransactions({
        startDate: startDate ? `${startDate}T00:00:00Z` : undefined,
        endDate: endDate ? `${endDate}T23:59:59Z` : undefined,
        type: type || undefined,
        userId: userId || undefined,
      })
      .then((data) => {
        setRows(data);
        setError("");
      })
      .catch((err) => setError(getApiError(err, "No se pudo cargar el registro de transacciones.")));
  }, [isBackendSession, startDate, endDate, type, userId, invalidRange]);

  return (
    <main className="panel__main panel__main--wide">
      <div>
        <h1 className="panel__heading">Transacciones</h1>
        <p className="panel__subheading">
          <Lock size={13} style={{ display: "inline", verticalAlign: "-1px" }} /> Registro de auditoría de solo lectura: los movimientos
          guardados no se pueden editar ni eliminar.
        </p>
      </div>

      <div className="filter-bar">
        <label className="filter-field">
          <span className="field-label">Desde</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="filter-field">
          <span className="field-label">Hasta</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="filter-field">
          <span className="field-label">Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos</option>
            <option value="recharge">Recarga</option>
            <option value="contribution">Aporte</option>
            <option value="refund">Devolución</option>
          </select>
        </label>
        <label className="filter-field">
          <span className="field-label">Usuario</span>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Todos</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.email}
              </option>
            ))}
          </select>
        </label>
      </div>

      {invalidRange && (
        <div className="panel__alert panel__alert--error">
          <AlertCircle size={16} />
          <p style={{ margin: 0 }}>La fecha final no puede ser anterior a la fecha inicial.</p>
        </div>
      )}
      {error && (
        <div className="panel__alert panel__alert--error">
          <AlertCircle size={16} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {!isBackendSession ? (
        <div className="panel__card empty-state">
          <p className="empty-state__title">Disponible con una cuenta real de administrador</p>
        </div>
      ) : (
        rows && (
          <section className="data-table" aria-label="Registro de transacciones" style={{ "--data-table-columns": COLUMNS } as React.CSSProperties}>
            <div className="data-table__row data-table__row--head">
              <span>Fecha y hora</span>
              <span>Tipo</span>
              <span>Usuario</span>
              <span className="data-table__cell--right">Monto</span>
              <span>Estado</span>
            </div>
            {rows.length === 0 ? (
              <div className="empty-state data-table__empty">
                <p className="empty-state__title">No hay transacciones con estos filtros</p>
              </div>
            ) : (
              rows.map((t) => (
                <div key={t.id} className="data-table__row">
                  <span>
                    <span className="data-table__label">Fecha y hora</span>
                    {formatDateTime(t.date)}
                  </span>
                  <span>
                    <span className="data-table__label">Tipo</span>
                    <span className={`badge ${t.type.toLowerCase() === "recharge" ? "badge--green" : "badge--red"}`}>
                      {typeLabel(t.type)}
                    </span>
                  </span>
                  <span>
                    <span className="data-table__label">Usuario</span>
                    {t.userName}
                  </span>
                  <span className="data-table__cell--right data-table__cell--strong">
                    <span className="data-table__label">Monto</span>
                    {formatCurrency(Number(t.amount))}
                  </span>
                  <span>
                    <span className="data-table__label">Estado</span>
                    {t.status === "EXITOSA" ? "Exitosa" : t.status}
                  </span>
                </div>
              ))
            )}
          </section>
        )
      )}
    </main>
  );
}
