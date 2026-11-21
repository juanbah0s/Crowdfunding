import { api, getApiError } from "./client";

// TEMPORAL: datos manipulables del navegador, no autorización real.
// Activar solo después de implementar el contrato en el servidor.
const remote = import.meta.env.VITE_CAMPAIGN_PIN_API === "true";
const KEY = "catalyst-campaign-pins-v1";
const DEFAULT_PINS: Record<string, string> = { "1": "482915", "2": "730264", "3": "159357", "4": "246810", "5": "908172" };
type Entry = { ownerId: string; pin: string };
type Store = Record<string, Entry>;
function read(): Store {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) as Store : {};
}
function localPin(id: string): string | undefined {
  if (remote) return undefined;
  try { return read()[id]?.pin ?? (Object.prototype.hasOwnProperty.call(DEFAULT_PINS, id) ? DEFAULT_PINS[id] : undefined); }
  catch { return undefined; }
}
// Único endpoint futuro. El servidor debe validar identidad, permisos y límites de intentos.
async function request(action: "check-available" | "set" | "verify" | "reveal", data: { campaignId?: string; pin?: string }) {
  const response = await api.post<{ ok: boolean; pin?: string }>("/campaigns/pin", { action, ...data });
  return response.data;
}
export function pinError(error: unknown): string {
  return error instanceof Error && !('response' in error) && error.message ? error.message : getApiError(error, "No se pudo procesar el PIN.");
}
export const campaignPins = {
  remote, localPin,
  async checkAvailable(ownerId: string, pin: string) {
    if (!/^\d{6}$/.test(pin)) throw new Error("El PIN debe tener exactamente 6 dígitos.");
    if (remote) { if (!(await request("check-available", { pin })).ok) throw new Error("PIN no disponible."); return; }
    if (Object.values(read()).some((entry) => entry.ownerId === ownerId && entry.pin === pin)) throw new Error("Ya usas ese PIN en otra campaña.");
    // Comprobar que el almacenamiento existe antes de publicar.
    localStorage.setItem(KEY, JSON.stringify(read()));
  },
  async set(campaignId: string, ownerId: string, pin: string) {
    if (!/^\d{6}$/.test(pin)) throw new Error("PIN inválido.");
    if (remote) { if (!(await request("set", { campaignId, pin })).ok) throw new Error("No se pudo guardar el PIN."); return; }
    const entries = read();
    localStorage.setItem(KEY, JSON.stringify({ ...entries, [campaignId]: { ownerId, pin } }));
  },
  async verify(campaignId: string, pin: string) {
    if (!/^\d{6}$/.test(pin)) return false;
    return remote ? (await request("verify", { campaignId, pin })).ok === true : localPin(campaignId) === pin;
  },
  async reveal(campaignId: string) {
    if (!remote) return localPin(campaignId);
    const result = await request("reveal", { campaignId });
    if (!result.ok) throw new Error("No autorizado para consultar el PIN.");
    return result.pin;
  },
};
