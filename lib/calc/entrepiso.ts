// lib/calc/entrepiso.ts
import type { EntrepisoInput, EntrepisoResult, Catalogs } from "@/lib/types/seco";

export function calculateEntrepiso(
  input: EntrepisoInput,
  catalogs: Catalogs
): EntrepisoResult {

  // --- 1. Geometría y Materiales ---
  const area_m2 = input.largo_m * input.ancho_m;
  const mult = 1 + (input.desperdicioPct / 100);

  const vigaPGC = catalogs.perfiles.find(p => p.id === input.perfilVigaId);
  const bordePGU = catalogs.perfiles.find(p => p.id === input.perfilBordeId);
  if (!vigaPGC || !bordePGU) throw new Error("Perfiles estructurales no encontrados.");

  // --- 2. Cálculo de Materiales ---
  
  // Perfiles de borde (PGU)
  const perimetro_ml = (input.largo_m * 2) + (input.ancho_m * 2);
  const cantBordesPGU = perimetro_ml / bordePGU.largo_m;

  // Vigas interiores (PGC)
  const cantVigasPGC = (input.largo_m / (input.separacionVigas_cm / 100)) - 1;

  // Placas para la cubierta superior
  const cantPlacasCubierta = area_m2 / 2.88; // Asumimos placas estándar de 2.88 m²

  // Tornillería estructural
  const cantTornillosHex = (cantVigasPGC * 2) * 4; // 4 tornillos por unión viga-borde
  
  return {
    area_m2: parseFloat(area_m2.toFixed(2)),
    materiales: {
      perfiles_pgu_un: Math.ceil(cantBordesPGU * mult),
      perfiles_pgc_un: Math.ceil(cantVigasPGC * mult),
      placas_cubierta_un: Math.ceil(cantPlacasCubierta * mult),
      tornillos_hex_un: Math.ceil(cantTornillosHex * mult),
    },
    notaImportante: "Este es un cómputo de materiales preliminar. El dimensionado y la ingeniería de un entrepiso estructural DEBEN ser verificados por un profesional matriculado."
  };
}