"use client";
import React, { useEffect, useState } from "react";
import {
  Shield,
  Mail,
  Search,
  Lock,
  UserPlus,
  Trash2,
  Edit2,
} from "lucide-react";
import { useToast } from "@/app/components/ui/Toast";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Modal } from "@/app/components/ui/Modal";
import { cn } from "@/app/utils/cn";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { EditarUsuarioModal } from "@/app/components/modalUsuarios/EditarUsuarioModal";
import { EliminarUsuarioModal } from "@/app/components/modalUsuarios/EliminarUsuarioModal";

export default function UsuariosPage() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, accessToken } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    rol: "vendedor",
  });
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const [modalEditar, setModalEditar] = useState<any | null>(null);
  const [modalEliminar, setModalEliminar] = useState<any | null>(null);
  const isSuperadmin = user?.rol === "superadmin";

  const handleEditar = async (data: any) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Usuario/${data.usuarioID}`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalEditar(null);
      showToast("Usuario actualizado correctamente", "success");
      fetchUsuarios();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Error al actualizar",
        "error",
      );
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Usuario/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalEliminar(null);
      showToast("Usuario eliminado correctamente", "success");
      fetchUsuarios();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Error al eliminar", "error");
    }
  };

  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Usuario?incluirInactivos=false`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setUsuarios(res.data.data);
    } catch (error) {
      showToast("Error al cargar usuarios", "error");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchUsuarios();
  }, [accessToken]);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreate(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Usuario/register`,
        {
          username: formData.username,
          email: formData.email,
          password: "12345678",
          rol: formData.rol,
          ruc: user?.ruc,
          sucursalID: user?.sucursalID,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      setIsModalOpen(false);
      showToast("Usuario creado correctamente", "success");
      setFormData({ username: "", email: "", rol: "vendedor" });
      fetchUsuarios();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Error al crear usuario",
        "error",
      );
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar usuarios por nombre o correo..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4" /> Nuevo Usuario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingUsuarios ? (
          <p className="text-gray-400 text-sm">Cargando usuarios...</p>
        ) : (
          usuarios
            .filter(
              (u) =>
                u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((u) => (
              <Card
                key={u.usuarioID}
                className="group hover:border-brand-blue transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue font-bold text-lg border border-blue-100">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">
                        {u.username}
                      </h4>
                      <Badge
                        variant={u.rol === "admin" ? "default" : "info"}
                        className="mt-1"
                      >
                        <Shield className="w-3 h-3 mr-1" /> {u.rol}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setModalEditar(u)}
                      className="p-1.5 text-gray-300 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setModalEliminar(u)}
                      className="p-1.5 text-gray-300 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {u.email}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        u.estado ? "bg-emerald-500" : "bg-gray-300",
                      )}
                    />
                    <span className="text-xs font-medium text-gray-500">
                      {u.estado ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">
                    Último acceso:{" "}
                    {u.fechaUltimoAcceso
                      ? new Date(u.fechaUltimoAcceso).toLocaleDateString()
                      : "Nunca"}
                  </span>
                </div>
              </Card>
            ))
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Usuario"
      >
        <form className="space-y-4" onSubmit={handleCrearUsuario}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ej: juan.perez"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="juan.p@empresa.com"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Rol / Perfil
            </label>
            <select
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              value={formData.rol}
              onChange={(e) =>
                setFormData({ ...formData, rol: e.target.value })
              }
            >
              <option value="vendedor">Vendedor</option>
              <option value="contador">Contador</option>
              <option value="soporte">Soporte</option>
              {(isSuperadmin || user?.rol === "admin") && (
                <option value="admin">Admin</option>
              )}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Contraseña Temporal
            </label>
            <div className="relative">
              <input
                type="password"
                value="Factura2024*"
                disabled
                className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500"
              />
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic">
              El usuario deberá cambiar su contraseña al primer inicio de
              sesión.
            </p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loadingCreate}>
              {loadingCreate ? "Creando..." : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </Modal>
      {modalEditar && (
        <EditarUsuarioModal
          usuario={modalEditar}
          onClose={() => setModalEditar(null)}
          onSave={handleEditar}
          isSuperadmin={isSuperadmin}
        />
      )}
      {modalEliminar && (
        <EliminarUsuarioModal
          usuario={modalEliminar}
          onClose={() => setModalEliminar(null)}
          onConfirm={handleEliminar}
        />
      )}
    </div>
  );
}
