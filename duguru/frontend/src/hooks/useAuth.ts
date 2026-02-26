import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import * as authService from "../services/authService";
import type { RegisterPayload } from "../services/authService";

/**
 * useAuth — Hook que combina o store de autenticação com os serviços de API.
 *
 * Expõe: login, logout, register + estado do store (user, isAuthenticated).
 */
export function useAuth() {
  const { user, isAuthenticated, setUser, logout: clearStore } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string) => {
      const authUser = await authService.login(email, password);
      setUser(authUser);
      navigate("/");
    },
    [setUser, navigate],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const authUser = await authService.register(payload);
      setUser(authUser);
      navigate("/");
    },
    [setUser, navigate],
  );

  const logout = useCallback(async () => {
    await authService.logout().catch(() => null); // não bloquear mesmo em erro de rede
    clearStore();
    navigate("/boas-vindas");
  }, [clearStore, navigate]);

  return { user, isAuthenticated, login, logout, register };
}
