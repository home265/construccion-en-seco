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
  const materiales: Record<string, number> = {};
  
  // Perfiles de borde (PGU)
  const perimetro_ml = (input.largo_m * 2) + (input.ancho_m * 2);
  const cantBordesPGU = perimetro_ml / bordePGU.largo_m;

  // Vigas interiores (PGC)
  // Se calcula en base al ANCHO (ancho_m), ya que las vigas se distribuyen a lo largo de esta dimensión.
  const cantVigasPGC = Math.floor(input.ancho_m / (input.separacionVigas_cm / 100)) -1;

  // Placas para la cubierta superior
  const cantPlacasCubierta = area_m2 / 2.88; // Asumimos placas estándar de 2.88 m²

  // Tornillería estructural base
  let cantTornillosHex = (cantVigasPGC * 2) * 4; // 4 tornillos por unión viga-borde en cada extremo

  materiales.perfiles_pgu_un = Math.ceil(cantBordesPGU);
  materiales.perfiles_pgc_un = Math.ceil(cantVigasPGC);
  materiales.placas_cubierta_un = Math.ceil(cantPlacasCubierta);
  
  // --- 3. Lógica Adicional Profesional: Blockings ---
  if (input.usaBlockings && vigaPGC.largo_m > 0) {
      // Se coloca una línea de blockings cada 1.5m a lo largo de las vigas
      const lineasBlocking = Math.floor(input.largo_m / 1.5);
      // Cada línea tiene tantos blockings como espacios entre vigas haya
      const cantBlockingsPorLinea = cantVigasPGC + 1;
      const cantTotalBlockings = lineasBlocking * cantBlockingsPorLinea;
      // El largo de cada blocking es la separación entre vigas menos el espesor del perfil
      const largoBlocking = (input.separacionVigas_cm / 100);
      const ml_blockings = cantTotalBlockings * largoBlocking;
      
      // Los blockings se hacen con el mismo perfil PGC. Se suma al total.
      materiales.perfiles_pgc_un += Math.ceil(ml_blockings / vigaPGC.largo_m);
      // Tornillos extra para los blockings (4 por cada uno, 2 por lado)
      cantTornillosHex += cantTotalBlockings * 4;
  }
  
  materiales.tornillos_hex_un = Math.ceil(cantTornillosHex);
  
  // --- 4. Aplicar Desperdicio a todos los materiales ---
  for (const key in materiales) {
      materiales[key] = Math.ceil(materiales[key] * mult);
  }

  return {
    area_m2: parseFloat(area_m2.toFixed(2)),
    materiales,
    notaImportante: "Este es un cómputo de materiales preliminar. El dimensionado y la ingeniería de un entrepiso estructural DEBEN ser verificados por un profesional matriculado según normas CIRSOC."
  };
}