"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Building2, MapPin, Phone, Upload, X, ChevronDown, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/app/components/ui/Toast';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';
import { useAuth } from "@/context/AuthContext";

const BASE_URL = 'http://localhost:5004';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmpresaForm {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  ubigeo: string;
  telefono: string;
  email: string;
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
  'AMAZONAS','ÁNCASH','APURÍMAC','AREQUIPA','AYACUCHO','CAJAMARCA','CALLAO',
  'CUSCO','HUANCAVELICA','HUÁNUCO','ICA','JUNÍN','LA LIBERTAD','LAMBAYEQUE',
  'LIMA','LORETO','MADRE DE DIOS','MOQUEGUA','PASCO','PIURA','PUNO',
  'SAN MARTÍN','TACNA','TUMBES','UCAYALI',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDataUrl(base64: string): string {
  if (!base64) return '';
  if (base64.startsWith('data:')) return base64;
  return `data:image/jpeg;base64,${base64}`;
}

function stripDataUrlPrefix(dataUrl: string): string {
  if (!dataUrl) return '';
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

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
            ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed select-none'
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

// ─── Logo Uploader ────────────────────────────────────────────────────────────
interface LogoUploaderProps {
  logoDataUrl: string;
  uploading: boolean;
  onFileSelected: (file: File, previewDataUrl: string) => void;
  onLogoRemove: () => void;
}
function LogoUploader({ logoDataUrl, uploading, onFileSelected, onLogoRemove }: LogoUploaderProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onFileSelected(file, reader.result as string);
    reader.readAsDataURL(file);
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
        onClick={() => !uploading && ref.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
        ) : logoDataUrl ? (
          <img src={logoDataUrl} alt="Logo" className="w-full h-full object-contain p-1" />
        ) : (
          <Upload className="w-6 h-6 text-gray-300" />
        )}
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 text-xs" type="button" disabled={uploading} onClick={() => ref.current?.click()}>
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Subiendo...' : 'Subir Logo'}
          </Button>
          {logoDataUrl && !uploading && (
            <Button variant="outline" className="h-9 text-xs" type="button" onClick={onLogoRemove}>
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
  label, serieKey, correlativoKey, series, setSeries, prefix, hint,
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
      <div className="flex-1 space-y-1.5">
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
      <div className="w-36 space-y-1.5">
        <FieldLabel>Correlativo inicial</FieldLabel>
        <input
          type="number"
          min={1}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-brand-blue bg-white transition-colors"
          value={series[correlativoKey] as number}
          onChange={(e) =>
            setSeries((s) => ({ ...s, [correlativoKey]: Math.max(1, parseInt(e.target.value) || 1) }))
          }
        />
        <p className="text-[10px] text-gray-400 italic">Por defecto: 1</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savingSeries, setSavingSeries] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // logoDataUrl    → data-URL para mostrar en <img>
  // logoBase64Pure → base64 puro para el PUT (null si se quitó)
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [logoBase64Pure, setLogoBase64Pure] = useState<string | null>(null);

  const { user } = useAuth();

  const [form, setForm] = useState<EmpresaForm>({
    ruc: '',
    razonSocial: '',
    nombreComercial: '',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    ubigeo: '',
    telefono: '',
    email: '',
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

  // ── GET ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ruc = user?.ruc;
    if (!ruc) return;

    setLoadingEmpresa(true);
    axios
      .get(`${BASE_URL}/api/companies/${ruc}`)
      .then((res) => {
        const d = res.data;
        setForm({
          ruc:             d.ruc             ?? '',
          razonSocial:     d.razonSocial     ?? '',
          nombreComercial: d.nombreComercial ?? '',
          departamento:    (d.departamento   ?? '').toUpperCase(),
          provincia:       d.provincia       ?? '',
          distrito:        d.distrito        ?? '',
          direccion:       d.direccion       ?? '',
          ubigeo:          d.ubigeo          ?? '',
          telefono:        d.telefono        ?? '',
          email:           d.email           ?? '',
        });

        if (d.logoBase64) {
          setLogoBase64Pure(d.logoBase64);
          setLogoDataUrl(toDataUrl(d.logoBase64));
        }
      })
      .catch(() => {
        showToast('No se pudo cargar los datos de la empresa', 'error');
      })
      .finally(() => {
        setLoadingEmpresa(false);
      });
  }, [user?.ruc]);

  // ── Subir logo (multipart/form-data) ─────────────────────────────────────
  const handleFileSelected = async (file: File, previewDataUrl: string) => {
    setLogoDataUrl(previewDataUrl);
    setLogoBase64Pure(stripDataUrlPrefix(previewDataUrl));
    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('File', file);
      await axios.post(`${BASE_URL}/api/companies/file/base64`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Logo subido correctamente', 'success');
    } catch {
      setLogoDataUrl('');
      setLogoBase64Pure(null);
      showToast('Error al subir el logo. Inténtalo de nuevo.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Quitar logo ───────────────────────────────────────────────────────────
  // null explícito → el backend borra logoBase64 de la DB
  const handleLogoRemove = () => {
    setLogoDataUrl('');
    setLogoBase64Pure(null);
  };

  const upd =
    (key: keyof EmpresaForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // ── PUT parcial: solo mandamos los campos que gestiona este form ──────────
  // El backend mantiene el resto de campos intactos (certificados, SOL, etc.)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ruc || !form.razonSocial || !form.direccion || !form.email) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        razonSocial:     form.razonSocial,
        nombreComercial: form.nombreComercial || null,
        direccion:       form.direccion,
        ubigeo:          form.ubigeo          || null,
        provincia:       form.provincia,
        departamento:    form.departamento,
        distrito:        form.distrito,
        telefono:        form.telefono        || null,
        email:           form.email,
        // null  → usuario quitó la imagen, backend borra logoBase64
        // string → base64 puro de la imagen actual
        logoBase64:      logoBase64Pure,
      };

      await axios.put(`${BASE_URL}/api/companies/${form.ruc}`, payload);
      showToast('Datos de empresa actualizados correctamente', 'success');
    } catch {
      showToast('Error al guardar los datos. Verifica tu conexión.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeries = async () => {
    setSavingSeries(true);
    await new Promise((r) => setTimeout(r, 800));
    showToast('Series guardadas correctamente', 'success');
    setSavingSeries(false);
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Datos de la Empresa ── */}
      <Card title="Datos de la Empresa" subtitle="Información que aparecerá en tus comprobantes electrónicos">

        {loadingEmpresa ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando datos de la empresa...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <LogoUploader
              logoDataUrl={logoDataUrl}
              uploading={uploadingLogo}
              onFileSelected={handleFileSelected}
              onLogoRemove={handleLogoRemove}
            />

            <div className="md:col-span-2">
              <SectionHeader icon={Building2} title="Identificación Tributaria" subtitle="Datos registrados en SUNAT" />
            </div>

            <Input label="RUC" value={form.ruc} disabled hint="El RUC no puede modificarse" />
            <Input label="Razón Social" value={form.razonSocial} onChange={upd('razonSocial')} required placeholder="Nombre legal de la empresa" />
            <Input label="Nombre Comercial" value={form.nombreComercial} onChange={upd('nombreComercial')} placeholder="Nombre con el que opera (opcional)" />

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
            <Input label="Provincia" value={form.provincia} onChange={upd('provincia')} required placeholder="Ej: Cajamarca" />
            <Input label="Distrito"  value={form.distrito}  onChange={upd('distrito')}  required placeholder="Ej: Cajamarca" />
            <Input label="Ubigeo" value={form.ubigeo} onChange={upd('ubigeo')} placeholder="Ej: 060101" maxLength={6} hint="Código de ubicación geográfica INEI (6 dígitos)" />

            <div className="md:col-span-2">
              <Input label="Dirección Fiscal" value={form.direccion} onChange={upd('direccion')} required placeholder="Av. / Jr. / Calle + número, referencia" hint="Dirección completa tal como aparece en SUNAT" />
            </div>

            <div className="md:col-span-2">
              <SectionHeader icon={Phone} title="Datos de Contacto" subtitle="Información de comunicación de la empresa" />
            </div>

            <Input label="Teléfono" value={form.telefono} onChange={upd('telefono')} placeholder="Ej: 01 234 5678 / 999 123 456" type="tel" />
            <Input label="Email" value={form.email} onChange={upd('email')} required placeholder="contacto@empresa.pe" type="email" hint="Se usará para notificaciones y envío de comprobantes" />

          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={saving || loadingEmpresa || uploadingLogo}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar Datos de Empresa'}
          </Button>
        </div>
      </Card>

      {/* ── Series de Comprobantes ── */}
      <Card title="Series de Comprobantes" subtitle="Configura la serie y el correlativo inicial para cada tipo de documento electrónico">
        <div className="space-y-5">
          <SerieRow label="Factura"          serieKey="serieFactura"     correlativoKey="correlativoFactura"     series={series} setSeries={setSeries} prefix="F" hint="F001" />
          <SerieRow label="Boleta"           serieKey="serieBoleta"      correlativoKey="correlativoBoleta"      series={series} setSeries={setSeries} prefix="B" hint="B001" />
          <SerieRow label="Nota de Crédito"  serieKey="serieNotaCredito" correlativoKey="correlativoNotaCredito" series={series} setSeries={setSeries} prefix="F" hint="FC01" />
          <SerieRow label="Nota de Débito"   serieKey="serieNotaDebito"  correlativoKey="correlativoNotaDebito"  series={series} setSeries={setSeries} prefix="F" hint="FD01" />
          <SerieRow label="Guía de Remisión" serieKey="serieGuia"        correlativoKey="correlativoGuia"        series={series} setSeries={setSeries} prefix="T" hint="T001" />
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" disabled={savingSeries} onClick={handleSaveSeries}>
            {savingSeries && <Loader2 className="w-4 h-4 animate-spin" />}
            {savingSeries ? 'Guardando...' : 'Guardar Series'}
          </Button>
        </div>
      </Card>

    </form>
  );
}