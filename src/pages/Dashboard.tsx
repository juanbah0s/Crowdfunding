import { Link } from "react-router";
import { useUser } from "../context/UserContext";

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);
}

function getTotalHistoricalContributions(transactions: ReturnType<typeof useUser>["transactions"]) {
  return transactions
    .filter((t) => t.type === "contribution")
    .reduce((sum, t) => sum + t.amount, 0);
}

const emptyTextStyle = { fontSize: "0.875rem", color: "#a1a1aa", textAlign: "center" as const, padding: "1rem 0" };
const linkStyle = { fontSize: "0.8rem", fontWeight: 700, color: "var(--color-accent)", textDecoration: "none" };

export function Dashboard() {
  const { user, transactions, campaigns } = useUser();
  const isAdmin = user?.role === "admin";

  const totalContributed = getTotalHistoricalContributions(transactions);
  const contributionCount = transactions.filter((t) => t.type === "contribution").length;

  const managedCampaigns = isAdmin ? campaigns : campaigns.filter((c) => c.creatorEmail === user?.email);
  const totalRaised = managedCampaigns.reduce((s, c) => s + c.raised, 0);

  const contributionsByCampaign = campaigns
    .map((c) => ({
      ...c,
      contributed: transactions
        .filter((t) => t.type === "contribution" && t.campaignId === c.id)
        .reduce((sum, t) => sum + t.amount, 0),
    }))
    .filter((c) => c.contributed > 0);

  return (
    <main className="panel__main">
      <div>
        <h1 className="panel__heading">Bienvenido, {user?.name.split(" ")[0]}.</h1>
        <p className="panel__subheading">{isAdmin ? "Administrador" : "Usuario"} · Panel principal</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
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
            {contributionCount} contribución{contributionCount !== 1 ? "es" : ""} realizadas
          </p>
        </div>

        <div className="panel__card" style={{ position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 110% 110%, rgba(22,163,74,0.07), transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <p className="panel__stat-label">{isAdmin ? "Recaudado en la plataforma" : "Total recaudado"}</p>
          <p className="panel__stat-value" style={{ color: "#16a34a" }}>
            {fmt(totalRaised)}
          </p>
          <p style={{ fontSize: "0.72rem", color: "#a1a1aa", marginTop: "0.35rem" }}>
            en {managedCampaigns.length} campaña{managedCampaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Creator view */}
      <div className="panel__card">
        <div className="panel__section-header">
          <h2 className="panel__card-title" style={{ margin: 0 }}>
            Fondos recaudados por campaña
          </h2>
          <Link to="/mis-campanas" style={linkStyle}>
            Gestionar campañas →
          </Link>
        </div>
        <div className="panel__list">
          {managedCampaigns.length === 0 && (
            <p style={emptyTextStyle}>
              Aún no has publicado campañas.{" "}
              <Link to="/campanas/nueva" style={linkStyle}>
                Publicar una
              </Link>
            </p>
          )}
          {managedCampaigns.map((c) => {
            const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
            return (
              <div
                key={c.id}
                className="panel__list-row"
                style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Link to={`/campanas/${c.id}`} className="panel__list-label" style={{ textDecoration: "none" }}>
                    {c.title}
                  </Link>
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

      {/* Sponsor view */}
      <div className="panel__card">
        <div className="panel__section-header">
          <h2 className="panel__card-title" style={{ margin: 0 }}>
            Detalle de aportes por campaña
          </h2>
          <Link to="/billetera" style={linkStyle}>
            Ver movimientos →
          </Link>
        </div>
        <div className="panel__list">
          {contributionsByCampaign.length === 0 ? (
            <p style={emptyTextStyle}>
              Aún no has realizado contribuciones.{" "}
              <Link to="/" style={linkStyle}>
                Explorar campañas
              </Link>
            </p>
          ) : (
            contributionsByCampaign.map((c) => {
              const pct = totalContributed > 0 ? Math.round((c.contributed / totalContributed) * 100) : 0;
              return (
                <div
                  key={c.id}
                  className="panel__list-row"
                  style={{ flexDirection: "column", alignItems: "stretch", gap: "0.4rem" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link to={`/campanas/${c.id}`} className="panel__list-label" style={{ textDecoration: "none" }}>
                      {c.title}
                    </Link>
                    <span className="panel__list-amount panel__list-amount--debit">{fmt(c.contributed)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="progress" style={{ flex: 1, marginTop: 0 }}>
                      <div className="progress__fill" style={{ width: `${pct}%` }} />
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
    </main>
  );
}
