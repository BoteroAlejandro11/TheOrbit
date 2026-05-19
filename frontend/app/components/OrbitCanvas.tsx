"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

interface Artist {
  _id: string;
  name: string;
  x: number;
  y: number;
  popularity: number;
  followers?: number;
  profile_image: string | null;
  genres: string[];
  spotify_id: string;
}

const GENRE_SECTORS = [
  {
    label: "LATIN",
    angle: 0,
    keywords: [
      "latin",
      "reggaeton",
      "reggaetón",
      "salsa",
      "bachata",
      "cumbia",
      "urbano",
      "latin pop",
      "trap latino",
    ],
  },
  {
    label: "POP",
    angle: -Math.PI / 4,
    keywords: ["pop", "dance pop", "k-pop", "electropop"],
  },
  {
    label: "ROCK",
    angle: -Math.PI / 2,
    keywords: ["rock", "indie rock", "alternative", "metal", "punk"],
  },
  {
    label: "HIP HOP",
    angle: (-3 * Math.PI) / 4,
    keywords: ["hip hop", "rap", "trap", "drill"],
  },
  {
    label: "R&B",
    angle: Math.PI,
    keywords: ["r&b", "rnb", "soul", "funk"],
  },
  {
    label: "JAZZ",
    angle: (3 * Math.PI) / 4,
    keywords: ["jazz", "blues", "classical", "ambient"],
  },
  {
    label: "ELECTRONIC",
    angle: Math.PI / 2,
    keywords: ["electronic", "edm", "house", "techno", "dance"],
  },
  {
    label: "OTHER",
    angle: Math.PI / 4,
    keywords: [],
  },
];

function getSectorForArtist(artist: Artist) {
  const genresText = (artist.genres || []).join(" ").toLowerCase();

  for (const sector of GENRE_SECTORS) {
    if (sector.label === "OTHER") continue;

    const matches = sector.keywords.some((keyword) =>
      genresText.includes(keyword.toLowerCase())
    );

    if (matches) return sector;
  }

  return GENRE_SECTORS[GENRE_SECTORS.length - 1];
}

function seededRandom(seed: string) {
  let hash = 0;
  const safeSeed = seed || "orbit";

  for (let i = 0; i < safeSeed.length; i++) {
    hash = (hash * 31 + safeSeed.charCodeAt(i)) >>> 0;
  }

  return (hash % 10000) / 10000;
}

function getArtistScore(artist: Artist): number {
  const popularity = Number(artist.popularity || 0);

  if (popularity > 0) {
    return Math.max(0, Math.min(100, popularity));
  }

  const followers = Number(artist.followers || 0);

  if (followers > 0) {
    const maxLog = Math.log10(100_000_000);
    const score = (Math.log10(followers + 1) / maxLog) * 100;
    return Math.max(35, Math.min(95, score));
  }

  return 55;
}

function computeGenrePositions(artists: Artist[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const sectorCounts = new Map<string, number>();

  const sortedArtists = [...artists].sort((a, b) => {
    return getArtistScore(b) - getArtistScore(a);
  });

  sortedArtists.forEach((artist) => {
    const sector = getSectorForArtist(artist);
    const count = sectorCounts.get(sector.label) ?? 0;
    sectorCounts.set(sector.label, count + 1);

    const score = getArtistScore(artist);

    // Mayor score = más cerca del centro.
    const baseRadius = 300 + (100 - score) * 4.6;

    // Distribución dentro del sector para que no queden todos encima.
    const ringOffset = (count % 4) * 48;
    const depthOffset = Math.floor(count / 4) * 22;

    const randomAngle = seededRandom(artist.spotify_id || artist._id);
    const randomRadius = seededRandom(artist.name || artist._id);

    const angleJitter = (randomAngle - 0.5) * 0.5;
    const radiusJitter = (randomRadius - 0.5) * 45;

    const radius = baseRadius + ringOffset + depthOffset + radiusJitter;
    const angle = sector.angle + angleJitter;

    positions.set(artist._id, {
      x: parseFloat((Math.cos(angle) * radius).toFixed(4)),
      y: parseFloat((Math.sin(angle) * radius).toFixed(4)),
    });
  });

  return resolveComputedOverlaps(positions);
}

function resolveComputedOverlaps(
  inputPositions: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> {
  const minDist = 115;
  const logoRadius = 230;

  const positions = new Map(
    Array.from(inputPositions.entries()).map(([id, pos]) => [
      id,
      { x: pos.x, y: pos.y },
    ])
  );

  for (let pass = 0; pass < 35; pass++) {
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

const legendLineStyle: CSSProperties = {
  margin: "8px 0",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 12,
  color: "rgba(255,255,255,0.68)",
};

const legendDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#9d33ff",
  flexShrink: 0,
};

const legendCircleStyle: CSSProperties = {
  width: 15,
  height: 15,
  borderRadius: "50%",
  border: "1.5px solid #9d33ff",
  flexShrink: 0,
};

const legendLineIconStyle: CSSProperties = {
  width: 18,
  height: 1.5,
  background: "rgba(157, 51, 255, 0.65)",
  flexShrink: 0,
};

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

    const camara = { x: 0, y: 0, zoom: 1 };

    try {
      const saved = sessionStorage.getItem("orbit-camera");
      if (saved) {
        const parsed = JSON.parse(saved);
        camara.x = parsed.x ?? 0;
        camara.y = parsed.y ?? 0;
        camara.zoom = parsed.zoom ?? 1;
      }
    } catch (_) {}

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resize);
    resize();

    async function fetchArtists(initial = false) {
      let x1: number;
      let x2: number;
      let y1: number;
      let y2: number;

      if (initial) {
        x1 = -5000;
        x2 = 5000;
        y1 = -5000;
        y2 = 5000;
      } else {
        const pad = 1000;
        const halfW = canvas.width / 2 / camara.zoom;
        const halfH = canvas.height / 2 / camara.zoom;

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
          resolvedPositions.current = computeGenrePositions(artistsRef.current);

          artistsRef.current.forEach((artist) => {
            if (artist.profile_image && !imageCache.current[artist._id]) {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.src = artist.profile_image;
              imageCache.current[artist._id] = img;
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch artists", error);
      }
    }

    fetchArtists(true);
    const fetchInterval = setInterval(() => fetchArtists(false), 30000);

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

      // Guías de sectores musicales.
      const guideRadius = 900 * camara.zoom;

      GENRE_SECTORS.forEach((sector) => {
        const endX = cx + Math.cos(sector.angle) * guideRadius;
        const endY = cy + Math.sin(sector.angle) * guideRadius;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "rgba(157, 51, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const labelX = cx + Math.cos(sector.angle) * 520 * camara.zoom;
        const labelY = cy + Math.sin(sector.angle) * 520 * camara.zoom;

        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.textAlign = "center";
        ctx.font = `700 ${11 * camara.zoom}px 'Geologica', sans-serif`;
        ctx.fillText(sector.label, labelX, labelY);
      });

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
      ctx.fillText("NEXO MUSICAL DEL MOMENTO", cx, cy + 50 * camara.zoom);

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

        if (sx < -120 || sx > canvas.width + 120 || sy < -120 || sy > canvas.height + 120) {
          return;
        }

        const score = getArtistScore(artist);
        const radius = (26 + score * 0.24) * camara.zoom;
        const img = imageCache.current[artist._id];

        ctx.beginPath();
        ctx.arc(sx, sy, radius + 3 * camara.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = "#9d33ff";
        ctx.lineWidth = (1.2 + score / 70) * camara.zoom;
        ctx.shadowBlur = (8 + score * 0.18) * camara.zoom;
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
          ctx.font = `700 ${12 * camara.zoom}px 'Geologica', sans-serif`;
          ctx.fillText(artist.name, sx, sy + radius + 16 * camara.zoom);
        }
      });

      animFrameId = requestAnimationFrame(render);
    }

    render();

    let dragging = false;
    let dragMoved = false;
    let prev = { x: 0, y: 0 };

    function onMouseDown(e: MouseEvent) {
      dragging = true;
      dragMoved = false;
      prev = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp() {
      dragging = false;
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;

      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragMoved = true;
      }

      camara.x -= dx / camara.zoom;
      camara.y -= dy / camara.zoom;
      prev = { x: e.clientX, y: e.clientY };
    }

    function onTouchStart(e: TouchEvent) {
      dragging = true;
      dragMoved = false;
      prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    function onTouchEnd() {
      dragging = false;
    }

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

      for (const artist of artistsRef.current) {
        const pos = resolvedPositions.current.get(artist._id) ?? { x: artist.x, y: artist.y };
        const dx = worldX - pos.x;
        const dy = worldY - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 52) {
          try {
            sessionStorage.setItem("orbit-camera", JSON.stringify(camara));
          } catch (_) {}

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
      try {
        sessionStorage.setItem("orbit-camera", JSON.stringify(camara));
      } catch (_) {}

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
    <>
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

      <div
        style={{
          position: "fixed",
          right: 28,
          bottom: 28,
          width: 285,
          padding: "16px 18px",
          borderRadius: 16,
          background: "rgba(13, 0, 26, 0.76)",
          border: "1px solid rgba(157, 51, 255, 0.28)",
          boxShadow: "0 0 24px rgba(157, 51, 255, 0.18)",
          backdropFilter: "blur(14px)",
          zIndex: 120,
          color: "white",
          fontFamily: "'Geologica', sans-serif",
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          CÓMO LEER THE ORBIT
        </p>

        <p style={legendLineStyle}>
          <span style={legendDotStyle} />
          Dirección = género musical
        </p>

        <p style={legendLineStyle}>
          <span style={legendCircleStyle} />
          Tamaño = relevancia del artista
        </p>

        <p style={legendLineStyle}>
          <span style={legendLineIconStyle} />
          Centro = mayor tendencia
        </p>
      </div>
    </>
  );
}
