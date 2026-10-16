import type { UserRole } from "../context/UserContext";

export type Account = { email: string; name: string; role?: UserRole; password?: string };

const USERS_STORAGE_KEY = "catalyst-users";

// Demo credentials (simulated database, stored locally).
const DEFAULT_ACCOUNTS: Account[] = [
  { email: "test@example.com", name: "Usuario Demo", password: "Demo1234!" },
  { email: "user@catalyst.com", name: "Catalyst User", password: "Demo1234!" },
  { email: "admin@catalyst.com", name: "Administrador", role: "admin", password: "Admin1234!" },
];

export function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_ACCOUNTS];
    // Older stored demo accounts lack passwords; restore the defaults for them.
    return (JSON.parse(raw) as Account[]).map((a) => ({
      ...a,
      password: a.password ?? DEFAULT_ACCOUNTS.find((d) => d.email === a.email)?.password,
    }));
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
}

export function saveAccounts(accounts: Account[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
}

export function findAccount(email: string) {
  return loadAccounts().find((a) => a.email === email);
}

/** Checks the password; accounts created before passwords were stored adopt the first one used. */
export function checkPassword(email: string, password: string): boolean {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.email === email);
  if (!account || !password) return false;
  if (account.password === undefined) {
    account.password = password;
    saveAccounts(accounts);
    return true;
  }
  return account.password === password;
}

export function addAccount(account: Account) {
  saveAccounts([...loadAccounts(), account]);
}

export function renameAccount(previousEmail: string, name: string, email: string) {
  saveAccounts(loadAccounts().map((a) => (a.email === previousEmail ? { ...a, name, email } : a)));
}
