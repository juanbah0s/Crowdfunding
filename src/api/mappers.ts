import type { User, CampaignSummary, TransactionItem, BalanceResponse } from '../context/UserContext';

export const toUser = (b: any): User => ({
  id: b.id,
  name: b.name,
  email: b.email,
  role: b.role,
  balance: Number(b.balance),
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
  date: b.date,
  campaignName: b.campaign_name,
  campaignId: b.campaign_id,
});

export const toBalanceResponse = (b: any): BalanceResponse => ({
  balance: Number(b.balance),
  historic: Number(b.historic ?? 0),
  campaigns: b.campaigns.map(toCampaignSummary),
  history: b.history.map(toTransactionItem),
});