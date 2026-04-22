"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import BoletaPage from "../boleta/page";
import FacturaPage from "../factura/page";

export default function BoletaFacturaElectronicaPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"boleta" | "factura">("boleta");

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Cabecera Unificada */}
      <div className="flex items-center justify-between mb-2 animate-in fade-in duration-500 py-2 rounded-xl ">
        <div className="flex items-center gap-4  ">
          <Button
            variant="ghost"
            onClick={() => router.push("/factunet/operaciones")}
            className="h-10 w-10 p-0 rounded-xl bg-gray-200 hover:bg-gray-300"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {tipo === "boleta" ? "Nueva Boleta de Venta" : "Nueva Factura Electrónica"}
            </h3>
            <p className="text-sm text-gray-500">
              Regresar a selección de comprobante
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <label htmlFor="tipo-comprobante" className="mr-3 font-semibold text-gray-700">
            Tipo:
          </label>
          <select
            id="tipo-comprobante"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "boleta" | "factura")}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue bg-white shadow-sm"
          >
            <option value="boleta">Boleta de Venta</option>
            <option value="factura">Factura Electrónica</option>
          </select>
        </div>
      </div>

      {/* Contenido Dinámico */}
      <div className="flex-1">
        {tipo === "boleta" ? <BoletaPage /> : <FacturaPage />}
      </div>
    </div>
  );
}
