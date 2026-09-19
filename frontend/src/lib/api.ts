const API = import.meta.env.VITE_API_URL || "";

export type Role = "business" | "forwarder";

export type User = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  business?: {
    business_name: string;
    region: string;
    activity: string;
    market: string;
  } | null;
  forwarder?: {
    vehicle: string;
    capacity: string;
    region: string;
  } | null;
};

export type Note = {
  id: number;
  type: "in" | "out";
  name: string;
  amount: number;
  date: string;
  category: string;
};

export type Instrument = {
  slug: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  price: number;
  change_pct: number;
  region: string;
  market: string;
  yahoo_symbol: string;
  source: string;
  as_of: string | null;
  proxy_note?: string;
};

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

function setSession(data: { access?: string; refresh?: string; user?: User }) {
  if (data.access) localStorage.setItem("bp_access", data.access);
  if (data.refresh) localStorage.setItem("bp_refresh", data.refresh);
  if (data.user) localStorage.setItem("bp_user", JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem("bp_access");
  localStorage.removeItem("bp_refresh");
  localStorage.removeItem("bp_user");
}

export function currentUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem("bp_user") || "null");
  } catch {
    return null;
  }
}

export function getAccess() {
  return localStorage.getItem("bp_access") || "";
}

async function refreshAccess() {
  const refresh = localStorage.getItem("bp_refresh");
  if (!refresh) throw new Error("Sessiya tugagan");
  const res = await fetch(`${API}/api/v1/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const data = await res.json();
  if (!res.ok) {
    clearSession();
    throw new Error(data?.error?.message || "Sessiya yangilanmadi");
  }
  localStorage.setItem("bp_access", data.access);
  if (data.refresh) localStorage.setItem("bp_refresh", data.refresh);
  return data.access as string;
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers as Record<string, string>),
  };
  let token = getAccess();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${API}${path}`, { ...opts, headers });
  if (res.status === 401 && localStorage.getItem("bp_refresh")) {
    try {
      token = await refreshAccess();
      headers.Authorization = `Bearer ${token}`;
      res = await fetch(`${API}${path}`, { ...opts, headers });
    } catch {
      clearSession();
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.detail || res.statusText);
  }
  return data as T;
}

export async function register(body: Record<string, unknown>) {
  const data = await api<{ access: string; refresh: string; user: User }>("/api/v1/auth/register/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setSession(data);
  return data;
}

export async function login(email: string, password: string) {
  const data = await api<{ access: string; refresh: string; user: User }>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSession(data);
  return data;
}

export async function logout() {
  const refresh = localStorage.getItem("bp_refresh");
  try {
    if (refresh) {
      await api("/api/v1/auth/logout/", { method: "POST", body: JSON.stringify({ refresh }) });
    }
  } finally {
    clearSession();
  }
}

export const som = (n?: number | null) => {
  if (n === undefined || n === null) return "—";
  return Number(n).toLocaleString("uz-UZ") + " so'm";
};
