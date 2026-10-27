import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import type { Account, AccountStatus, AccountRole } from "../context/UserContext";
import { PASSWORD_RULES } from "../lib/validation";
import "./Campaigns.css";
import "./Users.css";

const PAGE_SIZE = 8;

const ROLE_LABELS: Record<AccountRole, string> = { sponsor: "Patrocinador", creator: "Creador", admin: "Administrador" };
// El rol admin no se asigna desde este módulo (el backend solo acepta sponsor o creator).
const ASSIGNABLE_ROLES: AccountRole[] = ["sponsor", "creator"];
const STATUS_LABELS: Record<AccountStatus, string> = { active: "Activo", inactive: "Inactivo" };

type Feedback = { type: "success" | "error"; message: string } | null;
type ModalState = { mode: "create" } | { mode: "edit"; account: Account } | { mode: "remove"; account: Account } | null;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function RoleBadge({ role }: { role: AccountRole }) {
  return (
    <span className={`role-badge role-badge--${role}`}>
      {role === "admin" && <ShieldCheck size={12} />}
      {ROLE_LABELS[role]}
    </span>
  );
}

function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return <span className={`account-status account-status--${status}`}>{STATUS_LABELS[status]}</span>;
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
}

// --- Create / edit ------------------------------------------------------------

function UserFormModal({
  account,
  onClose,
  onSaved,
}: {
  account?: Account;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { createAccount, updateAccount, isSelf } = useUser();
  const isEditing = !!account;
  const editingSelf = !!account && isSelf(account);
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [role, setRole] = useState<AccountRole>(account?.role ?? "sponsor");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  useEscape(onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    const result = account
      ? await updateAccount(account.id, { name, email, role })
      : await createAccount({ name, email, role, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(
      isEditing
        ? `Los datos de ${name.trim()} se actualizaron correctamente.`
        : `Usuario ${name.trim()} creado como ${ROLE_LABELS[role]}.`,
    );
  };

  const clearError = () => setError(null);
  const invalid = (value: string) => (attempted && !value.trim() ? " input--error" : "");

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-modal-title" onClick={onClose}>
      <form className="user-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} noValidate>
        <div className="user-modal__head">
          <div>
            <h2 id="user-modal-title" className="user-modal__title">
              {isEditing ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            <p className="muted-text">
              {isEditing
                ? "Actualiza el nombre, el correo o el rol de la cuenta."
                : "La cuenta quedará activa y podrá iniciar sesión de inmediato."}
            </p>
          </div>
          <button type="button" className="icon-btn icon-btn--neutral" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="panel__alert panel__alert--error">
            <AlertCircle size={16} />
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="user-name" className="field-label">Nombre completo *</label>
          <input
            id="user-name"
            autoFocus
            className={`amount-input${invalid(name)}`}
            value={name}
            placeholder="Ej. Laura Méndez"
            onChange={(e) => {
              setName(e.target.value);
              clearError();
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="user-email" className="field-label">Correo electrónico *</label>
          <input
            id="user-email"
            type="email"
            className={`amount-input${invalid(email)}`}
            value={email}
            placeholder="nombre@correo.com"
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
          />
        </div>

        <div className="form-field">
          <span className="field-label">Rol *</span>
          {role === "admin" ? (
            <RoleBadge role="admin" />
          ) : (
          <div className="role-toggle" role="radiogroup" aria-label="Rol">
            {ASSIGNABLE_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                disabled={editingSelf}
                className={`role-toggle__btn${role === r ? " role-toggle__btn--active" : ""}`}
                onClick={() => {
                  setRole(r);
                  clearError();
                }}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          )}
          {editingSelf ? (
            <p className="field-hint">No puedes cambiar el rol de tu propia cuenta.</p>
          ) : (
            role === "admin" && <p className="field-hint">El rol de administrador no se cambia desde este módulo.</p>
          )}
        </div>

        {!isEditing && (
          <div className="form-field">
            <label htmlFor="user-password" className="field-label">Contraseña *</label>
            <div className="password-input">
              <input
                id="user-password"
                type={showPassword ? "text" : "password"}
                className={`amount-input${invalid(password)}`}
                value={password}
                maxLength={16}
                autoComplete="new-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
              />
              {password && (
                <button type="button" className="password-input__reveal" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              )}
            </div>
            <ul className="password-rules">
              {PASSWORD_RULES.map((rule) => {
                const met = rule.test(password);
                return (
                  <li key={rule.id} className={met ? "password-rules__item--met" : undefined}>
                    <span className="password-rules__dot">{met && <Check size={10} strokeWidth={3} />}</span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="action-row user-modal__actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="panel__submit">
            {isEditing ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Remove / deactivate --------------------------------------------------------

function RemoveDialog({
  account,
  onClose,
  onDone,
}: {
  account: Account;
  onClose: () => void;
  onDone: (feedback: Feedback) => void;
}) {
  const { getFinancialFootprint, removeAccount } = useUser();
  const footprint = getFinancialFootprint(account.email);
  const hasHistory = footprint.total > 0;
  const alreadyArchived = hasHistory && account.status === "inactive";
  useEscape(onClose);

  const handleConfirm = async () => {
    const result = await removeAccount(account.id);
    if (!result.ok) {
      onDone({ type: "error", message: result.error });
      return;
    }
    onDone({
      type: "success",
      message:
        result.data === "deleted"
          ? `${account.name} fue eliminado de la plataforma.`
          : `${account.name} tiene registros financieros: la cuenta se inhabilitó y su historial se conservó.`,
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="remove-title" onClick={onClose}>
      <div className="user-modal" onClick={(e) => e.stopPropagation()}>
        <span className={`user-modal__icon${hasHistory ? " user-modal__icon--neutral" : ""}`}>
          {hasHistory ? <Archive size={20} /> : <Trash2 size={20} />}
        </span>
        <div>
          <h2 id="remove-title" className="user-modal__title">
            {hasHistory ? "Esta cuenta tiene historial financiero" : `¿Eliminar a ${account.name}?`}
          </h2>
          <p className="muted-text" style={{ marginTop: "0.35rem", lineHeight: 1.55 }}>
            {alreadyArchived
              ? "La cuenta ya está inactiva. No puede eliminarse porque su historial debe conservarse para la trazabilidad del sistema."
              : hasHistory
                ? "Para garantizar la trazabilidad no se puede eliminar. En su lugar, la cuenta se inhabilitará: perderá el acceso y su historial se conservará."
                : "La cuenta no tiene registros financieros, así que se eliminará de forma permanente. Esta acción no se puede deshacer."}
          </p>
        </div>

        {hasHistory && (
          <dl className="footprint">
            <div>
              <dt>Recargas de saldo</dt>
              <dd>{footprint.recharges}</dd>
            </div>
            <div>
              <dt>Campañas creadas</dt>
              <dd>{footprint.campaigns}</dd>
            </div>
            <div>
              <dt>Aportes realizados</dt>
              <dd>{footprint.contributions}</dd>
            </div>
          </dl>
        )}

        <div className="action-row user-modal__actions">
          {alreadyArchived ? (
            <button type="button" className="panel__submit" onClick={onClose}>
              Entendido
            </button>
          ) : (
            <>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={handleConfirm}>
                {hasHistory ? (
                  <>
                    <UserX size={14} /> Inhabilitar cuenta
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Eliminar usuario
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Page -----------------------------------------------------------------------

export function Users() {
  const { accounts, isSelf, getFinancialFootprint, setAccountStatus } = useUser();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AccountRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts
      .filter((a) => roleFilter === "all" || a.role === roleFilter)
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .filter((a) => !q || a.name.toLowerCase().includes(q) || a.email.includes(q));
  }, [accounts, query, roleFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const stats = [
    { label: "Usuarios", value: accounts.length },
    { label: "Activos", value: accounts.filter((a) => a.status === "active").length },
    { label: "Inactivos", value: accounts.filter((a) => a.status === "inactive").length },
    { label: "Administradores", value: accounts.filter((a) => a.role === "admin").length },
  ];

  const updateFilter = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const closeModal = () => setModal(null);

  const toggleStatus = async (account: Account) => {
    const next: AccountStatus = account.status === "active" ? "inactive" : "active";
    const result = await setAccountStatus(account.id, next);
    setFeedback(
      result.ok
        ? {
            type: "success",
            message:
              next === "inactive"
                ? `${account.name} ahora está inactivo y ya no puede iniciar sesión.`
                : `${account.name} se reactivó y puede volver a iniciar sesión.`,
          }
        : { type: "error", message: result.error },
    );
  };

  return (
    <main className="panel__main panel__main--wide">
      <div className="panel__section-header users-header">
        <div>
          <h1 className="panel__heading">Usuarios</h1>
          <p className="panel__subheading">Administra las cuentas, los roles y el acceso a la plataforma.</p>
        </div>
        <button
          className="panel__submit inline-icon"
          onClick={() => {
            setFeedback(null);
            setModal({ mode: "create" });
          }}
        >
          <UserPlus size={15} /> Nuevo usuario
        </button>
      </div>

      <div className="users-stats">
        {stats.map((s) => (
          <div key={s.label} className="users-stats__item">
            <span className="panel__stat-label">{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      <div className="explore-toolbar">
        <label className="explore-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar por nombre o correo"
            value={query}
            onChange={(e) => updateFilter(setQuery)(e.target.value)}
          />
        </label>
        <label className="explore-select">
          <span>Rol</span>
          <select value={roleFilter} onChange={(e) => updateFilter(setRoleFilter)(e.target.value as AccountRole | "all")}>
            <option value="all">Todos</option>
            <option value="sponsor">{ROLE_LABELS.sponsor}</option>
            <option value="creator">{ROLE_LABELS.creator}</option>
            <option value="admin">{ROLE_LABELS.admin}</option>
          </select>
        </label>
        <label className="explore-select">
          <span>Estado</span>
          <select
            value={statusFilter}
            onChange={(e) => updateFilter(setStatusFilter)(e.target.value as AccountStatus | "all")}
          >
            <option value="all">Todos</option>
            <option value="active">{STATUS_LABELS.active}</option>
            <option value="inactive">{STATUS_LABELS.inactive}</option>
          </select>
        </label>
      </div>

      {feedback && (
        <div className={`panel__alert panel__alert--${feedback.type}`}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <p style={{ margin: 0, flex: 1 }}>{feedback.message}</p>
          <button className="alert-dismiss" onClick={() => setFeedback(null)} aria-label="Cerrar mensaje">
            <X size={14} />
          </button>
        </div>
      )}

      <section className="users-table" aria-label="Lista de usuarios">
        <div className="users-table__row users-table__row--head">
          <span>Usuario</span>
          <span>Rol</span>
          <span>Estado</span>
          <span>Historial</span>
          <span className="users-table__actions-head">Acciones</span>
        </div>

        {pageItems.length === 0 ? (
          <div className="empty-state users-table__empty">
            <UsersIcon size={28} />
            <p className="empty-state__title">No hay usuarios que coincidan</p>
            <p className="empty-state__text">Prueba con otro término de búsqueda o ajusta los filtros.</p>
          </div>
        ) : (
          pageItems.map((a) => {
            const self = isSelf(a);
            const footprint = getFinancialFootprint(a.email);
            return (
              <div key={a.id} className={`users-table__row${a.status === "inactive" ? " users-table__row--inactive" : ""}`}>
                <div className="user-identity">
                  <span className={`user-avatar user-avatar--${a.role}`}>{initials(a.name)}</span>
                  <div className="user-identity__text">
                    <p className="panel__list-label">
                      {a.name}
                      {self && <span className="self-tag">Tú</span>}
                    </p>
                    <p className="user-identity__email">{a.email}</p>
                  </div>
                </div>
                <div className="users-table__cell" data-label="Rol">
                  <RoleBadge role={a.role} />
                </div>
                <div className="users-table__cell" data-label="Estado">
                  <AccountStatusBadge status={a.status} />
                </div>
                <div className="users-table__cell" data-label="Historial">
                  {footprint.total > 0 ? (
                    <span
                      className="history-chip"
                      title={`${plural(footprint.recharges, "recarga", "recargas")} · ${plural(
                        footprint.campaigns,
                        "campaña",
                        "campañas",
                      )} · ${plural(footprint.contributions, "aporte", "aportes")}`}
                    >
                      {plural(footprint.total, "registro", "registros")}
                    </span>
                  ) : (
                    <span className="muted-text">Sin movimientos</span>
                  )}
                </div>
                <div className="users-table__actions">
                  <button
                    className="row-action"
                    onClick={() => {
                      setFeedback(null);
                      setModal({ mode: "edit", account: a });
                    }}
                    aria-label={`Editar a ${a.name}`}
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  {self ? (
                    <span className="lock-note" title="No puedes deshabilitar ni eliminar tu propia cuenta activa.">
                      <Lock size={12} /> Tu cuenta
                    </span>
                  ) : (
                    <>
                      <button
                        className="row-action"
                        onClick={() => toggleStatus(a)}
                        aria-label={a.status === "active" ? `Desactivar a ${a.name}` : `Activar a ${a.name}`}
                        title={a.status === "active" ? "Desactivar" : "Activar"}
                      >
                        {a.status === "active" ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      <button
                        className="row-action row-action--danger"
                        onClick={() => {
                          setFeedback(null);
                          setModal({ mode: "remove", account: a });
                        }}
                        aria-label={`Eliminar a ${a.name}`}
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div className="users-table__footer">
          <span className="muted-text">
            Mostrando {rangeStart}–{rangeEnd} de {plural(filtered.length, "usuario", "usuarios")}
          </span>
          <nav className="pagination" aria-label="Paginación">
            <button
              className="pagination__btn"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`pagination__btn${n === currentPage ? " pagination__btn--active" : ""}`}
                onClick={() => setPage(n)}
                aria-current={n === currentPage ? "page" : undefined}
              >
                {n}
              </button>
            ))}
            <button
              className="pagination__btn"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </section>

      {(modal?.mode === "create" || modal?.mode === "edit") && (
        <UserFormModal
          account={modal.mode === "edit" ? modal.account : undefined}
          onClose={closeModal}
          onSaved={(message) => {
            closeModal();
            setFeedback({ type: "success", message });
            if (modal.mode === "create") setPage(1);
          }}
        />
      )}
      {modal?.mode === "remove" && (
        <RemoveDialog
          account={modal.account}
          onClose={closeModal}
          onDone={(result) => {
            closeModal();
            setFeedback(result);
          }}
        />
      )}
    </main>
  );
}
