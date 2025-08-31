// app/layout.tsx
import "./globals.css";

import type { Metadata, Viewport } from "next";
import RegisterSW from "./register-sw";
import AppHeader from "./components/layout/AppHeader";

export const metadata: Metadata = {
  title: "Bob Constructor - En Seco",
  description: "Cómputo de materiales para construcción en seco",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2C3333",
};

// === Pestañas del menú (las mismas rutas que ya tenés) ===
const TABS = [
  { href: "/proyecto", label: "Proyectos" },
  { href: "/tabique-divisorio", label: "Tabiques" },
  { href: "/revestimiento", label: "Revestimiento" },
  { href: "/cielorraso", label: "Cielorraso" },
  { href: "/muro-portante", label: "Muro Portante" },
  { href: "/entrepiso-estructural", label: "Entrepiso" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <RegisterSW />

        <AppHeader tabs={TABS} />

        {/* CAMBIO: mismo contenedor que Gasista */}
        <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          {children}
        </main>

        {/* Footer simple al estilo Gasista (opcional) */}
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-foreground/60">
          Funciona offline (PWA)
        </footer>
      </body>
    </html>
  );
}
