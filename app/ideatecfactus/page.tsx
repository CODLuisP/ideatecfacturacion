export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-500">Ventas del Día</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">S/. 0.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-500">Facturas Emitidas</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-500">Clientes Nuevos</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">0</p>
        </div>
      </div>
    </div>
  )
}
