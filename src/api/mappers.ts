import type { User, CampaignSummary, TransactionItem, BalanceResponse } from '../context/UserContext';

export const toUser = (b: any): User => ({
  id: b.id,
  name: b.name,
  email: b.email,
  role: b.role ?? 'sponsor',
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

// El backend devuelve la fecha como ISO ("2026-09-22T13:00:00Z") y los campos en camelCase;
// la interfaz trabaja con "YYYY-MM-DD".
export const toTransactionItem = (b: any): TransactionItem => ({
  id: b.id,
  amount: Number(b.amount),
  type: b.type,
  date: String(b.date).slice(0, 10),
  campaignName: b.campaignName ?? b.campaign_name ?? undefined,
  campaignId: b.campaignId ?? b.campaign_id ?? undefined,
  rewardTitle: b.rewardName ?? undefined,
});

export const toBalanceResponse = (b: any): BalanceResponse => ({
  balance: Number(b.balance),
  historic: Number(b.historic ?? 0),
  campaigns: (b.campaigns ?? []).map(toCampaignSummary),
  history: (b.history ?? []).map(toTransactionItem),
});
