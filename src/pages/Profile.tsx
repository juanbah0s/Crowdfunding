import { useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useUser } from "../context/UserContext";
import "./Auth.css";

type FloatingFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
};

function FloatingField({ id, label, type = "text", value, onChange }: FloatingFieldProps) {
  return (
    <div className="field">
      <input
        id={id}
        type={type}
        placeholder=" "
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field__input"
      />
      <label htmlFor={id} className="field__label">
        {label}
      </label>
    </div>
  );
}

export function Profile() {
  const { user, updateProfile } = useUser();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const hasChanges = name.trim() !== user?.name || email.trim() !== user?.email;
  const canSave = name.trim() !== "" && email.trim() !== "" && hasChanges && password !== "" && !saving;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setStatus({ type: "error", message: "Por favor completa todos los campos obligatorios antes de continuar." });
      return;
    }
    if (savingRef.current || !canSave) return;
    savingRef.current = true;
    setSaving(true);
    try {
      // HU-S01: la contraseña viaja con los cambios y la valida el servidor.
      const result = await updateProfile(name.trim(), email.trim(), password);
      setPassword("");
      if (!result.ok) {
        setStatus({ type: "error", message: result.error });
        return;
      }
      setStatus({ type: "success", message: "Perfil actualizado correctamente. Los cambios ya se reflejan en tu cuenta." });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <main className="panel__main">
      <div>
        <h1 className="panel__heading">Editar perfil</h1>
        <p className="panel__subheading">Actualiza tu nombre y correo electrónico.</p>
      </div>

      <div className="panel__card" style={{ maxWidth: 480 }}>
        {status.type && (
          <div className={`panel__alert panel__alert--${status.type}`} style={{ marginBottom: "1.25rem" }}>
            {status.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <p style={{ margin: 0 }}>{status.message}</p>
          </div>
        )}

        <form
          onSubmit={handleSave}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <FloatingField
            id="profile-name"
            label="Nombre completo"
            value={name}
            onChange={(v) => { setName(v); setStatus({ type: null, message: "" }); }}
          />
          <FloatingField
            id="profile-email"
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); setStatus({ type: null, message: "" }); }}
          />

          {hasChanges && (
            <>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--c-text-4)" }}>
                Por seguridad, confirma tu contraseña para guardar los cambios.
              </p>
              <FloatingField
                id="profile-password"
                label="Contraseña actual"
                type="password"
                value={password}
                onChange={(v) => { setPassword(v); setStatus({ type: null, message: "" }); }}
              />
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="submit" disabled={!canSave} className="panel__submit">
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--c-text-5)", maxWidth: 480 }}>
        Los campos marcados son obligatorios. El correo electrónico se usará para notificaciones y acceso a tu cuenta.
      </p>
    </main>
  );
}
