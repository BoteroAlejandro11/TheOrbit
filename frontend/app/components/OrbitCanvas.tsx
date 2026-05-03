"use client";

import { useEffect, useRef } from "react";

// --- TIPOS ---
interface Artista {
  nombre: string;
  color: string;
}

// --- DATOS DE ARTISTAS (placeholder — luego vendrán del backend) ---
const artistas: Artista[] = [
  { nombre: "Bad Bunny", color: "#9d33ff" },
  { nombre: "The Weeknd", color: "#9d33ff" },
  { nombre: "Drake", color: "#9d33ff" },
  { nombre: "Ariana Grande", color: "#9d33ff" },
  { nombre: "Kendrick Lamar", color: "#9d33ff" },
  { nombre: "Bruno Mars", color: "#9d33ff" },
  { nombre: "Billie Eilish", color: "#9d33ff" },
  { nombre: "Taylor Swift", color: "#9d33ff" },
];

export default function OrbitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- 1. IMAGEN CENTRAL ---
    const imgCentro = new Image();
    imgCentro.src = "/LogoCentral.png";
    let imgCentroLista = false;
    imgCentro.onload = () => {
      imgCentroLista = true;
    };

    // --- 2. RESIZE ---
    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // --- 3. ESTADO DE LA CÁMARA ---
    const camara = { x: 0, y: 0, zoom: 1 };

    // --- 4. RENDER LOOP ---
    let animFrameId: number;

    function render() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centroX =
        (0 - camara.x) * camara.zoom + canvas.width / 2;
      const centroY =
        (0 - camara.y) * camara.zoom + canvas.height / 2;

      ctx.save();
      ctx.translate(centroX, centroY);

      // Logo central
      if (imgCentroLista) {
        const tamLogo = 447 * camara.zoom;
        ctx.drawImage(
          imgCentro,
          -tamLogo / 2,
          -tamLogo / 2,
          tamLogo,
          tamLogo
        );
      }

      // Texto principal
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.font = `bold ${42 * camara.zoom}px 'Geologica', sans-serif`;
      ctx.fillText("THE ORBIT", 0, -5 * camara.zoom);

      ctx.font = `400 ${14 * camara.zoom}px 'Geologica', sans-serif`;
      ctx.fillText("NEXO MUSICAL DEL MOMENTO", 0, 35 * camara.zoom);

      // Nodos de artistas orbitando
      const radioOrbita = 320 * camara.zoom;
      artistas.forEach((artista, i) => {
        const angulo =
          (i * (Math.PI * 2)) / artistas.length - Math.PI / 2;
        const x = Math.cos(angulo) * radioOrbita;
        const y = Math.sin(angulo) * radioOrbita;

        // Círculo con resplandor morado
        ctx.beginPath();
        ctx.arc(x, y, 55 * camara.zoom, 0, Math.PI * 2);
        ctx.shadowBlur = 20 * camara.zoom;
        ctx.shadowColor = "#9d33ff";
        ctx.fillStyle = "#1a1a1a";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Nombre del artista
        ctx.fillStyle = "white";
        ctx.font = `400 ${14 * camara.zoom}px 'Geologica', sans-serif`;
        ctx.fillText(artista.nombre, x, y + 80 * camara.zoom);
      });

      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    }

    render();

    // --- 5. MOVIMIENTO (DRAG & DROP MULTIDIRECCIONAL) ---
    let arrastrando = false;
    let posAnterior = { x: 0, y: 0 };

    function onMouseDown(e: MouseEvent) {
      arrastrando = true;
      posAnterior = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp() {
      arrastrando = false;
    }

    function onMouseMove(e: MouseEvent) {
      if (!arrastrando) return;
      camara.x -= (e.clientX - posAnterior.x) / camara.zoom;
      camara.y -= (e.clientY - posAnterior.y) / camara.zoom;
      posAnterior = { x: e.clientX, y: e.clientY };
    }

    // Soporte táctil (móvil)
    function onTouchStart(e: TouchEvent) {
      arrastrando = true;
      posAnterior = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }

    function onTouchEnd() {
      arrastrando = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (!arrastrando) return;
      e.preventDefault();
      camara.x -= (e.touches[0].clientX - posAnterior.x) / camara.zoom;
      camara.y -= (e.touches[0].clientY - posAnterior.y) / camara.zoom;
      posAnterior = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }

    // Zoom con rueda del mouse
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      camara.zoom = Math.min(Math.max(camara.zoom * factor, 0.2), 5);
    }

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // --- 6. CLEANUP ---
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#0a0a0a",
        cursor: "grab",
        display: "block",
      }}
    />
  );
}
