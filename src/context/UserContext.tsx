import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
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
}

export type TransactionItem = Transaction;

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
  /** 6-digit campaign password required to edit or close this campaign. */
  pin: string;
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
  pin: string;
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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string, password: string) => Promise<ActionResult>;
  verifyPassword: (password: string) => Promise<boolean>;
  recharge: (amount: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  canManageCampaign: (campaign: Campaign) => boolean;
  publishCampaign: (draft: CampaignDraft) => ActionResult<Campaign>;
  updateCampaign: (id: string, changes: CampaignChanges, pin: string) => ActionResult;
  changeCampaignStatus: (
    id: string,
    status: CampaignStatus,
    credentials?: { pin: string; password: string },
  ) => Promise<ActionResult>;
  contribute: (
    campaignId: string,
    amount: number,
    rewardId: string | null,
    options: { password: string; simulateFailure?: boolean },
  ) => Promise<ActionResult<ContributionReceipt>>;
  markNotificationsRead: () => void;
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


// Campaign passwords for the seeded demo campaigns (also applied to older saved data).
const DEFAULT_PINS: Record<string, string> = { "1": "482915", "2": "730264", "3": "159357", "4": "246810", "5": "908172" };

const MOCK_CAMPAIGN_SEED: Omit<Campaign, "pin">[] = [
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

const MOCK_CAMPAIGNS = withPins(MOCK_CAMPAIGN_SEED);

const UserContext = createContext<UserContextType | null>(null);

// Campañas, notificaciones y aportes simulados (todavía sin endpoint en el frontend).
const STORAGE_KEY = "catalyst-state-v2";

interface PersistedState {
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

function withPins(list: Omit<Campaign, "pin">[] | Campaign[]): Campaign[] {
  return list.map((c) => ({ ...c, pin: (c as Campaign).pin ?? DEFAULT_PINS[c.id] ?? "000000" }));
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as Partial<PersistedState>;
    return {
      campaigns: withPins(state.campaigns ?? MOCK_CAMPAIGNS),
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

function createId(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [serverTransactions, setServerTransactions] = useState<Transaction[]>([]);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(initialState?.localTransactions ?? []);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialState?.campaigns ?? MOCK_CAMPAIGNS);
  const [notifications, setNotifications] = useState<Notification[]>(initialState?.notifications ?? []);

  // Mantiene la base de datos simulada (campañas, notificaciones, aportes locales) entre recargas.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ campaigns, notifications, localTransactions }));
    } catch {
      // Storage quota exceeded (e.g. large uploaded images); keep working in memory.
    }
  }, [campaigns, notifications, localTransactions]);

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

  const loginDemo = (email: string): boolean => {
    const account = findAccount(email);
    if (!account) return false;
    const id = `demo:${account.email}`;
    authApi.logout(); // descarta cualquier token de una sesión real anterior
    setSession({
      id,
      name: account.name,
      email: account.email,
      role: account.role ?? "sponsor",
      balance: DEMO_BASE_BALANCE,
      historic: 0,
      demo: true,
    });
    setServerTransactions([]);
    setLocalTransactions((prev) =>
      prev.some((t) => t.userId === id) ? prev : [...DEMO_TRANSACTIONS.map((t) => ({ ...t, userId: id })), ...prev],
    );
    remapDemoOwner(account.name, account.email);
    return true;
  };

  const login = async (email: string, password: string) => {
    // Las cuentas de demostración funcionan sin backend; cualquier otra va a la API real.
    if (findAccount(email)) {
      // Correo reservado para demostración: no se consulta el backend.
      if (checkPassword(email, password) && loginDemo(email)) return;
      throw { response: { data: { message: "Credenciales inválidas." } } };
    }
    const u = await authApi.login({ email, password });
    setSession({ id: u.id, name: u.name, email: u.email, role: u.role, balance: u.balance, historic: u.historic });
    remapDemoOwner(u.name, u.email);
    await refreshBalance();
  };

  const register = async (name: string, email: string, password: string) => {
    await authApi.register({ name, email, password });
    await login(email, password);
  };

  const logout = () => {
    authApi.logout();
    setSession(null);
    setServerTransactions([]);
  };

  const verifyPassword = (password: string) => {
    if (!session) return Promise.resolve(false);
    if (session.demo) return Promise.resolve(checkPassword(session.email, password));
    return authApi.verifyPassword(session.email, password);
  };

  const updateProfile = async (name: string, email: string, password: string): Promise<ActionResult> => {
    if (!session) return { ok: false, error: "Debes iniciar sesión." };
    try {
      if (!(await verifyPassword(password))) {
        return { ok: false, error: "Contraseña incorrecta. No se guardaron los cambios." };
      }
      if (session.demo) {
        if (email !== session.email && findAccount(email)) {
          return { ok: false, error: "Este correo ya está registrado por otra cuenta." };
        }
        renameAccount(session.email, name, email);
      } else {
        await usersApi.updateProfile({ name, email });
      }
    } catch (err) {
      return { ok: false, error: getApiError(err, "No se pudo actualizar el perfil.") };
    }
    const previousEmail = session.email;
    setSession({ ...session, name, email });
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        creatorEmail: c.creatorEmail === previousEmail ? email : c.creatorEmail,
        creatorName: c.creatorEmail === previousEmail ? name : c.creatorName,
        backerEmails: c.backerEmails.map((b) => (b === previousEmail ? email : b)),
      })),
    );
    return { ok: true, data: undefined };
  };

  const recharge = async (amount: number) => {
    if (!session) return;
    if (session.demo) {
      setSession((prev) => (prev ? { ...prev, balance: prev.balance + amount } : prev));
      setLocalTransactions((prev) => [
        { id: `T${Date.now()}`, date: today(), type: "recharge" as const, amount, userId: session.id },
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

  const canManageCampaign = (campaign: Campaign) =>
    !!user && (user.role === "admin" || campaign.creatorEmail === user.email);

  const publishCampaign = (draft: CampaignDraft): ActionResult<Campaign> => {
    if (!user) return { ok: false, error: "Debes iniciar sesión para publicar." };
    if (!(draft.goal > 0)) {
      return { ok: false, error: "La meta de financiación debe ser mayor a cero." };
    }
    if (!/^\d{6}$/.test(draft.pin)) {
      return { ok: false, error: "La contraseña de campaña debe tener exactamente 6 dígitos." };
    }
    if (campaigns.some((c) => c.creatorEmail === user.email && c.pin === draft.pin)) {
      return { ok: false, error: "Ya usas esa contraseña en otra de tus campañas. Elige una diferente." };
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
      pin: draft.pin,
    };
    setCampaigns((prev) => [campaign, ...prev]);
    return { ok: true, data: campaign };
  };

  const updateCampaign = (id: string, changes: CampaignChanges, pin: string): ActionResult => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return { ok: false, error: "La campaña no existe." };
    if (!canManageCampaign(campaign)) {
      return { ok: false, error: "Permiso denegado: solo el creador o un administrador puede editar esta campaña." };
    }
    if (campaign.status !== "active") {
      return { ok: false, error: "Solo se pueden editar campañas activas." };
    }
    if (pin !== campaign.pin) {
      return { ok: false, error: "La contraseña de campaña es incorrecta." };
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

  const changeCampaignStatus: UserContextType["changeCampaignStatus"] = async (id, status, credentials) => {
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
    if (status === "closed") {
      if (!credentials || credentials.pin !== campaign.pin) {
        return { ok: false, error: "La contraseña de campaña es incorrecta." };
      }
      if (!(await verifyPassword(credentials.password))) {
        return { ok: false, error: "La contraseña de la cuenta es incorrecta." };
      }
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

  const contribute: UserContextType["contribute"] = async (campaignId, amount, rewardId, options) => {
    if (!user) return { ok: false, error: "Debes iniciar sesión para aportar." };
    if (!(await verifyPassword(options.password))) {
      return { ok: false, error: "Contraseña incorrecta. El aporte no se procesó." };
    }
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
        login,
        register,
        logout,
        updateProfile,
        verifyPassword,
        recharge,
        refreshBalance,
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
