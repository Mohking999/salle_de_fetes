export const AUTH_USER_KEY = "auth_user";

type AuthUser = {
  email: string;
  name?: string;
  authenticatedAt: number;
};

export function readAuthSession(): AuthUser | null {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (
      !parsed ||
      typeof parsed.email !== "string" ||
      !parsed.email.trim() ||
      typeof parsed.authenticatedAt !== "number"
    ) {
      return null;
    }

    return {
      email: parsed.email.trim(),
      name: typeof parsed.name === "string" ? parsed.name.trim() || parsed.email.trim() : parsed.email.trim(),
      authenticatedAt: parsed.authenticatedAt,
    };
  } catch {
    return null;
  }
}

export function writeAuthSession(email: string, name?: string) {
  if (typeof window === "undefined" || !window.localStorage) return;

  const normalizedEmail = email.trim();
  if (!normalizedEmail) return;

  const payload: AuthUser = {
    email: normalizedEmail,
    name: name && name.trim() ? name.trim() : normalizedEmail,
    authenticatedAt: Date.now(),
  };

  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload));
}

export function clearAuthSession() {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(AUTH_USER_KEY);
}
