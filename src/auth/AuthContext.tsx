import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  getApiBaseUrl,
  initApi,
  persistApiUrl,
  persistToken,
  setUnauthorizedHandler,
} from "../api/client";
import type { AuthResponse, UserDTO } from "../types";

type AuthContextValue = {
  user: UserDTO | null;
  loading: boolean;
  apiUrl: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateApiUrl: (url: string) => Promise<string>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const config = await initApi();
        if (!active) return;
        setApiUrl(config.apiUrl);

        if (!config.token) return;

        try {
          const me = await api.get<UserDTO>("/auth/me");
          if (active) setUser(me);
        } catch {
          await persistToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return setUnauthorizedHandler(() => {
      queryClient.clear();
      setUser(null);
    });
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>("/auth/login", { email, password });
    await persistToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await persistToken(null);
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const updateApiUrl = useCallback(
    async (value: string) => {
      const previous = getApiBaseUrl();
      const next = await persistApiUrl(value);
      setApiUrl(next);

      if (next !== previous) {
        await persistToken(null);
        queryClient.clear();
        setUser(null);
      }

      return next;
    },
    [queryClient],
  );

  const refreshUser = useCallback(async () => {
    const me = await api.get<UserDTO>("/auth/me");
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ user, loading, apiUrl, login, logout, updateApiUrl, refreshUser }),
    [user, loading, apiUrl, login, logout, updateApiUrl, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
