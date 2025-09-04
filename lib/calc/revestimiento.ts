// lib/calc/revestimiento.ts
import type { RevestimientoInput, RevestimientoResult, Catalogs } from "@/lib/types/seco";

export function calculateRevestimiento(
  input: RevestimientoInput,
  catalogs: Catalogs
): RevestimientoResult {

  // --- 1. Geometría y Materiales ---
  const areaBruta_m2 = input.largo_m * input.alto_m;
  const areaVanos_m2 = input.vanos.reduce((sum, vano) => sum + (vano.lv * vano.hv), 0);
  const areaNeta_m2 = areaBruta_m2 - areaVanos_m2;
  const mult = 1 + (input.desperdicioPct / 100);

  const placa = catalogs.placas.find(p => p.id === input.placaId);
  if (!placa) throw new Error("Placa no encontrada.");
  
  // --- 2. Cálculo de Materiales ---
  const materiales: Record<string, number> = {};

  // Placas (común a ambos métodos)
  materiales.placas_un = Math.ceil((areaNeta_m2 / placa.m2_por_placa) * mult);

  if (input.tipoRevestimiento === 'directo') {
    // Método directo: se usa adhesivo del catálogo
    const adhesivo = catalogs.adhesivos.find(a => (a as {id: string}).id === input.adhesivoId) as { rendimiento_kg_m2: number };
    if (adhesivo) {
        materiales.adhesivo_kg = parseFloat((areaNeta_m2 * adhesivo.rendimiento_kg_m2 * mult).toFixed(2));
    }
  } else {
    // Método con perfiles Omega
    const perfilOmega = catalogs.perfiles.find(p => p.id === input.perfilOmegaId);
    if (!perfilOmega) throw new Error("Perfil Omega no encontrado.");
    
    const separacion = input.separacionOmegas_cm || 60;
    const cantOmegas = ((input.largo_m / (separacion / 100)) + 1);
    materiales.perfiles_omega_un = Math.ceil(cantOmegas * mult);
    materiales.fijaciones_un = Math.ceil(cantOmegas * (input.alto_m / 0.6) * mult); // 1 fijación cada 60cm de alto
  }
  
  // --- NUEVA LÓGICA: Barrera Hidrófuga para Exteriores ---
  if (input.esRevestimientoExterior) {
      const barrera = catalogs.barrerasHidrofugas.find(b => (b as {id: string}).id === 'barrera_hidrofuga_estandar') as { m2_por_rollo: number };
      const cinta = catalogs.barrerasHidrofugas.find(b => (b as {id: string}).id === 'cinta_barrera_hidrofuga') as { ml_por_rollo: number };
      if (barrera) {
          materiales.barrera_hidrofuga_rollo = Math.ceil((areaBruta_m2 / barrera.m2_por_rollo) * mult);
      }
      if (cinta) {
          // Estimación de ML de cinta: perímetro del muro + uniones verticales cada 1.2m
          const mlCinta = (input.largo_m * 2 + input.alto_m * 2) + (Math.floor(input.largo_m / 1.2) * input.alto_m);
          materiales.cinta_hidrofuga_rollo = Math.ceil((mlCinta / cinta.ml_por_rollo) * mult);
      }
  }

  // Tratamiento de Juntas (común a ambos)
  const mlJuntas = areaNeta_m2 * 2.5;
  materiales.masilla_kg = parseFloat((mlJuntas * 0.4 * mult).toFixed(2));
  materiales.cinta_ml = parseFloat((mlJuntas * mult).toFixed(2));
  materiales.t1_aguja_un = Math.ceil((areaNeta_m2 * 15) * mult);

  return {
    areaNeta_m2: parseFloat(areaNeta_m2.toFixed(2)),
    materiales,
  };
}