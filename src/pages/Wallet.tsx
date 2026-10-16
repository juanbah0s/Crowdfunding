import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useUser } from "../context/UserContext";
import { getApiError } from "../api/client";

const MIN = 10000;
const MAX = 1000000;

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function Wallet() {
  const { user, transactions, recharge } = useUser();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });


  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    const parsed = parseInt(amount, 10);

    if (!amount || isNaN(parsed) || parsed <= 0) {
      setStatus({ type: "error", message: "El monto debe ser mayor a cero." });
      return;
    }

    if (parsed < MIN || parsed > MAX) {
      setStatus({
        type: "error",
        message: `El monto debe estar entre ${fmt(MIN)} y ${fmt(MAX)}.`,
      });
      return;
    }

    try {
      await recharge(parsed);
      setStatus({
        type: "success",
        message: `Recarga de ${fmt(parsed)} realizada exitosamente. Tu saldo ha sido actualizado.`,
      });
      setAmount("");
    } catch (err) {
      setStatus({ type: "error", message: getApiError(err, "No se pudo realizar la recarga.") });
    }
  };

  return (
    <main className="panel__main">
      <div>
        <h1 className="panel__heading">Billetera</h1>
        <p className="panel__subheading">
          Recarga tu saldo virtual y consulta todos tus movimientos.
        </p>
      </div>

      {/* Balance card */}
      <div className="panel__card">
        <p className="panel__stat-label">Saldo disponible</p>
        <p className="panel__stat-value">{fmt(user?.balance ?? 0)}</p>
      </div>

      {/* Recharge form */}
      <div className="panel__card" style={{ maxWidth: 480 }}>
        <h2 className="panel__card-title">Ingresar saldo</h2>

        {status.type && (
          <div
            className={`panel__alert panel__alert--${status.type}`}
            style={{ marginBottom: "1.25rem" }}
          >
            {status.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <p style={{ margin: 0 }}>{status.message}</p>
          </div>
        )}

        <form onSubmit={handleRecharge} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              htmlFor="recharge-amount"
              style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#71717a",
                marginBottom: "0.45rem",
              }}
            >
              Monto a recargar (COP)
            </label>
            <input
              id="recharge-amount"
              type="number"
              min={MIN}
              max={MAX}
              step={1000}
              value={amount}
              placeholder={`${MIN.toLocaleString("es-CO")} – ${MAX.toLocaleString("es-CO")}`}
              onChange={(e) => {
                setAmount(e.target.value);
                setStatus({ type: null, message: "" });
              }}
              className="amount-input"
            />
            <p style={{ fontSize: "0.68rem", color: "#a1a1aa", marginTop: "0.4rem" }}>
              Mínimo {fmt(MIN)} · Máximo {fmt(MAX)}
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={!amount} className="panel__submit">
              Recargar
            </button>
          </div>
        </form>
      </div>

      {/* Transaction history */}
      <div className="panel__card" id="movimientos">
        <h2 className="panel__card-title">Historial de movimientos</h2>
        <div className="panel__list">
          {transactions.length === 0 && (
            <p style={{ fontSize: "0.875rem", color: "#a1a1aa", textAlign: "center", padding: "1rem 0" }}>
              Aún no tienes movimientos.
            </p>
          )}
          {transactions.map((t) => (
            <div key={t.id} className="panel__list-row">
              <div>
                <p className="panel__list-label">
                  {t.type === "recharge" ? "Recarga de saldo" : `Aporte · ${t.campaignName}`}
                </p>
                <p className="panel__list-sub">
                  {fmtDate(t.date)}
                  {t.rewardTitle ? ` · Recompensa: ${t.rewardTitle}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                <span
                  className={`panel__list-amount ${
                    t.type === "recharge" ? "panel__list-amount--credit" : "panel__list-amount--debit"
                  }`}
                >
                  {t.type === "recharge" ? "+" : "−"}
                  {fmt(t.amount)}
                </span>
                <span className={`badge ${t.type === "recharge" ? "badge--green" : "badge--red"}`}>
                  {t.type === "recharge" ? "Recarga" : "Aporte"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
