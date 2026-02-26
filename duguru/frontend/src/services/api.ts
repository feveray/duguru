import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../stores/authStore";

/* ─── Access token — armazenado APENAS em memória (nunca no DOM) ─── */

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

/* ─── Instância axios ─────────────────────────────────────────────── */

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  withCredentials: true, // envia o cookie HttpOnly do refresh token automaticamente
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15_000,
});

/* ─── Interceptor de requisição: injeta Bearer token ─────────────── */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_accessToken) {
      config.headers["Authorization"] = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

/* ─── Interceptor de resposta: refresh silencioso em 401 ─────────── */

// Flag interna para evitar loop infinito de refresh
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let _isRefreshing = false;
type SubscriberCallback = (token: string) => void;
let _refreshSubscribers: SubscriberCallback[] = [];

function subscribeTokenRefresh(cb: SubscriberCallback): void {
  _refreshSubscribers.push(cb);
}

function notifySubscribers(token: string): void {
  _refreshSubscribers.forEach((cb) => { cb(token); });
  _refreshSubscribers = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalConfig = error.config as RetryableConfig | undefined;

    // Não tenta refresh para a própria rota de refresh
    const isRefreshRoute = originalConfig?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalConfig?._retry &&
      !isRefreshRoute
    ) {
      if (_isRefreshing) {
        // Outra requisição já está fazendo o refresh — aguarda o novo token
        return new Promise<AxiosResponse>((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            if (!originalConfig) {
              reject(error);
              return;
            }
            originalConfig.headers["Authorization"] = `Bearer ${newToken}`;
            resolve(api(originalConfig));
          });
        });
      }

      if (originalConfig) originalConfig._retry = true;
      _isRefreshing = true;

      try {
        // O cookie HttpOnly com o refresh token é enviado automaticamente
        const { data } = await api.post<{ accessToken: string }>(
          "/auth/refresh",
        );

        const newToken = data.accessToken;
        setAccessToken(newToken);
        notifySubscribers(newToken);

        if (originalConfig) {
          originalConfig.headers["Authorization"] = `Bearer ${newToken}`;
          return api(originalConfig);
        }
      } catch (refreshError: unknown) {
        // Refresh falhou — desloga e redireciona para /boas-vindas
        setAccessToken(null);
        useAuthStore.getState().logout();
        window.location.href = "/boas-vindas";
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/* ─── Helpers tipados ─────────────────────────────────────────────── */

/** Extrai `data` de uma resposta axios de forma segura. */
export function unwrap<T>(response: AxiosResponse<T>): T {
  return response.data;
}

export default api;
