import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { isValidEmail, isValidPassword, normalizeEmail, PASSWORD_ERROR } from "../lib/validation";
import { authApi } from "../api/auth";
import { checkPassword, findAccount, renameAccount } from "../lib/accounts";
import { usersApi } from "../api/users";
import { getApiError, SESSION_KEY, TOKEN_KEY } from "../api/client";

export type UserRole = "creator" | "sponsor" | "admin";

export type CampaignStatus = "active" | "paused" | "closed";

export const CAMPAIGN_CATEGORIES = [
  "Tecnología",
  "Agricultura",
  "Arte y cultura",
  "Educación",
  "Medio ambiente",
  "Comunidad",
  "Salud",
] as const;

export interface Transaction {
  id: string;
  date: string;
  type: "recharge" | "contribution";
  amount: number;
  campaignId?: string;
  campaignName?: string;
  rewardTitle?: string;
  /** Solo en aportes simulados localmente: usuario que los hizo. */
  userId?: string;
  /** Correo del dueño de la transacción (para el rastro financiero de HU-21). */
  userEmail?: string;
}

export type TransactionItem = Transaction;

export type AccountRole = "user" | "admin";
export type AccountStatus = "active" | "inactive";

/** Cuenta registrada en la plataforma (tabla de usuarios simulada de HU-21). */
export interface Account {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  /** Solo en cuentas creadas por un administrador: permiten iniciar sesión localmente. */
  password?: string;
  createdAt: string;
}

export interface AccountInput {
  name: string;
  email: string;
  role: AccountRole;
}

/** Registros financieros que ligan una cuenta al historial de la plataforma. */
export interface FinancialFootprint {
  recharges: number;
  campaigns: number;
  contributions: number;
  total: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  minAmount: number;
  stock: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  raised: number;
  goal: number;
  deadline: string;
  images: string[];
  status: CampaignStatus;
  creatorName: string;
  creatorEmail: string;
  rewards: Reward[];
  backerEmails: string[];
  contributionsCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Saldo disponible: saldo real del backend menos los aportes simulados localmente. */
  balance: number;
  /** Total histórico aportado según el backend. */
  historic: number;
}

export interface CampaignSummary {
  id: string;
  title: string;
  raised: number;
  goal: number;
  contributed: number;
}

export interface BalanceResponse {
  balance: number;
  historic: number;
  campaigns: CampaignSummary[];
  history: TransactionItem[];
}

export interface Notification {
  id: string;
  recipientEmail: string;
  channel: "email" | "system";
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

export interface ContributionReceipt {
  transactionId: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  rewardTitle: string | null;
  remainingBalance: number;
  date: string;
  email: string;
}

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export interface CampaignDraft {
  title: string;
  description: string;
  category: string;
  goal: number;
  deadline: string;
  images: string[];
  rewards: Omit<Reward, "id">[];
}

export interface CampaignChanges {
  title: string;
  description: string;
  images: string[];
  goal?: number;
  deadline?: string;
}

interface UserContextType {
  user: User | null;
  transactions: Transaction[];
  campaigns: Campaign[];
  notifications: Notification[];
  accounts: Account[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string) => Promise<ActionResult>;
  recharge: (amount: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  canManageCampaign: (campaign: Campaign) => boolean;
  publishCampaign: (draft: CampaignDraft) => ActionResult<Campaign>;
  updateCampaign: (id: string, changes: CampaignChanges) => ActionResult;
  changeCampaignStatus: (id: string, status: CampaignStatus) => ActionResult;
  contribute: (
    campaignId: string,
    amount: number,
    rewardId: string | null,
    options?: { simulateFailure?: boolean },
  ) => ActionResult<ContributionReceipt>;
  markNotificationsRead: () => void;
  isSelf: (account: Account) => boolean;
  getFinancialFootprint: (email: string) => FinancialFootprint;
  createAccount: (input: AccountInput & { password: string }) => ActionResult<Account>;
  updateAccount: (id: string, input: AccountInput) => ActionResult;
  setAccountStatus: (id: string, status: AccountStatus) => ActionResult;
  removeAccount: (id: string) => ActionResult<"deleted" | "deactivated">;
}

// Placeholder owner replaced by the logged-in user's email so the demo has campaigns to manage.
const DEMO_OWNER = "__demo_owner__";

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function unsplash(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
}


const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    title: "EcoTech Innovación",
    description:
      "Paneles solares modulares de bajo costo para escuelas rurales. Cada kit abastece un aula completa con iluminación y carga de equipos durante todo el año.",
    category: "Tecnología",
    raised: 450000,
    goal: 800000,
    deadline: addDays(24),
    images: [unsplash("photo-1509391366360-2e959784a276")],
    status: "active",
    creatorName: "Laura Méndez",
    creatorEmail: "laura@ecotech.co",
    rewards: [
      { id: "r1", title: "Agradecimiento digital", description: "Tu nombre en el muro de mecenas.", minAmount: 20000, stock: 200 },
      { id: "r2", title: "Kit de bienvenida", description: "Camiseta y stickers del proyecto.", minAmount: 80000, stock: 25 },
      { id: "r3", title: "Visita a la instalación", description: "Recorrido guiado por la primera escuela.", minAmount: 300000, stock: 0 },
    ],
    backerEmails: ["__self__", "marcos@mail.com", "sofia@mail.com"],
    contributionsCount: 14,
    createdAt: addDays(-20),
  },
  {
    id: "2",
    title: "AgroSmart Colombia",
    description:
      "Sensores de humedad y una app sencilla para que pequeños caficultores rieguen solo lo necesario y reduzcan pérdidas en temporada seca.",
    category: "Agricultura",
    raised: 120000,
    goal: 300000,
    deadline: addDays(9),
    images: [unsplash("photo-1559556064-4161b6be179b")],
    status: "active",
    creatorName: "Andrés Rojas",
    creatorEmail: "andres@agrosmart.co",
    rewards: [
      { id: "r1", title: "Bolsa de café de origen", description: "250 g de café de las fincas participantes.", minAmount: 40000, stock: 30 },
      { id: "r2", title: "Sensor apadrinado", description: "Un sensor con tu nombre instalado en una finca.", minAmount: 150000, stock: 5 },
    ],
    backerEmails: ["__self__", "carla@mail.com"],
    contributionsCount: 6,
    createdAt: addDays(-12),
  },
  {
    id: "3",
    title: "Taller de Cerámica Andina",
    description:
      "Un taller comunitario para recuperar técnicas de cerámica precolombina, con hornos compartidos y clases abiertas para jóvenes del barrio.",
    category: "Arte y cultura",
    raised: 210000,
    goal: 500000,
    deadline: addDays(31),
    images: [unsplash("photo-1595351298020-038700609878")],
    status: "active",
    creatorName: "Tú",
    creatorEmail: DEMO_OWNER,
    rewards: [
      { id: "r1", title: "Taza artesanal", description: "Pieza única hecha en el taller.", minAmount: 50000, stock: 12 },
      { id: "r2", title: "Clase privada", description: "Sesión de 2 horas en el torno.", minAmount: 120000, stock: 4 },
    ],
    backerEmails: ["pedro@mail.com", "lucia@mail.com"],
    contributionsCount: 5,
    createdAt: addDays(-8),
  },
  {
    id: "4",
    title: "Biblioteca Itinerante",
    description:
      "Una camioneta adaptada como biblioteca que recorre veredas llevando libros, talleres de lectura y conectividad a niños y niñas.",
    category: "Educación",
    raised: 0,
    goal: 650000,
    deadline: addDays(45),
    images: [unsplash("photo-1762475833699-53a01f26565a")],
    status: "active",
    creatorName: "Tú",
    creatorEmail: DEMO_OWNER,
    rewards: [
      { id: "r1", title: "Libro dedicado", description: "Un libro donado con tu dedicatoria.", minAmount: 30000, stock: 50 },
    ],
    backerEmails: [],
    contributionsCount: 0,
    createdAt: addDays(-2),
  },
  {
    id: "5",
    title: "Patios Verdes",
    description:
      "Convertimos patios abandonados en huertas urbanas compartidas, con compostaje y talleres para vecinos de todas las edades.",
    category: "Medio ambiente",
    raised: 380000,
    goal: 400000,
    deadline: addDays(4),
    images: [unsplash("photo-1759692071961-f71efda3691f")],
    status: "paused",
    creatorName: "Colectivo Raíz",
    creatorEmail: "hola@raiz.org",
    rewards: [
      { id: "r1", title: "Kit de semillas", description: "Semillas nativas para tu balcón.", minAmount: 25000, stock: 40 },
    ],
    backerEmails: ["ana@mail.com", "jorge@mail.com"],
    contributionsCount: 21,
    createdAt: addDays(-30),
  },
];

const UserContext = createContext<UserContextType | null>(null);

// Campañas, notificaciones y aportes simulados (todavía sin endpoint en el frontend).
const STORAGE_KEY = "catalyst-state-v2";

interface PersistedState {
  accounts?: Account[];
  campaigns: Campaign[];
  notifications: Notification[];
  localTransactions: Transaction[];
}

/** Perfil de la sesión + saldo según el backend. El token JWT vive aparte, en localStorage. */
interface Session {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;
  historic: number;
  /** Cuenta de demostración: funciona sin backend, con datos locales. */
  demo?: boolean;
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as Partial<PersistedState>;
    return {
      accounts: state.accounts,
      campaigns: state.campaigns ?? MOCK_CAMPAIGNS,
      notifications: state.notifications ?? [],
      localTransactions: state.localTransactions ?? [],
    };
  } catch {
    return null;
  }
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Session;
    // Sin token no hay sesión válida (salvo en cuentas de demostración, que no usan backend).
    if (!stored.demo && !localStorage.getItem(TOKEN_KEY)) return null;
    return stored;
  } catch {
    return null;
  }
}

const initialState = loadState();
const initialSession = loadSession();

// Historial inicial de las cuentas de demostración: 500.000 recargados y 150.000 aportados => saldo de 350.000.
const DEMO_BASE_BALANCE = 500000;
const DEMO_TRANSACTIONS: Omit<Transaction, "userId">[] = [
  { id: "T001", date: "2026-09-01", type: "recharge", amount: 500000 },
  { id: "T002", date: "2026-09-05", type: "contribution", amount: 100000, campaignId: "1", campaignName: "EcoTech Innovación" },
  { id: "T003", date: "2026-09-10", type: "contribution", amount: 50000, campaignId: "2", campaignName: "AgroSmart Colombia" },
];

// Tabla de usuarios simulada (HU-21). Solo las tres cuentas de demostración pueden iniciar sesión;
// el resto son registros para probar el listado, los filtros y la baja con historial.
const SEED_ACCOUNTS: Omit<Account, "id" | "createdAt">[] = [
  { name: "Administrador", email: "admin@catalyst.com", role: "admin", status: "active" },
  { name: "Usuario Demo", email: "test@example.com", role: "user", status: "active" },
  { name: "Catalyst User", email: "user@catalyst.com", role: "user", status: "active" },
  { name: "Mariana Soto", email: "soporte@catalyst.com", role: "admin", status: "active" },
  { name: "Laura Méndez", email: "laura@ecotech.co", role: "user", status: "active" },
  { name: "Andrés Rojas", email: "andres@agrosmart.co", role: "user", status: "active" },
  { name: "Colectivo Raíz", email: "hola@raiz.org", role: "user", status: "active" },
  { name: "Marcos Peña", email: "marcos@mail.com", role: "user", status: "active" },
  { name: "Sofía Cárdenas", email: "sofia@mail.com", role: "user", status: "active" },
  { name: "Carla Ruiz", email: "carla@mail.com", role: "user", status: "active" },
  { name: "Pedro Gómez", email: "pedro@mail.com", role: "user", status: "active" },
  { name: "Lucía Torres", email: "lucia@mail.com", role: "user", status: "active" },
  { name: "Ana Morales", email: "ana@mail.com", role: "user", status: "inactive" },
  { name: "Jorge Díaz", email: "jorge@mail.com", role: "user", status: "active" },
  { name: "Valentina Ríos", email: "valentina@mail.com", role: "user", status: "active" },
  { name: "Diego Herrera", email: "diego@mail.com", role: "user", status: "active" },
  { name: "Camila Ortiz", email: "camila@mail.com", role: "user", status: "inactive" },
];

function seedAccounts(): Account[] {
  return SEED_ACCOUNTS.map((a, i) => ({ ...a, id: `U${String(i + 1).padStart(3, "0")}`, createdAt: addDays(-90 + i * 4) }));
}

// Recargas de cuentas semilla: permiten probar la baja de usuarios con historial financiero.
const SEED_FOOTPRINT_TX: Transaction[] = [
  { id: "T004", date: "2026-08-22", type: "recharge", amount: 200000, userEmail: "marcos@mail.com" },
  { id: "T005", date: "2026-08-28", type: "recharge", amount: 150000, userEmail: "valentina@mail.com" },
];

const sessionRoleFor = (role: AccountRole): UserRole => (role === "admin" ? "admin" : "sponsor");

function createId(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [serverTransactions, setServerTransactions] = useState<Transaction[]>([]);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(initialState?.localTransactions ?? []);
  const [accounts, setAccounts] = useState<Account[]>(() => initialState?.accounts ?? seedAccounts());
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialState?.campaigns ?? MOCK_CAMPAIGNS);
  const [notifications, setNotifications] = useState<Notification[]>(initialState?.notifications ?? []);

  // Mantiene la base de datos simulada (campañas, notificaciones, aportes locales) entre recargas.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts, campaigns, notifications, localTransactions }));
    } catch {
      // Storage quota exceeded (e.g. large uploaded images); keep working in memory.
    }
  }, [accounts, campaigns, notifications, localTransactions]);

  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, [session]);

  // Los aportes a campañas aún son simulados: se descuentan del saldo real para que
  // el saldo mostrado sea coherente tras recargar la página.
  const localSpent = useMemo(
    () =>
      session
        ? localTransactions
            .filter((t) => t.type === "contribution" && t.userId === session.id)
            .reduce((sum, t) => sum + t.amount, 0)
        : 0,
    [localTransactions, session],
  );

  const user: User | null = useMemo(
    () => (session ? { ...session, balance: session.balance - localSpent } : null),
    [session, localSpent],
  );

  const transactions = useMemo(
    () =>
      session
        ? [...localTransactions.filter((t) => t.userId === session.id), ...serverTransactions].sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        : [],
    [localTransactions, serverTransactions, session],
  );

  const refreshBalance = useCallback(async () => {
    if (initialSession?.demo) return;
    try {
      const detail = await usersApi.getBalance();
      setSession((prev) => (prev ? { ...prev, balance: detail.balance, historic: detail.historic } : prev));
      setServerTransactions(detail.history);
    } catch (err) {
      console.error("Error refreshing balance:", err);
    }
  }, []);

  // Al abrir la app con una sesión guardada, sincroniza saldo e historial con el backend.
  useEffect(() => {
    if (initialSession && !initialSession.demo) void refreshBalance();
  }, [refreshBalance]);

  const remapDemoOwner = (name: string, email: string) =>
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        creatorEmail: c.creatorEmail === DEMO_OWNER ? email : c.creatorEmail,
        creatorName: c.creatorEmail === DEMO_OWNER ? name : c.creatorName,
        backerEmails: c.backerEmails.map((b) => (b === "__self__" ? email : b)),
      })),
    );

  /** Inicia una sesión local (sin backend): cuentas de demostración y cuentas creadas por un administrador. */
  const startLocalSession = (info: { id: string; name: string; email: string; role: UserRole }) => {
    authApi.logout(); // descarta cualquier token de una sesión real anterior
    setSession({ ...info, balance: DEMO_BASE_BALANCE, historic: 0, demo: true });
    setServerTransactions([]);
    setLocalTransactions((prev) =>
      prev.some((t) => t.userId === info.id)
        ? prev
        : [...DEMO_TRANSACTIONS.map((t) => ({ ...t, userId: info.id, userEmail: info.email })), ...prev],
    );
    remapDemoOwner(info.name, info.email);
  };

  const invalidCredentials = () => ({ response: { data: { message: "Credenciales inválidas." } } });

  const upsertAccount = (u: { name: string; email: string; role: UserRole }) => {
    const email = normalizeEmail(u.email);
    setAccounts((prev) =>
      prev.some((a) => a.email === email)
        ? prev.map((a) => (a.email === email ? { ...a, name: u.name } : a))
        : [
            ...prev,
            {
              id: createId("U"),
              name: u.name,
              email,
              role: u.role === "admin" ? "admin" : "user",
              status: "active",
              createdAt: today(),
            },
          ],
    );
  };

  const login = async (email: string, password: string) => {
    const registered = accounts.find((a) => a.email === normalizeEmail(email));
    if (registered?.status === "inactive") {
      throw { response: { data: { message: "Tu cuenta está inactiva. Contacta a un administrador para recuperar el acceso." } } };
    }
    // Cuentas de demostración: funcionan sin backend. Su rol sale de la tabla de usuarios.
    const demo = findAccount(email);
    if (demo) {
      if (!checkPassword(email, password)) throw invalidCredentials();
      startLocalSession({
        id: `demo:${demo.email}`,
        name: demo.name,
        email: demo.email,
        role: registered ? sessionRoleFor(registered.role) : (demo.role ?? "sponsor"),
      });
      return;
    }
    // Cuentas creadas por un administrador desde el módulo de usuarios (locales).
    if (registered?.password !== undefined) {
      if (registered.password !== password) throw invalidCredentials();
      startLocalSession({
        id: `local:${registered.id}`,
        name: registered.name,
        email: registered.email,
        role: sessionRoleFor(registered.role),
      });
      return;
    }
    const u = await authApi.login({ email, password });
    setSession({ id: u.id, name: u.name, email: u.email, role: u.role, balance: u.balance, historic: u.historic });
    upsertAccount(u);
    remapDemoOwner(u.name, u.email);
    await refreshBalance();
  };

  const register = async (name: string, email: string, password: string) => {
    if (accounts.some((a) => a.email === normalizeEmail(email))) {
      throw { response: { data: { message: "Este correo ya está registrado." } } };
    }
    await authApi.register({ name, email, password });
    await login(email, password);
  };

  const logout = () => {
    authApi.logout();
    setSession(null);
    setServerTransactions([]);
  };

  // Propaga un cambio de nombre/correo a todos los registros que referencian la cuenta.
  const renameIdentity = (previousEmail: string, name: string, email: string) => {
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        creatorEmail: c.creatorEmail === previousEmail ? email : c.creatorEmail,
        creatorName: c.creatorEmail === previousEmail ? name : c.creatorName,
        backerEmails: c.backerEmails.map((b) => (b === previousEmail ? email : b)),
      })),
    );
    setLocalTransactions((prev) => prev.map((t) => (t.userEmail === previousEmail ? { ...t, userEmail: email } : t)));
    setNotifications((prev) =>
      prev.map((n) => (n.recipientEmail === previousEmail ? { ...n, recipientEmail: email } : n)),
    );
  };

  const emailTakenByOther = (email: string, ownEmail: string) => {
    const normalized = normalizeEmail(email);
    return normalized !== normalizeEmail(ownEmail) && accounts.some((a) => a.email === normalized);
  };

  const updateProfile = async (name: string, email: string): Promise<ActionResult> => {
    if (!session) return { ok: false, error: "Debes iniciar sesión." };
    if (!name.trim() || !email.trim()) {
      return { ok: false, error: "Por favor completa todos los campos obligatorios antes de continuar." };
    }
    if (!isValidEmail(email)) return { ok: false, error: "Ingresa un correo electrónico válido." };
    if (emailTakenByOther(email, session.email)) {
      return { ok: false, error: "El correo ya pertenece a otro usuario registrado." };
    }
    const previousEmail = session.email;
    const nextName = name.trim();
    const nextEmail = normalizeEmail(email);
    try {
      if (session.demo) {
        if (findAccount(previousEmail)) renameAccount(previousEmail, nextName, nextEmail);
      } else {
        await usersApi.updateProfile({ name: nextName, email: nextEmail });
      }
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo actualizar el perfil.") };
    }
    setSession({ ...session, name: nextName, email: nextEmail });
    setAccounts((prev) =>
      prev.map((a) => (a.email === normalizeEmail(previousEmail) ? { ...a, name: nextName, email: nextEmail } : a)),
    );
    renameIdentity(previousEmail, nextName, nextEmail);
    return { ok: true, data: undefined };
  };

  const recharge = async (amount: number) => {
    if (!session) return;
    if (session.demo) {
      setSession((prev) => (prev ? { ...prev, balance: prev.balance + amount } : prev));
      setLocalTransactions((prev) => [
        { id: `T${Date.now()}`, date: today(), type: "recharge" as const, amount, userId: session.id, userEmail: session.email },
        ...prev,
      ]);
      return;
    }
    const res = await usersApi.recharge(amount);
    const newBalance = Number(res.balance ?? res.newBalance);
    if (Number.isFinite(newBalance)) {
      setSession((prev) => (prev ? { ...prev, balance: newBalance } : prev));
    }
    await refreshBalance();
  };

  // --- Administración de usuarios (solo administradores) ------------------------

  const isSelf = (account: Account) => !!session && normalizeEmail(session.email) === account.email;

  const getFinancialFootprint = (email: string): FinancialFootprint => {
    // Para la sesión con backend se suman también sus recargas y aportes reales.
    const own = session && !session.demo && normalizeEmail(session.email) === normalizeEmail(email);
    const records: Transaction[] = [
      ...SEED_FOOTPRINT_TX,
      ...localTransactions,
      ...(own ? serverTransactions.map((t) => ({ ...t, userEmail: session.email })) : []),
    ];
    const recharges = records.filter((t) => t.type === "recharge" && t.userEmail === email).length;
    const created = campaigns.filter((c) => c.creatorEmail === email).length;
    const contributions = Math.max(
      records.filter((t) => t.type === "contribution" && t.userEmail === email).length,
      campaigns.filter((c) => c.backerEmails.includes(email)).length,
    );
    return { recharges, campaigns: created, contributions, total: recharges + created + contributions };
  };

  const adminGuard = (): { ok: false; error: string } | null =>
    user?.role === "admin"
      ? null
      : { ok: false, error: "Permiso denegado: solo un administrador puede gestionar usuarios." };

  const validateAccountInput = (input: AccountInput, ownEmail = ""): string | null => {
    if (!input.name.trim() || !input.email.trim() || !input.role) {
      return "Completa todos los campos obligatorios: nombre, correo electrónico y rol.";
    }
    if (!isValidEmail(input.email)) return "Ingresa un correo electrónico válido.";
    if (emailTakenByOther(input.email, ownEmail)) return "El correo ya pertenece a otro usuario registrado.";
    return null;
  };

  const createAccount: UserContextType["createAccount"] = (input) => {
    const denied = adminGuard();
    if (denied) return denied;
    const error = validateAccountInput(input);
    if (error) return { ok: false, error };
    if (!isValidPassword(input.password)) return { ok: false, error: PASSWORD_ERROR };
    const account: Account = {
      id: createId("U"),
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      role: input.role,
      status: "active",
      password: input.password,
      createdAt: today(),
    };
    setAccounts((prev) => [account, ...prev]);
    return { ok: true, data: account };
  };

  const updateAccount: UserContextType["updateAccount"] = (id, input) => {
    const denied = adminGuard();
    if (denied) return denied;
    const account = accounts.find((a) => a.id === id);
    if (!account) return { ok: false, error: "El usuario no existe." };
    const error = validateAccountInput(input, account.email);
    if (error) return { ok: false, error };
    const self = isSelf(account);
    if (self && input.role !== "admin") {
      return { ok: false, error: "No puedes quitarte el rol de administrador desde este módulo." };
    }
    const name = input.name.trim();
    const email = normalizeEmail(input.email);
    if (self && session && !session.demo && (name !== account.name || email !== account.email)) {
      // La cuenta real vive en el backend: sus datos se editan desde el perfil.
      return { ok: false, error: "Para cambiar tu nombre o correo usa la página de Perfil." };
    }
    if (findAccount(account.email)) renameAccount(account.email, name, email);
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, name, email, role: input.role } : a)));
    renameIdentity(account.email, name, email);
    if (self) setSession((prev) => (prev ? { ...prev, name, email } : prev));
    return { ok: true, data: undefined };
  };

  const setAccountStatus: UserContextType["setAccountStatus"] = (id, status) => {
    const denied = adminGuard();
    if (denied) return denied;
    const account = accounts.find((a) => a.id === id);
    if (!account) return { ok: false, error: "El usuario no existe." };
    if (status === "inactive" && isSelf(account)) {
      return { ok: false, error: "No puedes deshabilitar tu propia cuenta mientras está activa." };
    }
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    return { ok: true, data: undefined };
  };

  const removeAccount: UserContextType["removeAccount"] = (id) => {
    const denied = adminGuard();
    if (denied) return denied;
    const account = accounts.find((a) => a.id === id);
    if (!account) return { ok: false, error: "El usuario no existe." };
    if (isSelf(account)) return { ok: false, error: "No puedes eliminar tu propia cuenta mientras está activa." };
    if (getFinancialFootprint(account.email).total > 0) {
      // Se conserva la cuenta y su historial para garantizar la trazabilidad; solo se revoca el acceso.
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "inactive" } : a)));
      return { ok: true, data: "deactivated" };
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    return { ok: true, data: "deleted" };
  };

  const canManageCampaign = (campaign: Campaign) =>
    !!user && (user.role === "admin" || campaign.creatorEmail === user.email);

  const publishCampaign = (draft: CampaignDraft): ActionResult<Campaign> => {
    if (!user) return { ok: false, error: "Debes iniciar sesión para publicar." };
    if (!(draft.goal > 0)) {
      return { ok: false, error: "La meta de financiación debe ser mayor a cero." };
    }
    const campaign: Campaign = {
      id: createId("C"),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      goal: draft.goal,
      raised: 0,
      deadline: draft.deadline,
      images: draft.images,
      status: "active",
      creatorName: user.name,
      creatorEmail: user.email,
      rewards: draft.rewards.map((r, i) => ({ ...r, id: `r${i + 1}` })),
      backerEmails: [],
      contributionsCount: 0,
      createdAt: today(),
    };
    setCampaigns((prev) => [campaign, ...prev]);
    return { ok: true, data: campaign };
  };

  const updateCampaign = (id: string, changes: CampaignChanges): ActionResult => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return { ok: false, error: "La campaña no existe." };
    if (!canManageCampaign(campaign)) {
      return { ok: false, error: "Permiso denegado: solo el creador o un administrador puede editar esta campaña." };
    }
    if (campaign.status !== "active") {
      return { ok: false, error: "Solo se pueden editar campañas activas." };
    }
    if (!changes.title.trim() || !changes.description.trim()) {
      return { ok: false, error: "Completa los campos obligatorios antes de guardar." };
    }
    const hasContributions = campaign.raised > 0 || campaign.contributionsCount > 0;
    if (hasContributions && (changes.goal !== undefined || changes.deadline !== undefined)) {
      if (changes.goal !== campaign.goal || changes.deadline !== campaign.deadline) {
        return {
          ok: false,
          error: "La campaña ya recibió aportes: no se puede modificar la meta ni la fecha límite.",
        };
      }
    }
    if (changes.goal !== undefined && !(changes.goal > 0)) {
      return { ok: false, error: "La meta de financiación debe ser mayor a cero." };
    }
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              title: changes.title.trim(),
              description: changes.description.trim(),
              images: changes.images,
              goal: hasContributions ? c.goal : (changes.goal ?? c.goal),
              deadline: hasContributions ? c.deadline : (changes.deadline ?? c.deadline),
            }
          : c,
      ),
    );
    return { ok: true, data: undefined };
  };

  const changeCampaignStatus = (id: string, status: CampaignStatus): ActionResult => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return { ok: false, error: "La campaña no existe." };
    if (!canManageCampaign(campaign)) {
      return {
        ok: false,
        error: "Permiso denegado: solo el creador o un administrador puede cambiar el estado de esta campaña.",
      };
    }
    if (campaign.status === "closed") {
      return { ok: false, error: "La campaña está cerrada de forma permanente." };
    }
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

    if (status === "closed") {
      const sentAt = new Date().toISOString();
      setNotifications((prev) => [
        ...campaign.backerEmails.map((email) => ({
          id: createId("N"),
          recipientEmail: email,
          channel: "email" as const,
          subject: `La campaña "${campaign.title}" ha sido cerrada`,
          body: `El creador cerró la campaña "${campaign.title}". Ya no recibirá nuevos aportes. Recaudo final: ${campaign.raised.toLocaleString("es-CO")} COP de una meta de ${campaign.goal.toLocaleString("es-CO")} COP.`,
          date: sentAt,
          read: false,
        })),
        ...prev,
      ]);
    }
    return { ok: true, data: undefined };
  };

  const contribute: UserContextType["contribute"] = (campaignId, amount, rewardId, options) => {
    if (!user) return { ok: false, error: "Debes iniciar sesión para aportar." };
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return { ok: false, error: "La campaña no existe." };
    if (campaign.status !== "active") {
      return { ok: false, error: "Esta campaña no está recibiendo aportes en este momento." };
    }
    if (!(amount > 0)) return { ok: false, error: "El monto debe ser mayor a cero." };
    if (amount > user.balance) {
      return { ok: false, error: "Saldo insuficiente. Recarga tu billetera para continuar." };
    }
    const reward = rewardId ? campaign.rewards.find((r) => r.id === rewardId) : null;
    if (rewardId && !reward) return { ok: false, error: "La recompensa seleccionada no existe." };
    if (reward && reward.stock <= 0) return { ok: false, error: "La recompensa seleccionada está agotada." };
    if (reward && amount < reward.minAmount) {
      return { ok: false, error: "El monto no alcanza el mínimo requerido para la recompensa." };
    }
    if (options?.simulateFailure) {
      // Nothing has been mutated yet, so the balance stays intact.
      return {
        ok: false,
        error: "No pudimos procesar el pago (error de la pasarela). La operación fue cancelada y no se descontó saldo.",
      };
    }

    const transactionId = createId("TX-");
    const date = today();
    const remainingBalance = user.balance - amount;

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              raised: c.raised + amount,
              contributionsCount: c.contributionsCount + 1,
              backerEmails: c.backerEmails.includes(user.email) ? c.backerEmails : [...c.backerEmails, user.email],
              rewards: c.rewards.map((r) => (r.id === rewardId ? { ...r, stock: r.stock - 1 } : r)),
            }
          : c,
      ),
    );
    setLocalTransactions((prev) => [
      {
        id: transactionId,
        date,
        type: "contribution",
        amount,
        campaignId,
        campaignName: campaign.title,
        rewardTitle: reward?.title,
        userId: user.id,
        userEmail: user.email,
      },
      ...prev,
    ]);
    setNotifications((prev) => [
      {
        id: createId("N"),
        recipientEmail: user.email,
        channel: "email",
        subject: `Comprobante de tu aporte a "${campaign.title}"`,
        body: `Transacción ${transactionId}. Aportaste ${amount.toLocaleString("es-CO")} COP${
          reward ? ` con la recompensa "${reward.title}"` : " sin recompensa"
        }. Saldo restante: ${remainingBalance.toLocaleString("es-CO")} COP.`,
        date: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return {
      ok: true,
      data: {
        transactionId,
        campaignId,
        campaignTitle: campaign.title,
        amount,
        rewardTitle: reward?.title ?? null,
        remainingBalance,
        date,
        email: user.email,
      },
    };
  };

  const markNotificationsRead = () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => (n.recipientEmail === user.email ? { ...n, read: true } : n)));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        transactions,
        campaigns,
        notifications,
        accounts,
        login,
        register,
        logout,
        updateProfile,
        recharge,
        refreshBalance,
        isSelf,
        getFinancialFootprint,
        createAccount,
        updateAccount,
        setAccountStatus,
        removeAccount,
        canManageCampaign,
        publishCampaign,
        updateCampaign,
        changeCampaignStatus,
        contribute,
        markNotificationsRead,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
