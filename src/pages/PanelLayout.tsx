import { NavLink, Link, Outlet, Navigate, useNavigate } from "react-router";
import { useUser } from "../context/UserContext";
import "./Panel.css";

export function PanelLayout() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="panel">
      <nav className="panel__nav">
        <Link to="/" className="panel__brand">
          Catalyst<span>.</span>
        </Link>
        <div className="panel__nav-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `panel__nav-link${isActive ? " panel__nav-link--active" : ""}`}
          >
            Panel
          </NavLink>
          <NavLink
            to="/perfil"
            className={({ isActive }) => `panel__nav-link${isActive ? " panel__nav-link--active" : ""}`}
          >
            Perfil
          </NavLink>
          <NavLink
            to="/billetera"
            className={({ isActive }) => `panel__nav-link${isActive ? " panel__nav-link--active" : ""}`}
          >
            Billetera
          </NavLink>
          <button
            className="panel__logout"
            onClick={() => {
              logout();
              navigate("/auth");
            }}
          >
            Salir
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
