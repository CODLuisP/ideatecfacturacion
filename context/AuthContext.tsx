"use client";
import { createContext, useContext, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";

export interface AuthUser {
  id: string;
  username: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  ruc: string;
  razonSocial: string;
  imagen: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id ?? "",
        username: session.user.username ?? "",
        nombreCompleto: session.user.name ?? "",
        email: session.user.email ?? "",
        rol: session.user.rol ?? "",
        ruc: session.user.ruc ?? "",
        razonSocial: session.user.razonSocial ?? "",
        imagen: session.user.imagen ?? null,
      }
    : null;

  const logout = () => signOut({ callbackUrl: "/login" });

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: session?.accessToken ?? null,
        refreshToken: session?.refreshToken ?? null,
        isAuthenticated: status === "authenticated",
        isLoading: status === "loading",
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
