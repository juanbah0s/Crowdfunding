import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useUser } from "../context/UserContext";
import { addAccount, checkPassword, findAccount } from "../lib/accounts";
import "./Auth.css";



type FloatingFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  trailing?: React.ReactNode;
};

function FloatingField({ id, label, type = "text", value, onChange, trailing }: FloatingFieldProps) {
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
      {trailing && <div className="field__trailing">{trailing}</div>}
    </div>
  );
}

export function Auth() {
  const navigate = useNavigate();
  const { user, login } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const canSubmit = isLogin
    ? formData.email.trim() !== "" && formData.password !== ""
    : formData.name.trim() !== "" && formData.email.trim() !== "" && formData.password !== "";

  const validatePassword = (password: string) => {
    return (
      password.length >= 8 &&
      password.length <= 16 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    if (!isLogin) {
      if (!formData.name || !formData.email || !formData.password) {
        setStatus({ type: "error", message: "Por favor completa todos los campos." });
        return;
      }
      if (findAccount(formData.email)) {
        setStatus({ type: "error", message: "Este correo ya está registrado." });
        return;
      }
      if (!validatePassword(formData.password)) {
        setStatus({
          type: "error",
          message: "La contraseña debe tener 8-16 caracteres, 1 mayúscula, 1 número y 1 carácter especial.",
        });
        return;
      }

      addAccount({ email: formData.email, name: formData.name, password: formData.password });
      login(formData.name, formData.email);
      setStatus({ type: "success", message: "¡Cuenta creada exitosamente! Redirigiendo..." });
      setTimeout(() => navigate("/"), 1200);
    } else {
      if (!formData.email || !formData.password) {
        setStatus({ type: "error", message: "Por favor ingresa tu correo y contraseña." });
        return;
      }
      const found = findAccount(formData.email);
      if (found && checkPassword(found.email, formData.password)) {
        login(found.name, found.email, found.role ?? "user");
        setStatus({ type: "success", message: "Sesión iniciada correctamente. Redirigiendo..." });
        setTimeout(() => navigate("/"), 1000);
      } else {
        setStatus({ type: "error", message: "Credenciales inválidas." });
      }
    }
  };

  if (user && status.type !== "success") return <Navigate to="/" replace />;

  return (
    <div className="auth">
      <div className="auth__stack">

        <div className="auth__card auth__card--main">
          <Link to="/" className="auth__brand">
            Catalyst<span>.</span>
          </Link>

          {!isLogin && (
            <h2 className="auth__tagline">
              Regístrate para financiar o lanzar proyectos visionarios.
            </h2>
          )}

          {status.type && (
            <div
              className={`auth__alert ${
                status.type === "success" ? "auth__alert--success" : "auth__alert--error"
              }`}
            >
              {status.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <p>{status.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth__form">
            {!isLogin && (
              <FloatingField
                id="name"
                label="Nombre completo"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
              />
            )}

            <FloatingField
              id="email"
              label="Correo electrónico"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
            />

            <FloatingField
              id="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              trailing={
                formData.password ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="field__reveal"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                ) : null
              }
            />

            <button type="submit" disabled={!canSubmit} className="auth__submit">
              {isLogin ? "Iniciar sesión" : "Registrarse"}
            </button>
          </form>

          <div className="auth__divider">
            <span>O</span>
          </div>

          {!isLogin && (
            <p className="auth__fineprint">
              Al registrarte, aceptas nuestros Términos, Política de Datos y Política de Cookies.
              La contraseña debe tener 8-16 caracteres, incluir 1 mayúscula, 1 número y 1 carácter especial.
            </p>
          )}
        </div>

        <div className="auth__card auth__card--switch">
          <span>{isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}</span>{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setStatus({ type: null, message: "" });
              setFormData({ name: "", email: "", password: "" });
              setShowPassword(false);
            }}
            className="auth__switch-btn"
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </div>

      </div>

      <footer className="auth__footer">
        <div className="auth__footer-links">
          <Link to="/">Inicio</Link>
          <a href="#">Acerca de</a>
          <a href="#">Ayuda</a>
          <a href="#">Términos</a>
          <a href="#">Privacidad</a>
        </div>
        <p>© 2026 Catalyst de Crowdfunding Inc.</p>
      </footer>
    </div>
  );
}
