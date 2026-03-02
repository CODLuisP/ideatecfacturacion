"use client";
import React, { useState } from 'react';
import { 
  UserCircle, 
  Shield, 
  Mail, 
  Phone, 
  MoreVertical, 
  Plus, 
  Search,
  Lock,
  UserPlus,
  Trash2,
  Edit2
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { cn } from '@/app/utils/cn';


const USERS_DATA = [
  { id: 1, name: 'Admin Principal', email: 'admin@facturapro.pe', role: 'Administrador', status: 'Activo', phone: '987 654 321', lastLogin: 'Hace 10 min' },
  { id: 2, name: 'Carlos Ventas', email: 'carlos.v@facturapro.pe', role: 'Vendedor', status: 'Activo', phone: '912 345 678', lastLogin: 'Ayer' },
  { id: 3, name: 'María Contador', email: 'maria.c@facturapro.pe', role: 'Contador', status: 'Inactivo', phone: '955 444 333', lastLogin: 'Hace 3 días' },
  { id: 4, name: 'Soporte Técnico', email: 'soporte@facturapro.pe', role: 'Soporte', status: 'Activo', phone: '900 111 222', lastLogin: 'Hace 1 hora' },
];

export const UsuariosView = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (name: string) => {
    if (confirm(`¿Estás seguro de eliminar al usuario ${name}?`)) {
      showToast(`Usuario ${name} eliminado`, 'success');
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
        <Button onClick={() => setIsModalOpen(true)}><UserPlus className="w-4 h-4" /> Nuevo Usuario</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {USERS_DATA.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
          <Card key={user.id} className="group hover:border-brand-blue transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue font-bold text-lg border border-blue-100">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{user.name}</h4>
                  <Badge variant={user.role === 'Administrador' ? 'default' : 'info'} className="mt-1">
                    <Shield className="w-3 h-3 mr-1" /> {user.role}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 text-gray-300 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(user.name)} className="p-1.5 text-gray-300 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-gray-400" />
                {user.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Phone className="w-4 h-4 text-gray-400" />
                {user.phone}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", user.status === 'Activo' ? 'bg-emerald-500' : 'bg-gray-300')} />
                <span className="text-xs font-medium text-gray-500">{user.status}</span>
              </div>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Último acceso: {user.lastLogin}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nuevo Usuario"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); showToast('Usuario creado correctamente', 'success'); }}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
            <input type="text" placeholder="Ej: Juan Pérez" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
            <input type="email" placeholder="juan.p@empresa.com" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Rol / Perfil</label>
              <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                <option>Vendedor</option>
                <option>Administrador</option>
                <option>Contador</option>
                <option>Soporte</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
              <input type="text" placeholder="999 999 999" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña Temporal</label>
            <div className="relative">
              <input type="password" value="Factura2024*" disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500" />
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic">El usuario deberá cambiar su contraseña al primer inicio de sesión.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Crear Usuario</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
