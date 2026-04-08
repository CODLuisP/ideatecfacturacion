"use client";
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle, Plus, Truck, Receipt, ReceiptText } from 'lucide-react';

const documentTypes = [
  { title: 'Factura Electrónica', desc: 'Para empresas y negocios con RUC (con derecho a crédito fiscal).', icon: ReceiptText,    href: '/ideatecfactus/operaciones/factura'},
  { title: 'Boleta de Venta',     desc: 'Para personas naturales y consumidores finales sin RUC.',          icon: FileText,    href: '/ideatecfactus/operaciones/boleta'       },
  { title: 'Nota de Crédito',     desc: 'Para anular o modificar comprobantes emitidos previamente.',       icon: AlertCircle, href: '/ideatecfactus/operaciones/nota-credito' },
  { title: 'Nota de Débito',      desc: 'Para aumentar el valor de un comprobante emitido previamente.',    icon: Plus,        href: '/ideatecfactus/operaciones/nota-debito'  },
  { title: 'Guía de Remisión',    desc: 'Para sustentar el traslado de bienes a nivel nacional.',           icon: Truck,       href: '/ideatecfactus/operaciones/guia-remision'},
];

export default function EmisionPage() {
  const router = useRouter();

  return (
    <div className="mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">¿Qué comprobante deseas emitir?</h2>
        <p className="text-gray-500">Selecciona el tipo de documento para comenzar el proceso de emisión.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {documentTypes.map((item, i) => (
          <button
            key={i}
            onClick={() => router.push(item.href)}
            className="group p-8 bg-white rounded-2xl border-2 border-transparent hover:border-brand-blue shadow-sm hover:shadow-md transition-all text-left flex gap-6 items-start"
          >
            <div className="p-4 rounded-xl bg-blue-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
              <item.icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}