export const PASSWORD_RULES = [
  { id: "length", label: "Entre 8 y 16 caracteres", test: (p: string) => p.length >= 8 && p.length <= 16 },
  { id: "upper", label: "Al menos 1 letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Al menos 1 número", test: (p: string) => /[0-9]/.test(p) },
  {
    id: "special",
    label: "Al menos 1 carácter especial (! @ # $ % …)",
    test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
] as const;

export const PASSWORD_ERROR =
  "La contraseña debe tener 8-16 caracteres, 1 mayúscula, 1 número y 1 carácter especial.";

export function isValidPassword(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
