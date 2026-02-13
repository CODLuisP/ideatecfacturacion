import "next-auth";

declare module "next-auth" {
  interface User {
    username?: string;
    rol?: string;
    ruc?: string;
    razonSocial?: string;
    imagen?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      username?: string;
      rol?: string;
      ruc?: string;
      razonSocial?: string;
      imagen?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    rol?: string;
    ruc?: string;
    razonSocial?: string;
    imagen?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}