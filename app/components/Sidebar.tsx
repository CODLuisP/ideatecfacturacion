'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';

export function Sidebar() {
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Ideatec Facturación</h1>
        {session?.user && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{session.user.username}</p>
              <p className="text-xs text-gray-400 truncate">{session.user.rol}</p>
            </div>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/ideatecfactus" className="block px-4 py-2 hover:bg-gray-800 rounded">
          Dashboard
        </Link>
        <div className="pt-4 pb-2 px-4 text-xs uppercase text-gray-500 font-semibold">
          Módulos
        </div>
        <Link href="/ideatecfactus/facturacion" className="block px-4 py-2 hover:bg-gray-800 rounded">
          Facturación
        </Link>
        <Link href="/ideatecfactus/inventario" className="block px-4 py-2 hover:bg-gray-800 rounded">
          Inventario
        </Link>
        <Link href="/ideatecfactus/clientes" className="block px-4 py-2 hover:bg-gray-800 rounded">
          Clientes
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-900/50 text-red-400 rounded transition-colors"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}