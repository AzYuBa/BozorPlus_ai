const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function getToken() {
  return localStorage.getItem("bp_token") || "";
}

export function setAuth(data: { access: string; user: unknown }) {
  localStorage.setItem("bp_token", data.access);
  localStorage.setItem("bp_user", JSON.stringify(data.user));
}

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("bp_user") || "null");
  } catch {
    return null;
  }
}

export async function api(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers as Record<string, string>),
  };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    throw new Error(data?.detail || res.statusText);
  }
  return data;
}

export const som = (n?: number | string | null) => {
  if (n === undefined || n === null || n === "") return "—";
  const x = Number(n);
  if (Number.isNaN(x)) return String(n);
  return x.toLocaleString("uz-UZ") + " so'm";
};
