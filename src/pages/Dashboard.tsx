import { Link } from "react-router";
import { useUser } from "../context/UserContext";
import type { UserRole } from "../context/UserContext";

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

function getTotalHistoricalContributions(transactions: ReturnType<typeof useUser>["transactions"]) {
  return transactions
    .filter((t) => t.type === "contribution")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function Dashboard() {
  const { user, transactions, campaigns, setRole } = useUser();

  const totalContributed = getTotalHistoricalContributions(transactions);

  const contributionsByCampaign = campaigns.map((c) => ({
    ...c,
    contributed: transactions
      .filter((t) => t.type === "contribution" && t.campaignName === c.title)
      .reduce((sum, t) => sum + t.amount, 0),
  }));

  return (
    <main className="panel__main">
      {/* Greeting */}
      <div>
        <h1 className="panel__heading">
          Bienvenido, {user?.name.split(" ")[0]}.
        </h1>
        <p className="panel__subheading">
          {user?.role === "creator" ? "Creador de proyectos" : "Patrocinador"} · Panel principal
        </p>
      </div>

      {/* Role demo toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#a1a1aa",
          }}
        >
          Vista demo
        </span>
        <div className="role-toggle">
          {(["sponsor", "creator"] as UserRole[]).map((r) => (
            <button
              key={r}
              className={`role-toggle__btn${user?.role === r ? " role-toggle__btn--active" : ""}`}
              onClick={() => setRole(r)}
            >
              {r === "sponsor" ? "Patrocinador" : "Creador"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Balance */}
        <div
          className="panel__card"
          style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}
        >
          <div>
            <p className="panel__stat-label">Saldo disponible</p>
            <p className="panel__stat-value">{fmt(user?.balance ?? 0)}</p>
          </div>
          <Link to="/billetera" style={{ textDecoration: "none", alignSelf: "flex-start" }}>
            <button className="panel__submit" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
              Recargar
            </button>
          </Link>
        </div>

        {/* Total histórico aportado — visible only for sponsors */}
        {user?.role === "sponsor" && (
          <div className="panel__card" style={{ position: "relative", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at 110% 110%, rgba(229,57,53,0.07), transparent 65%)",
                pointerEvents: "none",
              }}
            />
            <p className="panel__stat-label">Total histórico aportado</p>
            <p className="panel__stat-value" style={{ color: "var(--color-accent)" }}>
              {fmt(totalContributed)}
            </p>
            <p style={{ fontSize: "0.72rem", color: "#a1a1aa", marginTop: "0.35rem" }}>
              {transactions.filter((t) => t.type === "contribution").length} contribución
              {transactions.filter((t) => t.type === "contribution").length !== 1 ? "es" : ""} realizadas
            </p>
          </div>
        )}

        {/* Creator: total recaudado */}
        {user?.role === "creator" && (
          <div className="panel__card" style={{ position: "relative", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at 110% 110%, rgba(22,163,74,0.07), transparent 65%)",
                pointerEvents: "none",
              }}
            />
            <p className="panel__stat-label">Total recaudado</p>
            <p className="panel__stat-value" style={{ color: "#16a34a" }}>
              {fmt(campaigns.reduce((s, c) => s + c.raised, 0))}
            </p>
            <p style={{ fontSize: "0.72rem", color: "#a1a1aa", marginTop: "0.35rem" }}>
              en {campaigns.length} campaña{campaigns.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Creator view — fondos recaudados por campaña */}
      {user?.role === "creator" && (
        <div className="panel__card">
          <h2 className="panel__card-title">Fondos recaudados por campaña</h2>
          <div className="panel__list">
            {campaigns.map((c) => {
              const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
              return (
                <div
                  key={c.id}
                  className="panel__list-row"
                  style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p className="panel__list-label">{c.title}</p>
                    <span className="panel__list-amount">{fmt(c.raised)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="progress" style={{ flex: 1, marginTop: 0 }}>
                      <div className="progress__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#71717a", minWidth: "2.75rem", textAlign: "right" }}>
                      {pct}%
                    </span>
                  </div>
                  <p className="panel__list-sub" style={{ margin: 0 }}>
                    Meta: {fmt(c.goal)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sponsor view — detalle de aportes por campaña */}
      {user?.role === "sponsor" && (
        <div className="panel__card">
          <h2 className="panel__card-title">Detalle de aportes por campaña</h2>
          <div className="panel__list">
            {contributionsByCampaign.filter((c) => c.contributed > 0).length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "#a1a1aa", textAlign: "center", padding: "1rem 0" }}>
                Aún no has realizado contribuciones.
              </p>
            ) : (
              contributionsByCampaign
                .filter((c) => c.contributed > 0)
                .map((c) => {
                  const pct = totalContributed > 0
                    ? Math.round((c.contributed / totalContributed) * 100)
                    : 0;
                  return (
                    <div
                      key={c.id}
                      className="panel__list-row"
                      style={{ flexDirection: "column", alignItems: "stretch", gap: "0.4rem" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p className="panel__list-label">{c.title}</p>
                        <span className="panel__list-amount panel__list-amount--debit">
                          {fmt(c.contributed)}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="progress" style={{ flex: 1, marginTop: 0 }}>
                          <div
                            className="progress__fill"
                            style={{ width: `${pct}%`, background: "var(--color-accent)" }}
                          />
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#71717a", minWidth: "2.75rem", textAlign: "right" }}>
                          {pct}% del total
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="panel__card" id="movimientos">
        <h2 className="panel__card-title">Historial de movimientos</h2>
        <div className="panel__list">
          {transactions.map((t) => (
            <div key={t.id} className="panel__list-row">
              <div>
                <p className="panel__list-label">
                  {t.type === "recharge" ? "Recarga de saldo" : `Aporte · ${t.campaignName}`}
                </p>
                <p className="panel__list-sub">{fmtDate(t.date)}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                <span
                  className={`panel__list-amount ${
                    t.type === "recharge" ? "panel__list-amount--credit" : "panel__list-amount--debit"
                  }`}
                >
                  {t.type === "recharge" ? "+" : "−"}{fmt(t.amount)}
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
