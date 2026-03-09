"use client";
import React, { useState, useRef } from 'react';
import { Building2, MapPin, Phone, Mail, FileText, Receipt, Loader2, Upload, X, Globe, Hash, User, Briefcase, ChevronDown } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────
type Regimen = '0' | '1' | '2' | '3';
type TipoContribuyente = 'PERSONA_JURIDICA' | 'PERSONA_NATURAL';

interface EmpresaForm {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  tipoContribuyente: TipoContribuyente;
  regimen: Regimen;
  // Ubicación
  departamento: string;
  provincia: string;
  distrito: string;
  direccionFiscal: string;
  ubigeo: string;
  // Contacto
  telefono: string;
  telefonoSecundario: string;
  email: string;
  emailSecundario: string;
  web: string;
  // Comprobantes
  moneda: string;
  serieFactura: string;
  serieBoleta: string;
  serieNotaCredito: string;
  serieNotaDebito: string;
  serieGuia: string;
  // Representante
  repLegal: string;
  repLegalDni: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEPARTAMENTOS = [
  'Amazonas','Áncash','Apurímac','Arequipa','Ayacucho','Cajamarca','Callao',
  'Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad','Lambayeque',
  'Lima','Loreto','Madre de Dios','Moquegua','Pasco','Piura','Puno',
  'San Martín','Tacna','Tumbes','Ucayali',
];

const REGIMENES: { value: Regimen; label: string; desc: string }[] = [
  { value: '0', label: 'Régimen General', desc: 'Ingresos anuales mayores a 1700 UIT' },
  { value: '1', label: 'Régimen MYPE Tributario', desc: 'Ingresos hasta 1700 UIT anuales' },
  { value: '2', label: 'Régimen Especial (RER)', desc: 'Ingresos hasta 525,000 soles anuales' },
  { value: '3', label: 'Nuevo RUS', desc: 'Para personas naturales con ingresos mínimos' },
];

const MONEDAS = [
  { value: 'PEN', label: 'Sol Peruano (PEN)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
      {children}
      {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
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

// ─── Select ───────────────────────────────────────────────────────────────────
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

// ─── Section Header ───────────────────────────────────────────────────────────
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

// ─── Toggle ───────────────────────────────────────────────────────────────────
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

// ─── Logo Uploader ────────────────────────────────────────────────────────────
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
            <Upload className="w-3.5 h-3.5" /> Cambiar Logo
          </Button>
          {logo && (
            <Button variant="outline" className="h-9 text-xs" type="button" onClick={() => onLogo('')}>
              <X className="w-3.5 h-3.5" /> Quitar
            </Button>
          )}
        </div>
        <p className="text-[10px] text-gray-400">JPG, PNG, SVG o WEBP. Máximo 2MB.<br />Se mostrará en tus comprobantes electrónicos.</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState('https://picsum.photos/seed/company/200/200');

  const [form, setForm] = useState<EmpresaForm>({
    ruc: '20601234567',
    razonSocial: 'MI EMPRESA DIGITAL SAC',
    nombreComercial: 'FacturaPro Perú',
    tipoContribuyente: 'PERSONA_JURIDICA',
    regimen: '1',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'San Isidro',
    direccionFiscal: 'Av. Javier Prado Este 1234, San Isidro, Lima',
    ubigeo: '150131',
    telefono: '01 234 5678',
    telefonoSecundario: '',
    email: 'contacto@miempresa.pe',
    emailSecundario: '',
    web: 'www.miempresa.pe',
    moneda: 'PEN',
    serieFactura: 'F001',
    serieBoleta: 'B001',
    serieNotaCredito: 'FC01',
    serieNotaDebito: 'FD01',
    serieGuia: 'T001',
    repLegal: '',
    repLegalDni: '',
  });

  // Taxes toggles
  const [icbper, setIcbper] = useState(false);
  const [retencion, setRetencion] = useState(false);
  const [detraccion, setDetraccion] = useState(false);
  const [percepcion, setPercepcion] = useState(false);

  const upd = (key: keyof EmpresaForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razonSocial || !form.direccionFiscal || !form.email) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    showToast('Configuración guardada correctamente', 'success');
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Datos de la Empresa ── */}
      <Card title="Datos de la Empresa" subtitle="Información que aparecerá en tus comprobantes electrónicos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <LogoUploader logo={logo} onLogo={setLogo} />

          {/* Identificación */}
          <div className="md:col-span-2">
            <SectionHeader icon={Building2} title="Identificación Tributaria" subtitle="Datos registrados en SUNAT" />
          </div>

          <Input label="RUC" value={form.ruc} onChange={upd('ruc')} disabled required hint="Número de RUC registrado en SUNAT (no editable)" />

          <div className="space-y-1.5">
            <FieldLabel>Tipo de Contribuyente</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'PERSONA_JURIDICA', label: 'Persona Jurídica' },
                { value: 'PERSONA_NATURAL', label: 'Persona Natural' },
              ] as const).map((t) => (
                <label key={t.value} className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm',
                  form.tipoContribuyente === t.value ? 'border-brand-blue bg-blue-50 text-brand-blue font-semibold' : 'border-gray-200 hover:border-gray-300'
                )}>
                  <input type="radio" name="tipoContribuyente" value={t.value} checked={form.tipoContribuyente === t.value} onChange={upd('tipoContribuyente')} className="accent-brand-blue" />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <Input label="Razón Social" value={form.razonSocial} onChange={upd('razonSocial')} required placeholder="Nombre legal de la empresa" />
          <Input label="Nombre Comercial" value={form.nombreComercial} onChange={upd('nombreComercial')} placeholder="Nombre con el que opera (opcional)" />

          <div className="md:col-span-2">
            <Select
              label="Régimen Tributario"
              required
              value={form.regimen}
              onChange={upd('regimen')}
              options={REGIMENES.map((r) => ({ value: r.value, label: `${r.label} — ${r.desc}` }))}
              hint="Determina las obligaciones tributarias y límites de emisión"
            />
          </div>

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
          <div className="md:col-span-2">
            <Input label="Dirección Fiscal" value={form.direccionFiscal} onChange={upd('direccionFiscal')} required placeholder="Av. / Jr. / Calle + número, referencia" hint="Dirección completa tal como aparece en SUNAT" />
          </div>

          {/* Contacto */}
          <div className="md:col-span-2">
            <SectionHeader icon={Phone} title="Datos de Contacto" subtitle="Información de comunicación de la empresa" />
          </div>

          <Input label="Teléfono Principal" value={form.telefono} onChange={upd('telefono')} required placeholder="Ej: 01 234 5678 / 999 123 456" type="tel" />
          <Input label="Teléfono Secundario" value={form.telefonoSecundario} onChange={upd('telefonoSecundario')} placeholder="Opcional" type="tel" />
          <Input label="Email Principal" value={form.email} onChange={upd('email')} required placeholder="contacto@empresa.pe" type="email" hint="Se usará para notificaciones y envío de comprobantes" />
          <Input label="Email Secundario" value={form.emailSecundario} onChange={upd('emailSecundario')} placeholder="Opcional" type="email" />
          <div className="md:col-span-2">
            <Input label="Sitio Web" value={form.web} onChange={upd('web')} placeholder="www.empresa.pe" hint="Aparecerá en el pie de los comprobantes (opcional)" />
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar Datos de Empresa'}
          </Button>
        </div>
      </Card>

      {/* ── Series de Comprobantes ── */}
      <Card title="Series de Comprobantes" subtitle="Configura las series para cada tipo de documento electrónico">
        <div className="mb-4">
          <Select
            label="Moneda Predeterminada"
            value={form.moneda}
            onChange={upd('moneda')}
            options={MONEDAS}
            hint="Moneda que se usará por defecto al crear nuevos comprobantes"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {[
            { key: 'serieFactura' as const, label: 'Serie Factura', prefix: 'F', hint: 'Ej: F001' },
            { key: 'serieBoleta' as const, label: 'Serie Boleta', prefix: 'B', hint: 'Ej: B001' },
            { key: 'serieNotaCredito' as const, label: 'Nota de Crédito', prefix: 'F', hint: 'Ej: FC01' },
            { key: 'serieNotaDebito' as const, label: 'Nota de Débito', prefix: 'F', hint: 'Ej: FD01' },
            { key: 'serieGuia' as const, label: 'Guía de Remisión', prefix: 'T', hint: 'Ej: T001' },
          ].map((s) => (
            <Input
              key={s.key}
              label={s.label}
              value={form[s.key]}
              onChange={upd(s.key)}
              placeholder={s.hint}
              maxLength={4}
              hint={`Empieza con "${s.prefix}" — máx. 4 caracteres`}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="outline" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Series
          </Button>
        </div>
      </Card>

      {/* ── Impuestos ── */}
      <Card title="Configuración de Impuestos" subtitle="Parámetros tributarios aplicados a tus comprobantes">
        <div className="space-y-3">
          {/* IGV — fijo */}
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

          <Toggle
            checked={icbper}
            onChange={() => { setIcbper(!icbper); showToast(!icbper ? 'ICBPER activado' : 'ICBPER desactivado', !icbper ? 'success' : 'info'); }}
            label="ICBPER — Impuesto al Consumo de Bolsas Plásticas"
            desc="S/ 0.50 por cada bolsa plástica entregada al cliente."
          />
          <Toggle
            checked={retencion}
            onChange={() => { setRetencion(!retencion); showToast(!retencion ? 'Retenciones activadas' : 'Retenciones desactivadas', !retencion ? 'success' : 'info'); }}
            label="Retenciones (3%)"
            desc="Aplica si eres Agente de Retención designado por SUNAT."
          />
          <Toggle
            checked={percepcion}
            onChange={() => { setPercepcion(!percepcion); showToast(!percepcion ? 'Percepciones activadas' : 'Percepciones desactivadas', !percepcion ? 'success' : 'info'); }}
            label="Percepciones"
            desc="Aplica si eres Agente de Percepción designado por SUNAT."
          />
          <Toggle
            checked={detraccion}
            onChange={() => { setDetraccion(!detraccion); showToast(!detraccion ? 'Detracciones activadas' : 'Detracciones desactivadas', !detraccion ? 'success' : 'info'); }}
            label="Detracciones (SPOT)"
            desc="Sistema de Pago de Obligaciones Tributarias para servicios o bienes sujetos."
          />
        </div>
      </Card>

    </form>
  );
}