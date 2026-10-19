import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Gift,
  Lock,
  Mail,
  PauseCircle,
  Users,
  XCircle,
  Loader2,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import type { ContributionReceipt } from "../context/UserContext";
import {
  formatCurrency,
  formatDate,
  getDaysLeft,
  getProgress,
  StatusBadge,
  CampaignCover,
} from "../lib/campaignUtils";
import "./Campaigns.css";

type Feedback = { type: "success" | "error"; message: string; suggestRecharge?: boolean } | null;

export function CampaignDetail() {
  const { id } = useParams();
  const { user, campaigns, contribute } = useUser();
  const campaign = campaigns.find((c) => c.id === id);

  const [activeImage, setActiveImage] = useState(0);
  const [amount, setAmount] = useState("");
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contributionFeedback, setContributionFeedback] = useState<Feedback>(null);
  const [receipt, setReceipt] = useState<ContributionReceipt | null>(null);

  if (!campaign) {
    return (
      <main className="panel__main">
        <div className="panel__card empty-state">
          <AlertCircle size={28} />
          <p className="empty-state__title">Campaña no encontrada</p>
          <Link to="/" className="text-link">
            Volver a explorar
          </Link>
        </div>
      </main>
    );
  }

  const pct = getProgress(campaign);
  const isOwner = campaign.creatorEmail === user?.email;
  const parsedAmount = Number(amount);
  const isActive = campaign.status === "active";
  const hasActiveImage = Boolean(campaign.images[activeImage]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setContributionFeedback(null);
    const selected = campaign.rewards.find((r) => r.id === rewardId);
    if (selected && Number(value) < selected.minAmount) setRewardId(null);
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    setContributionFeedback(null);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setContributionFeedback({ type: "error", message: "El monto debe ser mayor a cero." });
      return;
    }
    if (user && parsedAmount > user.balance) {
      setContributionFeedback({
        type: "error",
        message: `Tu saldo (${formatCurrency(user.balance)}) es insuficiente para este aporte.`,
        suggestRecharge: true,
      });
      return;
    }

    setIsProcessing(true);
    // Simulated payment processing delay.
    setTimeout(async () => {
      const result = await contribute(campaign.id, parsedAmount, rewardId, { simulateFailure });
      setIsProcessing(false);
      if (!result.ok) {
        setContributionFeedback({
          type: "error",
          message: result.error,
          suggestRecharge: result.error.startsWith("Saldo insuficiente"),
        });
        return;
      }
      setReceipt(result.data);
      setAmount("");
      setRewardId(null);
    }, 900);
  };

  return (
    <main className="panel__main panel__main--wide">
      <Link to="/" className="back-link">
        <ArrowLeft size={15} /> Todas las campañas
      </Link>

      {campaign.status === "paused" && (
        <div className="status-banner status-banner--paused">
          <PauseCircle size={18} />
          <p>Campaña pausada · Los aportes están inhabilitados temporalmente.</p>
        </div>
      )}
      {campaign.status === "closed" && (
        <div className="status-banner status-banner--closed">
          <XCircle size={18} />
          <p>Campaña cerrada · Ya no recibe nuevos aportes.</p>
        </div>
      )}

      <div className="detail-layout">
        {/* Left column */}
        <div className="detail-main">
          <div className="detail-gallery">
            {hasActiveImage ? (
              <img src={campaign.images[activeImage]} alt={campaign.title} className="detail-gallery__main" />
            ) : (
              <CampaignCover campaign={campaign} className="detail-gallery__main" />
            )}
            {campaign.images.length > 1 && (
              <div className="detail-gallery__thumbs">
                {campaign.images.map((src, i) => (
                  <button
                    key={src.slice(-40) + i}
                    className={`detail-gallery__thumb${i === activeImage ? " detail-gallery__thumb--active" : ""}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={src} alt={`Imagen ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="detail-tags">
              <span className="campaign-card__category">{campaign.category}</span>
              <StatusBadge status={campaign.status} />
            </div>
            <h1 className="detail-title">{campaign.title}</h1>
            <p className="detail-creator">
              por <strong>{campaign.creatorName}</strong> · publicada el {formatDate(campaign.createdAt)}
            </p>
          </div>

          <div className="panel__card">
            <h2 className="panel__card-title">Sobre el proyecto</h2>
            <p className="detail-description">{campaign.description}</p>
          </div>

        </div>

        {/* Right column */}
        <aside className="detail-aside">
          <div className="panel__card">
            <p className="detail-raised">{formatCurrency(campaign.raised)}</p>
            <p className="muted-text">recaudado de {formatCurrency(campaign.goal)}</p>
            <div className="progress">
              <div className="progress__fill" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <div className="detail-stats">
              <div>
                <strong>{pct}%</strong>
                <span>financiado</span>
              </div>
              <div>
                <strong>
                  <Users size={14} /> {campaign.contributionsCount}
                </strong>
                <span>aportes</span>
              </div>
              <div>
                <strong>
                  <CalendarClock size={14} /> {getDaysLeft(campaign.deadline)}
                </strong>
                <span>días restantes</span>
              </div>
            </div>
            <p className="muted-text" style={{ marginTop: "0.75rem" }}>
              Fecha límite: {formatDate(campaign.deadline)}
            </p>
          </div>

          <div className="panel__card">
            <h2 className="panel__card-title">Realizar aporte</h2>

            {!user && isActive ? (
              <div className="disabled-box">
                <Lock size={16} />
                <p>
                  <Link to="/auth" className="text-link">
                    Inicia sesión
                  </Link>{" "}
                  para apoyar este proyecto con tu saldo virtual.
                </p>
              </div>
            ) : !isActive ? (
              <div className="disabled-box">
                <Lock size={16} />
                <p>
                  {campaign.status === "paused"
                    ? "Los aportes están inhabilitados mientras la campaña esté pausada."
                    : "Esta campaña está cerrada y no recibe nuevos aportes."}
                </p>
              </div>
            ) : isOwner ? (
              <div className="disabled-box">
                <Lock size={16} />
                <p>
                  No puedes aportar a tu propia campaña. Gestiónala desde{" "}
                  <Link to="/mis-campanas" className="text-link">
                    Mis campañas
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleContribute} className="contribute-form">
                <div>
                  <label htmlFor="contribution-amount" className="field-label">
                    Monto a aportar (COP)
                  </label>
                  <input
                    id="contribution-amount"
                    type="number"
                    step={1000}
                    className="amount-input"
                    placeholder="Ej. 50000"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                  <p className="field-hint">Saldo disponible: {formatCurrency(user?.balance ?? 0)}</p>
                </div>

                <div>
                  <p className="field-label">
                    Recompensa <span className="field-label__optional">(opcional)</span>
                  </p>
                  <div className="reward-list">
                    <button
                      type="button"
                      className={`reward-option${rewardId === null ? " reward-option--selected" : ""}`}
                      onClick={() => setRewardId(null)}
                    >
                      <div className="reward-option__head">
                        <span className="reward-option__title">Sin recompensa</span>
                      </div>
                      <span className="reward-option__desc">Apoyo el proyecto sin beneficio a cambio.</span>
                    </button>
                    {campaign.rewards.map((r) => {
                      const isSoldOut = r.stock <= 0;
                      const isBelowMinimum = !(parsedAmount >= r.minAmount);
                      const isDisabled = isSoldOut || isBelowMinimum;
                      return (
                        <button
                          type="button"
                          key={r.id}
                          disabled={isDisabled}
                          className={`reward-option${rewardId === r.id ? " reward-option--selected" : ""}${
                            isSoldOut ? " reward-option--soldout" : ""
                          }`}
                          onClick={() => setRewardId(r.id)}
                        >
                          <div className="reward-option__head">
                            <span className="reward-option__title">
                              <Gift size={13} /> {r.title}
                            </span>
                            <span className="reward-option__min">desde {formatCurrency(r.minAmount)}</span>
                          </div>
                          <span className="reward-option__desc">{r.description}</span>
                          <span className="reward-option__foot">
                            {isSoldOut ? (
                              <span className="status-badge status-badge--closed">Agotada</span>
                            ) : (
                              <>
                                <span>{r.stock} disponibles</span>
                                {isBelowMinimum && <span>Aporta al menos {formatCurrency(r.minAmount)}</span>}
                              </>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {contributionFeedback && (
                  <div className={`panel__alert panel__alert--${contributionFeedback.type}`}>
                    <AlertCircle size={16} />
                    <div>
                      <p style={{ margin: 0 }}>{contributionFeedback.message}</p>
                      {contributionFeedback.suggestRecharge && (
                        <Link to="/billetera" className="text-link" style={{ color: "inherit" }}>
                          Recargar saldo →
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <label className="demo-check">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                  />
                  Demo: simular error de procesamiento
                </label>

                <button type="submit" className="panel__submit" disabled={!amount || isProcessing}>
                  {isProcessing ? (
                    <span className="inline-icon">
                      <Loader2 size={15} className="spin" /> Procesando…
                    </span>
                  ) : (
                    "Confirmar aporte"
                  )}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>

      {/* Receipt (HU-12) */}
      {receipt && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="receipt">
            <div className="receipt__icon">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="receipt__title">¡Gracias por tu aporte!</h2>
            <p className="receipt__subtitle">Tu contribución se procesó correctamente.</p>

            <dl className="receipt__list">
              <div>
                <dt>ID de transacción</dt>
                <dd className="receipt__mono">{receipt.transactionId}</dd>
              </div>
              <div>
                <dt>Campaña</dt>
                <dd>{receipt.campaignTitle}</dd>
              </div>
              <div>
                <dt>Monto aportado</dt>
                <dd>{formatCurrency(receipt.amount)}</dd>
              </div>
              <div>
                <dt>Recompensa</dt>
                <dd>{receipt.rewardTitle ?? "Sin recompensa"}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{formatDate(receipt.date)}</dd>
              </div>
              <div className="receipt__total">
                <dt>Saldo restante</dt>
                <dd>{formatCurrency(receipt.remainingBalance)}</dd>
              </div>
            </dl>

            <p className="receipt__email">
              <Mail size={14} /> Enviamos el comprobante a <strong>{receipt.email}</strong>
            </p>

            <div className="action-row">
              <Link to="/notificaciones" className="btn-ghost">
                Ver correo
              </Link>
              <button className="panel__submit" onClick={() => setReceipt(null)}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
