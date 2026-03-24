"use client";
import React, { useState } from "react";
import { X, User, Mail, Shield, Loader2 } from "lucide-react";

interface EditarUsuarioForm {
  usuarioID: number;
  username: string;
  email: string;
  rol: string;
}

interface Props {
  usuario: any;
  onClose: () => void;
  onSave: (data: EditarUsuarioForm) => Promise<void>;
  isSuperadmin: boolean;
}

export function EditarUsuarioModal({
  usuario,
  onClose,
  onSave,
  isSuperadmin,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditarUsuarioForm>({
    usuarioID: usuario.usuarioID,
    username: usuario.username,
    email: usuario.email,
    rol: usuario.rol,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Editar Usuario</p>
              <p className="text-xs text-gray-500">{usuario.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Correo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500"
                />
              </div>
            </div>

            {/* Rol — solo admin/superadmin puede cambiarlo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Rol
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="contador">Contador</option>
                  <option value="soporte">Soporte</option>
                  {(isSuperadmin || usuario.rol === "admin") && (
                    <option value="admin">Admin</option>
                  )}
                  {usuario.rol === "superadmin" && (
                    <option value="superadmin">Super Admin</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
