"use client";
import React, { useState, useEffect } from 'react';
import { RefreshCw, Mail, MessageCircle, CheckCircle2, X, Send } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { ComprobanteListado, ComprobanteDetalleItem } from '@/app/factunet/ver-comprobantes/gestionComprobantes/Comprobante';
import { padCorrelativo, tipoLabel, formatFechaHora, COLORS } from '@/app/factunet/ver-comprobantes/gestionComprobantes/helpers';
import { useActualizarCorreoWhatsapp } from '@/app/factunet/ver-comprobantes/gestionComprobantes/UseActualizarCorreoWhatsapp';

export interface ModalEnvioCorreoWhatsappProps {
    comprobante: ComprobanteListado;
    tipo: 'email' | 'whatsapp';
    ruc: string;
    accessToken: string;
    onClose: () => void;
    onEnviado: (tipo: 'email' | 'whatsapp', destino: string) => void;
}

export const ModalEnvioCorreoWhatsapp = ({ comprobante, tipo, ruc, accessToken, onClose, onEnviado }: ModalEnvioCorreoWhatsappProps) => {
    const { actualizar } = useActualizarCorreoWhatsapp()
    const esEmail = tipo === 'email';
    const [detalles, setDetalles] = useState<ComprobanteDetalleItem[]>([]);
    const yaEnviado = esEmail ? comprobante.cliente.enviadoPorCorreo : comprobante.cliente.enviadoPorWhatsApp;
    const [destino, setDestino] = useState(esEmail ? (comprobante.cliente.correo ?? '') : (comprobante.cliente.whatsApp ?? ''));
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState(false);

    useEffect(() => {
        const cargarDetalles = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobante.comprobanteId}/detalles`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (!res.ok) return;
                const data = await res.json();
                setDetalles(data.details ?? []);
            } catch {}
        };
        if (esEmail) cargarDetalles();
    }, [comprobante.comprobanteId, accessToken, esEmail]);

    const serieNum = `${comprobante.serie}-${padCorrelativo(comprobante.correlativo)}`;

    const handleEnviar = async () => {
        if (!destino.trim()) return;
        setEnviando(true);
        try {
            const resPdf = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobante.comprobanteId}/pdf?tamano=A4`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!resPdf.ok) throw new Error('No se pudo obtener el PDF');
            const pdfBlob = await resPdf.blob();
            const pdfFile = new File([pdfBlob], `${ruc}-${tipoLabel(comprobante.tipoComprobante)}-${serieNum}.pdf`, { type: 'application/pdf' });

            if (esEmail) {
                const formData = new FormData();
                formData.append('toEmail', destino);
                formData.append('toName', comprobante.cliente.razonSocial ?? '');
                formData.append('subject', `${tipoLabel(comprobante.tipoComprobante)} Electrónica ${serieNum}`);
                formData.append('body', `Adjuntamos su ${tipoLabel(comprobante.tipoComprobante)} electrónica.`);
                formData.append('tipo', comprobante.tipoComprobante === '03' ? '3' : '1');
                formData.append('comprobanteJson', JSON.stringify({
                    serieNumero: serieNum,
                    estadoSunat: comprobante.estadoSunat,
                    items: detalles.map(d => ({
                        descripcion: d.descripcion,
                        cantidad: d.cantidad,
                        precioUnitario: d.precioVenta
                    })),
                    igv: comprobante.totalIGV,
                    total: comprobante.importeTotal,
                }));
                formData.append('adjunto', pdfFile);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email/send`, {
                    method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: formData,
                });
                if (!res.ok) throw new Error('Error al enviar correo');
            } else {
                const whatsappApiKey = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY!;
                const whatsappBase = 'https://do.velsat.pe:8443/whatsapp';
                const uploadForm = new FormData();
                uploadForm.append('file', pdfFile);
                const resUpload = await fetch(`${whatsappBase}/api/upload`, {
                    method: 'POST', headers: { 'x-api-key': whatsappApiKey }, body: uploadForm,
                });
                if (!resUpload.ok) throw new Error('No se pudo subir el PDF');
                const fileUrl = (await resUpload.json()).datos.url;
                const numeroFormateado = destino.startsWith('51') ? destino : `51${destino}`;
                const resWsp = await fetch(`${whatsappBase}/api/send/single`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': whatsappApiKey },
                    body: JSON.stringify({
                        phone: numeroFormateado, type: 'documento', file_url: fileUrl,
                        filename: pdfFile.name, mime_type: 'application/pdf',
                        text: `Estimado(a) ${comprobante.cliente.razonSocial}, adjuntamos su ${tipoLabel(comprobante.tipoComprobante)} electrónica ${serieNum}.`,
                    }),
                });
                if (!resWsp.ok) throw new Error('Error al enviar por WhatsApp');
            }
            setExito(true);
            // Actualizar correo/whatsapp con los valores ingresados
            if (esEmail) {
                await actualizar({
                    comprobanteId: comprobante.comprobanteId,
                    correo: destino,
                    enviadoPorCorreo: true,
                    whatsApp: comprobante.cliente.whatsApp,
                    enviadoPorWhatsApp: comprobante.cliente.enviadoPorWhatsApp
                })
            } else {
                await actualizar({
                    comprobanteId: comprobante.comprobanteId,
                    correo: comprobante.cliente.correo,
                    enviadoPorCorreo: comprobante.cliente.enviadoPorCorreo,
                    whatsApp: destino,
                    enviadoPorWhatsApp: true
                })
            }
            onEnviado(tipo, destino);
            setTimeout(() => { setExito(false); onClose(); }, 1500);
        } catch { } finally { setEnviando(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={cn("px-6 py-4 flex items-center justify-between", esEmail ? "bg-blue-50 border-b border-blue-100" : "bg-green-50 border-b border-green-100")}>
                    <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", esEmail ? "bg-blue-100" : "bg-green-100")}>
                            {esEmail ? <Mail size={18} className="text-blue-600" /> : <MessageCircle size={18} className="text-green-600" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Enviar por {esEmail ? 'Correo electrónico' : 'WhatsApp'}</h2>
                            <p className="text-xs text-gray-500">{tipoLabel(comprobante.tipoComprobante)}: {comprobante.numeroCompleto}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/70 rounded-lg transition-colors">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {yaEnviado && (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <CheckCircle2 size={15} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">
                                Este comprobante ya fue enviado el <span className="font-semibold">{formatFechaHora(comprobante.fechaCreacion)}</span>. Puedes volver a enviarlo.
                            </p>
                        </div>
                    )}
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="text-sm font-semibold text-gray-900">{comprobante.cliente.razonSocial}</p>
                        <p className="text-xs text-gray-500">{comprobante.cliente.numeroDocumento}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                            {esEmail ? 'Correo electrónico' : 'Número de WhatsApp'}
                        </label>
                        <input type={esEmail ? 'email' : 'tel'} value={destino} onChange={e => setDestino(e.target.value)}
                            placeholder={esEmail ? 'correo@ejemplo.com' : '51987654321'}
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" />
                        {!esEmail && <p className="text-xs text-gray-400 mt-1">Incluye el código de país. Ej: 51987654321</p>}
                    </div>
                </div>
                <div className="px-6 pb-5 flex gap-3">
                    <button onClick={onClose} className={cn("flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors", COLORS.btnSecondary)}>Cancelar</button>
                    <button onClick={handleEnviar} disabled={enviando || exito || !destino.trim()}
                        className={cn("flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all",
                            exito ? "bg-emerald-500 text-white"
                                : esEmail ? cn(COLORS.btnPrimary, "disabled:opacity-50")
                                    : cn(COLORS.btnGreen, "disabled:opacity-50"))}>
                        {exito ? <><CheckCircle2 size={16} /> Enviado</>
                            : enviando ? <><RefreshCw size={16} className="animate-spin" /> Enviando...</>
                                : <><Send size={16} /> Enviar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};