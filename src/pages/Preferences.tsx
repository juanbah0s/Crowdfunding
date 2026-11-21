import { Monitor, Moon, Sun, Type } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext";
import { useUser } from "../context/UserContext";
import {
  FONT_SIZE_LABELS,
  THEME_LABELS,
  type FontSizePreference,
  type ThemePreference,
} from "../lib/preferences";
import "./Reports.css";

const FONT_SIZES: FontSizePreference[] = ["medium", "large", "xlarge"];
const THEMES: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];

/** HU-22 / HU-23: tamaño de texto y tema; se aplican al instante y se recuerdan al volver a abrir la app. */
export function Preferences() {
  const { preferences, setPreferences } = usePreferences();
  const { isBackendSession } = useUser();

  return (
    <main className="panel__main">
      <div>
        <h1 className="panel__heading">Preferencias</h1>
        <p className="panel__subheading">
          Ajusta la apariencia de la aplicación.{" "}
          {isBackendSession
            ? "Se guardan en este dispositivo y en tu cuenta."
            : "Se guardan en este dispositivo."}
        </p>
      </div>

      <section className="panel__card" aria-labelledby="font-size-title">
        <h2 id="font-size-title" className="panel__card-title">
          <Type size={16} style={{ display: "inline", verticalAlign: "-2px" }} /> Tamaño del texto
        </h2>
        <div className="segmented" role="radiogroup" aria-labelledby="font-size-title">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={preferences.fontSize === size}
              className={`segmented__option${preferences.fontSize === size ? " segmented__option--active" : ""}`}
              onClick={() => setPreferences({ fontSize: size })}
            >
              {FONT_SIZE_LABELS[size]}
            </button>
          ))}
        </div>
        <p className="preference-preview">
          Así se verá el texto: apoya los proyectos que te inspiran y sigue su avance en tiempo real.
        </p>
      </section>

      <section className="panel__card" aria-labelledby="theme-title">
        <h2 id="theme-title" className="panel__card-title">
          Tema
        </h2>
        <div className="segmented" role="radiogroup" aria-labelledby="theme-title">
          {THEMES.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={preferences.theme === value}
              className={`segmented__option${preferences.theme === value ? " segmented__option--active" : ""}`}
              onClick={() => setPreferences({ theme: value })}
            >
              <Icon size={15} /> {THEME_LABELS[value]}
            </button>
          ))}
        </div>
        <p className="field-hint" style={{ marginTop: "0.75rem" }}>
          "Según el sistema" sigue el modo claro u oscuro de tu dispositivo y cambia solo cuando lo cambias allí.
        </p>
      </section>
    </main>
  );
}
