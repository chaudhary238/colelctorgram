const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function storeTokens(access: string, refresh: string) {
  localStorage.setItem("ch_access_token", access);
  localStorage.setItem("ch_refresh_token", refresh);
  // Write refresh token as a cookie so proxy.ts can see the session (30-day TTL)
  document.cookie = `ch_refresh_token=${refresh}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearTokens() {
  localStorage.removeItem("ch_access_token");
  localStorage.removeItem("ch_refresh_token");
  document.cookie = "ch_refresh_token=; path=/; max-age=0";
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ch_access_token");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Attempt token refresh
    const refresh = localStorage.getItem("ch_refresh_token");
    if (refresh) {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (refreshRes.ok) {
        const { access_token, refresh_token } = await refreshRes.json();
        storeTokens(access_token, refresh_token);
        return apiFetch<T>(path, options); // retry
      }
    }
    clearTokens();
    window.location.href = "/auth/signin";
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
