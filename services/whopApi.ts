// Whop-native API helper
// Uses Whop’s injected x-whop-user-token header automatically when embedded in Whop.
// Adds a mock token ONLY for local development.

const MOCK_TOKEN = "mock_dev_token_12345"; // local-dev only

// Detects whether we are running inside Whop iframe or local dev
const isLocalDev = import.meta.env.DEV || window.location.hostname === "localhost";

interface FetchApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
}

export const fetchApi = async <T = any>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> => {
  const { method = "GET", body, headers = {} } = options;

  // ✅ RELATIVE path only (so Whop can inject the token header)
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  // ⚙️ Only attach mock token in local dev
  if (isLocalDev) {
    (config.headers as Record<string, string>)["x-whop-user-token"] = MOCK_TOKEN;
  }

  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message || data?.error || res.statusText;
      console.error("API Error:", msg);
      if (typeof window !== "undefined") alert(`Error: ${msg}`);
      throw new Error(msg);
    }

    return data as T;
  } catch (err) {
    console.error("Fetch error:", err);
    throw err;
  }
};

// Specific API methods
export const whopApi = {
  bootstrap: (experienceId: string) =>
    fetchApi(`/api/bootstrap?experienceId=${encodeURIComponent(experienceId)}`),

  recordAction: (payload: {
    experienceId: string;
    actionType: string;
    xp: number;
  }) =>
    fetchApi("/api/actions/record", {
      method: "POST",
      body: payload,
    }),

  getMetrics: (companyId: string) =>
    fetchApi(`/api/admin/metrics?companyId=${encodeURIComponent(companyId)}`),
};
