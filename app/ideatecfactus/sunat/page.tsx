"use client";
import React, { useState, useRef, useCallback } from 'react';
import {
  Zap, CheckCircle2, FileJson, AlertCircle, ShieldCheck,
  Eye, EyeOff, Upload, RefreshCw, Download, X, ChevronDown,
  Wifi, WifiOff, Clock, User, Lock, Key, Globe, Info,
  FileText, AlertTriangle, CheckCheck, Loader2
} from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Modal } from '@/app/components/ui/Modal';
import { cn } from '@/app/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Config {
  solUser: string;
  solPassword: string;
  clientId: string;
  clientSecret: string;
  environment: 'produccion' | 'beta';
  certFile: string | null;
  certPassword: string;
  certExpiry: string;
  certIssuer: string;
  certRuc: string;
  saved: boolean;
}

interface ConnectionStatus {
  connected: boolean;
  responseMs: number;
  cdrCount: number;
  xmlCount: number;
  errors: number;
}

interface CdrRow {
  id: string;
  date: string;
  ticket: string;
  status: 'Aceptado' | 'Rechazado';
  type: string;
}

// ─── SecretInput ──────────────────────────────────────────────────────────────
interface SecretInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  hint?: string;
}

function SecretInput({ label, placeholder, value, onChange, required, hint }: SecretInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm pr-10 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────
interface TextInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
}

function TextInput({ label, placeholder, value, onChange, required, hint, disabled }: TextInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
    </div>
  );
}

// ─── FileDrop ─────────────────────────────────────────────────────────────────
interface FileDropProps {
  onFile: (file: File) => void;
  accept: string;
}

function FileDrop({ onFile, accept }: FileDropProps) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handle = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    onFile(file);
  };

  return (
    <div
      className={cn(
        'p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-colors bg-gray-50/50',
        dragging ? 'border-brand-blue bg-blue-50/50' : 'border-gray-200 hover:border-brand-blue'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => ref.current?.click()}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {fileName ? (
        <>
          <div className="p-3 bg-emerald-50 rounded-xl shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">{fileName}</p>
            <p className="text-xs text-gray-500 mt-1">Clic para cambiar archivo</p>
          </div>
        </>
      ) : (
        <>
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <FileJson className="w-8 h-8 text-brand-blue" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Selecciona tu archivo .pfx o .p12</p>
            <p className="text-xs text-gray-500 mt-1">O arrastra y suelta el archivo aquí</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
interface CollapsibleProps {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

function CollapsibleSection({ title, subtitle, defaultOpen = false, children, badge }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900">{title}</p>
            {badge}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform shrink-0 ml-4', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-5">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── InfoBanner ───────────────────────────────────────────────────────────────
function InfoBanner({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' }) {
  const styles = {
    info: 'bg-blue-50 border-blue-100 text-blue-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
  };
  const Icon = variant === 'warning' ? AlertTriangle : Info;
  return (
    <div className={cn('p-3 rounded-xl border flex gap-2 text-xs', styles[variant])}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <p>{children}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SunatPage() {
  const { showToast } = useToast();

  const [config, setConfig] = useState<Config>({
    solUser: '',
    solPassword: '',
    clientId: '',
    clientSecret: '',
    environment: 'produccion',
    certFile: null,
    certPassword: '',
    certExpiry: '2024-06-05',
    certIssuer: 'Llama.pe SAC',
    certRuc: '20601234567',
    saved: false,
  });

  const [status, setStatus] = useState<ConnectionStatus>({
    connected: true,
    responseMs: 120,
    cdrCount: 1245,
    xmlCount: 1245,
    errors: 0,
  });

  const [syncing, setSyncing] = useState(false);
  const [testingSol, setTestingSol] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingCert, setSavingCert] = useState(false);

  // Modal certificado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPasswordInput, setCertPasswordInput] = useState('');

  const upd = (key: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig((c) => ({ ...c, [key]: e.target.value, saved: false }));

  // ── Días restantes certificado ──
  const daysLeft = Math.ceil((new Date(config.certExpiry).getTime() - Date.now()) / 86400000);
  const certPct = Math.max(0, Math.min(100, (daysLeft / 365) * 100));
  const certBadgeVariant: 'error' | 'info' | 'success' =
    daysLeft < 7 ? 'error' : daysLeft < 30 ? 'info' : 'success';

  // ── Historial mock ──
  const history: CdrRow[] = [
    { id: 'F001-0000123', date: '20/05/2024 14:20', ticket: '2024052012345', status: 'Aceptado', type: 'Factura' },
    { id: 'F001-0000122', date: '20/05/2024 12:15', ticket: '2024052012344', status: 'Aceptado', type: 'Factura' },
    { id: 'B001-0000456', date: '19/05/2024 18:30', ticket: '2024051998765', status: 'Aceptado', type: 'Boleta' },
    { id: 'T001-0000089', date: '19/05/2024 10:00', ticket: '2024051998000', status: 'Rechazado', type: 'Guía' },
  ];

  // ── Handlers ──
  const handleRefresh = async () => {
    if (!config.solUser || !config.solPassword) {
      showToast('Configura las Credenciales SOL antes de sincronizar', 'info');
      return;
    }
    setSyncing(true);
    showToast('Sincronizando con servidores de SUNAT...', 'info');
    await new Promise((r) => setTimeout(r, 1800));
    setStatus((s) => ({ ...s, connected: true, responseMs: Math.floor(Math.random() * 80 + 90) }));
    setSyncing(false);
    showToast('Sincronización completada', 'success');
  };

  const handleTestSol = async () => {
    if (!config.solUser || !config.solPassword) {
      showToast('Completa el usuario y clave SOL', 'info');
      return;
    }
    setTestingSol(true);
    showToast('Validando credenciales SOL con SUNAT...', 'info');
    await new Promise((r) => setTimeout(r, 2000));
    setTestingSol(false);
    if (config.solUser.length >= 3) {
      showToast('Credenciales SOL verificadas correctamente ✓', 'success');
    } else {
      showToast('Error: Credenciales SOL incorrectas', 'error');
    }
  };


  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.solUser || !config.solPassword) {
      showToast('Las credenciales SOL son obligatorias', 'error');
      return;
    }
    setSavingConfig(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSavingConfig(false);
    setConfig((c) => ({ ...c, saved: true }));
    showToast('Configuración guardada correctamente', 'success');
  };

  const handleUploadCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFile) { showToast('Selecciona un archivo .pfx o .p12', 'error'); return; }
    if (!certPasswordInput) { showToast('Ingresa la contraseña del certificado', 'error'); return; }
    setSavingCert(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSavingCert(false);
    setConfig((c) => ({ ...c, certFile: certFile.name, certPassword: certPasswordInput }));
    setIsModalOpen(false);
    setCertPasswordInput('');
    setCertFile(null);
    showToast('Certificado digital actualizado correctamente', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header actions */}


      {/* Estado conexión + certificado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Estado de Conexión SUNAT" subtitle="Monitoreo de servicios OSE/PSE">
          <div className={cn(
            'flex items-center gap-8 p-4 rounded-2xl border',
            status.connected ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
          )}>
            <div className={cn('p-4 rounded-full text-white shadow-lg', status.connected ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-500 shadow-red-200')}>
              {status.connected ? <Zap className="w-8 h-8" /> : <WifiOff className="w-8 h-8" />}
            </div>
            <div className="space-y-1">
              <h4 className={cn('text-lg font-bold', status.connected ? 'text-emerald-900' : 'text-red-900')}>
                {status.connected ? 'Servicio Operativo' : 'Sin Conexión'}
              </h4>
              <p className={cn('text-sm', status.connected ? 'text-emerald-700' : 'text-red-700')}>
                {status.connected
                  ? `La conexión con los servidores de SUNAT es estable. Tiempo de respuesta: ${status.responseMs}ms.`
                  : 'No se puede conectar con los servidores de SUNAT. Verifica tus credenciales.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { label: 'CDR Recibidos', value: status.cdrCount.toLocaleString(), icon: CheckCircle2, color: 'text-emerald-600' },
              { label: 'XML Generados', value: status.xmlCount.toLocaleString(), icon: FileJson, color: 'text-blue-600' },
              { label: 'Errores Envío', value: status.errors.toString(), icon: AlertCircle, color: status.errors > 0 ? 'text-red-500' : 'text-gray-400' },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <stat.icon className={cn('w-5 h-5 mb-2', stat.color)} />
                <p className="text-xs font-bold text-gray-500 uppercase">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Certificado Digital */}

     <Card title="Certificado Digital (PSF)" subtitle="Validación y vigencia">
  <div className="space-y-6">
    <div className={cn(
      'p-4 rounded-xl border space-y-3',
      !config.certFile
        ? 'border-gray-100 bg-gray-50/50'
        : daysLeft < 30 ? 'border-amber-100 bg-amber-50/50' : 'border-emerald-100 bg-emerald-50/50'
    )}>
      <div className="flex justify-between items-center">
        <span className={cn(
          'text-xs font-bold uppercase',
          !config.certFile ? 'text-gray-400' : daysLeft < 30 ? 'text-amber-800' : 'text-emerald-800'
        )}>Vigencia</span>
        <Badge variant={!config.certFile ? 'default' : certBadgeVariant}>
          {!config.certFile ? 'Sin certificado' : daysLeft < 7 ? 'Por vencer' : daysLeft < 30 ? 'Próximo a vencer' : 'Vigente'}
        </Badge>
      </div>
      <div className={cn(
        'h-2 rounded-full overflow-hidden',
        !config.certFile ? 'bg-gray-200' : daysLeft < 30 ? 'bg-amber-100' : 'bg-emerald-200'
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all',
            !config.certFile ? 'bg-gray-300' : daysLeft < 30 ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          style={{ width: !config.certFile ? '0%' : `${certPct}%` }}
        />
      </div>
      <p className={cn('text-xs', !config.certFile ? 'text-gray-400' : daysLeft < 30 ? 'text-amber-700' : 'text-emerald-700')}>
        {!config.certFile
          ? 'Cargue un certificado para determinar la cantidad de días.'
          : <>Expira el <strong>{new Date(config.certExpiry).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> (en {daysLeft} días).</>
        }
      </p>
    </div>

    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-500 uppercase">Detalles del Certificado</p>
      <div className="text-sm space-y-1">
        {[
          ['Emisor', config.certFile ? config.certIssuer : '—'],
          ['RUC', config.certFile ? config.certRuc : '—'],
          ['Tipo', config.certFile ? 'PFX / P12' : '—'],
          ['Archivo', config.certFile ?? 'No cargado'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-gray-500">{k}:</span>
            <span className={cn(
              'font-medium',
              !config.certFile && k === 'Archivo' ? 'text-red-500' : config.certFile ? 'text-gray-900' : 'text-gray-400'
            )}>{v}</span>
          </div>
        ))}
      </div>
    </div>

    <Button variant="outline" className="w-full" onClick={() => setIsModalOpen(true)}>
      <Upload className="w-4 h-4" />
      {config.certFile ? 'Actualizar Certificado' : 'Subir Certificado'}
    </Button>
  </div>
</Card>

      </div>

      {/* ── Configuración ── */}
      <form onSubmit={handleSaveConfig} className="space-y-4">

        {/* Entorno */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-bold text-gray-900 mb-1">Entorno de Operación</p>
          <p className="text-xs text-gray-500 mb-4">Define si trabajas en producción real o en pruebas con SUNAT</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              { key: 'produccion', label: 'Producción', desc: 'Comprobantes reales enviados a SUNAT', accent: 'emerald' },
              { key: 'beta', label: 'Beta / Homologación', desc: 'Ambiente de pruebas de SUNAT', accent: 'amber' },
            ] as const).map((env) => (
              <label
                key={env.key}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                  config.environment === env.key
                    ? env.accent === 'emerald'
                      ? 'border-emerald-300 bg-emerald-50/60'
                      : 'border-amber-300 bg-amber-50/60'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
                )}
              >
                <input
                  type="radio"
                  name="environment"
                  value={env.key}
                  checked={config.environment === env.key}
                  onChange={() => setConfig((c) => ({ ...c, environment: env.key, saved: false }))}
                  className="mt-0.5 accent-brand-blue"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">{env.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{env.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Credenciales SOL — obligatorio */}
        <CollapsibleSection
          defaultOpen
          title="Credenciales SOL"
          subtitle="Usuario y Clave SOL de SUNAT — requeridas para todos los comprobantes electrónicos"
          badge={
            config.solUser && config.solPassword
              ? <Badge variant="success">Configurado</Badge>
              : <Badge variant="error">Requerido</Badge>
          }
        >
          <div className="space-y-4">
            <InfoBanner variant="info">
              Las credenciales SOL son necesarias para autenticarse con SUNAT y enviar Facturas, Boletas y Notas de Crédito/Débito.
              Obtenlas en <strong>sunat.gob.pe → Operaciones en Línea (SOL)</strong>.
            </InfoBanner>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Usuario SOL"
                placeholder="Ej: 20601234567ADMIN"
                value={config.solUser}
                onChange={upd('solUser')}
                required
                hint="Formato: RUC + nombre de usuario SOL registrado en SUNAT"
              />
              <SecretInput
                label="Clave SOL"
                placeholder="••••••••"
                value={config.solPassword}
                onChange={upd('solPassword')}
                required
                hint="Clave de acceso a los servicios en línea de SUNAT"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleTestSol} disabled={testingSol}>
                {testingSol ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {testingSol ? 'Validando...' : 'Probar Credenciales SOL'}
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        {/* Guía de Remisión Electrónica */}
        <CollapsibleSection
          title="Guía de Remisión Electrónica"
          subtitle="Client ID y Client Secret requeridos solo para emitir Guías de Remisión Electrónicas"
          badge={
            config.clientId && config.clientSecret
              ? <Badge variant="success">Configurado</Badge>
              : <Badge variant="info">Opcional</Badge>
          }
        >
          <div className="space-y-4">
            <InfoBanner variant="info">
              Las Guías de Remisión Electrónicas requieren credenciales adicionales proporcionadas por SUNAT.
              No se requieren para Facturas ni Boletas.
            </InfoBanner>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Client ID"
                placeholder="Tu Client ID de SUNAT"
                value={config.clientId}
                onChange={upd('clientId')}
                hint="ID de cliente proporcionado por SUNAT para guías de remisión"
              />
              <SecretInput
                label="Client Secret"
                placeholder="••••••••••••••••"
                value={config.clientSecret}
                onChange={upd('clientSecret')}
                hint="Secreto de cliente proporcionado por SUNAT para guías de remisión"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Guardar */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setConfig((c) => ({ ...c, solUser: '', solPassword: '', clientId: '', clientSecret: '', saved: false }));
              showToast('Configuración limpiada', 'info');
            }}
          >
            Limpiar
          </Button>
          <Button type="submit" disabled={savingConfig}>
            {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </form>

      {/* ── Modal Certificado ── */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCertPasswordInput(''); setCertFile(null); }} title="Actualizar Certificado Digital">
        <form className="space-y-4" onSubmit={handleUploadCert}>
          <InfoBanner variant="warning">
            El certificado digital firma electrónicamente todos tus comprobantes. Asegúrate de que sea válido y emitido por una entidad certificadora autorizada por SUNAT.
          </InfoBanner>

          <FileDrop accept=".pfx,.p12" onFile={setCertFile} />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña del Certificado</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Ingresa la clave del certificado"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm pr-10"
                value={certPasswordInput}
                onChange={(e) => setCertPasswordInput(e.target.value)}
                required
              />
              <ShieldCheck className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic">
              Esta contraseña es necesaria para firmar digitalmente tus comprobantes.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); setCertPasswordInput(''); setCertFile(null); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={savingCert}>
              {savingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {savingCert ? 'Validando...' : 'Cargar Certificado'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Historial CDR ── */}
      <Card title="Historial de Envíos (CDR)" subtitle="Últimos documentos procesados por SUNAT">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                {['Documento', 'Tipo', 'Fecha Envío', 'Ticket SUNAT', 'Estado CDR', 'XML / CDR'].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-brand-blue">{row.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.date}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-400">{row.ticket}</td>
                  <td className="px-6 py-4">
                    <Badge variant={row.status === 'Aceptado' ? 'success' : 'error'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Descargar XML"
                        onClick={() => showToast(`Descargando XML de ${row.id}...`, 'info')}
                      >
                        <FileJson className="w-4 h-4" />
                      </button>
                      <button
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          row.status === 'Aceptado'
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-gray-300 cursor-not-allowed'
                        )}
                        title={row.status === 'Aceptado' ? 'Descargar CDR' : 'No hay CDR para documentos rechazados'}
                        onClick={() =>
                          row.status === 'Aceptado'
                            ? showToast(`Descargando CDR de ${row.id}...`, 'info')
                            : showToast('No hay CDR disponible para documentos rechazados', 'info')
                        }
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Descargar PDF"
                        onClick={() => showToast(`Descargando PDF de ${row.id}...`, 'info')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
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