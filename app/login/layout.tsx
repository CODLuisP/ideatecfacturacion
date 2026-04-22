import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Accede a FactuNet, tu sistema de facturación electrónica en Perú. Ingresa al portal para emitir tus facturas, boletas y notas 100% validado por SUNAT.",
  alternates: {
    canonical: "https://factunet.pe/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
