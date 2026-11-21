import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { usersApi } from "../api/users";
import { useUser } from "./UserContext";
import {
  applyPreferences,
  normalizePreferences,
  onSystemThemeChange,
  readStoredPreferences,
  storePreferences,
  type Preferences,
} from "../lib/preferences";

interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: (changes: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

/**
 * HU-22 / HU-23: las preferencias se guardan en el dispositivo y se aplican al instante.
 * Con una cuenta real también se sincronizan con el servidor, que manda al iniciar sesión.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isBackendSession } = useUser();
  const [preferences, setState] = useState<Preferences>(readStoredPreferences);

  useEffect(() => {
    applyPreferences(preferences);
    storePreferences(preferences);
    if (preferences.theme !== "system") return;
    return onSystemThemeChange(() => applyPreferences(preferences));
  }, [preferences]);

  const userId = user?.id;
  useEffect(() => {
    if (!isBackendSession || !userId) return;
    usersApi
      .getPreferences()
      .then((server) => setState(normalizePreferences(server)))
      .catch((err) => console.error("Error loading preferences:", err));
  }, [isBackendSession, userId]);

  const setPreferences = useCallback(
    (changes: Partial<Preferences>) => {
      setState((prev) => ({ ...prev, ...changes }));
      if (isBackendSession) {
        usersApi.updatePreferences(changes).catch((err) => console.error("Error saving preferences:", err));
      }
    },
    [isBackendSession],
  );

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
