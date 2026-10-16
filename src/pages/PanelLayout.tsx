import { NavLink, Link, Outlet, Navigate, useNavigate, useLocation } from "react-router";
import { Bell, ShieldAlert } from "lucide-react";
import { useUser } from "../context/UserContext";
import "./Panel.css";
import "./Campaigns.css";
import "./Users.css";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `panel__nav-link${isActive ? " panel__nav-link--active" : ""}`;

export function RequireAuth() {
  const { user } = useUser();
  const location = useLocation();
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Restricts nested routes to administrators; other signed-in users see an access notice. */
export function RequireAdmin() {
  const { user } = useUser();
  if (user?.role === "admin") return <Outlet />;
  return (
    <main className="panel__main">
      <div className="panel__card empty-state restricted">
        <ShieldAlert size={28} />
        <p className="empty-state__title">Acceso restringido</p>
        <p className="empty-state__text">Esta sección solo está disponible para administradores de la plataforma.</p>
        <Link to="/dashboard" className="text-link">
          Volver a mi panel
        </Link>
      </div>
    </main>
  );
}

export function PanelLayout() {
  const { user, logout, notifications } = useUser();
  const navigate = useNavigate();

  const unreadCount = user
    ? notifications.filter((n) => n.recipientEmail === user.email && !n.read).length
    : 0;

  return (
    <div className="panel">
      <nav className="panel__nav">
        <Link to="/" className="panel__brand">
          Catalyst<span>.</span>
        </Link>
        <div className="panel__nav-links">
          <NavLink to="/" end className={navClass}>
            Explorar
          </NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" className={navClass}>
                Panel
              </NavLink>
              <NavLink to="/mis-campanas" className={navClass}>
                {user.role === "admin" ? "Campañas" : "Mis campañas"}
              </NavLink>
              {user.role === "admin" && (
                <NavLink to="/usuarios" className={navClass}>
                  Usuarios
                </NavLink>
              )}
              <NavLink to="/perfil" className={navClass}>
                Perfil
              </NavLink>
              <NavLink to="/billetera" className={navClass}>
                Billetera
              </NavLink>
              <NavLink to="/notificaciones" className={navClass} aria-label="Notificaciones">
                <span className="panel__bell">
                  <Bell size={17} />
                  {unreadCount > 0 && <span className="panel__bell-count">{unreadCount}</span>}
                </span>
              </NavLink>
              <button
                className="panel__logout"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <Link to="/auth" className="panel__submit panel__auth-btn">
              Iniciar sesión / Registrarse
            </Link>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
