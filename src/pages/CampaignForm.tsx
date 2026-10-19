import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, ImagePlus, Lock, Plus, Trash2, X, Gift } from "lucide-react";
import { useUser } from "../context/UserContext";
import type { Campaign } from "../context/UserContext";
import { formatCurrency } from "../lib/campaignUtils";
import "./Campaigns.css";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REWARDS = 6;

interface RewardInput {
  title: string;
  description: string;
  minAmount: string;
  stock: string;
}

type FieldErrors = Record<string, string>;

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const navigate = useNavigate();
  const { publishCampaign, updateCampaign, categories } = useUser();
  const isEditing = !!campaign;
  const hasContributions = !!campaign && (campaign.raised > 0 || campaign.contributionsCount > 0);
  const isFundingLocked = isEditing && hasContributions;

  const [title, setTitle] = useState(campaign?.title ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [category, setCategory] = useState(campaign?.category ?? "");
  const [goal, setGoal] = useState(campaign ? String(campaign.goal) : "");
  const [deadline, setDeadline] = useState(campaign?.deadline ?? "");
  const [images, setImages] = useState<string[]>(campaign?.images ?? []);
  const [rewards, setRewards] = useState<RewardInput[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const available = MAX_IMAGES - images.length;
    const tooLarge = files.filter((f) => f.size > MAX_IMAGE_BYTES);
    const valid = files.filter((f) => f.size <= MAX_IMAGE_BYTES && f.type.startsWith("image/")).slice(0, available);
    const urls = await Promise.all(valid.map(readFileAsDataUrl));
    setImages((prev) => [...prev, ...urls]);
    if (tooLarge.length > 0) {
      setErrors((prev) => ({ ...prev, images: "Cada imagen debe pesar máximo 2 MB." }));
    } else if (files.length > available) {
      setErrors((prev) => ({ ...prev, images: `Puedes subir hasta ${MAX_IMAGES} imágenes.` }));
    } else {
      clearError("images");
    }
  };

  const updateReward = (index: number, key: keyof RewardInput, value: string) => {
    setRewards((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
    clearError(`reward-${index}-${key}`);
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (!title.trim()) next.title = "El título es obligatorio.";
    else if (title.trim().length > 80) next.title = "Máximo 80 caracteres.";
    if (!description.trim()) next.description = "La descripción es obligatoria.";
    else if (!isEditing && description.trim().length < 20) next.description = "Describe tu proyecto con al menos 20 caracteres.";

    if (!isEditing && !category) next.category = "Selecciona una categoría.";

    if (!isFundingLocked) {
      const parsedGoal = Number(goal);
      if (goal.trim() === "" || isNaN(parsedGoal)) next.goal = "La meta de financiación es obligatoria.";
      else if (parsedGoal <= 0) next.goal = "La meta de financiación debe ser mayor a cero.";

      if (!deadline) next.deadline = "La fecha límite es obligatoria.";
      else if (deadline < getTomorrow()) next.deadline = "La fecha límite debe ser posterior a hoy.";
    }

    if (!isEditing) {
      rewards.forEach((r, i) => {
        const minAmount = Number(r.minAmount);
        const stock = Number(r.stock);
        if (!r.title.trim()) next[`reward-${i}-title`] = "Título obligatorio.";
        if (!r.minAmount || isNaN(minAmount) || minAmount <= 0) next[`reward-${i}-minAmount`] = "Debe ser mayor a cero.";
        else if (Number(goal) > 0 && minAmount > Number(goal)) next[`reward-${i}-minAmount`] = "No puede superar la meta.";
        if (!r.stock || !Number.isInteger(stock) || stock < 1) next[`reward-${i}-stock`] = "Entero mayor o igual a 1.";
      });
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const missingRequired = !title.trim() || !description.trim();
      setFormError(
        nextErrors.goal && Number(goal) <= 0 && goal.trim() !== ""
          ? "No se puede publicar: la meta de financiación debe ser mayor a cero."
          : missingRequired
            ? "Completa los campos obligatorios antes de continuar."
            : "Revisa los campos marcados.",
      );
      return;
    }

    if (isEditing && campaign) {
      const result = await updateCampaign(campaign.id, {
        title,
        description,
        images,
        ...(isFundingLocked ? {} : { goal: Number(goal), deadline }),
      });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      navigate(`/campanas/${campaign.id}`);
      return;
    }

    const result = await publishCampaign({
      title,
      description,
      category,
      goal: Number(goal),
      deadline,
      images,
      rewards: rewards.map((r) => ({
        title: r.title.trim(),
        description: r.description.trim(),
        minAmount: Number(r.minAmount),
        stock: Number(r.stock),
      })),
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    navigate(`/campanas/${result.data.id}`);
  };

  const fieldError = (key: string) => errors[key] && <p className="field-error">{errors[key]}</p>;

  return (
    <main className="panel__main">
      <Link to="/mis-campanas" className="back-link">
        <ArrowLeft size={15} /> Mis campañas
      </Link>
      <div>
        <h1 className="panel__heading">{isEditing ? "Editar campaña" : "Publicar campaña"}</h1>
        <p className="panel__subheading">
          {isEditing
            ? "Los cambios se reflejarán de inmediato en la vista pública."
            : "Cuéntale al mundo tu iniciativa. Los campos con * son obligatorios."}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="campaign-form">
        <section className="panel__card form-section">
          <h2 className="panel__card-title">Información básica</h2>

          <div className="form-field">
            <label htmlFor="title" className="field-label">Título *</label>
            <input
              id="title"
              className={`amount-input${errors.title ? " input--error" : ""}`}
              value={title}
              maxLength={80}
              placeholder="Ej. Biblioteca itinerante para veredas"
              onChange={(e) => {
                setTitle(e.target.value);
                clearError("title");
              }}
            />
            {fieldError("title")}
          </div>

          <div className="form-field">
            <label htmlFor="description" className="field-label">Descripción *</label>
            <textarea
              id="description"
              rows={5}
              className={`amount-input form-textarea${errors.description ? " input--error" : ""}`}
              value={description}
              placeholder="¿Qué quieres lograr y por qué importa?"
              onChange={(e) => {
                setDescription(e.target.value);
                clearError("description");
              }}
            />
            {fieldError("description")}
          </div>

          <div className="form-field">
            <label htmlFor="category" className="field-label">
              Categoría {!isEditing && "*"}
            </label>
            <select
              id="category"
              className={`amount-input${errors.category ? " input--error" : ""}`}
              value={category}
              disabled={isEditing}
              onChange={(e) => {
                setCategory(e.target.value);
                clearError("category");
              }}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldError("category")}
          </div>
        </section>

        <section className="panel__card form-section">
          <div className="panel__section-header">
            <h2 className="panel__card-title" style={{ margin: 0 }}>Financiación</h2>
            {isFundingLocked && (
              <span className="lock-note">
                <Lock size={12} /> Bloqueado: la campaña ya recibió aportes
              </span>
            )}
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="goal" className="field-label">Meta de financiación (COP) *</label>
              <input
                id="goal"
                type="number"
                step={1000}
                className={`amount-input${errors.goal ? " input--error" : ""}`}
                value={goal}
                disabled={isFundingLocked}
                placeholder="Ej. 500000"
                onChange={(e) => {
                  setGoal(e.target.value);
                  clearError("goal");
                }}
              />
              {fieldError("goal")}
            </div>
            <div className="form-field">
              <label htmlFor="deadline" className="field-label">Fecha límite *</label>
              <input
                id="deadline"
                type="date"
                min={getTomorrow()}
                className={`amount-input${errors.deadline ? " input--error" : ""}`}
                value={deadline}
                disabled={isFundingLocked}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  clearError("deadline");
                }}
              />
              {fieldError("deadline")}
            </div>
          </div>
        </section>

        <section className="panel__card form-section">
          <h2 className="panel__card-title">Imágenes</h2>
          <div className="image-grid">
            {images.map((src, i) => (
              <div key={src.slice(-32) + i} className="image-tile">
                <img src={src} alt={`Imagen ${i + 1}`} />
                {i === 0 && <span className="image-tile__badge">Portada</span>}
                <button
                  type="button"
                  className="image-tile__remove"
                  aria-label="Quitar imagen"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className="image-upload">
                <ImagePlus size={22} />
                <span>Subir imagen</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} hidden />
              </label>
            )}
          </div>
          <p className="field-hint">Hasta {MAX_IMAGES} imágenes · 2 MB máximo cada una · La primera será la portada.</p>
          {fieldError("images")}
        </section>

        <section className="panel__card form-section">
          <div className="panel__section-header">
            <h2 className="panel__card-title" style={{ margin: 0 }}>Recompensas</h2>
            {isEditing ? (
              <span className="lock-note">
                <Lock size={12} /> No editables
              </span>
            ) : (
              rewards.length < MAX_REWARDS && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setRewards((prev) => [...prev, { title: "", description: "", minAmount: "", stock: "" }])}
                >
                  <Plus size={14} /> Agregar
                </button>
              )
            )}
          </div>

          {isEditing ? (
            campaign!.rewards.length === 0 ? (
              <p className="muted-text">Esta campaña no tiene recompensas.</p>
            ) : (
              <div className="panel__list">
                {campaign!.rewards.map((r) => (
                  <div key={r.id} className="panel__list-row">
                    <div>
                      <p className="panel__list-label">
                        <Gift size={13} style={{ verticalAlign: "-2px" }} /> {r.title}
                      </p>
                      <p className="panel__list-sub">{r.description}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className="panel__list-amount">{formatCurrency(r.minAmount)}</p>
                      <p className="panel__list-sub">{r.stock > 0 ? `${r.stock} disponibles` : "Agotada"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : rewards.length === 0 ? (
            <p className="muted-text">
              Opcional. Define beneficios con un monto mínimo de aporte y unidades disponibles (máx. {MAX_REWARDS}).
            </p>
          ) : (
            <div className="reward-editor-list">
              {rewards.map((r, i) => (
                <div key={i} className="reward-editor">
                  <div className="reward-editor__head">
                    <span>Recompensa {i + 1}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Eliminar recompensa"
                      onClick={() => {
                        setRewards((prev) => prev.filter((_, idx) => idx !== i));
                        setErrors({});
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="form-field">
                    <input
                      className={`amount-input${errors[`reward-${i}-title`] ? " input--error" : ""}`}
                      placeholder="Título de la recompensa *"
                      value={r.title}
                      onChange={(e) => updateReward(i, "title", e.target.value)}
                    />
                    {fieldError(`reward-${i}-title`)}
                  </div>
                  <input
                    className="amount-input"
                    placeholder="Descripción breve"
                    value={r.description}
                    onChange={(e) => updateReward(i, "description", e.target.value)}
                  />
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="field-label">Monto mínimo (COP) *</label>
                      <input
                        type="number"
                        step={1000}
                        className={`amount-input${errors[`reward-${i}-minAmount`] ? " input--error" : ""}`}
                        value={r.minAmount}
                        onChange={(e) => updateReward(i, "minAmount", e.target.value)}
                      />
                      {fieldError(`reward-${i}-minAmount`)}
                    </div>
                    <div className="form-field">
                      <label className="field-label">Unidades disponibles *</label>
                      <input
                        type="number"
                        step={1}
                        className={`amount-input${errors[`reward-${i}-stock`] ? " input--error" : ""}`}
                        value={r.stock}
                        onChange={(e) => updateReward(i, "stock", e.target.value)}
                      />
                      {fieldError(`reward-${i}-stock`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {formError && (
          <div className="panel__alert panel__alert--error">
            <AlertCircle size={16} />
            <p style={{ margin: 0 }}>{formError}</p>
          </div>
        )}

        <div className="action-row">
          <Link to="/mis-campanas" className="btn-ghost">
            Cancelar
          </Link>
          <button type="submit" className="panel__submit">
            {isEditing ? "Guardar cambios" : "Publicar campaña"}
          </button>
        </div>
      </form>
    </main>
  );
}

export function CreateCampaign() {
  return <CampaignForm />;
}

export function EditCampaign() {
  const { id } = useParams();
  const { campaigns, canManageCampaign } = useUser();
  const campaign = campaigns.find((c) => c.id === id);

  if (!campaign) return <Navigate to="/" replace />;

  if (!canManageCampaign(campaign) || campaign.status !== "active") {
    return (
      <main className="panel__main">
        <div className="panel__card empty-state">
          <Lock size={28} />
          <p className="empty-state__title">
            {canManageCampaign(campaign) ? "Campaña no editable" : "Permiso denegado"}
          </p>
          <p className="empty-state__text">
            {canManageCampaign(campaign)
              ? "Solo las campañas activas pueden editarse."
              : "Solo el creador de la campaña o un administrador puede editarla."}
          </p>
          <Link to="/mis-campanas" className="text-link">
            Volver a Mis campañas
          </Link>
        </div>
      </main>
    );
  }

  return <CampaignForm key={campaign.id} campaign={campaign} />;
}
