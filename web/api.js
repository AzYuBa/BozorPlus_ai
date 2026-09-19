/* Bozor-Puls.Ai API client — Stage 1 */
(function () {
  const TOKEN_KEY = "bp_access";
  const REFRESH_KEY = "bp_refresh";
  const USER_KEY = "bp_user";

  function apiBase() {
    return (window.BP_API || "http://127.0.0.1:8000").replace(/\/$/, "");
  }

  function getAccess() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function getRefresh() {
    return localStorage.getItem(REFRESH_KEY) || 
  }

  function setSession(data) {
    if (data.access) localStorage.setItem(TOKEN_KEY, data.access);
    if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
    if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function currentUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }

  function isAuthed() {
    return Boolean(getAccess());
  }

  async function refreshAccess() {
    const refresh = getRefresh();
    if (!refresh) throw new Error("Sessiya tugagan");
    const res = await fetch(apiBase() + "/api/v1/auth/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      clearSession();
      throw new Error(data?.error?.message || "Sessiya yangilanmadi");
    }
    localStorage.setItem(TOKEN_KEY, data.access);
    if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
    return data.access;
  }

  async function api(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    let token = getAccess();
    if (token) headers.Authorization = "Bearer " + token;

    let res = await fetch(apiBase() + path, { ...opts, headers });
    if (res.status === 401 && getRefresh() && !opts._retried) {
      try {
        token = await refreshAccess();
        headers.Authorization = "Bearer " + token;
        res = await fetch(apiBase() + path, { ...opts, headers, _retried: true });
      } catch {
        clearSession();
      }
    }

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: { message: text || res.statusText } };
    }
    if (!res.ok) {
      const msg = data?.error?.message || data?.detail || res.statusText || "Xato";
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  window.BP = {
    api,
    setSession,
    clearSession,
    currentUser,
    isAuthed,
    getAccess,
  };
})();
