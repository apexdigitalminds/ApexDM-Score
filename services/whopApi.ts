// Whop-native API helper
// Automatically includes x-whop-user-token header from Whop iframe context

const MOCK_TOKEN = 'mock_dev_token_12345'; // For local development only

// Get Whop user token from iframe context or use mock for local dev
const getWhopUserToken = (): string => {
  // In production, Whop injects this automatically
  // For now, check if we're in development mode
  if (import.meta.env.DEV) {
    console.warn('⚠️ Missing Whop token — using mock user for local dev.');
    return MOCK_TOKEN;
  }

  // In production Whop iframe, the token should be available
  // This will be automatically provided by Whop's SDK/iframe
  return MOCK_TOKEN; // Fallback for now
};

interface FetchApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export const fetchApi = async <T = any>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> => {
  const { method = 'GET', body, headers = {} } = options;

  const whopToken = getWhopUserToken();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-whop-user-token': whopToken,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json();

    if (!response.ok || data.ok === false) {
      const errorMessage = data.message || data.error || 'An error occurred';
      console.error('API Error:', errorMessage);

      // Show error toast (you can replace this with your toast library)
      if (typeof window !== 'undefined') {
        alert(`Error: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Specific API methods for clarity
export const whopApi = {
  // Bootstrap user profile
  bootstrap: (experienceId: string) =>
    fetchApi(`/api/bootstrap?experienceId=${experienceId}`),

  // Record user action/XP
  recordAction: (payload: {
    experienceId: string;
    actionType: string;
    xp: number;
  }) =>
    fetchApi('/api/actions/record', {
      method: 'POST',
      body: payload,
    }),

  // Admin analytics
  getMetrics: (companyId: string) =>
    fetchApi(`/api/admin/metrics?companyId=${companyId}`),
};
