export const TOKEN_STORAGE_KEY = "jobb-service-token";
export const USER_STORAGE_KEY = "jobb-service-user";

export type StoredUser = {
  userId: number;
  name: string;
  email: string;
  role: string;
};

const AUTH_EVENT = "jobb-auth-change";

export function saveAuth(token?: string, user?: StoredUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof token === "string" && token.length > 0) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export function readStoredUser():
  | { token: string | null; user: StoredUser | null }
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);

  if (!token && !raw) {
    return { token: null, user: null };
  }

  try {
    const parsed = raw ? (JSON.parse(raw) as StoredUser) : null;
    return { token, user: parsed };
  } catch {
    return { token, user: null };
  }
}

export function subscribeAuthChange(handler: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_EVENT, handler);
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
  };
}
