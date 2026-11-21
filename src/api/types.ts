export type CampaignStatusBackend = "ACTIVE" | "PAUSED" | "CLOSED" | "FINISHED";

export interface RewardResponse {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  stock: number;
}

export interface CampaignResponse {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  deadline: string;
  status: CampaignStatusBackend;
  categoryId: string;
  categoryName: string;
  images: string[];
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  hasContributions: boolean;
  backerEmails: string[];
  contributionsCount: number;
  createdAt: string;
  updatedAt: string;
  rewards: RewardResponse[];
}

export interface CampaignSummary {
  id: string;
  title: string;
  raised: number;
  goal: number;
  contributed: number;
}

export interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  date: string;
  campaignName?: string;
  campaignId?: string;
  rewardName?: string;
}

export interface BalanceResponse {
  balance: number;
  historic: number;
  campaigns: CampaignSummary[];
  history: TransactionItem[];
}

export interface CategoryResponse {
  id: string;
  name: string;
}

export interface ContributionConfirmationResponse {
  transactionId: string;
  campaignId: string;
  campaignName: string;
  amount: number;
  rewardId: string | null;
  rewardName: string | null;
  remainingBalance: number;
  transactionDate: string;
  message: string;
}

export interface LoginResponse {
  token: string;
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  message: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  historic: number;
}

export interface RechargeResponse {
  id: string;
  newBalance: number;
  message: string;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface AdminUserDetailResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  balance: number;
  historic: number;
  createdAt: string;
  updatedAt: string;
  campaignsCount: number;
  transactionsCount: number;
}

// `users` es un Page de Spring: según la versión trae `totalPages` arriba o dentro de `page`.
export interface AdminUserListResponse {
  users: {
    content: AdminUserSummary[];
    totalPages?: number;
    page?: { totalPages: number };
  };
}

export interface AdminCreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: "sponsor" | "creator";
}

export interface AdminUpdateUserRequest {
  name?: string;
  email?: string;
  role?: "sponsor" | "creator";
}

export interface AdminUserActionRequest {
  action: "DISABLE" | "ENABLE";
}

export interface CreateCampaignRequest {
  title: string;
  description: string;
  goal: number;
  deadline: string;
  categoryId: string;
  images: string[];
  rewards: {
    name: string;
    description: string;
    minAmount: number;
    stock: number;
  }[];
  /** HU-S02: PIN de la campaña, exactamente 6 dígitos. */
  pin: string;
}

export interface UpdateCampaignRequest {
  title: string;
  description: string;
  images: string[];
  goal?: number;
  deadline?: string;
  categoryId?: string;
  rewards?: {
    name: string;
    description: string;
    minAmount: number;
    stock: number;
  }[];
  /** HU-S04: PIN de esta campaña. */
  pin: string;
}

export interface UpdateCampaignStatusRequest {
  status: CampaignStatusBackend;
  /** HU-S05: solo para cerrar. */
  pin?: string;
  password?: string;
}

export interface ContributionConfirmationRequest {
  amount: number;
  rewardId?: string | null;
  /** HU-S06: contraseña de la cuenta. */
  password: string;
}

/** HU-15: notificación de la plataforma (por ejemplo, un hito de financiación). */
export interface NotificationResponse {
  id: string;
  campaignId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationSummaryResponse {
  unreadCount: number;
  notifications: NotificationResponse[];
}

/** HU-16: un aporte del historial; campaignStatus es el estado actual de la campaña. */
export interface ContributionHistoryItem {
  transactionId: string;
  campaignId: string;
  campaignName: string;
  amount: number;
  date: string;
  rewardId: string | null;
  rewardName: string | null;
  campaignStatus: CampaignStatusBackend | null;
}

export interface ContributionHistoryResponse {
  totalContributed: number;
  contributionsCount: number;
  contributions: ContributionHistoryItem[];
}

/** HU-14: recaudo de una campaña propia y sus patrocinadores. */
export interface CampaignEarningsResponse {
  campaignId: string;
  campaignName: string;
  totalRaised: number;
  contributorsCount: number;
  contributions: {
    transactionId: string;
    contributorId: string;
    contributorName: string | null;
    contributorEmail: string | null;
    amount: number;
    date: string;
    rewardId: string | null;
    rewardName: string | null;
  }[];
}

/** HU-14: total aportado por el patrocinador y detalle por campaña. */
export interface SponsorContributionsSummaryResponse {
  totalContributed: number;
  campaigns: { campaignId: string; campaignName: string; totalContributed: number }[];
}

/** HU-17: movimiento del registro general (solo admin). */
export interface AdminTransactionResponse {
  id: string;
  date: string;
  type: string;
  userName: string;
  amount: number;
  status: string;
}

/** HU-18: campaña activa del reporte. */
export interface ActiveCampaignReportItem {
  id: string;
  title: string;
  goal: number;
  currentRaised: number;
  percentage: number;
  daysRemaining: number;
  alert: boolean;
}

/** HU-19: fondos recaudados en un periodo. */
export interface PeriodFundsReportResponse {
  totalFunds: number;
  contributionCount: number;
  averageContribution: number;
  message: string;
}

/** HU-22 / HU-23: preferencias de interfaz guardadas en el servidor. */
export interface PreferencesResponse {
  fontSize: "small" | "medium" | "large";
  theme: "light" | "dark";
  language: "es" | "en";
}

export interface RechargeRequest {
  amount: number;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
  /** HU-S01: contraseña actual de la cuenta. */
  password: string;
}
