"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
 
export default function Navbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
 
  return (
    <>
      {/* Fuente Geologica */}
      <link
        href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;700&display=swap"
        rel="stylesheet"
      />
 
      <header style={styles.navbar}>
        {/* Logo izquierda */}
        <div style={styles.logoWrap}>
          <Image
            src="/LogoConejo.png"
            alt="The Orbit"
            width={38}
            height={38}
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
            priority
          />
        </div>
 
        {/* Buscador centro */}
        <div
          style={{
            ...styles.searchWrap,
            border: searchFocused
              ? "1.5px solid rgba(157,51,255,0.9)"
              : "1.5px solid rgba(255,255,255,0.12)",
            boxShadow: searchFocused
              ? "0 0 20px rgba(157,51,255,0.3), inset 0 0 10px rgba(157,51,255,0.05)"
              : "none",
          }}
        >
          {/* Ícono lupa */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke={searchFocused ? "#9d33ff" : "rgba(255,255,255,0.35)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, transition: "stroke 0.3s" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
 
          <input
            type="text"
            placeholder="Busca un artista..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={styles.searchInput}
          />
 
          {/* Atajo de teclado */}
          {!searchFocused && searchValue === "" && (
            <span style={styles.shortcut}>⌘K</span>
          )}
        </div>
 
        {/* Menú derecha */}
        <nav style={styles.menu}>
          <NavBtn icon="↓" label="APP" />
          <NavBtn label="INICIO" />
          <div style={styles.divider} />
          <button style={styles.joinBtn} onClick ={() => router.push("/den")}>ÚNETE</button>
        </nav>
      </header>
    </>
  );
}
 
function NavBtn({
  label,
  icon,
}: {
  label: string;
  icon?: string;
}) {
  const [hovered, setHovered] = useState(false);
 
  return (
    <button
      style={{
        ...styles.navBtn,
        color: hovered ? "#fff" : "rgba(255,255,255,0.6)",
        letterSpacing: hovered ? "2px" : "1.5px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon && <span style={{ fontSize: "13px" }}>{icon} </span>}
      {label}
    </button>
  );
}
 
const styles: Record<string, React.CSSProperties> = {
  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    boxSizing: "border-box",
    zIndex: 100,
    background:
      "linear-gradient(180deg, rgba(13,0,26,0.98) 0%, rgba(13,0,26,0.85) 100%)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(157,51,255,0.2)",
    boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
    fontFamily: "'Geologica', sans-serif",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "340px",
    height: "38px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "10px",
    padding: "0 14px",
    boxSizing: "border-box",
    transition: "border 0.3s, box-shadow 0.3s",
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "rgba(255,255,255,0.85)",
    fontSize: "13px",
    fontFamily: "'Geologica', sans-serif",
    fontWeight: 300,
    letterSpacing: "0.5px",
  },
  shortcut: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.07)",
    padding: "2px 6px",
    borderRadius: "4px",
    letterSpacing: "0.5px",
    flexShrink: 0,
  },
  menu: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  navBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "'Geologica', sans-serif",
    letterSpacing: "1.5px",
    padding: "8px 12px",
    borderRadius: "6px",
    transition: "color 0.2s, letter-spacing 0.2s",
  },
  divider: {
    width: "1px",
    height: "20px",
    background: "rgba(255,255,255,0.1)",
    margin: "0 4px",
  },
  joinBtn: {
    background: "#9d33ff",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "'Geologica', sans-serif",
    letterSpacing: "2px",
    color: "#fff",
    padding: "9px 20px",
    borderRadius: "8px",
    boxShadow: "0 0 16px rgba(157,51,255,0.5)",
    transition: "box-shadow 0.3s, transform 0.2s",
  },
};