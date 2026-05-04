"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Mode = "register" | "login";

export default function DenPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Campos
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function handleSubmit() {
    setError("");

    if (mode === "register") {
      if (!email || !username || !password || !confirm) {
        setError("Completa todos los campos.");
        return;
      }
      if (password !== confirm) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("http://localhost:3000/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Error al registrarse");
        setMode("login");
        setError("✓ Registro exitoso. Ahora inicia sesión.");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }

    } else {
      if (!email || !password) {
        setError("Completa todos los campos.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("http://localhost:3000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Credenciales inválidas");

        // Guardar token en localStorage para uso posterior
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        router.push("/inicio");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* Resplandor morado de fondo */}
      <div style={styles.glow} />

      {/* Logo */}
      <div style={styles.logoWrap}>
        <Image
          src="/LogoConejo.png"
          alt="The Orbit"
          width={120}
          height={120}
          style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
          priority
        />
      </div>

      {/* Título */}
      <h1 style={styles.title}>DEN</h1>

      {/* Tarjeta */}
      <div style={styles.card}>
        {/* Flecha volver */}
        <button style={styles.backBtn} onClick={() => router.push("/inicio")}>
          ←
        </button>

        {mode === "register" ? (
          <>
            <Field label="Correo:" type="email" value={email} onChange={setEmail} />
            <Field label="Usuario:" type="text" value={username} onChange={setUsername} />
            <Field label="Contraseña:" type="password" value={password} onChange={setPassword} />
            <Field label="Confirmar Contraseña:" type="password" value={confirm} onChange={setConfirm} />

            {error && (
              <p style={{ ...styles.error, color: error.startsWith("✓") ? "#4ade80" : "#f87171" }}>
                {error}
              </p>
            )}

            <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </button>

            <button style={styles.switchBtn} onClick={() => { setMode("login"); setError(""); }}>
              Ya tienes cuenta? Click aquí
            </button>
          </>
        ) : (
          <>
            <Field label="Correo:" type="email" value={email} onChange={setEmail} />
            <Field label="Contraseña:" type="password" value={password} onChange={setPassword} />

            {error && (
              <p style={{ ...styles.error, color: error.startsWith("✓") ? "#4ade80" : "#f87171" }}>
                {error}
              </p>
            )}

            <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? "Ingresando..." : "INGRESAR"}
            </button>

            <button style={styles.switchBtn} onClick={() => { setMode("register"); setError(""); }}>
              ¿No tienes cuenta? Regístrate
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...styles.input,
          border: focused ? "1px solid rgba(157,51,255,0.8)" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: focused ? "0 0 10px rgba(157,51,255,0.3)" : "none",
        }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Geologica', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "40px 20px",
  },
  glow: {
    position: "absolute",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(80,0,120,0.6) 0%, transparent 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  logoWrap: {
    position: "relative",
    zIndex: 1,
    marginBottom: 8,
  },
  title: {
    color: "white",
    fontSize: "clamp(48px, 10vw, 80px)",
    fontWeight: 700,
    letterSpacing: "8px",
    margin: "0 0 24px",
    position: "relative",
    zIndex: 1,
    fontFamily: "'Geologica', sans-serif",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(30, 15, 50, 0.85)",
    borderRadius: 12,
    padding: "32px 36px",
    width: "100%",
    maxWidth: 340,
    backdropFilter: "blur(10px)",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.6)",
    fontSize: 20,
    cursor: "pointer",
    padding: 4,
  },
  label: {
    display: "block",
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginBottom: 6,
    fontFamily: "'Geologica', sans-serif",
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    background: "rgba(0,0,0,0.4)",
    borderRadius: 4,
    color: "white",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Geologica', sans-serif",
    transition: "border 0.2s, box-shadow 0.2s",
  },
  error: {
    fontSize: 12,
    margin: "0 0 12px",
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    padding: "10px",
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 2,
    cursor: "pointer",
    fontFamily: "'Geologica', sans-serif",
    marginBottom: 12,
    transition: "background 0.2s",
  },
  switchBtn: {
    background: "none",
    border: "none",
    color: "rgba(157,51,255,0.9)",
    fontSize: 12,
    cursor: "pointer",
    textDecoration: "underline",
    fontFamily: "'Geologica', sans-serif",
    display: "block",
    margin: "0 auto",
  },
};