import LoginClient from '../components/LoginClient';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso Beta | FactuFly",
  description: "Ambiente de pruebas de FactuFly. Accede al sistema en modo beta para pruebas y desarrollo.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BetaLoginPage() {
  return <LoginClient />;
}
