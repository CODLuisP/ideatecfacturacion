"use client";
import { useRouter } from 'next/navigation';

export default function EmisionPage() {
  const router = useRouter();

  return (
    <div className="mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Módulo Emisión Rápida</h2>
      </div>
    </div>
  );
}