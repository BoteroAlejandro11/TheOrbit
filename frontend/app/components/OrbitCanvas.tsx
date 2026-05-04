"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Artist {
  _id: string;
  name: string;
  x: number;
  y: number;
  popularity: number;
  profile_image: string | null;
  genres: string[];
  spotify_id: string;
}

function resolveOverlaps(artists: Artist[]): Map<string, { x: number; y: number }> {
  const minDist = 130;
  const logoRadius = 220;
  const positions = new Map<string, { x: number; y: number }>(
    artists.map((a) => [a._id, { x: a.x, y: a.y }])
  );

  for (let pass = 0; pass < 50; pass++) {
    let moved = false;

    positions.forEach((pos, id) => {
      const distLogo = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      if (distLogo < logoRadius) {
        const angle = Math.atan2(pos.y, pos.x);
        pos.x = Math.cos(angle) * logoRadius;
        pos.y = Math.sin(angle) * logoRadius;
        moved = true;
      }

      positions.forEach((other, otherId) => {
        if (otherId === id) return;
        const dx = pos.x - other.x;
        const dy = pos.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && dist > 0) {
          const angle = Math.atan2(dy, dx);
          const push = (minDist - dist + 5) / 2;
          pos.x += Math.cos(angle) * push;
          pos.y += Math.sin(angle) * push;
          other.x -= Math.cos(angle) * push;
          other.y -= Math.sin(angle) * push;
          moved = true;
        }
      });
    });

    if (!moved) break;
  }

  return positions;
}

export default function OrbitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artistsRef = useRef<Artist[]>([]);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const resolvedPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Recuperar cámara ──────────────────────────────────────
    const camara = { x: 0, y: 0, zoom: 1 };
    try {
      const saved = sessionStorage.getItem("orbit-camera");
      if (saved) {
        const p = JSON.parse(saved);
        camara.x = p.x ?? 0;
        camara.y = p.y ?? 0;
        camara.zoom = p.zoom ?? 1;
      }
    } catch (_) {}

    // ── Resize ────────────────────────────────────────────────
    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // ── Fetch artists ─────────────────────────────────────────
    async function fetchArtists(initial = false) {
      let x1, x2, y1, y2;
      if (initial) {
        x1 = -5000; x2 = 5000; y1 = -5000; y2 = 5000;
      } else {
        const pad = 1000;
        const halfW = canvas!.width / 2 / camara.zoom;
        const halfH = canvas!.height / 2 / camara.zoom;
        x1 = camara.x - halfW - pad;
        x2 = camara.x + halfW + pad;
        y1 = camara.y - halfH - pad;
        y2 = camara.y + halfH + pad;
      }

      try {
        const res = await fetch(
          `http://localhost:3000/map/artists?x1=${x1}&y1=${y1}&x2=${x2}&y2=${y2}&limit=200`
        );
        const data = await res.json();

        const newIds = (data.artists ?? []).map((a: Artist) => a._id).join(",");
        const oldIds = artistsRef.current.map((a) => a._id).join(",");

        if (newIds !== oldIds) {
          artistsRef.current = data.artists ?? [];
          resolvedPositions.current = resolveOverlaps(artistsRef.current);

          artistsRef.current.forEach((artist) => {
            if (artist.profile_image && !imageCache.current[artist._id]) {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.src = artist.profile_image;
              imageCache.current[artist._id] = img;
            }
          });
        }
      } catch (e) {
        console.error("Failed to fetch artists", e);
      }
    }

    fetchArtists(true);
    const fetchInterval = setInterval(() => fetchArtists(false), 30000);

    // ── Render loop ───────────────────────────────────────────
    let animFrameId: number;

    function render() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const screenCX = canvas.width / 2;
      const screenCY = canvas.height / 2;

      function toScreen(wx: number, wy: number) {
        return {
          sx: (wx - camara.x) * camara.zoom + screenCX,
          sy: (wy - camara.y) * camara.zoom + screenCY,
        };
      }

      const { sx: cx, sy: cy } = toScreen(0, 0);

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200 * camara.zoom);
      gradient.addColorStop(0, "rgba(157, 51, 255, 0.12)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 200 * camara.zoom, 0, Math.PI * 2);
      ctx.fill();

      const ringConfigs = [
        { rx: 90, ry: 35, angle: 0 },
        { rx: 90, ry: 35, angle: Math.PI / 3 },
        { rx: 90, ry: 35, angle: -Math.PI / 3 },
      ];

      ringConfigs.forEach(({ rx, ry, angle }) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.scale(camara.zoom, camara.zoom);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(157, 51, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#9d33ff";
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      ctx.beginPath();
      ctx.arc(cx, cy, 130 * camara.zoom, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(157, 51, 255, 0.8)";
      ctx.lineWidth = 1.5 * camara.zoom;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#9d33ff";
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.font = `bold ${42 * camara.zoom}px 'Geologica', sans-serif`;
      ctx.fillText("THE ORBIT", cx + 1, cy + 15 * camara.zoom);

      ctx.font = `700 ${16 * camara.zoom}px 'Geologica', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.letterSpacing = `${3 * camara.zoom}px`;
      ctx.fillText("NEXO MUSICAL DEL MOMENTO", cx, cy + 50 * camara.zoom);
      ctx.letterSpacing = "0px";

      ctx.beginPath();
      ctx.arc(cx, cy, 4 * camara.zoom, 0, Math.PI * 2);
      ctx.fillStyle = "#9d33ff";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#9d33ff";
      ctx.fill();
      ctx.shadowBlur = 0;

      artistsRef.current.forEach((artist) => {
        const pos = resolvedPositions.current.get(artist._id) ?? { x: artist.x, y: artist.y };
        const { sx, sy } = toScreen(pos.x, pos.y);

        if (sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) return;

        const radius = 40 * camara.zoom;
        const img = imageCache.current[artist._id];

        ctx.beginPath();
        ctx.arc(sx, sy, radius + 3 * camara.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = "#9d33ff";
        ctx.lineWidth = 1.5 * camara.zoom;
        ctx.shadowBlur = 15 * camara.zoom;
        ctx.shadowColor = "#9d33ff";
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.clip();

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, sx - radius, sy - radius, radius * 2, radius * 2);
        } else {
          ctx.fillStyle = "#1a1a1a";
          ctx.fill();
        }
        ctx.restore();

        if (camara.zoom > 0.4) {
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.font = `${13 * camara.zoom}px 'Geologica', sans-serif`;
          ctx.fillText(artist.name, sx, sy + radius + 16 * camara.zoom);
        }
      });

      animFrameId = requestAnimationFrame(render);
    }

    render();

    // ── Pan & zoom ────────────────────────────────────────────
    let dragging = false;
    let dragMoved = false;
    let prev = { x: 0, y: 0 };

    function onMouseDown(e: MouseEvent) { dragging = true; dragMoved = false; prev = { x: e.clientX, y: e.clientY }; }
    function onMouseUp() { dragging = false; }
    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
      camara.x -= dx / camara.zoom;
      camara.y -= dy / camara.zoom;
      prev = { x: e.clientX, y: e.clientY };
    }

    function onTouchStart(e: TouchEvent) { dragging = true; dragMoved = false; prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
    function onTouchEnd() { dragging = false; }
    function onTouchMove(e: TouchEvent) {
      if (!dragging) return;
      e.preventDefault();
      dragMoved = true;
      camara.x -= (e.touches[0].clientX - prev.x) / camara.zoom;
      camara.y -= (e.touches[0].clientY - prev.y) / camara.zoom;
      prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      camara.zoom = Math.min(Math.max(camara.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.1), 5);
    }

    // ── Click — router.push para NO destruir el AudioProvider ─
    function onCanvasClick(e: MouseEvent) {
      if (dragMoved) return;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const screenCX = canvas.width / 2;
      const screenCY = canvas.height / 2;
      const worldX = (mouseX - screenCX) / camara.zoom + camara.x;
      const worldY = (mouseY - screenCY) / camara.zoom + camara.y;
      const radius = 40;

      for (const artist of artistsRef.current) {
        const pos = resolvedPositions.current.get(artist._id) ?? { x: artist.x, y: artist.y };
        const dx = worldX - pos.x;
        const dy = worldY - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          try { sessionStorage.setItem("orbit-camera", JSON.stringify(camara)); } catch (_) {}
          routerRef.current.push(`/artist/${artist.spotify_id}`);
          return;
        }
      }
    }

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      try { sessionStorage.setItem("orbit-camera", JSON.stringify(camara)); } catch (_) {}
      cancelAnimationFrame(animFrameId);
      clearInterval(fetchInterval);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onCanvasClick);
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