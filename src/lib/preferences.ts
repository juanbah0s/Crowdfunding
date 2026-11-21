// HU-22 / HU-23: tamaño de texto y tema de la interfaz, guardados en el dispositivo.

export type FontSizePreference = "medium" | "large" | "xlarge";
export type ThemePreference = "light" | "dark" | "system";

export interface Preferences {
  fontSize: FontSizePreference;
  theme: ThemePreference;
}

export const FONT_SIZE_LABELS: Record<FontSizePreference, string> = {
  medium: "Normal",
  large: "Grande",
  xlarge: "Extra grande",
};

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Según el sistema",
};

export const DEFAULT_PREFERENCES: Preferences = { fontSize: "medium", theme: "light" };

const STORAGE_KEY = "catalyst-preferences";
const SYSTEM_DARK = "(prefers-color-scheme: dark)";

/** Acepta valores del servidor o del almacenamiento; lo desconocido vuelve al valor por defecto. */
export function normalizePreferences(raw: Partial<Record<keyof Preferences, unknown>> | null | undefined): Preferences {
  const fontSize = raw?.fontSize;
  const theme = raw?.theme;
  return {
    fontSize: fontSize === "large" || fontSize === "xlarge" ? fontSize : "medium",
    theme: theme === "dark" || theme === "system" ? theme : "light",
  };
}

export function readStoredPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizePreferences(JSON.parse(raw)) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function storePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Sin almacenamiento (modo privado) la preferencia dura solo la sesión.
  }
}

export function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia?.(SYSTEM_DARK).matches ? "dark" : "light";
}

/** Aplica las preferencias a la raíz del documento; el CSS reacciona a data-theme y data-font-size. */
export function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(preferences.theme);
  if (preferences.fontSize === "medium") delete root.dataset.fontSize;
  else root.dataset.fontSize = preferences.fontSize;
}

/** Avisa cuando cambia el tema del sistema operativo; devuelve la función para dejar de escuchar. */
export function onSystemThemeChange(callback: () => void) {
  const query = window.matchMedia?.(SYSTEM_DARK);
  if (!query) return () => {};
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
