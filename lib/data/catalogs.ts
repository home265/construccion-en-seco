// lib/data/catalogs.ts
import type { Catalogs, Perfil, Placa } from "@/lib/types/seco";

// Cada función carga un JSON específico
async function loadPerfiles(): Promise<Perfil[]> {
  const res = await fetch('/data/perfiles.json');
  return res.json();
}

async function loadPlacas(): Promise<Placa[]> {
  const res = await fetch('/data/placas.json');
  return res.json();
}

async function loadTornilleria(): Promise<Record<string, unknown>> {
  const res = await fetch('/data/tornilleria.json');
  return res.json();
}

async function loadAislantes(): Promise<Record<string, unknown>[]> {
  const res = await fetch('/data/aislantes.json');
  return res.json();
}

async function loadMasillasCintas(): Promise<Record<string, unknown>> {
  const res = await fetch('/data/masillas-cintas.json');
  return res.json();
}

async function loadAccesorios(): Promise<Record<string, unknown>[]> {
  const res = await fetch('/data/accesorios.json');
  return res.json();
}

async function loadCargas(): Promise<Record<string, unknown>> {
  const res = await fetch('/data/cargas.json');
  return res.json();
}

async function loadAnclajes(): Promise<Record<string, unknown>[]> {
  const res = await fetch('/data/anclajes.json');
  return res.json();
}

// 👇 NUEVAS FUNCIONES DE CARGA AÑADIDAS 👇
async function loadAdhesivos(): Promise<Record<string, unknown>[]> {
    const res = await fetch('/data/adhesivos.json');
    return res.json();
}

async function loadBarrerasHidrofugas(): Promise<Record<string, unknown>[]> {
    const res = await fetch('/data/barreras_hidrofugas.json');
    return res.json();
}


// Esta función principal carga todo de una vez para ser más eficiente
export async function loadAllCatalogs(): Promise<Catalogs> {
  const [
    perfiles,
    placas,
    tornilleria,
    aislantes,
    masillasCintas,
    accesorios,
    cargas,
    anclajes,
    adhesivos,
    barrerasHidrofugas,
  ] = await Promise.all([
    loadPerfiles(),
    loadPlacas(),
    loadTornilleria(),
    loadAislantes(),
    loadMasillasCintas(),
    loadAccesorios(),
    loadCargas(),
    loadAnclajes(),
    loadAdhesivos(),
    loadBarrerasHidrofugas(),
  ]);

  return {
    perfiles,
    placas,
    tornilleria,
    aislantes,
    masillasCintas,
    accesorios,
    cargas,
    anclajes,
    adhesivos,
    barrerasHidrofugas,
  };
}