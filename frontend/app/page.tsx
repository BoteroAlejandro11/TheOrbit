"use client";
 
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
 
export default function Bienvenida() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
 
  // Fondo animado con partículas flotantes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
 
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
 
    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
 
    // Partículas
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }));
 
    let animId: number;
 
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
 
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
 
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(157, 51, 255, ${p.alpha})`;
        ctx.fill();
      });
 
      animId = requestAnimationFrame(draw);
    }
 
    draw();
 
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);
 
  return (
    <div style={styles.wrapper}>
      {/* Fondo de partículas */}
      <canvas ref={canvasRef} style={styles.canvas} />
 
      {/* Resplandor central */}
      <div style={styles.glow} />
 
      {/* Contenido */}
      <main style={styles.main}>
        <p style={styles.eyebrow}>DESCUBRE TU UNIVERSO MUSICAL</p>
 
        <h1 style={styles.title}>
          THE<br />
          <span style={styles.titleAccent}>ORBIT</span>
        </h1>
 
        <p style={styles.subtitle}>
          Explora artistas, géneros y conexiones musicales<br />
          en un mapa espacial interactivo.
        </p>
 
        <button
          style={styles.button}
          onClick={() => router.push("/inicio")}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
            (e.currentTarget as HTMLButtonElement).style.color = "#9d33ff";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 40px rgba(157,51,255,0.8)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 20px rgba(157,51,255,0.4)";
          }}
        >
          COMENZAR
        </button>
      </main>
    </div>
  );
}
 
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    background: "#0d001a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontFamily: "'Geologica', sans-serif",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  glow: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(157,51,255,0.15) 0%, transparent 70%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  main: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "24px",
  },
  eyebrow: {
    color: "#9d33ff",
    fontSize: "11px",
    letterSpacing: "4px",
    fontWeight: 700,
    margin: 0,
  },
  title: {
    color: "#ffffff",
    fontSize: "clamp(64px, 12vw, 120px)",
    fontWeight: 700,
    lineHeight: 0.9,
    margin: 0,
    letterSpacing: "-2px",
  },
  titleAccent: {
    color: "#9d33ff",
    textShadow: "0 0 40px rgba(157,51,255,0.6)",
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "15px",
    lineHeight: 1.8,
    margin: 0,
    fontWeight: 400,
  },
  button: {
    marginTop: "16px",
    padding: "16px 56px",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "4px",
    color: "#fff",
    background: "transparent",
    border: "1.5px solid #9d33ff",
    borderRadius: "40px",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(157,51,255,0.4)",
    transition: "all 0.3s ease",
    fontFamily: "'Geologica', sans-serif",
  },
};