'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Globe,
  LifeBuoy,
  FileText,
  ShieldAlert,
  Zap,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

import IncaPattern from '../components/IncaPattern';

enum LoginStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

interface FormErrors {
  identifier?: string;
  password?: string;
}

interface LoginFormData {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<LoginStatus>(LoginStatus.IDLE);
  const [apiError, setApiError] = useState<string>('');

  const validate = (name: string, value: string) => {
  let error = '';
  if (name === 'identifier') {
    if (!value) {
      error = 'RUC o correo electrónico es requerido';
    }
    // ✅ Comentadas las validaciones estrictas
    // else if (value.includes('@')) {
    //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //   if (!emailRegex.test(value)) error = 'Correo electrónico inválido';
    // } else {
    //   const rucRegex = /^\d{11}$/;
    //   if (!rucRegex.test(value)) error = 'El RUC debe tener 11 dígitos numéricos';
    // }
  }
  if (name === 'password') {
    if (!value) error = 'La contraseña es requerida';
    // ✅ Comentada la validación de longitud mínima
    // else if (value.length < 6) error = 'Mínimo 6 caracteres';
  }
  return error;
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
    
    const error = validate(name, (val as string));
    setErrors(prev => ({ ...prev, [name]: error }));
    setApiError(''); // Limpiar error de API
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const idError = validate('identifier', formData.identifier);
    const passError = validate('password', formData.password);
    
    if (idError || passError) {
      setErrors({ identifier: idError, password: passError });
      return;
    }

    setStatus(LoginStatus.LOADING);
    setApiError('');

    try {
      const result = await signIn('credentials', {
        identifier: formData.identifier,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setStatus(LoginStatus.ERROR);
        setApiError('Credenciales inválidas. Verifica tus datos.');
        return;
      }

      if (result?.ok) {
        setStatus(LoginStatus.SUCCESS);
        // Pequeño delay para mostrar el estado de éxito
        setTimeout(() => {
          router.push('/ideatecfactus');
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      console.error('Error en login:', error);
      setStatus(LoginStatus.ERROR);
      setApiError('Error al conectar con el servidor');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column: Login Form */}
      <section className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center min-h-screen p-6 sm:p-10 lg:p-16 relative overflow-hidden">
        <IncaPattern />
        
        <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Building2 size={24} />
            </div>
            <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">
              IDEA<span className="text-red-600">TEC</span>
            </h1>
          </div>

          {/* Main Content */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Iniciar Sesión</h2>
              <p className="text-slate-500">Accede a tu panel de facturación electrónica.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error de API */}
              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{apiError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="identifier" className="block text-sm font-semibold text-slate-700">
                  RUC o Correo Electrónico
                </label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${errors.identifier ? 'text-red-500' : 'text-slate-400 group-focus-within:text-blue-700'}`}>
                    <User size={18} />
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    placeholder="20123456789 o tu@email.com"
                    className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${errors.identifier ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-700'} rounded-xl transition-all outline-none text-slate-900 font-medium`}
                    value={formData.identifier}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
                {errors.identifier && (
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-red-600 mt-1.5">
                    <AlertCircle size={14} /> {errors.identifier}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <a href="#" className="text-xs font-bold text-blue-700 hover:text-red-600 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${errors.password ? 'text-red-500' : 'text-slate-400 group-focus-within:text-blue-700'}`}>
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`block w-full pl-11 pr-11 py-3.5 bg-slate-50 border ${errors.password ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-700'} rounded-xl transition-all outline-none text-slate-900 font-medium`}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-red-600 mt-1.5">
                    <AlertCircle size={14} /> {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="w-5 h-5 text-blue-900 border-slate-300 rounded focus:ring-blue-500"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span className="ml-2.5 text-sm font-medium text-slate-600">Recordarme</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={status === LoginStatus.LOADING}
                className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl text-sm font-bold text-white transition-all ${
                  status === LoginStatus.LOADING 
                    ? 'bg-blue-800 opacity-80 cursor-not-allowed' 
                    : 'bg-blue-900 hover:bg-blue-950 hover:shadow-xl'
                }`}
              >
                {status === LoginStatus.LOADING ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </div>
                ) : status === LoginStatus.SUCCESS ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-green-400" />
                    <span>¡Bienvenido!</span>
                  </div>
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                ¿Eres una nueva empresa?{' '}
                <a href="#" className="font-bold text-red-600 hover:text-red-700 transition-colors">
                  Regístrate aquí
                </a>
              </p>
            </div>
          </div>

          <footer className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="text-xs font-semibold text-slate-400 hover:text-blue-900 flex items-center gap-1">
              <LifeBuoy size={14} /> Soporte
            </a>
            <a href="#" className="text-xs font-semibold text-slate-400 hover:text-blue-900 flex items-center gap-1">
              <FileText size={14} /> Términos
            </a>
            <a href="#" className="text-xs font-semibold text-slate-400 hover:text-blue-900 flex items-center gap-1">
              <Globe size={14} /> Privacidad
            </a>
          </footer>
        </div>
      </section>

      {/* Right Column: Hero / Brand Panel (Visible on Desktop) */}
      <section className="hidden md:flex md:w-[55%] lg:w-[60%] bg-[#0c2a72] relative overflow-hidden items-center justify-center p-8 lg:p-16">
        {/* Peruvian Red Gradient Accents */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-red-600/15 to-transparent pointer-events-none" />        
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-600/5 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-2xl">
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-4xl lg:text-5xl xl:text-6xl font-brand font-extrabold text-white leading-tight">
              La Facturación <br /> 
              <span className="text-red-500 italic">más inteligente</span> <br /> 
              del Perú.
            </h3>
            <p className="text-blue-200 text-base lg:text-lg mt-6 leading-relaxed max-w-lg">
              Optimiza la gestión tributaria de tu empresa con cumplimiento 100% SUNAT, reportes en tiempo real y soporte especializado.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-3">
                <Zap size={20} />
              </div>
              <h4 className="text-white font-bold mb-1 text-sm lg:text-base">Emisión Instantánea</h4>
              <p className="text-blue-200/70 text-xs lg:text-sm">Genera facturas, boletas y guías en segundos desde cualquier dispositivo.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 mb-3">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-white font-bold mb-1 text-sm lg:text-base">Seguridad Bancaria</h4>
              <p className="text-blue-200/70 text-xs lg:text-sm">Tus datos empresariales protegidos con los estándares más altos de encriptación.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 mb-3">
                <BarChart3 size={20} />
              </div>
              <h4 className="text-white font-bold mb-1 text-sm lg:text-base">Análisis Financiero</h4>
              <p className="text-blue-200/70 text-xs lg:text-sm">Visualiza tus ventas y crecimiento con dashboards dinámicos y reportes PDF/Excel.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 mb-3">
                <Globe size={20} />
              </div>
              <h4 className="text-white font-bold mb-1 text-sm lg:text-base">Conectividad OSE/PSE</h4>
              <p className="text-blue-200/70 text-xs lg:text-sm">Sincronización directa y masiva con los sistemas de validación de SUNAT.</p>
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-6 animate-in fade-in duration-1000 delay-500">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-900 bg-slate-300 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-blue-200 text-xs lg:text-sm">
              <span className="text-white font-bold">Más de 5,000</span> empresas peruanas <br /> ya confían en IDEATEC.
            </p>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <div className="fixed bottom-6 right-6 md:left-6 md:right-auto z-20 pointer-events-none">
        <div className="bg-white/90 backdrop-blur shadow-xl border border-slate-200 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <ShieldAlert size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conexión Segura</p>
            <p className="text-xs font-semibold text-slate-700">Encriptación SSL de 256 bits</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;