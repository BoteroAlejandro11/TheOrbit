import type { Metadata } from "next";
import { AudioProvider } from "./components/AudioContext";
import PlayerBar from "./components/PlayerBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Orbit",
  description: "Nexo musical del momento",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AudioProvider>
          {children}
          <PlayerBar />
        </AudioProvider>
      </body>
    </html>
  );
}