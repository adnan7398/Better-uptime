export type Monitor = {
  id: string;
  org_id: string;
  created_by: string;
  url: string;
  name: string | null;
  type: "HTTP" | "TCP";
  interval_seconds: number;
  last_status: "Up" | "Down" | "Unknown" | null;
  last_status_at: string | null;
  created_at: string;
  updated_at: string;
  checks?: MonitorCheck[];
};

export type MonitorCheck = {
  createdAt: string;
  response_time_ms: number;
  status: "Up" | "Down" | "Unknown";
};

export type UptimeResult = Record<string, number | null>;

async function apiFetch<T>(
  path: string,
  baseUrl: string,
  token: string | null,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Server components (docker-network hostname)
export function serverApi(token: string | null) {
  const baseUrl = process.env.API_INTERNAL_URL || "http://localhost:3001";
  return {
    listMonitors: () => apiFetch<Monitor[]>("/monitors", baseUrl, token),
    getMonitor: (id: string) => apiFetch<Monitor>(`/monitors/${id}`, baseUrl, token),
    getChecks: (id: string, window = "24h") =>
      apiFetch<MonitorCheck[]>(`/monitors/${id}/checks?window=${window}`, baseUrl, token),
    getUptime: (id: string, windows = "24h,7d,30d") =>
      apiFetch<UptimeResult>(`/monitors/${id}/uptime?windows=${windows}`, baseUrl, token)
  };
}

// Client components (published port)
export function clientApi(token: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return {
    createMonitor: (input: { url: string; name?: string; interval_seconds?: number }) =>
      apiFetch<Monitor>("/monitors", baseUrl, token, {
        method: "POST",
        body: JSON.stringify(input)
      }),
    deleteMonitor: (id: string) =>
      apiFetch<{ id: string }>(`/monitors/${id}`, baseUrl, token, { method: "DELETE" })
  };
}
