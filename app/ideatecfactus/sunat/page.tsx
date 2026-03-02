"use client";
import React from 'react';
import { Zap, CheckCircle2, FileJson, AlertCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Modal } from '@/app/components/ui/Modal';
import { cn } from '@/app/utils/cn';

export default function SunatPage() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [certPassword, setCertPassword] = React.useState('');

  const handleRefresh = () => {
    showToast('Sincronizando con servidores de SUNAT...', 'info');
    setTimeout(() => {
      showToast('Sincronización completada', 'success');
    }, 1500);
  };

  const handleUploadCert = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Certificado digital actualizado correctamente', 'success');
    setIsModalOpen(false);
    setCertPassword('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleRefresh}><Zap className="w-4 h-4" /> Sincronizar Ahora</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Estado de Conexión SUNAT" subtitle="Monitoreo de servicios OSE/PSE">
          <div className="flex items-center gap-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="p-4 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
              <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-emerald-900">Servicio Operativo</h4>
              <p className="text-sm text-emerald-700">La conexión con los servidores de SUNAT es estable. Tiempo de respuesta: 120ms.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { label: 'CDR Recibidos', value: '1,245', icon: CheckCircle2, color: 'text-emerald-600' },
              { label: 'XML Generados', value: '1,245', icon: FileJson, color: 'text-blue-600' },
              { label: 'Errores Envío', value: '0', icon: AlertCircle, color: 'text-gray-400' },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <stat.icon className={cn("w-5 h-5 mb-2", stat.color)} />
                <p className="text-xs font-bold text-gray-500 uppercase">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Certificado Digital" subtitle="Validación y vigencia">
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-800 uppercase">Vigencia</span>
                <Badge variant="warning">Próximo a vencer</Badge>
              </div>
              <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[85%]" />
              </div>
              <p className="text-xs text-amber-700">Expira el <strong>05 de Junio, 2024</strong> (en 15 días).</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Detalles del Certificado</p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Emisor:</span> <span className="font-medium">Llama.pe SAC</span></div>
                <div className="flex justify-between"><span className="text-gray-500">RUC:</span> <span className="font-medium">20601234567</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tipo:</span> <span className="font-medium">PFX / P12</span></div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setIsModalOpen(true)}>Actualizar Certificado</Button>
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Actualizar Certificado Digital">
        <form className="space-y-4" onSubmit={handleUploadCert}>
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 hover:border-brand-blue transition-colors cursor-pointer bg-gray-50/50">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <FileJson className="w-8 h-8 text-brand-blue" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Selecciona tu archivo .pfx o .p12</p>
              <p className="text-xs text-gray-500 mt-1">O arrastra y suelta el archivo aquí</p>
            </div>
            <input type="file" className="hidden" accept=".pfx,.p12" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña del Certificado</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Ingresa la clave del certificado"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                required
              />
              <ShieldCheck className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic">Esta contraseña es necesaria para firmar digitalmente tus comprobantes.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Cargar Certificado</Button>
          </div>
        </form>
      </Modal>

      <Card title="Historial de Envíos (CDR)" subtitle="Últimos documentos procesados por SUNAT">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Envío</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket SUNAT</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado CDR</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">XML / CDR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { id: 'F001-0000123', date: '20/05/2024 14:20', ticket: '2024052012345', status: 'Aceptado' },
                { id: 'F001-0000122', date: '20/05/2024 12:15', ticket: '2024052012344', status: 'Aceptado' },
                { id: 'B001-0000456', date: '19/05/2024 18:30', ticket: '2024051998765', status: 'Aceptado' },
              ].map((env, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-brand-blue">{env.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{env.date}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-400">{env.ticket}</td>
                  <td className="px-6 py-4"><Badge variant="success">{env.status}</Badge></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Descargar XML"><FileJson className="w-4 h-4" /></button>
                      <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Descargar CDR"><ShieldCheck className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}