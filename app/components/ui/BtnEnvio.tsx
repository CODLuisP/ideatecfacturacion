"use client";
import { Mail, MessageCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface BtnEnvioProps {
    tipo: 'email' | 'whatsapp';
    enviado: boolean;
    fecha?: string;
    onClick: () => void;
}

export const BtnEnvio = ({ tipo, enviado, fecha, onClick }: BtnEnvioProps) => {
    const esEmail = tipo === 'email';
    return (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={onClick}
                title={enviado
                    ? `Enviado${fecha ? ` el ${fecha}` : ''}. Click para reenviar`
                    : `Enviar por ${esEmail ? 'correo' : 'WhatsApp'}`}
                className={cn(
                    "relative p-2 rounded-xl transition-all",
                    enviado
                        ? esEmail ? "bg-blue-50 text-blue-500 hover:bg-blue-100" : "bg-green-50 text-green-500 hover:bg-green-100"
                        : "text-gray-300 hover:text-gray-400 hover:bg-gray-50"
                )}>
                {esEmail ? <Mail size={17} /> : <MessageCircle size={17} />}
                {enviado && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" strokeWidth={2.5} />
                    </span>
                )}
            </button>
            {enviado && (
                <span className={cn("text-[10px] font-medium leading-none", esEmail ? "text-blue-500" : "text-green-500")}>
                    Enviado
                </span>
            )}
        </div>
    );
};