"use client";

import React, { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/app/utils/cn";

interface Sucursal {
  sucursalId: number;
  nombre: string;
}

interface DropdownSucursalProps {
  sucursales: Sucursal[];
  seleccionada: number | null;
  onSelect: (id: number | null) => void;
}

export function DropdownSucursal({
  sucursales,
  seleccionada,
  onSelect,
}: DropdownSucursalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sucursalActual = sucursales.find((s) => s.sucursalId === seleccionada);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md",
          isOpen && "border-blue-500 ring-4 ring-blue-50"
        )}
      >
        <Building2
          size={16}
          className={cn(
            "text-gray-400 transition-colors duration-200",
            isOpen && "text-blue-500"
          )}
        />
        <div className="flex flex-col items-start min-w-35">
          <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mb-1">
            Sucursal
          </span>
          <span className="text-[12px] font-bold text-gray-700 leading-none">
            {sucursalActual?.nombre || "Todas las sucursales"}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180 text-blue-500"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 w-full min-w-50 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-1.5">
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors text-left group",
                  seleccionada === null
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                )}
              >
                <span className="text-[12px] font-bold">Todas las sucursales</span>
                {seleccionada === null && <Check size={14} className="text-blue-600" />}
              </button>

              <div className="h-px bg-gray-100 my-1.5 mx-2" />

              <div className="max-h-75 overflow-y-auto custom-scrollbar">
                {sucursales.map((s) => (
                  <button
                    key={s.sucursalId}
                    onClick={() => {
                      onSelect(s.sucursalId);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2 rounded-lg transition-colors text-left group ",
                      seleccionada === s.sucursalId
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50 text-gray-600 hover:text-gray-900 "
                    )}
                  >
                    <span className="text-sm font-bold text-[12px]">{s.nombre}</span>
                    {seleccionada === s.sucursalId && (
                      <Check size={14} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
