"use client";
import {
  BarChart2,
  CheckCircle,
  FileText,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import { useToast } from "../components/ui/Toast";

export default function Page() {
  const [ruc, setRuc] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [rucHint, setRucHint] = useState({
    text: "Número de 11 dígitos registrado en SUNAT",
    color: "",
  });
  const [clave, setClave] = useState("");
  const [claveError, setClaveError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);

  const [empresaData, setEmpresaData] = useState<any>(null);
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [loading, setLoading] = useState(false);

  const CLAVE_SECRETA = "vadmin123";
  const { showToast } = useToast();

  const handleRUC = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setRuc(val);

    if (val.length === 11) {
      setLoadingRuc(true);
      setRucHint({ text: "Consultando RUC...", color: "#185FA5" });
      try {
        const res = await fetch(
          `https://dniruc.apisperu.com/api/v1/ruc/${val}?token=${process.env.NEXT_PUBLIC_APISPERU_TOKEN}`,
        );
        const data = await res.json();

        if (data.ruc) {
          setEmpresaData(data);
          setRucHint({ text: `✓ ${data.razonSocial}`, color: "#15803d" });
        } else {
          setEmpresaData(null);
          setRucHint({ text: "RUC no encontrado", color: "#DC2626" });
        }
      } catch (err) {
        console.error("Error consultando RUC:", err);
        setRucHint({ text: "Error al consultar RUC", color: "#DC2626" });
      } finally {
        setLoadingRuc(false);
      }
    } else if (val.length > 0) {
      setEmpresaData(null);
      setRucHint({ text: `${val.length}/11 dígitos`, color: "#B45309" });
    } else {
      setEmpresaData(null);
      setRucHint({
        text: "Número de 11 dígitos registrado en SUNAT",
        color: "",
      });
    }
  };

  const handleSubmit = () => {
    if (!ruc || !usuario || !email) {
      alert("Por favor completa todos los campos.");
      return;
    }
    if (ruc.length !== 11) {
      alert("El RUC debe tener 11 dígitos.");
      return;
    }
    setShowModal(true);
    setClave("");
    setClaveError("");
  };

  const handleConfirmarClave = async () => {
    if (clave !== CLAVE_SECRETA) {
      setClaveError("Clave incorrecta. Intenta nuevamente.");
      setClave("");
      return;
    }

    setShowModal(false);
    setLoading(true);

    try {
      // 1. Registrar usuario
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Usuario/register`,
        {
          username: usuario,
          email: email,
          password: "12345678",
          ruc: ruc,
          rol: "admin",
        },
      );
      showToast("Usuario registrado correctamente", "success");

      // 2. Crear empresa
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/companies`, {
        ruc: ruc,
        razonSocial: empresaData?.razonSocial ?? "",
        nombreComercial: empresaData?.nombreComercial ?? null,
        direccion: empresaData?.direccion ?? null,
        ubigeo: empresaData?.ubigeo ?? null,
        urbanizacion: empresaData?.urbanizacion ?? null,
        provincia: empresaData?.provincia ?? null,
        departamento: empresaData?.departamento ?? null,
        distrito: empresaData?.distrito ?? null,
        telefono: empresaData?.telefono ?? null,
        email: email,
        logoBase64: null,
        certificadoPem: null,
        certificadoPassword: null,
        solUsuario: null,
        solClave: null,
        clienteId: null,
        clientSecret: null,
        plan: "free",
        environment: "beta",
      });
      showToast("Empresa registrada correctamente", "success");

      // 3. Enviar correo de bienvenida
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/Email/send`, {
        toEmail: email,
        toName: usuario,
        subject: "¡Bienvenido a Factura Digital! 🎉",
        body: `Hola ${usuario},\n\n¡Tu registro en Factura Digital ha sido exitoso!\n\nYa puedes comenzar a emitir tus comprobantes electrónicos certificados por SUNAT.\n\nEstos son tus datos de acceso:\n  • Usuario: ${usuario}\n  • RUC: ${ruc}\n  • Empresa: ${empresaData?.razonSocial ?? ""}\n  • Contraseña: 12345678 (por defecto)\n\n⚠️ Por seguridad, te recomendamos cambiar tu contraseña lo antes posible desde la opción "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión.\n\nSi tienes alguna consulta, no dudes en contactarnos.\n\n¡Bienvenido a bordo!\n\nEl equipo de Factura Digital`,
        tipo: "0",
      });
      showToast("Correo de bienvenida enviado", "success");

      setSuccess(true);
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || "Error inesperado";
      console.error("Error:", msg);

      const lower = msg.toLowerCase();
      if (lower.includes("username") || lower.includes("usuario")) {
        showToast("El nombre de usuario ya está registrado", "error");
      } else if (lower.includes("email") && lower.includes("otro ruc")) {
        showToast("El correo ya está registrado con otro RUC", "error");
      } else if (lower.includes("ruc")) {
        showToast("El RUC ya tiene un usuario registrado", "error");
      } else {
        showToast(`Error: ${msg}`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "#0F2D6E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');`}</style>
        <div style={{ textAlign: "center", color: "#fff", padding: "2rem" }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: "#DC2626",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <CheckCircle size={36} color="white" />
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            ¡Registro exitoso!
          </div>
          <div
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 8,
            }}
          >
            Usuario <strong style={{ color: "#fff" }}>{usuario}</strong>{" "}
            registrado correctamente.
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Se envió un correo de verificación a {email}
          </div>
          <button
            onClick={() => {
              setSuccess(false);
              setRuc("");
              setUsuario("");
              setEmail("");
              setRucHint({
                text: "Número de 11 dígitos registrado en SUNAT",
                color: "",
              });
            }}
            style={{
              marginTop: "2rem",
              padding: "12px 32px",
              background: "#DC2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Registrar otro usuario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        .field-input {
          width: 100%;
          height: 48px;
          padding: 0 14px 0 44px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: #94a3b8; }
        .field-input:focus {
          border-color: #185FA5;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(24,95,165,0.12);
        }
        .clave-input {
          width: 100%;
          height: 48px;
          padding: 0 14px 0 44px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: #1e293b;
          outline: none;
          letter-spacing: 0.15em;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .clave-input:focus { border-color: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,0.12); }
        .clave-input.error { border-color: #DC2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.12); }
        .btn-submit {
          width: 100%;
          height: 52px;
          background: #0F2D6E;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, transform 0.1s;
        }
        .btn-submit:hover { background: #185FA5; }
        .btn-submit:active { transform: scale(0.99); }
        .btn-confirm {
          flex: 1;
          height: 46px;
          background: #0F2D6E;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-confirm:hover { background: #185FA5; }
        .btn-cancel {
          flex: 1;
          height: 46px;
          background: transparent;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-cancel:hover { background: #f8fafc; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* SIDEBAR */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: "#0F2D6E",
          padding: "3rem 2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(220,38,38,0.15)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(220,38,38,0.08)",
          }}
        />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "#DC2626",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <FileText size={26} color="white" />
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            FACTURA DIGITAL
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Sistema de facturación electrónica
          </div>
          <div
            style={{
              width: 32,
              height: 2,
              background: "#DC2626",
              borderRadius: 2,
              margin: "24px 0",
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.7,
            }}
          >
            Registra tu empresa en el sistema de facturación electrónica
            certificado por SUNAT.
          </div>
        </div>

        {/* Features */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {[
            {
              icon: <Zap size={16} color="#fff" />,
              text: "Emisión en tiempo real",
            },
            {
              icon: <ShieldCheck size={16} color="#fff" />,
              text: "Certificado digital incluido",
            },
            {
              icon: <BarChart2 size={16} color="#fff" />,
              text: "Panel de reportes",
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {f.icon}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            lineHeight: 1.6,
          }}
        >
          Certificado por SUNAT · Perú
          <br />© 2025 FacturaDigital
        </div>
      </div>

      {/* FORM PANEL */}
      <div
        style={{
          flex: 1,
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #0F2D6E 50%, #DC2626 50%)",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "#fff",
            borderRadius: 16,
            border: "0.5px solid #e2e8f0",
            padding: "2.5rem 2.5rem",
            boxShadow: "0 4px 40px rgba(15,45,110,0.08)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 500,
                color: "#185FA5",
                background: "#E6F1FB",
                padding: "4px 12px",
                borderRadius: 20,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#DC2626",
                }}
              />
              Nuevo registro
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#1e293b",
                lineHeight: 1.15,
                marginBottom: 8,
              }}
            >
              CREAR CUENTA
            </div>
            <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              Ingresa los datos de tu empresa para comenzar con la facturación
              electrónica.
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
              <div
                style={{
                  height: 3,
                  width: 32,
                  background: "#0F2D6E",
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  height: 3,
                  width: 16,
                  background: "#DC2626",
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  height: 3,
                  width: 8,
                  background: "#e2e8f0",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {/* RUC */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#475569",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                RUC <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#185FA5",
                    opacity: 0.55,
                    pointerEvents: "none",
                    display: "flex",
                  }}
                >
                  <FileText size={16} />
                </span>
                <input
                  className="field-input"
                  type="text"
                  placeholder="20XXXXXXXXXXX"
                  maxLength={11}
                  value={ruc}
                  onChange={handleRUC}
                />
              </div>
              <span style={{ fontSize: 11, color: rucHint.color || "#94a3b8" }}>
                {rucHint.text}
              </span>
            </div>

            {/* Usuario */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#475569",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                Nombre de usuario <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#185FA5",
                    opacity: 0.55,
                    pointerEvents: "none",
                    display: "flex",
                  }}
                >
                  <User size={16} />
                </span>
                <input
                  className="field-input"
                  type="text"
                  placeholder="usuario_empresa"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Mínimo 4 caracteres, sin espacios
              </span>
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#475569",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                Correo electrónico <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#185FA5",
                    opacity: 0.55,
                    pointerEvents: "none",
                    display: "flex",
                  }}
                >
                  <Mail size={16} />
                </span>
                <input
                  className="field-input"
                  type="email"
                  placeholder="empresa@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Se enviará un código de verificación
              </span>
            </div>
          </div>

          {/* Submit */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ animation: "spin 0.9s linear infinite" }}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Registrando...
                </>
              ) : (
                <>
                  Registrar usuario
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <KeyRound size={12} color="white" />
                  </span>
                </>
              )}
            </button>
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Lock size={12} color="#185FA5" opacity={0.5} />
              Datos protegidos con cifrado SSL · SUNAT
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CLAVE */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,45,110,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "2rem",
              width: "100%",
              maxWidth: 380,
              boxShadow: "0 20px 60px rgba(15,45,110,0.25)",
              border: "0.5px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: "#0F2D6E",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <KeyRound size={20} color="white" />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  Clave de autorización
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  Ingresa la clave para confirmar el registro
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 18,
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.5,
                border: "0.5px solid #e2e8f0",
              }}
            >
              <strong style={{ color: "#1e293b" }}>Resumen:</strong>
              <br />
              RUC: {ruc} · Usuario: {usuario}
            </div>

            <div style={{ position: "relative", marginBottom: 8 }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#185FA5",
                  opacity: 0.5,
                  pointerEvents: "none",
                  display: "flex",
                }}
              >
                <Lock size={16} />
              </span>
              <input
                className={`clave-input${claveError ? " error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={clave}
                onChange={(e) => {
                  setClave(e.target.value);
                  setClaveError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmarClave()}
                autoFocus
              />
            </div>

            {claveError && (
              <div
                style={{
                  fontSize: 12,
                  color: "#DC2626",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ShieldCheck size={12} color="#DC2626" />
                {claveError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: claveError ? 0 : 14,
              }}
            >
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleConfirmarClave}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
