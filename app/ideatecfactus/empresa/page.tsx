"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Building2, MapPin, Phone, Upload, X, User, ChevronDown, Loader2 } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type Regimen = '0' | '1' | '2' | '3';

interface EmpresaForm {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  regimen: Regimen;
  // Ubicación
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  ubigeo: string;
  urbanizacion: string;
  // Contacto
  telefono: string;
  email: string;
  // Representante
  repLegal: string;
  repLegalDni: string;
}

interface SeriesForm {
  serieFactura: string;
  correlativoFactura: number;
  serieBoleta: string;
  correlativoBoleta: number;
  serieNotaCredito: string;
  correlativoNotaCredito: number;
  serieNotaDebito: string;
  correlativoNotaDebito: number;
  serieGuia: string;
  correlativoGuia: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEPARTAMENTOS = [
  'Amazonas','Áncash','Apurímac','Arequipa','Ayacucho','Cajamarca','Callao',
  'Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad','Lambayeque',
  'Lima','Loreto','Madre de Dios','Moquegua','Pasco','Piura','Puno',
  'San Martín','Tacna','Tumbes','Ucayali',
];


// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
      {children}
      {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hint?: string;
}
function Input({ label, required, hint, disabled, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        required={required}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2.5 border rounded-xl outline-none text-sm transition-colors',
          disabled
            ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-white border-gray-200 focus:border-brand-blue',
          className
        )}
        {...props}
      />
      {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  hint?: string;
  options: { value: string; label: string }[];
}
function Select({ label, required, hint, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          required={required}
          className={cn(
            'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm appearance-none transition-colors',
            className
          )}
          {...props}
        >
          <option value="">— Seleccionar —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
      <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
        <Icon className="w-4 h-4 text-brand-blue" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: () => void; label: string; desc: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div>
        <p className="font-bold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={cn('w-10 h-5 rounded-full relative transition-colors', checked ? 'bg-brand-blue' : 'bg-gray-200')}
      >
        <div className={cn('absolute top-1 w-3 h-3 bg-white rounded-full transition-all', checked ? 'right-1' : 'left-1')} />
      </button>
    </div>
  );
}

function LogoUploader({ logo, onLogo }: { logo: string; onLogo: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    onLogo(url);
  };

  return (
    <div className="md:col-span-2 flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <div
        className={cn(
          'w-24 h-24 bg-white rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors',
          dragging ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        onClick={() => ref.current?.click()}
      >
        {logo ? (
          <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
        ) : (
          <Upload className="w-6 h-6 text-gray-300" />
        )}
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 text-xs" type="button" onClick={() => ref.current?.click()}>
            <Upload className="w-3.5 h-3.5" /> Subir Logo
          </Button>
          {logo && (
            <Button variant="outline" className="h-9 text-xs" type="button" onClick={() => onLogo('')}>
              <X className="w-3.5 h-3.5" /> Quitar
            </Button>
          )}
        </div>
        <p className="text-[10px] text-gray-400">
          JPG, PNG, SVG o WEBP. Máximo 2MB.<br />
          Se mostrará en tus comprobantes electrónicos.
        </p>
      </div>
    </div>
  );
}

// ─── Serie Row ────────────────────────────────────────────────────────────────
function SerieRow({
  label,
  serieKey,
  correlativoKey,
  series,
  setSeries,
  prefix,
  hint,
}: {
  label: string;
  serieKey: keyof SeriesForm;
  correlativoKey: keyof SeriesForm;
  series: SeriesForm;
  setSeries: React.Dispatch<React.SetStateAction<SeriesForm>>;
  prefix: string;
  hint: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <div className="space-y-1.5">
          <FieldLabel>{label} — Serie</FieldLabel>
          <input
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-brand-blue bg-white transition-colors"
            value={series[serieKey] as string}
            onChange={(e) => setSeries((s) => ({ ...s, [serieKey]: e.target.value }))}
            placeholder={hint}
            maxLength={4}
          />
          <p className="text-[10px] text-gray-400 italic">Empieza con "{prefix}" — máx. 4 caracteres</p>
        </div>
      </div>
      <div className="w-36">
        <div className="space-y-1.5">
          <FieldLabel>Correlativo inicial</FieldLabel>
          <input
            type="number"
            min={1}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-brand-blue bg-white transition-colors"
            value={series[correlativoKey] as number}
            onChange={(e) => setSeries((s) => ({ ...s, [correlativoKey]: Math.max(1, parseInt(e.target.value) || 1) }))}
          />
          <p className="text-[10px] text-gray-400 italic">Por defecto: 1</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savingSeries, setSavingSeries] = useState(false);
  const [logo, setLogo] = useState('');
  const { user } = useAuth();

    useEffect(() => {
    console.log("Usuario actual:", user);
    console.log("RUC:", user?.ruc);
    console.log("Rol:", user?.rol);
  }, [user]);

  const [form, setForm] = useState<EmpresaForm>({
    ruc: '',
    razonSocial: '',
    nombreComercial: '',
    regimen: '1',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    ubigeo: '',
    urbanizacion: '',
    telefono: '',
    email: '',
    repLegal: '',
    repLegalDni: '',
  });

  const [series, setSeries] = useState<SeriesForm>({
    serieFactura: 'F001',
    correlativoFactura: 1,
    serieBoleta: 'B001',
    correlativoBoleta: 1,
    serieNotaCredito: 'FC01',
    correlativoNotaCredito: 1,
    serieNotaDebito: 'FD01',
    correlativoNotaDebito: 1,
    serieGuia: 'T001',
    correlativoGuia: 1,
  });

  const [icbper, setIcbper] = useState(false);
  const [retencion, setRetencion] = useState(false);
  const [detraccion, setDetraccion] = useState(false);
  const [percepcion, setPercepcion] = useState(false);

  const upd = (key: keyof EmpresaForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ruc || !form.razonSocial || !form.direccion || !form.email) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ruc: form.ruc,
        razonSocial: form.razonSocial,
        nombreComercial: form.nombreComercial,
        direccion: form.direccion,
        ubigeo: form.ubigeo,
        urbanizacion: form.urbanizacion,
        provincia: form.provincia,
        departamento: form.departamento,
        distrito: form.distrito,
        telefono: form.telefono,
        email: form.email,
        // logoBase64 se actualiza por separado
        // certificadoPem, certificadoPassword, solUsuario, solClave, clienteId, clientSecret → se configuran en otro lugar
      };

      const res = await fetch('http://localhost:5004/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      showToast('Datos de empresa guardados correctamente', 'success');
    } catch (err) {
      showToast('Error al guardar los datos. Verifica tu conexión.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeries = async () => {
    setSavingSeries(true);
    try {
      // Aquí puedes ajustar el endpoint cuando esté disponible para series
      await new Promise((r) => setTimeout(r, 800));
      showToast('Series guardadas correctamente', 'success');
    } catch {
      showToast('Error al guardar las series', 'error');
    } finally {
      setSavingSeries(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Datos de la Empresa ── */}
      <Card title="Datos de la Empresa" subtitle="Información que aparecerá en tus comprobantes electrónicos">
        
        <p>{user?.ruc}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <LogoUploader logo={logo} onLogo={setLogo} />

          {/* Identificación */}
          <div className="md:col-span-2">
            <SectionHeader icon={Building2} title="Identificación Tributaria" subtitle="Datos registrados en SUNAT" />
          </div>

          <Input
            label="RUC"
            value={form.ruc}
            onChange={upd('ruc')}
            required
            placeholder="20xxxxxxxxx"
            maxLength={11}
            hint="Número de RUC de 11 dígitos registrado en SUNAT"
          />

         

          <Input label="Razón Social" value={form.razonSocial} onChange={upd('razonSocial')} required placeholder="Nombre legal de la empresa" />
          <Input label="Nombre Comercial" value={form.nombreComercial} onChange={upd('nombreComercial')} placeholder="Nombre con el que opera (opcional)" />

          {/* Representante Legal */}
          <div className="md:col-span-2">
            <SectionHeader icon={User} title="Representante Legal" subtitle="Datos del responsable de la empresa ante SUNAT" />
          </div>
          <Input label="Nombre del Representante Legal" value={form.repLegal} onChange={upd('repLegal')} placeholder="Nombres y apellidos completos" />
          <Input label="DNI del Representante Legal" value={form.repLegalDni} onChange={upd('repLegalDni')} placeholder="8 dígitos" maxLength={8} hint="Documento de identidad del representante" />

          {/* Ubicación */}
          <div className="md:col-span-2">
            <SectionHeader icon={MapPin} title="Ubicación y Domicilio Fiscal" subtitle="Dirección registrada en SUNAT para tus comprobantes" />
          </div>

          <Select
            label="Departamento"
            required
            value={form.departamento}
            onChange={upd('departamento')}
            options={DEPARTAMENTOS.map((d) => ({ value: d, label: d }))}
          />
          <Input label="Provincia" value={form.provincia} onChange={upd('provincia')} required placeholder="Ej: Lima" />
          <Input label="Distrito" value={form.distrito} onChange={upd('distrito')} required placeholder="Ej: San Isidro" />
          <Input label="Ubigeo" value={form.ubigeo} onChange={upd('ubigeo')} placeholder="Ej: 150131" maxLength={6} hint="Código de ubicación geográfica INEI (6 dígitos)" />
          <Input label="Urbanización" value={form.urbanizacion} onChange={upd('urbanizacion')} placeholder="Ej: Urb. Los Jardines" />
          <div className="md:col-span-2">
            <Input label="Dirección Fiscal" value={form.direccion} onChange={upd('direccion')} required placeholder="Av. / Jr. / Calle + número, referencia" hint="Dirección completa tal como aparece en SUNAT" />
          </div>

          {/* Contacto */}
          <div className="md:col-span-2">
            <SectionHeader icon={Phone} title="Datos de Contacto" subtitle="Información de comunicación de la empresa" />
          </div>

          <Input label="Teléfono" value={form.telefono} onChange={upd('telefono')} required placeholder="Ej: 01 234 5678 / 999 123 456" type="tel" />
          <Input label="Email" value={form.email} onChange={upd('email')} required placeholder="contacto@empresa.pe" type="email" hint="Se usará para notificaciones y envío de comprobantes" />

        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar Datos de Empresa'}
          </Button>
        </div>
      </Card>

      {/* ── Series de Comprobantes ── */}
      <Card title="Series de Comprobantes" subtitle="Configura la serie y el correlativo inicial para cada tipo de documento electrónico">
        <div className="space-y-5">
          <SerieRow label="Factura" serieKey="serieFactura" correlativoKey="correlativoFactura" series={series} setSeries={setSeries} prefix="F" hint="F001" />
          <SerieRow label="Boleta" serieKey="serieBoleta" correlativoKey="correlativoBoleta" series={series} setSeries={setSeries} prefix="B" hint="B001" />
          <SerieRow label="Nota de Crédito" serieKey="serieNotaCredito" correlativoKey="correlativoNotaCredito" series={series} setSeries={setSeries} prefix="F" hint="FC01" />
          <SerieRow label="Nota de Débito" serieKey="serieNotaDebito" correlativoKey="correlativoNotaDebito" series={series} setSeries={setSeries} prefix="F" hint="FD01" />
          <SerieRow label="Guía de Remisión" serieKey="serieGuia" correlativoKey="correlativoGuia" series={series} setSeries={setSeries} prefix="T" hint="T001" />
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" disabled={savingSeries} onClick={handleSaveSeries}>
            {savingSeries && <Loader2 className="w-4 h-4 animate-spin" />}
            {savingSeries ? 'Guardando...' : 'Guardar Series'}
          </Button>
        </div>
      </Card>

      {/* ── Impuestos ── */}
      <Card title="Configuración de Impuestos" subtitle="Parámetros tributarios aplicados a tus comprobantes">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-bold text-gray-900 text-sm">IGV — Impuesto General a las Ventas</p>
              <p className="text-xs text-gray-500 mt-0.5">Tasa estándar aplicada a la mayoría de productos y servicios.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-brand-blue">18%</span>
              <div className="w-10 h-5 bg-brand-blue rounded-full relative cursor-pointer" onClick={() => showToast('La tasa del IGV está bloqueada por normativa SUNAT', 'info')}>
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          </div>

          <Toggle checked={icbper} onChange={() => { setIcbper(!icbper); showToast(!icbper ? 'ICBPER activado' : 'ICBPER desactivado', !icbper ? 'success' : 'info'); }} label="ICBPER — Impuesto al Consumo de Bolsas Plásticas" desc="S/ 0.50 por cada bolsa plástica entregada al cliente." />
          <Toggle checked={retencion} onChange={() => { setRetencion(!retencion); showToast(!retencion ? 'Retenciones activadas' : 'Retenciones desactivadas', !retencion ? 'success' : 'info'); }} label="Retenciones (3%)" desc="Aplica si eres Agente de Retención designado por SUNAT." />
          <Toggle checked={percepcion} onChange={() => { setPercepcion(!percepcion); showToast(!percepcion ? 'Percepciones activadas' : 'Percepciones desactivadas', !percepcion ? 'success' : 'info'); }} label="Percepciones" desc="Aplica si eres Agente de Percepción designado por SUNAT." />
          <Toggle checked={detraccion} onChange={() => { setDetraccion(!detraccion); showToast(!detraccion ? 'Detracciones activadas' : 'Detracciones desactivadas', !detraccion ? 'success' : 'info'); }} label="Detracciones (SPOT)" desc="Sistema de Pago de Obligaciones Tributarias para servicios o bienes sujetos." />
        </div>
      </Card>

    </form>
  );
}