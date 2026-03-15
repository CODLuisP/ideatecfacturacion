"use client";

import React from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";

interface AgregarClienteProps {
  isOpen: boolean;
  nuevoCliente: any;
  errors: Record<string, boolean>;
  lengthErrors: Record<string, string>;
  setNuevoCliente: React.Dispatch<React.SetStateAction<any>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setLengthErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleNuevoSubmit: (e: React.FormEvent) => void;
  handleCancelarNuevo: () => void;
}

export const AgregarCliente: React.FC<AgregarClienteProps> = ({
  isOpen,
  nuevoCliente,
  errors,
  lengthErrors,
  setNuevoCliente,
  setErrors,
  setLengthErrors,
  handleNuevoSubmit,
  handleCancelarNuevo,
}) => {

  const buscarDni = async () => {
    if (nuevoCliente.numeroDocumento.length !== 8) return;
    try {
      const res = await fetch(
        `https://dniruc.apisperu.com/api/v1/dni/${nuevoCliente.numeroDocumento}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImVzbHVpc2NhYnJlcmEyMEBnbWFpbC5jb20ifQ.6itYzECdbiU5iZ8loM3Os1kdGrX-dXXOmdrMnYVo2no`
      );
      const data = await res.json();
      if (data.success) {
        const nombreCompleto = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`;
        setNuevoCliente((prev: any) => ({ ...prev, razonSocialNombre: nombreCompleto }));
      }
    } catch (error) {
      console.log("No se pudo consultar DNI, llenar manualmente");
    }
  };

  const buscarRuc = async () => {
    if (nuevoCliente.numeroDocumento.length !== 11) return;

    try {
      const res = await fetch(
        `https://dniruc.apisperu.com/api/v1/ruc/${nuevoCliente.numeroDocumento}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImVzbHVpc2NhYnJlcmEyMEBnbWFpbC5jb20ifQ.6itYzECdbiU5iZ8loM3Os1kdGrX-dXXOmdrMnYVo2no`
      );
      const data = await res.json();
      if (data.ruc) {
        setNuevoCliente((prev: any) => ({
          ...prev,
          razonSocialNombre: data.razonSocial || "",
          nombreComercial: data.nombreComercial || "",
          telefono: data.telefonos?.[0] || "",
          direccion: {
            ...prev.direccion,
            direccionLineal: data.direccion || "",
            departamento: data.departamento || "",
            provincia: data.provincia || "",
            distrito: data.distrito || "",
            ubigeo: data.ubigeo || ""
          }
        }));
      }
    } catch (error) {
      console.log("No se pudo consultar RUC, llenar manualmente");
    }
  };

  //Elegimos que funcion usar
  const buscarDocumento = () => {
    if (nuevoCliente.tipoDocumentoId === "01") {
      buscarDni();
    }

    if (nuevoCliente.tipoDocumentoId === "06") {
      buscarRuc();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancelarNuevo}
      title="Registrar Nuevo Cliente"
    >
      <form className="space-y-4" onSubmit={handleNuevoSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Tipo Documento
            </label>

            <select
              value={nuevoCliente.tipoDocumentoId}
              onChange={(e) =>
                setNuevoCliente((f: any) => ({ ...f, tipoDocumentoId: e.target.value }))
              }
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            >
              <option value="01">DNI</option>
              <option value="06">RUC</option>
              <option value="07">CE</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <InputBase
                  label="Número"
                  value={nuevoCliente.numeroDocumento}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/\D/g, "");
                    const limite = nuevoCliente.tipoDocumentoId === "01" ? 8 : 11;

                    setNuevoCliente((f: any) => ({
                      ...f,
                      numeroDocumento: soloNumeros.slice(0, limite)
                    }));

                    if (errors.numeroDocumento) {
                      setErrors((prev) => ({ ...prev, numeroDocumento: false }));
                    }

                    if (lengthErrors.numeroDocumento) {
                      setLengthErrors((prev) => ({ ...prev, numeroDocumento: "" }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      buscarDocumento();
                    }
                  }}
                  placeholder="Ej:87654321"
                  maxLength={nuevoCliente.tipoDocumentoId === "01" ? 8 : 11}
                  showError={!!errors.numeroDocumento || !!lengthErrors.numeroDocumento}
                  errorMessage={
                    errors.numeroDocumento
                      ? "Campo obligatorio"
                      : lengthErrors.numeroDocumento
                  }
                />
              </div>
                <button
                  type="button"
                  onClick={buscarDocumento}
                  className="h-10.5 px-3 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
                >
                  Buscar
                </button>
            </div>
          </div>
        </div>
        <InputBase
          label={
            nuevoCliente.tipoDocumentoId === "06"
              ? "Razón Social"
              : "Nombre Completo"
          }
          value={nuevoCliente.razonSocialNombre}
          onChange={(e) => {
            setNuevoCliente((f: any) => ({ ...f, razonSocialNombre: e.target.value}));
            if (errors.razonSocialNombre) {
              setErrors((prev) => ({ ...prev, razonSocialNombre: false}));
            }
          }}
          placeholder={
            nuevoCliente.tipoDocumentoId === "06"
              ? "Ej: Aceros S.A.C."
              : "Ej: Juan Perez Neira"
          }
          showError={!!errors.razonSocialNombre}
        />

        {nuevoCliente.tipoDocumentoId === "06" && (
          <InputBase
            label="Nombre Comercial"
            labelOptional="(opcional)"
            value={nuevoCliente.nombreComercial}
            onChange={(e) =>
              setNuevoCliente((f: any) => ({...f, nombreComercial: e.target.value}))
            }
            placeholder="Ej: Aceros del Norte"
            showError={false}
          />
        )}

        <InputBase
          label="Correo Electrónico"
          labelOptional="(opcional)"
          value={nuevoCliente.correo}
          onChange={(e) =>
            setNuevoCliente((f: any) => ({ ...f, correo: e.target.value}))
          }
          placeholder="cliente@ejemplo.com"
          showError={false}
        />

        <InputBase
          label="Teléfono"
          labelOptional="(opcional)"
          value={nuevoCliente.telefono}
          onChange={(e) =>
            setNuevoCliente((f: any) => ({ ...f, telefono: e.target.value}))
          }
          placeholder="Ej: 987654321"
          showError={false}
        />

        {nuevoCliente.tipoDocumentoId === "06" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputBase
              label="Ubigeo"
              value={nuevoCliente.direccion.ubigeo}
              onChange={(e) => {
                setNuevoCliente((f: any) => ({ ...f, direccion: { ...f.direccion, ubigeo: e.target.value} }));
                if (errors["direccion.ubigeo"]) {
                  setErrors((prev) => ({ ...prev, ["direccion.ubigeo"]: false }));
                }
              }}
              placeholder="Ubigeo"
              showError={!!errors["direccion.ubigeo"]}
            />

            <InputBase
              label="Dirección"
              value={nuevoCliente.direccion.direccionLineal}
              onChange={(e) => {
                setNuevoCliente((f: any) => ({ ...f, direccion: {...f.direccion, direccionLineal: e.target.value} }));
                if (errors["direccion.direccionLineal"]) {
                  setErrors((prev) => ({ ...prev, ["direccion.direccionLineal"]: false }));
                }
              }}
              placeholder="Ej: Av. Perú n° 123"
              showError={!!errors["direccion.direccionLineal"]}
            />

            <InputBase
              label="Distrito"
              value={nuevoCliente.direccion.distrito}
              onChange={(e) => {
                setNuevoCliente((f: any) => ({ ...f, direccion: { ...f.direccion, distrito: e.target.value } }));
                if (errors["direccion.distrito"]) {
                  setErrors((prev) => ({ ...prev, ["direccion.distrito"]: false }));
                }
              }}
              placeholder="Distrito"
              showError={!!errors["direccion.distrito"]}
            />

            <InputBase
              label="Provincia"
              value={nuevoCliente.direccion.provincia}
              onChange={(e) => {
                setNuevoCliente((f: any) => ({  ...f, direccion: { ...f.direccion, provincia: e.target.value } }));
                if (errors["direccion.provincia"]) {
                  setErrors((prev) => ({ ...prev, ["direccion.provincia"]: false }));
                }
              }}
              placeholder="Provincia"
              showError={!!errors["direccion.provincia"]}
            />

            <InputBase
              label="Departamento"
              value={nuevoCliente.direccion.departamento}
              onChange={(e) => {
                setNuevoCliente((f: any) => ({ ...f, direccion: { ...f.direccion, departamento: e.target.value } }));
                if (errors["direccion.departamento"]) {
                  setErrors((prev) => ({ ...prev, ["direccion.departamento"]: false }));
                }
              }}
              placeholder="Departamento"
              showError={!!errors["direccion.departamento"]}
            />

            <InputBase
              label="Tipo Dirección"
              labelOptional="(opcional)"
              value={nuevoCliente.direccion.tipoDireccion}
              onChange={(e) =>
                setNuevoCliente((f: any) => ({ ...f, direccion: { ...f.direccion, tipoDireccion: e.target.value } }))
              }
              placeholder="Dirección fiscal"
              showError={false}
            />
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={handleCancelarNuevo}>
            Cancelar
          </Button>
          <Button type="submit">Guardar Cliente</Button>
        </div>
      </form>
    </Modal>
  );
};
