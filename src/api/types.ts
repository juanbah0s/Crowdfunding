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

export interface AdminUserListResponse {
  users: AdminUserSummary[];
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
}

export interface UpdateCampaignStatusRequest {
  status: CampaignStatusBackend;
}

export interface ContributionConfirmationRequest {
  amount: number;
  rewardId?: string | null;
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
}
