"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronRight, Bell, Settings, LogOut, User, Check, AlertCircle, Info } from 'lucide-react';
import { View } from '@/app/types';

interface TopbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeView: View;
}

const notifications = [
  {
    id: 1,
    icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
    title: 'Factura pendiente',
    desc: 'La factura #F-00234 vence hoy',
    time: 'Hace 5 min',
    unread: true,
  },
  {
    id: 2,
    icon: <Check className="w-4 h-4 text-emerald-500" />,
    title: 'Sincronización exitosa',
    desc: 'SUNAT sincronizó 12 documentos',
    time: 'Hace 1 hora',
    unread: true,
  },
  {
    id: 3,
    icon: <Info className="w-4 h-4 text-blue-500" />,
    title: 'Actualización disponible',
    desc: 'Nueva versión del módulo contable',
    time: 'Ayer',
    unread: false,
  },
];

export const Topbar = ({ isSidebarOpen, toggleSidebar, activeView }: TopbarProps) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"
        >
          {isSidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
          <span className="hover:text-gray-600 cursor-pointer">Sistema</span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-gray-900 capitalize">{activeView}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* SUNAT badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">SUNAT Online</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 relative group transition-all"
          >
            <Bell className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-900">Notificaciones</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>

              {/* List */}
              <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="mt-0.5 p-1.5 bg-white rounded-lg border border-gray-100 shadow-sm shrink-0">
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{n.desc}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.time}</p>
                    </div>
                    {n.unread && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <button className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors text-center">
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-100 mx-1" />

        {/* User Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-3 pl-2 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-all group"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-900 leading-none">Admin Usuario</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden group-hover:ring-2 group-hover:ring-blue-200 transition-all">
              <img
                src="https://picsum.photos/seed/user/100/100"
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userOpen ? 'rotate-90' : ''}`}
            />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-bold text-gray-900">Admin Usuario</p>
                <p className="text-xs text-gray-400 mt-0.5">admin@empresa.com</p>
              </div>

              {/* Options */}
              <ul className="py-1.5">
                <li>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                    <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <User className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="font-medium">Mi perfil</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                    <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <Settings className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="font-medium">Configuración</span>
                  </button>
                </li>
              </ul>

              <div className="border-t border-gray-100 py-1.5">
                <li className="list-none">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group">
                    <div className="p-1.5 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <span className="font-medium">Cerrar sesión</span>
                  </button>
                </li>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out both;
        }
      `}</style>
    </header>
  );
};