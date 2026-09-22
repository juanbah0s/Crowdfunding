import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';

export type UserRole = 'creator' | 'sponsor';

export interface TransactionItem {
  id: string;
  date: string;
  type: 'recharge' | 'contribution';
  amount: number;
  campaignName?: string;
  campaignId?: string;
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;
  historic: number;
}

interface UserContextType {
  user: User | null;
  transactions: TransactionItem[];
  campaigns: CampaignSummary[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateProfile: (name: string, email: string) => Promise<void>;
  recharge: (amount: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBalance = async () => {
    if (!user) return;
    try {
      const detail = await usersApi.getBalance();
      setUser((prev) => prev ? { ...prev, balance: detail.balance, historic: detail.historic } : prev);
      setCampaigns(detail.campaigns);
      setTransactions(detail.history);
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshBalance().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const userData = await authApi.login({ email, password });
    setUser(userData);
    await refreshBalance();
  };

  const register = async (name: string, email: string, password: string) => {
    await authApi.register({ name, email, password });
    await login(email, password);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setTransactions([]);
    setCampaigns([]);
  };

  const setRole = (role: UserRole) => {
    if (user) setUser({ ...user, role });
  };

  const updateProfile = async (name: string, email: string) => {
    await usersApi.updateProfile({ name, email });
    setUser((prev) => prev ? { ...prev, name, email } : prev);
  };

  const recharge = async (amount: number) => {
    const { newBalance } = await usersApi.recharge(amount);
    setUser((prev) => prev ? { ...prev, balance: newBalance } : prev);
    await refreshBalance();
  };

  return (
    <UserContext.Provider value={{
      user,
      transactions,
      campaigns,
      loading,
      login,
      register,
      logout,
      setRole,
      updateProfile,
      recharge,
      refreshBalance,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}