// Whop-native API helper

// -------------------------------------
// Basic fetch wrapper
// -------------------------------------
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

  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = (data as any)?.message || (data as any)?.error || res.statusText;
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

// -------------------------------------
// Specific API methods
// -------------------------------------
export const whopApi = {
  // 🔹 Start Whop OAuth, returns the redirect URL as a string
  authorize: async (): Promise<string> => {
    // If your backend returns { url: string }, adjust accordingly:
    const result = await fetchApi<string | { url: string }>("/api/whop/authorize");
    if (typeof result === "string") return result;
    return (result as any).url;
  },

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

