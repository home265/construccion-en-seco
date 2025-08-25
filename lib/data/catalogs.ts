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

async function loadTornilleria(): Promise<Record<string, any>> {
  const res = await fetch('/data/tornilleria.json');
  return res.json();
}

async function loadAislantes(): Promise<any[]> {
  const res = await fetch('/data/aislantes.json');
  return res.json();
}

async function loadMasillasCintas(): Promise<Record<string, any>> {
  const res = await fetch('/data/masillas-cintas.json');
  return res.json();
}

async function loadAccesorios(): Promise<any[]> {
  const res = await fetch('/data/accesorios.json');
  return res.json();
}

// 👇 1. AGREGAMOS LAS FUNCIONES PARA CARGAR LOS NUEVOS JSONS 👇
async function loadCargas(): Promise<Record<string, any>> {
  const res = await fetch('/data/cargas.json');
  return res.json();
}

async function loadAnclajes(): Promise<any[]> {
  const res = await fetch('/data/anclajes.json');
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
    cargas,     // <--- 2. Agregamos la variable aquí
    anclajes    // <--- 2. Agregamos la variable aquí
  ] = await Promise.all([
    loadPerfiles(),
    loadPlacas(),
    loadTornilleria(),
    loadAislantes(),
    loadMasillasCintas(),
    loadAccesorios(),
    loadCargas(), // <--- 3. Y llamamos a la nueva función aquí
    loadAnclajes(), // <--- 3. Y llamamos a la nueva función aquí
  ]);

  return {
    perfiles,
    placas,
    tornilleria,
    aislantes,
    masillasCintas,
    accesorios,
    cargas,     // <--- 4. Finalmente, las incluimos en el objeto que se devuelve
    anclajes    // <--- 4. Finalmente, las incluimos en el objeto que se devuelve
  };
}