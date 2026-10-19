import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { isValidEmail, isValidPassword, normalizeEmail, PASSWORD_ERROR } from "../lib/validation";
import { authApi } from "../api/auth";
import { checkPassword, findAccount, renameAccount } from "../lib/accounts";
import { usersApi } from "../api/users";
import { categoriesApi } from "../api/categories";
import { campaignsApi } from "../api/campaigns";
import { contributionsApi } from "../api/contributions";
import { adminApi } from "../api/admin";
import { getApiError, SESSION_KEY, TOKEN_KEY } from "../api/client";
import {
  mapCampaign,
  mapCampaignStatus,
  mapContributionReceipt,
  mapTransactionItem,
  mapAdminUserSummary,
} from "../api/mappers";

export type UserRole = "creator" | "sponsor" | "admin";

export type CampaignStatus = "active" | "paused" | "closed";

export const CAMPAIGN_CATEGORIES: string[] = [];

export interface Transaction {
  id: string;
  date: string;
  type: "recharge" | "contribution";
  amount: number;
  campaignId?: string;
  campaignName?: string;
  rewardTitle?: string;
  userId?: string;
  userEmail?: string;
}

export type TransactionItem = Transaction;

export type AccountRole = "user" | "admin";
export type AccountStatus = "active" | "inactive";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  password?: string;
  createdAt: string;
}

export interface AccountInput {
  name: string;
  email: string;
  role: AccountRole;
}

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
  balance: number;
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
  categories: { id: string; name: string }[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string) => Promise<ActionResult>;
  recharge: (amount: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  canManageCampaign: (campaign: Campaign) => boolean;
  publishCampaign: (draft: CampaignDraft) => Promise<ActionResult<Campaign>>;
  updateCampaign: (id: string, changes: CampaignChanges) => Promise<ActionResult>;
  changeCampaignStatus: (id: string, status: CampaignStatus) => Promise<ActionResult>;
  contribute: (
    campaignId: string,
    amount: number,
    rewardId: string | null,
    options?: { simulateFailure?: boolean },
  ) => Promise<ActionResult<ContributionReceipt>>;
  markNotificationsRead: () => void;
  isSelf: (account: Account) => boolean;
  getFinancialFootprint: (email: string) => FinancialFootprint;
  createAccount: (input: AccountInput & { password: string }) => Promise<ActionResult<Account>>;
  updateAccount: (id: string, input: AccountInput) => Promise<ActionResult>;
  setAccountStatus: (id: string, status: AccountStatus) => Promise<ActionResult>;
  removeAccount: (id: string) => Promise<ActionResult<"deleted" | "deactivated">>;
}

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

const STORAGE_KEY = "catalyst-state-v2";

interface PersistedState {
  accounts?: Account[];
  campaigns: Campaign[];
  notifications: Notification[];
  localTransactions: Transaction[];
}

interface Session {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;
  historic: number;
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
    if (!stored.demo && !localStorage.getItem(TOKEN_KEY)) return null;
    return stored;
  } catch {
    return null;
  }
}

const initialState = loadState();
const initialSession = loadSession();

const DEMO_BASE_BALANCE = 500000;
const DEMO_TRANSACTIONS: Omit<Transaction, "userId">[] = [
  { id: "T001", date: "2026-09-01", type: "recharge", amount: 500000 },
  { id: "T002", date: "2026-09-05", type: "contribution", amount: 100000, campaignId: "1", campaignName: "EcoTech Innovación" },
  { id: "T003", date: "2026-09-10", type: "contribution", amount: 50000, campaignId: "2", campaignName: "AgroSmart Colombia" },
];

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

const SEED_FOOTPRINT_TX: Transaction[] = [
  { id: "T004", date: "2026-08-22", type: "recharge", amount: 200000, userEmail: "marcos@mail.com" },
  { id: "T005", date: "2026-08-28", type: "recharge", amount: 150000, userEmail: "valentina@mail.com" },
];

const sessionRoleFor = (role: AccountRole): UserRole => (role === "admin" ? "admin" : "sponsor");

function createId(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function toBackendStatus(status: CampaignStatus): "ACTIVE" | "PAUSED" | "CLOSED" {
  switch (status) {
    case "active": return "ACTIVE";
    case "paused": return "PAUSED";
    case "closed": return "CLOSED";
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [serverTransactions, setServerTransactions] = useState<Transaction[]>([]);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(initialState?.localTransactions ?? []);
  const [accounts, setAccounts] = useState<Account[]>(() => initialState?.accounts ?? seedAccounts());
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialState?.campaigns ?? MOCK_CAMPAIGNS);
  const [notifications, setNotifications] = useState<Notification[]>(initialState?.notifications ?? []);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts, campaigns, notifications, localTransactions }));
    } catch {
      // ignore
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
      setServerTransactions(detail.history.map((h) => mapTransactionItem(h, session?.email)));
    } catch (err) {
      console.error("Error refreshing balance:", err);
    }
  }, []);

  useEffect(() => {
    if (initialSession && !initialSession.demo) void refreshBalance();
  }, [refreshBalance]);

  const loadCategories = useCallback(async () => {
    try {
      const list = await categoriesApi.list();
      setCategories(list);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const [publicCampaigns, managedCampaigns] = await Promise.all([
        campaignsApi.list(),
        campaignsApi.listManaged(),
      ]);
      const campaignsById = new Map(
        publicCampaigns.map((campaign) => [campaign.id, mapCampaign(campaign)]),
      );
      managedCampaigns.forEach((campaign) => {
        campaignsById.set(campaign.id, mapCampaign(campaign));
      });
      setCampaigns([...campaignsById.values()]);
    } catch {
      setCampaigns(MOCK_CAMPAIGNS);
    }
  }, []);

  useEffect(() => {
    if (session && !session.demo) {
      void loadCategories();
      void loadCampaigns();
    }
  }, [session, loadCategories, loadCampaigns]);

  const remapDemoOwner = (name: string, email: string) =>
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        creatorEmail: c.creatorEmail === DEMO_OWNER ? email : c.creatorEmail,
        creatorName: c.creatorEmail === DEMO_OWNER ? name : c.creatorName,
        backerEmails: c.backerEmails.map((b) => (b === "__self__" ? email : b)),
      })),
    );

  const startLocalSession = (info: { id: string; name: string; email: string; role: UserRole }) => {
    authApi.logout();
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

  const startBackendSession = async (u: User) => {
    setSession({ id: u.id, name: u.name, email: u.email, role: u.role, balance: u.balance, historic: u.historic });
    upsertAccount(u);
    remapDemoOwner(u.name, u.email);
    await refreshBalance();
    void loadCategories();
    void loadCampaigns();
  };

  const login = async (email: string, password: string) => {
    const registered = accounts.find((a) => a.email === normalizeEmail(email));
    if (registered?.status === "inactive") {
      throw { response: { data: { message: "Tu cuenta está inactiva. Contacta a un administrador para recuperar el acceso." } } };
    }
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
    await startBackendSession(u);
  };

  const register = async (name: string, email: string, password: string) => {
    if (findAccount(normalizeEmail(email))) {
      throw { response: { data: { message: "Este correo ya está registrado." } } };
    }
    await authApi.register({ name, email, password });
    const u = await authApi.login({ email, password });
    await startBackendSession(u);
  };

  const logout = () => {
    authApi.logout();
    setSession(null);
    setServerTransactions([]);
    setCampaigns(MOCK_CAMPAIGNS);
    setCategories([]);
  };

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
    const newBalance = Number(res.newBalance);
    if (Number.isFinite(newBalance)) {
      setSession((prev) => (prev ? { ...prev, balance: newBalance } : prev));
    }
    await refreshBalance();
  };

  const isSelf = (account: Account) => !!session && normalizeEmail(session.email) === account.email;

  const getFinancialFootprint = (email: string): FinancialFootprint => {
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

  const createAccount = async (input: AccountInput & { password: string }): Promise<ActionResult<Account>> => {
    const denied = adminGuard();
    if (denied) return denied;
    const error = validateAccountInput(input);
    if (error) return { ok: false, error };
    if (!isValidPassword(input.password)) return { ok: false, error: PASSWORD_ERROR };
    try {
      const backendRole: "sponsor" | "creator" =
        input.role === "admin" ? "creator" : input.role === "user" ? "sponsor" : input.role;
      const created = await adminApi.createUser({
        name: input.name.trim(),
        email: input.email.trim(),
        password: input.password,
        role: backendRole,
      });
      const account = mapAdminUserSummary(created);
      setAccounts((prev) => [account, ...prev]);
      return { ok: true, data: account };
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo crear el usuario.") };
    }
  };

  const updateAccount = async (id: string, input: AccountInput): Promise<ActionResult> => {
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
      return { ok: false, error: "Para cambiar tu nombre o correo usa la página de Perfil." };
    }
    try {
      const backendRole: "sponsor" | "creator" =
        input.role === "admin" ? "creator" : input.role === "user" ? "sponsor" : input.role;
      const updated = await adminApi.updateUser(id, {
        name,
        email,
        role: backendRole,
      });
      const accountUpdated = mapAdminUserSummary(updated);
      setAccounts((prev) => prev.map((a) => (a.id === id ? accountUpdated : a)));
      renameIdentity(account.email, name, email);
      if (self) setSession((prev) => (prev ? { ...prev, name, email } : prev));
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo actualizar el usuario.") };
    }
  };

  const setAccountStatus = async (id: string, status: AccountStatus): Promise<ActionResult> => {
    const denied = adminGuard();
    if (denied) return denied;
    const account = accounts.find((a) => a.id === id);
    if (!account) return { ok: false, error: "El usuario no existe." };
    if (status === "inactive" && isSelf(account)) {
      return { ok: false, error: "No puedes deshabilitar tu propia cuenta mientras está activa." };
    }
    try {
      await adminApi.changeUserStatus(id, status === "active" ? "ENABLE" : "DISABLE");
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo cambiar el estado del usuario.") };
    }
  };

  const removeAccount = async (id: string): Promise<ActionResult<"deleted" | "deactivated">> => {
    const denied = adminGuard();
    if (denied) return denied;
    const account = accounts.find((a) => a.id === id);
    if (!account) return { ok: false, error: "El usuario no existe." };
    if (isSelf(account)) return { ok: false, error: "No puedes eliminar tu propia cuenta mientras está activa." };
    if (getFinancialFootprint(account.email).total > 0) {
      await adminApi.changeUserStatus(id, "DISABLE");
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "inactive" } : a)));
      return { ok: true, data: "deactivated" };
    }
    try {
      await adminApi.changeUserStatus(id, "DISABLE");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      return { ok: true, data: "deleted" };
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo eliminar el usuario.") };
    }
  };

  const canManageCampaign = (campaign: Campaign) =>
    !!user && (user.role === "admin" || campaign.creatorEmail === user.email);

  const publishCampaign = async (draft: CampaignDraft): Promise<ActionResult<Campaign>> => {
    if (!user) return { ok: false, error: "Debes iniciar sesión para publicar." };
    if (!(draft.goal > 0)) {
      return { ok: false, error: "La meta de financiación debe ser mayor a cero." };
    }

    // Si no hay categorías cargadas, intentarlas obtener primero
    if (categories.length === 0) {
      try {
        const list = await categoriesApi.list();
        setCategories(list);
      } catch {
        setCategories([]);
      }
    }

    // Siempre usar una categoría válida: la seleccionada o la primera disponible
    const selectedCategoryId = draft.category;
    const categoryId = selectedCategoryId && categories.some((c) => c.id === selectedCategoryId)
      ? selectedCategoryId
      : categories.length > 0
        ? categories[0].id
        : null;

    if (!categoryId) {
      return { ok: false, error: "No hay categorías disponibles en el sistema." };
    }
    try {
      const created = await campaignsApi.publish({
        title: draft.title.trim(),
        description: draft.description.trim(),
        goal: draft.goal,
        deadline: `${draft.deadline}T00:00:00Z`,
        categoryId,
        images: draft.images,
        rewards: draft.rewards.map((r) => ({
          name: r.title.trim(),
          description: r.description.trim(),
          minAmount: r.minAmount,
          stock: r.stock,
        })),
      });
      const campaign = mapCampaign(created);
      setCampaigns((prev) => [campaign, ...prev]);
      return { ok: true, data: campaign };
    } catch (err: any) {
      const backendMsg = err.response?.data?.message || err.response?.data?.details;
      console.error("Publicar campaña error completo:", err);
      console.error("Backend response:", err.response?.data);
      const errorMsg = backendMsg || getApiError(err, "No se pudo publicar la campaña.");
      return { ok: false, error: errorMsg };
    }
  };

  const updateCampaign = async (id: string, changes: CampaignChanges): Promise<ActionResult> => {
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
    try {
      const body: any = {
        title: changes.title.trim(),
        description: changes.description.trim(),
        images: changes.images,
      };
      if (!hasContributions) {
        if (changes.goal !== undefined) body.goal = changes.goal;
        if (changes.deadline !== undefined) body.deadline = `${changes.deadline}T00:00:00Z`;
      }
      await campaignsApi.update(id, body);
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
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo actualizar la campaña.") };
    }
  };

  const changeCampaignStatus = async (id: string, status: CampaignStatus): Promise<ActionResult> => {
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
    try {
      await campaignsApi.updateStatus(id, toBackendStatus(status));
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
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo cambiar el estado de la campaña.") };
    }
  };

  const contribute = async (
    campaignId: string,
    amount: number,
    rewardId: string | null,
    options?: { simulateFailure?: boolean },
  ): Promise<ActionResult<ContributionReceipt>> => {
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
      return {
        ok: false,
        error: "No pudimos procesar el pago (error de la pasarela). La operación fue cancelada y no se descontó saldo.",
      };
    }
    try {
      const receipt = await contributionsApi.confirm(campaignId, {
        amount,
        rewardId: rewardId ?? undefined,
      });
      const mapped = mapContributionReceipt(receipt, user.email);
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
          id: mapped.transactionId,
          date: mapped.date,
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
          body: `Transacción ${mapped.transactionId}. Aportaste ${amount.toLocaleString("es-CO")} COP${
            reward ? ` con la recompensa "${reward.title}"` : " sin recompensa"
          }. Saldo restante: ${mapped.remainingBalance.toLocaleString("es-CO")} COP.`,
          date: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
      await refreshBalance();
      return { ok: true, data: mapped };
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo procesar el aporte.") };
    }
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
        categories,
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
