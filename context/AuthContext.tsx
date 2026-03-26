"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useSession, signOut } from "next-auth/react";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  rol: string;
  ruc: string;
  sucursalID: string | null;
  nombreSucursal: string | null;
  nombreEmpresa: string | null;
  environment: string | null;
  logoBase64: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  setEnvironment: (env: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();

  // Override que persiste el environment real (no el de la sesión de login)
  const [environmentOverride, setEnvironmentOverride] = useState<string | null>(null);
  const [logoOverride, setLogoOverride] = useState<string | null>(null);  

  // Al autenticarse, fetch del environment real desde el backend
  // Esto corrige el bug: la sesión next-auth guarda el environment del momento
  // del login, pero el usuario pudo haberlo cambiado después.
  useEffect(() => {
    const ruc = session?.user?.ruc;
    if (!ruc || status !== "authenticated") return;

    fetch(`http://localhost:5004/api/companies/${ruc}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.environment) setEnvironmentOverride(data.environment);
        if (data?.logoBase64) setLogoOverride(data.logoBase64); 
      })
      .catch(() => {
        // Si falla, se usa el valor de la sesión como fallback silencioso
      });
  }, [session?.user?.ruc, status]);

  const user: AuthUser | null = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id ?? "",
      username: session.user.username ?? "",
      email: session.user.email ?? "",
      rol: session.user.rol ?? "",
      ruc: session.user.ruc ?? "",
      sucursalID: session.user.sucursalID ?? null,
      nombreSucursal: session.user.nombreSucursal ?? null,
      nombreEmpresa: session.user.nombreEmpresa ?? null,
      // environmentOverride (del backend) tiene prioridad sobre la sesión
      environment: environmentOverride ?? session.user.environment ?? null,
      logoBase64: logoOverride ?? null,  // 👈
    };
  }, [
    session?.user?.id,
    session?.user?.username,
    session?.user?.email,
    session?.user?.rol,
    session?.user?.ruc,
    session?.user?.sucursalID,
    session?.user?.environment,
    environmentOverride,
    logoOverride
  ]);

  const logout = useCallback(() => signOut({ callbackUrl: "/login" }), []);

  const setEnvironment = useCallback((env: string) => {
    setEnvironmentOverride(env);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken: session?.accessToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      logout,
      setEnvironment,
    }),
    [user, session?.accessToken, session?.refreshToken, status, logout, setEnvironment],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}