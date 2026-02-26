import { api, setAccessToken, unwrap } from "./api";

/* ─── Types ──────────────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  sunSign: string | null;
  ascendant: string | null;
  onboardingDone: boolean;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  birthDate: string;      // "YYYY-MM-DD"
  birthTime?: string | null; // "HH:MM"
  birthCity: string;
  birthCountry: string;
  birthLat: number;
  birthLon: number;
  timezone: string;
}

/* ─── Auth service ───────────────────────────────────────────── */

/**
 * register — Cadastra novo usuário e armazena access token em memória.
 */
export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const data = unwrap(await api.post<AuthResponse>("/auth/register", payload));
  setAccessToken(data.accessToken);
  return data.user;
}

/**
 * login — Autentica com e-mail e senha.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const data = unwrap(await api.post<AuthResponse>("/auth/login", { email, password }));
  setAccessToken(data.accessToken);
  return data.user;
}

/**
 * logout — Revoga refresh token no servidor e limpa estado local.
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

/**
 * refreshTokens — Troca o refresh token (cookie HttpOnly) por um novo access token.
 * Chamado automaticamente pelo interceptor de 401 da api.ts.
 */
export async function refreshTokens(): Promise<string> {
  const data = unwrap(await api.post<{ accessToken: string }>("/auth/refresh"));
  setAccessToken(data.accessToken);
  return data.accessToken;
}

/**
 * forgotPassword — Solicita e-mail de recuperação de senha.
 */
export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

/**
 * resetPassword — Define nova senha com o token do e-mail.
 */
export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post("/auth/reset-password", { token, password });
}

/**
 * getMe — Busca dados do usuário autenticado.
 */
export async function getMe(): Promise<AuthUser> {
  const data = unwrap(await api.get<{ user: AuthUser }>("/auth/me"));
  return data.user;
}
