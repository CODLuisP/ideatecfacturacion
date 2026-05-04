import { useState } from "react";
import axios from "axios";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";
import { Modal } from "@/app/components/ui/Modal";
import { Cliente, Direccion } from "./typesCliente";
import { useToast } from "@/app/components/ui/Toast";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Props {
  cliente: Cliente;
  onClose: () => void;
  onSave: (c: Cliente) => void;
}

export const EditarClienteModal: React.FC<Props> = ({
  cliente,
  onClose,
  onSave,
}) => {
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();
  const [form, setForm] = useState<Cliente>({ ...cliente });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mostrarDireccion, setMostrarDireccion] = useState(
    // si ya tiene dirección, mostrarla abierta por defecto
    !!(cliente.direccion && cliente.direccion.length > 0)
  );

  const updateForm = (campo: keyof Cliente, valor: any) => {
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const updateDireccion = (campo: keyof Direccion, valor: string) => {
    setForm((f) => {
      const direccionBase =
        f.direccion && f.direccion.length > 0
          ? f.direccion[0]
          : {
              direccionId: 0,
              ubigeo: "",
              direccionLineal: "",
              departamento: "",
              provincia: "",
              distrito: "",
              tipoDireccion: "",
            };

      return {
        ...f,
        direccion: [{ ...direccionBase, [campo]: valor }],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.razonSocialNombre || form.razonSocialNombre.trim() === "") {
      showToast(
        form.tipoDocumento.tipoDocumentoId === "06"
          ? "La razón social es obligatoria."
          : "El nombre completo es obligatorio.",
        "info"
      );
      return;
    }

    setIsSubmitting(true);

    const emptyToNull = (val: string | null | undefined) =>
      !val || val.trim() === "" ? null : val;

    try {
      const payloadCliente = {
        clienteId: form.clienteId,
        razonSocialNombre: form.razonSocialNombre,
        numeroDocumento: form.numeroDocumento,
        telefono: form.telefono,
        correo: form.correo,
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Cliente/${form.clienteId}`,
        payloadCliente,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // ─── Dirección para cualquier tipo de documento ───
      if (form.direccion && form.direccion.length > 0) {
        const d = form.direccion[0];
        const tieneDatos = esDni
          ? d.direccionLineal || d.tipoDireccion
          : d.direccionLineal || d.distrito || d.provincia || d.departamento || d.ubigeo;

        if (tieneDatos) {
          const payloadDireccion = esDni
            ? {
                direccionLineal: emptyToNull(d.direccionLineal),
                ubigeo: null,
                departamento: null,
                provincia: null,
                distrito: null,
                tipoDireccion: emptyToNull(d.tipoDireccion),
              }
            : {
                direccionLineal: d.direccionLineal,
                ubigeo: d.ubigeo,
                departamento: d.departamento,
                provincia: d.provincia,
                distrito: d.distrito,
                tipoDireccion: d.tipoDireccion,
              };

          if (d.direccionId && d.direccionId > 0) {
            // ya existe → PUT
            await axios.put(
              `${process.env.NEXT_PUBLIC_API_URL}/api/Direccion/${d.direccionId}`,
              { ...payloadDireccion, direccionId: d.direccionId },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          } else {
            // nueva dirección → POST
            await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/Direccion`,
              { ...payloadDireccion, clienteId: form.clienteId },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          }
        }
      }

      showToast("Cliente actualizado correctamente.", "success");
      onSave(form);
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 400) {
          showToast("Los datos ingresados no son válidos.", "error");
        } else if (status === 404) {
          showToast("No se encontró el cliente a actualizar.", "error");
        } else {
          showToast("No se pudo actualizar el cliente. Intenta nuevamente.", "error");
        }
      } else {
        showToast("Error inesperado. Intenta nuevamente.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const esDni = form.tipoDocumento.tipoDocumentoId !== "06";

  return (
    <Modal isOpen onClose={onClose} title="Editar Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Tipo Documento
            </label>
            <select
              value={form.tipoDocumento.tipoDocumentoId}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
            >
              <option value="01">DNI</option>
              <option value="06">RUC</option>
              <option value="07">CE</option>
            </select>
          </div>

          <InputBase
            label="Número"
            value={form.numeroDocumento}
            disabled
            showError={false}
          />
        </div>

        <InputBase
          label={
            form.tipoDocumento.tipoDocumentoId === "06"
              ? "Razón Social"
              : "Nombre Completo"
          }
          value={form.razonSocialNombre}
          onChange={(e) => updateForm("razonSocialNombre", e.target.value)}
          showError={false}
        />

        <InputBase
          label="Correo Electrónico"
          labelOptional="(opcional)"
          value={form.correo ?? ""}
          onChange={(e) => updateForm("correo", e.target.value || null)}
          showError={false}
        />

        <InputBase
          label="Teléfono"
          labelOptional="(opcional)"
          value={form.telefono ?? ""}
          onChange={(e) => updateForm("telefono", e.target.value || null)}
          showError={false}
        />

        {/* ───────── Dirección RUC — siempre visible ───────── */}
        {!esDni && form.direccion && form.direccion.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputBase
              label="Ubigeo"
              value={form.direccion[0].ubigeo ?? ""}
              onChange={(e) => updateDireccion("ubigeo", e.target.value)}
              showError={false}
            />
            <InputBase
              label="Dirección"
              value={form.direccion[0].direccionLineal ?? ""}
              onChange={(e) => updateDireccion("direccionLineal", e.target.value)}
              showError={false}
            />
            <InputBase
              label="Distrito"
              value={form.direccion[0].distrito ?? ""}
              onChange={(e) => updateDireccion("distrito", e.target.value)}
              showError={false}
            />
            <InputBase
              label="Provincia"
              value={form.direccion[0].provincia ?? ""}
              onChange={(e) => updateDireccion("provincia", e.target.value)}
              showError={false}
            />
            <InputBase
              label="Departamento"
              value={form.direccion[0].departamento ?? ""}
              onChange={(e) => updateDireccion("departamento", e.target.value)}
              showError={false}
            />
            <InputBase
              label="Tipo Dirección"
              labelOptional="(opcional)"
              value={form.direccion[0].tipoDireccion ?? ""}
              onChange={(e) => updateDireccion("tipoDireccion", e.target.value)}
              showError={false}
            />
          </div>
        )}

        {/* ───────── Dirección DNI/CE — opcional con toggle ───────── */}
        {esDni && (
          <div className={`border rounded-xl transition-colors ${mostrarDireccion ? "border-brand-blue" : "border-gray-200"}`}>
            <button
              type="button"
              onClick={() => setMostrarDireccion((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-brand-blue transition-colors"
            >
              <span>Dirección (opcional)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mostrarDireccion ? "rotate-180" : ""}`} />
            </button>

            {mostrarDireccion && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
                <InputBase
                  label="Dirección"
                  labelOptional="(opcional)"
                  value={form.direccion?.[0]?.direccionLineal ?? ""}
                  onChange={(e) => updateDireccion("direccionLineal", e.target.value)}
                  showError={false}
                />
                <InputBase
                  label="Tipo Dirección"
                  labelOptional="(opcional)"
                  value={form.direccion?.[0]?.tipoDireccion ?? ""}
                  onChange={(e) => updateDireccion("tipoDireccion", e.target.value)}
                  showError={false}
                />
              </div>
            )}
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};