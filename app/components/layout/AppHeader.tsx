// app/components/layout/AppHeader.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

export default function AppHeader() {
  // Estado para manejar si el menú desplegable está abierto o cerrado
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <nav className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-lg">
          Bob Seco
        </Link>
        <div className="flex items-center gap-6">
          {/* Menú desplegable para todas las calculadoras */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onBlur={() => setTimeout(() => setIsMenuOpen(false), 150)} // Cierra el menú al perder foco
              className="text-sm font-medium hover:text-foreground/80"
            >
              Calculadoras ▼
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-muted shadow-lg ring-1 ring-border ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Link
                    href="/tabique-divisorio"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-card"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tabiques Divisorios
                  </Link>
                  <Link
                    href="/cielorraso"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-card"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Cielorrasos
                  </Link>
                   <Link
                    href="/revestimiento"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-card"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Revestimientos
                  </Link>
                   <Link
                    href="/muro-portante"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-card"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Muros Portantes
                  </Link>
                   {/* 👇 LINK AÑADIDO DE VUELTA 👇 */}
                   <Link
                    href="/entrepiso-estructural"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-card"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Entrepiso Estructural
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Link directo a Proyectos */}
          <Link href="/proyecto" className="text-sm font-medium hover:text-foreground/80">
            Proyectos
          </Link>
        </div>
      </nav>
    </header>
  );
}