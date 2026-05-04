"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/app/utils/cn";

interface DropdownFiltroProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
  className?: string;
}

export const DropdownFiltro = ({ 
  label, 
  value, 
  options, 
  onChange, 
  colorMap,
  className 
}: DropdownFiltroProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = value !== "Todos" && value !== "";

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-2.5 text-xs font-medium border rounded-md outline-none transition-all shadow-sm whitespace-nowrap",
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
        )}
      >
        <span className="truncate max-w-[150px]">
          {active ? value : label}
        </span>
        {active ? (
          <X 
            size={11} 
            className="text-white/80 hover:text-white shrink-0" 
            onClick={(e) => { e.stopPropagation(); onChange("Todos"); }} 
          />
        ) : (
          <ChevronDown size={12} className={cn("text-gray-400 shrink-0 transition-transform", open && "rotate-180")} />
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden min-w-[140px]">
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left",
                  value === opt ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50",
                )}
              >
                <span className="flex items-center gap-1.5 truncate">
                  {colorMap && opt !== "Todos" && <span className={cn("w-1.5 h-1.5 rounded-full", colorMap[opt])} />}
                  {opt}
                </span>
                {value === opt && <Check size={11} className="text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
