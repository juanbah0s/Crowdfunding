import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "creator" | "sponsor";

export interface Transaction {
  id: string;
  date: string;
  type: "recharge" | "contribution";
  amount: number;
  campaignName?: string;
}

export interface Campaign {
  id: string;
  title: string;
  raised: number;
  goal: number;
}

export interface User {
  name: string;
  email: string;
  role: UserRole;
  balance: number;
}

interface UserContextType {
  user: User | null;
  transactions: Transaction[];
  campaigns: Campaign[];
  login: (name: string, email: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateProfile: (name: string, email: string) => void;
  recharge: (amount: number) => void;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "1", title: "EcoTech Innovación", raised: 450000, goal: 800000 },
  { id: "2", title: "AgroSmart Colombia", raised: 120000, goal: 300000 },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "T001", date: "2026-09-01", type: "recharge", amount: 500000 },
  { id: "T002", date: "2026-09-05", type: "contribution", amount: 100000, campaignName: "EcoTech Innovación" },
  { id: "T003", date: "2026-09-10", type: "contribution", amount: 50000, campaignName: "AgroSmart Colombia" },
];

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [campaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);

  const login = (name: string, email: string) => {
    setUser({ name, email, role: "sponsor", balance: 350000 });
  };

  const logout = () => setUser(null);

  const setRole = (role: UserRole) => {
    if (user) setUser({ ...user, role });
  };

  const updateProfile = (name: string, email: string) => {
    if (user) setUser({ ...user, name, email });
  };

  const recharge = (amount: number) => {
    if (!user) return;
    setUser((prev) => prev ? { ...prev, balance: prev.balance + amount } : prev);
    setTransactions((prev) => [
      {
        id: `T${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        type: "recharge" as const,
        amount,
      },
      ...prev,
    ]);
  };

  return (
    <UserContext.Provider value={{ user, transactions, campaigns, login, logout, setRole, updateProfile, recharge }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
