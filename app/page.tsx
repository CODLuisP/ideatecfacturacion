import LoginClient from './components/LoginClient';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión | FactuFly",
  description: "Accede a FactuFly, tu sistema de facturación electrónica en Perú. Ingresa al portal para emitir tus facturas, boletas y notas 100% validado por SUNAT.",
  alternates: {
    canonical: "https://factufly.pe/",
  },
};

export default function Home() {
  return <LoginClient />;
}