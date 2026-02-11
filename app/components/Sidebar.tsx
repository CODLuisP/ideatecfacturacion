'use client'

import Link from 'next/link'
import { logout } from '../actions/auth'

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Ideatec Facturación</h1>
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
        <form action={logout}>
            <button type="submit" className="w-full text-left px-4 py-2 hover:bg-red-900/50 text-red-400 rounded transition-colors">
            Cerrar Sesión
            </button>
        </form>
      </div>
    </aside>
  )
}
