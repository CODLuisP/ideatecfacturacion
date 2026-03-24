import { useState } from "react";
import axios from "axios";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";
import { Modal } from "@/app/components/ui/Modal";
import { Cliente, Direccion } from "./Cliente";
import { useToast } from "@/app/components/ui/Toast";

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
  const [form, setForm] = useState<Cliente>({ ...cliente });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (campo: keyof Cliente, valor: any) => {
    setForm((f) => ({
      ...f,
      [campo]: valor,
    }));
  };

  const updateDireccion = (campo: keyof Direccion, valor: string) => {
    if (!form.direccion || form.direccion.length === 0) return;

    setForm((f) => ({
      ...f,
      direccion: [
        {
          ...f.direccion[0],
          [campo]: valor,
        },
      ],
    }));
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

    try {
      const payloadCliente = {
        clienteId: form.clienteId,
        razonSocialNombre: form.razonSocialNombre,
        numeroDocumento: form.numeroDocumento,
        nombreComercial: form.nombreComercial,
        telefono: form.telefono,
        correo: form.correo,
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Cliente/${form.clienteId}`,
        payloadCliente,
      );

      if (form.tipoDocumento.tipoDocumentoId === "06" && form.direccion) {
        const payloadDireccion = {
          direccionId: form.direccion[0].direccionId,
          direccionLineal: form.direccion[0].direccionLineal,
          ubigeo: form.direccion[0].ubigeo,
          departamento: form.direccion[0].departamento,
          provincia: form.direccion[0].provincia,
          distrito: form.direccion[0].distrito,
          tipoDireccion: form.direccion[0].tipoDireccion,
        };

        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Direccion/${form.direccion[0].direccionId}`,
          payloadDireccion,
        );
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

        {form.tipoDocumento.tipoDocumentoId === "06" && (
          <InputBase
            label="Nombre Comercial"
            labelOptional="(opcional)"
            value={form.nombreComercial ?? ""}
            onChange={(e) =>
              updateForm("nombreComercial", e.target.value || null)
            }
            showError={false}
          />
        )}

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

        {/* ───────── Dirección solo RUC ───────── */}

        {form.tipoDocumento.tipoDocumentoId === "06" &&
          form.direccion &&
          form.direccion.length > 0 && (
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
                onChange={(e) =>
                  updateDireccion("direccionLineal", e.target.value)
                }
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
                onChange={(e) =>
                  updateDireccion("departamento", e.target.value)
                }
                showError={false}
              />

              <InputBase
                label="Tipo Dirección"
                labelOptional="(opcional)"
                value={form.direccion[0].tipoDireccion ?? ""}
                onChange={(e) =>
                  updateDireccion("tipoDireccion", e.target.value)
                }
                showError={false}
              />
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
