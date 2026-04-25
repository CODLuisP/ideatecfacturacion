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
  igv: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  setEnvironment: (env: string) => void;
  refreshLogo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();
  const [igvOverride, setIgvOverride] = useState<number | null>(null);
  const [environmentOverride, setEnvironmentOverride] = useState<string | null>(
    null,
  );
  const [logoOverride, setLogoOverride] = useState<string | null>(null);

  const fetchCompanyData = useCallback(
    async (ruc: string, token: string | null) => {
      try {
        const r = await fetch(`http://localhost:5004/api/companies/${ruc}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        const data = await r.json();
        if (data?.environment) setEnvironmentOverride(data.environment);
        if (data?.igv !== undefined) setIgvOverride(data.igv);
        setLogoOverride(data?.logoBase64 ?? null);
      } catch {
        // falla silenciosamente
      }
    },
    [],
  );

  useEffect(() => {
    const ruc = session?.user?.ruc;
    const token = session?.accessToken ?? null;
    if (!ruc || status !== "authenticated") return;
    fetchCompanyData(ruc, token);
  }, [session?.user?.ruc, session?.accessToken, status, fetchCompanyData]);

  const refreshLogo = useCallback(async () => {
    const ruc = session?.user?.ruc;
    const token = session?.accessToken ?? null;
    if (!ruc) return;
    await fetchCompanyData(ruc, token);
  }, [session?.user?.ruc, session?.accessToken, fetchCompanyData]);

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
      environment: environmentOverride ?? session.user.environment ?? null,
      logoBase64: logoOverride,
      igv: igvOverride ?? session.user.igv ?? 18, // 👈 agregar
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
    logoOverride,
    igvOverride,
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
      refreshLogo,
    }),
    [
      user,
      session?.accessToken,
      session?.refreshToken,
      status,
      logout,
      setEnvironment,
      refreshLogo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
