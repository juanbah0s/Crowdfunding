import type {
  Account,
  BalanceResponse,
  Campaign,
  CampaignStatus,
  CampaignSummary,
  ContributionReceipt,
  Reward,
  Transaction,
  User,
} from "../context/UserContext";
import type {
  CampaignResponse,
  CampaignStatusBackend,
  ContributionConfirmationResponse,
  TransactionItem,
} from "./types";

export const toUser = (b: any): User => ({
  id: b.id,
  name: b.name,
  email: b.email,
  role: b.role ?? "sponsor",
  balance: Number(b.balance ?? 0),
  historic: Number(b.historic ?? 0),
});

export const toCampaignSummary = (b: any): CampaignSummary => ({
  id: b.id,
  title: b.title,
  raised: Number(b.raised),
  goal: Number(b.goal),
  contributed: Number(b.contributed ?? 0),
});

export const toTransactionItem = (b: any): TransactionItem => ({
  id: b.id,
  amount: Number(b.amount),
  type: b.type,
  date: String(b.date).slice(0, 10),
  campaignName: b.campaignName ?? b.campaign_name ?? undefined,
  campaignId: b.campaignId ?? b.campaign_id ?? undefined,
  rewardName: b.rewardName ?? undefined,
});

export const toBalanceResponse = (b: any): BalanceResponse => ({
  balance: Number(b.balance),
  historic: Number(b.historic ?? 0),
  campaigns: (b.campaigns ?? []).map(toCampaignSummary),
  history: (b.history ?? []).map(toTransactionItem),
});

export function mapCampaignStatus(status: CampaignStatusBackend): CampaignStatus {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "PAUSED":
      return "paused";
    case "CLOSED":
    case "FINISHED":
      return "closed";
  }
}

export function mapCampaign(b: CampaignResponse): Campaign {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    category: b.categoryName,
    raised: Number(b.raised),
    goal: Number(b.goal),
    deadline: String(b.deadline).slice(0, 10),
    images: b.images ?? [],
    status: mapCampaignStatus(b.status),
    creatorName: b.creatorName,
    creatorEmail: b.creatorEmail,
    rewards: (b.rewards ?? []).map((r) => ({
      id: r.id,
      title: r.name,
      description: r.description,
      minAmount: Number(r.minAmount),
      stock: r.stock,
    })),
    backerEmails: b.backerEmails ?? [],
    contributionsCount: b.contributionsCount,
    createdAt: String(b.createdAt).slice(0, 10),
  };
}

export function mapTransactionItem(
  b: TransactionItem,
  userEmail?: string,
): Transaction {
  return {
    id: b.id,
    amount: Number(b.amount),
    type: b.type === "contribution" ? ("contribution" as const) : ("recharge" as const),
    date: String(b.date).slice(0, 10),
    campaignName: b.campaignName,
    campaignId: b.campaignId,
    rewardTitle: b.rewardName,
    userEmail,
  };
}

export function mapContributionReceipt(
  b: ContributionConfirmationResponse,
  email: string,
): ContributionReceipt {
  return {
    transactionId: b.transactionId,
    campaignId: b.campaignId,
    campaignTitle: b.campaignName,
    amount: Number(b.amount),
    rewardTitle: b.rewardName ?? null,
    remainingBalance: Number(b.remainingBalance),
    date: String(b.transactionDate).slice(0, 10),
    email,
  };
}

export function mapAdminUserSummary(b: any): Account {
  return {
    id: b.id,
    name: b.name,
    email: b.email,
    role: b.role === "admin" || b.role === "creator" ? b.role : ("sponsor" as const),
    status: b.status === "ACTIVE" ? ("active" as const) : ("inactive" as const),
    createdAt: String(b.createdAt).slice(0, 10),
  };
}
