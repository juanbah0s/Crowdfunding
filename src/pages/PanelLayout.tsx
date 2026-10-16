import { NavLink, Link, Outlet, Navigate, useNavigate, useLocation } from "react-router";
import { Bell } from "lucide-react";
import { useUser } from "../context/UserContext";
import "./Panel.css";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `panel__nav-link${isActive ? " panel__nav-link--active" : ""}`;

export function RequireAuth() {
  const { user } = useUser();
  const location = useLocation();
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <Outlet />;
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
