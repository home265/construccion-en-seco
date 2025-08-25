// lib/calc/tabique.ts
import type { TabiqueInput, TabiqueResult, Catalogs } from "@/lib/types/seco";

export function calculateTabique(
  input: TabiqueInput,
  catalogs: Catalogs
): TabiqueResult {

  // --- 1. Cálculos de Geometría ---
  const areaBruta_m2 = input.largo_m * input.alto_m;
  const areaVanos_m2 = input.vanos.reduce((sum, vano) => sum + (vano.lv * vano.hv), 0);
  const areaNeta_m2 = areaBruta_m2 - areaVanos_m2;
  const perimetroVanos_ml = input.vanos.reduce((sum, vano) => sum + (2 * vano.lv + 2 * vano.hv), 0);

  // --- 2. Búsqueda de Materiales Seleccionados ---
  const perfilSeleccionado = catalogs.perfiles.find(p => p.id === input.perfilId);
  const placaSeleccionada = catalogs.placas.find(p => p.id === input.placaId);

  if (!perfilSeleccionado || !placaSeleccionada) {
    throw new Error("Perfil o placa seleccionada no se encuentra en los catálogos.");
  }
  
  // --- 3. Cálculo de Materiales (Cantidades Netas) ---

  // Perfiles
  const cantidadSoleras = (input.largo_m * 2) / perfilSeleccionado.largo_m;
  const cantidadMontantes = (input.largo_m / (input.separacionMontantes_cm / 100)) + 1;
  // Refuerzos en vanos: 2 montantes + 1 dintel de solera por vano
  const montantesExtraPorVanos = input.vanos.length * 2;
  const solerasExtraPorVanos_ml = input.vanos.reduce((sum, vano) => sum + vano.lv, 0);
  
  // Placas (se multiplican por 2 caras del tabique)
  const caras = 2;
  const capas = input.esDoblePlaca ? 2 : 1;
  const cantidadPlacas = (areaNeta_m2 * caras * capas) / placaSeleccionada.m2_por_placa;

  // Tornillería (usando rendimientos del JSON)
  const tornilleria = catalogs.tornilleria;
  const cantidadT1 = areaNeta_m2 * caras * capas * tornilleria.T1_aguja.rendimiento_m2;
  const cantidadT2 = (cantidadMontantes + montantesExtraPorVanos) * tornilleria.T2_mecha.rendimiento_montante;
  const cantidadFijaciones = (input.largo_m * 2) * tornilleria.fijacion_8mm.rendimiento_ml_solera;
  
  // Tratamiento de Juntas
  const masillasCintas = catalogs.masillasCintas;
  // Ml de junta = uniones verticales + horizontales + perímetro de vanos
  const mlJuntas = ((cantidadMontantes -1) * input.alto_m * caras * capas) + perimetroVanos_ml;
  const cantidadMasilla_kg = mlJuntas * 0.4; // Estimación de 0.4 kg/ml de junta
  const cantidadCinta_ml = mlJuntas;

  // Aislante (si aplica)
  let cantidadAislante_m2;
  if (input.llevaAislante) {
      cantidadAislante_m2 = areaNeta_m2;
  }

  // --- 4. Aplicar Desperdicio ---
  const mult = 1 + (input.desperdicioPct / 100);

  // --- 5. Armar el Objeto de Resultado Final ---
  const resultado: TabiqueResult = {
    areaNeta_m2: parseFloat(areaNeta_m2.toFixed(2)),
    materiales: {
      soleras_un: Math.ceil((cantidadSoleras) + (solerasExtraPorVanos_ml / perfilSeleccionado.largo_m) * mult),
      montantes_un: Math.ceil((cantidadMontantes + montantesExtraPorVanos) * mult),
      placas_un: Math.ceil(cantidadPlacas * mult),
      t1_aguja_un: Math.ceil(cantidadT1 * mult),
      t2_mecha_un: Math.ceil(cantidadT2 * mult),
      fijaciones_un: Math.ceil(cantidadFijaciones * mult),
      cinta_ml: parseFloat((cantidadCinta_ml * mult).toFixed(2)),
      masilla_kg: parseFloat((cantidadMasilla_kg * mult).toFixed(2)),
      ...(cantidadAislante_m2 && { aislante_m2: parseFloat((cantidadAislante_m2 * mult).toFixed(2)) })
    }
  };

  return resultado;
}