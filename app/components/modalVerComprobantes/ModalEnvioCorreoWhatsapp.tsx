"use client";
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Mail, MessageCircle, CheckCircle2, X, Send, Plus, Check } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { ComprobanteListado, ComprobanteDetalleItem } from '@/app/factunet/comprobantes/gestionComprobantes/Comprobante';
import { padCorrelativo, tipoLabel, formatFechaHora, COLORS } from '@/app/factunet/comprobantes/gestionComprobantes/helpers';
import { useActualizarCorreoWhatsapp } from '@/app/factunet/comprobantes/gestionComprobantes/UseActualizarCorreoWhatsapp';
import { useToast } from '../ui/Toast';

export interface ModalEnvioCorreoWhatsappProps {
    comprobante: ComprobanteListado;
    tipo: 'email' | 'whatsapp';
    ruc: string;
    accessToken: string;
    onClose: () => void;
    onEnviado: (tipo: 'email' | 'whatsapp', destino: string) => void;
}

export const ModalEnvioCorreoWhatsapp = ({ comprobante, tipo, ruc, accessToken, onClose, onEnviado }: ModalEnvioCorreoWhatsappProps) => {
    const { actualizar } = useActualizarCorreoWhatsapp();
    const { showToast } = useToast();
    const esEmail = tipo === 'email';
    const [detalles, setDetalles] = useState<ComprobanteDetalleItem[]>([]);
    const yaEnviado = esEmail ? comprobante.cliente.enviadoPorCorreo : comprobante.cliente.enviadoPorWhatsApp;

    const [destinos, setDestinos] = useState<string[]>(
        esEmail
            ? (comprobante.cliente.correo ?? '').split(',').map(s => s.trim()).filter(Boolean)
            : (comprobante.cliente.whatsApp ?? '').split(',').map(s => s.trim()).filter(Boolean)
    );
    const [mostrarInput, setMostrarInput] = useState(false);
    const [inputActual, setInputActual] = useState('');
    const [errorInput, setErrorInput] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

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

    // Cuando se muestra el input, enfocarlo automáticamente
    useEffect(() => {
        if (mostrarInput) {
            inputRef.current?.focus();
        }
    }, [mostrarInput]);

    const validarDestino = (valor: string): boolean => {
        if (esEmail) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
        } else {
            const limpio = valor.startsWith('51') ? valor.slice(2) : valor;
            return /^\d{9}$/.test(limpio);
        }
    };

    const agregarDestino = () => {
        const val = inputActual.trim();
        if (!val) {
            setErrorInput('Escribe un valor válido');
            inputRef.current?.focus();
            return;
        }
        if (!validarDestino(val)) {
            setErrorInput(esEmail ? 'Correo inválido, debe incluir @' : 'El número debe tener 9 dígitos');
            inputRef.current?.focus();
            return;
        }
        if (destinos.includes(val)) {
            setErrorInput(esEmail ? 'Este correo ya está agregado' : 'Este número ya está agregado');
            inputRef.current?.focus();
            return;
        }
        // Agregar destino
        setDestinos(prev => [...prev, val]);
        setInputActual('');
        setErrorInput('');
        setMostrarInput(false); // ocultar el input después de agregar
    };

    const eliminarDestino = (i: number) => {
        setDestinos(prev => prev.filter((_, idx) => idx !== i));
    };

    const serieNum = `${comprobante.serie}-${padCorrelativo(comprobante.correlativo)}`;

    const handleEnviar = async () => {
        if (destinos.length === 0) return;
        setEnviando(true);
        try {
            const resPdf = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobante.comprobanteId}/pdf?tamano=A4`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!resPdf.ok) throw new Error('No se pudo obtener el PDF');
            const pdfBlob = await resPdf.blob();
            const pdfFile = new File(
                [pdfBlob],
                `${ruc}-${tipoLabel(comprobante.tipoComprobante)}-${serieNum}.pdf`,
                { type: 'application/pdf' }
            );

            if (esEmail) {
                const comprobanteJson = JSON.stringify({
                    serieNumero: serieNum,
                    estadoSunat: comprobante.estadoSunat,
                    items: detalles.map(d => ({
                        descripcion: d.descripcion,
                        cantidad: d.cantidad,
                        precioUnitario: d.precioVenta
                    })),
                    igv: comprobante.totalIGV,
                    total: comprobante.importeTotal,
                });

                const resultados = await Promise.allSettled(
                    destinos.map(correo => {
                        const formData = new FormData();
                        formData.append('toEmail', correo);
                        formData.append('toName', comprobante.cliente.razonSocial ?? '');
                        formData.append('subject', `${tipoLabel(comprobante.tipoComprobante)} Electrónica ${serieNum}`);
                        formData.append('body', `Adjuntamos su ${tipoLabel(comprobante.tipoComprobante)} electrónica.`);
                        formData.append('tipo', comprobante.tipoComprobante === '03' ? '3' : '1');
                        formData.append('comprobanteJson', comprobanteJson);
                        formData.append('adjunto', pdfFile);
                        return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email/send`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${accessToken}` },
                            body: formData,
                        }).then(res => { if (!res.ok) throw new Error(`Error al enviar a ${correo}`); });
                    })
                );

                const fallidos = resultados
                    .filter(r => r.status === 'rejected')
                    .map((r, i) => destinos[i]);

                if (fallidos.length === destinos.length) {
                    throw new Error('No se pudo enviar ningún correo');
                } else if (fallidos.length > 0) {
                    showToast(`Enviado, pero falló: ${fallidos.join(', ')}`, 'error');
                } else {
                    showToast('Correos enviados correctamente', 'success');
                }
            } else {
                const whatsappApiKey = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY!;
                const whatsappBase = 'https://do.velsat.pe:8443/whatsapp';

                const uploadForm = new FormData();
                uploadForm.append('file', pdfFile);
                const resUpload = await fetch(`${whatsappBase}/api/upload`, {
                    method: 'POST',
                    headers: { 'x-api-key': whatsappApiKey },
                    body: uploadForm,
                });
                if (!resUpload.ok) throw new Error('No se pudo subir el PDF');
                const fileUrl = (await resUpload.json()).datos.url;

                const resultados = await Promise.allSettled(
                    destinos.map(num => {
                        const numeroFormateado = num.startsWith('51') ? num : `51${num}`;
                        return fetch(`${whatsappBase}/api/send/single`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-api-key': whatsappApiKey },
                            body: JSON.stringify({
                                phone: numeroFormateado,
                                type: 'documento',
                                file_url: fileUrl,
                                filename: pdfFile.name,
                                mime_type: 'application/pdf',
                                text: `Estimado(a) ${comprobante.cliente.razonSocial}, adjuntamos su ${tipoLabel(comprobante.tipoComprobante)} electrónica ${serieNum}.`,
                            }),
                        }).then(res => { if (!res.ok) throw new Error(`Error al enviar a ${num}`); });
                    })
                );

                const fallidos = resultados
                    .filter(r => r.status === 'rejected')
                    .map((r, i) => destinos[i]);

                if (fallidos.length === destinos.length) {
                    throw new Error('No se pudo enviar a ningún número');
                } else if (fallidos.length > 0) {
                    showToast(`Enviado, pero falló: ${fallidos.join(', ')}`, 'error');
                } else {
                    showToast('WhatsApp enviados correctamente', 'success');
                }
            }

            const destinosStr = destinos.join(',');
            if (esEmail) {
                await actualizar({
                    comprobanteId: comprobante.comprobanteId,
                    correo: destinosStr,
                    enviadoPorCorreo: true,
                    whatsApp: comprobante.cliente.whatsApp,
                    enviadoPorWhatsApp: comprobante.cliente.enviadoPorWhatsApp
                });
            } else {
                await actualizar({
                    comprobanteId: comprobante.comprobanteId,
                    correo: comprobante.cliente.correo,
                    enviadoPorCorreo: comprobante.cliente.enviadoPorCorreo,
                    whatsApp: destinosStr,
                    enviadoPorWhatsApp: true
                });
            }

            onEnviado(tipo, destinosStr);
            setExito(true);
            setTimeout(() => { setExito(false); onClose(); }, 1500);
        } catch (e: any) {
            showToast(e?.message ?? (esEmail ? 'Error al enviar por correo' : 'Error al enviar por WhatsApp'), 'error');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 min-h-screen h-full">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
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
                    <button onClick={onClose} disabled={enviando} className="p-1.5 hover:bg-white/70 rounded-lg transition-colors">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {yaEnviado && (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <CheckCircle2 size={15} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">
                                Este comprobante ya fue enviado el{" "}
                                <span className="font-semibold">{formatFechaHora(comprobante.fechaCreacion)}</span>. Puedes volver a enviarlo.
                            </p>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="text-sm font-semibold text-gray-900">{comprobante.cliente.razonSocial}</p>
                        <p className="text-xs text-gray-500">{comprobante.cliente.numeroDocumento}</p>
                    </div>

                    {/* Lista de destinatarios (chips) */}
                    {destinos.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                                {esEmail ? 'Correos agregados' : 'Números agregados'}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {destinos.map((d, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                                            esEmail ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                        )}
                                    >
                                        {d}
                                        <button
                                            type="button"
                                            onClick={() => eliminarDestino(i)}
                                            className={cn(
                                                "rounded-full p-0.5 transition-colors",
                                                esEmail ? "hover:bg-blue-200" : "hover:bg-green-200"
                                            )}
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botón para mostrar el input */}
                    {!mostrarInput && (
                        <button
                            type="button"
                            onClick={() => setMostrarInput(true)}
                            className={cn(
                                "w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border transition-all",
                                esEmail
                                    ? "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                                    : "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                            )}
                        >
                            <Plus size={14} />
                            {esEmail ? 'Agregar correo electrónico' : 'Agregar número de WhatsApp'}
                        </button>
                    )}

                    {/* Input que aparece al hacer clic en el botón */}
                    {mostrarInput && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type={esEmail ? 'email' : 'tel'}
                                    value={inputActual}
                                    onChange={e => { setInputActual(e.target.value); setErrorInput(''); }}
                                    onKeyDown={e => { if (e.key === 'Enter') agregarDestino(); }}
                                    placeholder={esEmail ? 'ejemplo@correo.com' : '9XXXXXXXX (9 dígitos)'}
                                    className={cn(
                                        "flex-1 px-3 py-2 text-sm border rounded-xl outline-none transition-all",
                                        errorInput
                                            ? "border-red-400 ring-2 ring-red-100"
                                            : esEmail
                                                ? "border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                                : "border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-400"
                                    )}
                                />
                                <button
                                    onClick={agregarDestino}
                                    className={cn(
                                        "p-2 rounded-xl transition-colors",
                                        esEmail ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
                                    )}
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => { setMostrarInput(false); setInputActual(''); setErrorInput(''); }}
                                    className="p-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            {errorInput && <p className="text-xs text-red-500">{errorInput}</p>}
                            <p className="text-xs text-gray-400">
                                {esEmail ? 'Ejemplo: cliente@empresa.com' : 'Ejemplo: 987654321 (9 dígitos)'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex gap-3">
                    <button onClick={onClose} className={cn("flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors", COLORS.btnSecondary)}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleEnviar}
                        disabled={enviando || exito || destinos.length === 0}
                        className={cn(
                            "flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all",
                            exito ? "bg-emerald-500 text-white"
                                : esEmail ? cn(COLORS.btnPrimary, "disabled:opacity-50")
                                    : cn(COLORS.btnGreen, "disabled:opacity-50")
                        )}
                    >
                        {exito ? <><CheckCircle2 size={16} /> Enviado</>
                            : enviando ? <><RefreshCw size={16} className="animate-spin" /> Enviando {destinos.length > 1 ? `(${destinos.length})` : ''}...</>
                                : <><Send size={16} /> Enviar {destinos.length > 1 ? `(${destinos.length})` : ''}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};