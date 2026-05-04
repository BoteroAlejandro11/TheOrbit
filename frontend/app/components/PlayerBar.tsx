"use client";

import { useAudio } from "./AudioContext";

export default function PlayerBar() {
  const { currentTrack, playing, progress, visible, queue, togglePlay, next, prev, closePlayer } = useAudio();

  if (!visible || !currentTrack) return null;

  const idx = queue.findIndex((t) => t.id === currentTrack.id);
  const hasPrev = idx > 0;
  const hasNext = idx < queue.length - 1;

  return (
    <div style={styles.bar}>

      {/* Info — izquierda */}
      <div style={styles.trackInfo}>
        <img src={currentTrack.album_art} alt={currentTrack.name} style={styles.albumArt} />
        <div style={styles.trackText}>
          <p style={styles.trackName}>{currentTrack.name}</p>
          <p style={styles.artistName}>{currentTrack.artistName}</p>
        </div>
      </div>

      {/* Controles — centro */}
      <div style={styles.controls}>
        <div style={styles.buttons}>
          <button
            onClick={prev}
            disabled={!hasPrev}
            style={{ ...styles.skipBtn, opacity: hasPrev ? 1 : 0.3 }}
          >
            ⏮
          </button>

          <button onClick={togglePlay} style={styles.playBtn}>
            {playing ? "⏸" : "▶"}
          </button>

          <button
            onClick={next}
            disabled={!hasNext}
            style={{ ...styles.skipBtn, opacity: hasNext ? 1 : 0.3 }}
          >
            ⏭
          </button>
        </div>

        {/* Barra de progreso */}
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* Botón cerrar — derecha */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={closePlayer} style={styles.closeBtn} title="Cerrar reproductor">
          ✕
        </button>
      </div>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "72px",
    background: "rgba(10,10,10,0.97)",
    backdropFilter: "blur(16px)",
    borderTop: "1px solid rgba(157,51,255,0.3)",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    padding: "0 24px",
    zIndex: 200,
    boxShadow: "0 -4px 20px rgba(157,51,255,0.15)",
    gap: 16,
  },
  trackInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  albumArt: {
    width: 46,
    height: 46,
    borderRadius: 6,
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid rgba(157,51,255,0.3)",
  },
  trackText: {
    minWidth: 0,
  },
  trackName: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "white",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily: "'Geologica', sans-serif",
  },
  artistName: {
    margin: 0,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "'Geologica', sans-serif",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    width: 320,
  },
  buttons: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  skipBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
    padding: 4,
    transition: "opacity 0.2s",
  },
  playBtn: {
    background: "#9d33ff",
    border: "none",
    borderRadius: "50%",
    width: 38,
    height: 38,
    color: "white",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 12px rgba(157,51,255,0.5)",
    transition: "transform 0.15s",
  },
  progressWrap: {
    width: "100%",
    height: 3,
    background: "rgba(255,255,255,0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#9d33ff",
    borderRadius: 2,
    transition: "width 0.5s linear",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    cursor: "pointer",
    padding: 8,
    borderRadius: 6,
    transition: "color 0.2s",
    fontFamily: "'Geologica', sans-serif",
  },
};