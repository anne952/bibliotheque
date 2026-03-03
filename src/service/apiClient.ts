const API_URL = import.meta.env.VITE_API_URL || 'https://bibliotheque-backend-1.onrender.com';

const DEFAULT_API_BASE_URL = `${API_URL}/api`;

const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (baseUrl) {
    return baseUrl.replace(/\/$/, '');
  }

  return DEFAULT_API_BASE_URL.replace(/\/$/, '');
};

const getAuthToken = () => {
  return (
    localStorage.getItem('refreshToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    ''
  );
};

const clearAuthStorage = () => {
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('authUser');
};

const persistAuthSession = (payload: { refreshToken?: string; user?: unknown }) => {
  if (payload.refreshToken) {
    localStorage.setItem('refreshToken', payload.refreshToken);
    localStorage.setItem('authToken', payload.refreshToken);
  }

  if (payload.user) {
    localStorage.setItem('authUser', JSON.stringify(payload.user));
  }
};

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  target?: 'default' | 'render';
  skipOfflineQueue?: boolean;
};

const buildQueryString = (query?: ApiRequestOptions['query']) => {
  if (!query) return '';

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const raw = searchParams.toString();
  return raw ? `?${raw}` : '';
};

export const isApiNetworkError = (error: unknown) => {
  return error instanceof TypeError || (error instanceof Error && /Failed to fetch|NetworkError/i.test(error.message));
};

const isMutationMethod = (method: ApiRequestOptions['method']) => {
  return method === 'POST' || method === 'PUT' || method === 'DELETE';
};

const isQueueablePath = (path: string) => {
  return !path.startsWith('/auth/');
};

const buildApiError = (status: number, rawBody: string) => {
  let message = `Erreur API (${status})`;

  if (rawBody) {
    try {
      const errorBody = JSON.parse(rawBody) as { message?: string };
      message = errorBody?.message || rawBody;
    } catch {
      message = rawBody;
    }
  }

  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
};

const buildOfflineQueuedError = (path: string) => {
  const error = new Error(`Mode hors ligne: action en attente de synchronisation (${path}).`) as Error & {
    status?: number;
    offlineQueued?: boolean;
  };
  error.status = 202;
  error.offlineQueued = true;
  return error;
};

const enqueueOfflineAction = async (action: {
  method: 'POST' | 'PUT' | 'DELETE';
  path: string;
  data?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  target?: 'default' | 'render';
}) => {
  if (!window.api?.offlineQueue) return null;
  try {
    return await window.api.offlineQueue.enqueue(action);
  } catch {
    return null;
  }
};

const tryRefreshToken = async (baseUrl: string) => {
  const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    const payload = (await response.json()) as { refreshToken?: string; user?: unknown };
    if (!payload?.refreshToken) {
      return null;
    }

    persistAuthSession(payload);
    return payload.refreshToken;
  } catch {
    return null;
  }
};

const parseSuccessfulResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

export const apiClient = {
  async request<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', data, query, auth = true, target = 'default', skipOfflineQueue = false } = options;

    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const baseUrl = target === 'render' ? DEFAULT_API_BASE_URL : getApiBaseUrl();
    const url = `${baseUrl}${path}${buildQueryString(query)}`;
    const canQueue = isMutationMethod(method) && !skipOfflineQueue && isQueueablePath(path);

    if (canQueue && !navigator.onLine) {
      await enqueueOfflineAction({
        method,
        path,
        data,
        query,
        auth,
        target
      });
      throw buildOfflineQueuedError(path);
    }

    const makeRequest = async (tokenOverride?: string) => {
      const headers: Record<string, string> = { ...baseHeaders };

      if (auth) {
        const token = tokenOverride || getAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      return fetch(url, {
        method,
        headers,
        mode: 'cors',
        body: data !== undefined ? JSON.stringify(data) : undefined
      });
    };

    try {
      let response = await makeRequest();

      if (response.status === 401 && auth && path !== '/auth/refresh') {
        const refreshedToken = await tryRefreshToken(baseUrl);

        if (refreshedToken) {
          response = await makeRequest(refreshedToken);
        } else {
          clearAuthStorage();
          throw new Error('Session expiree. Veuillez vous reconnecter.');
        }
      }

      if (!response.ok) {
        const rawError = await response.text();
        throw buildApiError(response.status, rawError);
      }

      return parseSuccessfulResponse<T>(response);
    } catch (error) {
      if (canQueue && isApiNetworkError(error)) {
        await enqueueOfflineAction({
          method,
          path,
          data,
          query,
          auth,
          target
        });
        throw buildOfflineQueuedError(path);
      }

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error(`Network error calling ${method} ${url}`, error);
        throw new Error(`Impossible de se connecter a l'API (${url}). Verifiez votre connexion Internet.`);
      }
      throw error;
    }
  }
};

