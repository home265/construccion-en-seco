// lib/project/compute.ts
import type { Project, MaterialRow } from "./types";

/**
 * Agrega y suma todos los materiales de todas las partidas de un proyecto.
 * @param project El objeto del proyecto.
 * @returns Una lista unificada y sumada de todos los materiales.
 */
export function aggregateMaterials(project: Project | null): MaterialRow[] {
  if (!project || !project.partes) {
    return [];
  }

  // Usamos un Map para sumar cantidades de materiales con la misma clave (key).
  const summary = new Map<string, MaterialRow>();

  // Iteramos sobre cada partida del proyecto
  for (const partida of project.partes) {
    if (!partida.materials) continue;

    // Iteramos sobre cada material de la partida
    for (const material of partida.materials) {
      // Usamos la 'key' del material como identificador único
      const key = material.key;

      if (summary.has(key)) {
        // Si ya tenemos este material, sumamos la nueva cantidad
        const existing = summary.get(key)!;
        existing.qty += material.qty;
      } else {
        // Si es un material nuevo, lo agregamos al resumen creando una copia
        summary.set(key, { ...material });
      }
    }
  }

  // Convertimos el Map de vuelta a un array y lo ordenamos alfabéticamente
  const aggregatedList = Array.from(summary.values());
  aggregatedList.sort((a, b) => a.label.localeCompare(b.label));

  return aggregatedList;
}