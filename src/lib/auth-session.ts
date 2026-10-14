export const AUTH_USER_KEY = "auth_user";

type AuthUser = {
  email: string;
  name?: string;
  authenticatedAt: number;
  signature: string;
};

function createSessionSignature(email: string, authenticatedAt: number) {
  const { email: configuredEmail, password: configuredPassword, isConfigured } =
    getConfiguredAdminCredentials();

  if (!isConfigured) {
    return null;
  }

  const seed = `${configuredEmail}:${configuredPassword}:${email.trim().toLowerCase()}:${authenticatedAt}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export function getConfiguredAdminCredentials() {
  const email = (import.meta.env.VITE_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = (import.meta.env.VITE_ADMIN_PASSWORD ?? "").trim();

  return {
    email,
    password,
    isConfigured: Boolean(email && password),
  };
}

export function validateCredentials(email: string, password: string) {
  const { email: configuredEmail, password: configuredPassword, isConfigured } =
    getConfiguredAdminCredentials();

  if (!isConfigured) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  return (
    normalizedEmail === configuredEmail &&
    normalizedPassword === configuredPassword
  );
}

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
      typeof parsed.authenticatedAt !== "number" ||
      !Number.isFinite(parsed.authenticatedAt) ||
      typeof parsed.signature !== "string" ||
      !parsed.signature.trim()
    ) {
      return null;
    }

    const expectedSignature = createSessionSignature(parsed.email, parsed.authenticatedAt);
    if (!expectedSignature || expectedSignature !== parsed.signature.trim()) {
      return null;
    }

    return {
      email: parsed.email.trim(),
      name:
        typeof parsed.name === "string"
          ? parsed.name.trim() || parsed.email.trim()
          : parsed.email.trim(),
      authenticatedAt: parsed.authenticatedAt,
      signature: parsed.signature.trim(),
    };
  } catch {
    return null;
  }
}

export function writeAuthSession(email: string, name?: string) {
  if (typeof window === "undefined" || !window.localStorage) return;

  const normalizedEmail = email.trim();
  if (!normalizedEmail) return;

  const authenticatedAt = Date.now();
  const signature = createSessionSignature(normalizedEmail, authenticatedAt);
  if (!signature) return;

  const payload: AuthUser = {
    email: normalizedEmail,
    name: name && name.trim() ? name.trim() : normalizedEmail,
    authenticatedAt,
    signature,
  };

  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload));
}

export function clearAuthSession() {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(AUTH_USER_KEY);
}
