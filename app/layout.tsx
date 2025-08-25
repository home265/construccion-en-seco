// app/layout.tsx
import "./globals.css";

import type { Metadata, Viewport } from "next";
import RegisterSW from "./register-sw";
import AppHeader from "./components/layout/AppHeader";

export const metadata: Metadata = {
  title: "Bob Constructor - En Seco", // Título actualizado
  description: "Cómputo de materiales para construcción en seco",
  manifest: "/manifest.webmanifest" // Lo crearemos después
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2C3333",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <RegisterSW />
        <AppHeader />
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </body>
    </html>
  );
}