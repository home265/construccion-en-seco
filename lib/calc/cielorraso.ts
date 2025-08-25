// lib/calc/cielorraso.ts
import type { CielorrasoInput, CielorrasoResult, Catalogs } from "@/lib/types/seco";

export function calculateCielorraso(
  input: CielorrasoInput,
  catalogs: Catalogs
): CielorrasoResult {

  // --- 1. Geometría y Materiales ---
  const area_m2 = input.largo_m * input.ancho_m;
  const perimetro_ml = (input.largo_m + input.ancho_m) * 2;
  const mult = 1 + (input.desperdicioPct / 100);

  const perfilPrimario = catalogs.perfiles.find(p => p.id === input.perfilPrimarioId);
  const perfilSecundario = catalogs.perfiles.find(p => p.id === input.perfilSecundarioId);
  const placa = catalogs.placas.find(p => p.id === input.placaId);
  const angulo = catalogs.accesorios.find(a => a.id === 'angulo_ajuste');
  
  if (!perfilPrimario || !perfilSecundario || !placa || !angulo) {
    throw new Error("No se encontraron algunos de los materiales base en los catálogos.");
  }

  // --- 2. Cálculo de Materiales (Neto) ---

  // Estructura
  const cantAngulosPerimetrales = perimetro_ml / 2.6; // Asumimos tiras de 2.6m
  const cantPerfilesPrimarios = (input.largo_m / (input.separacionPrimarios_cm / 100)) + 1;
  const cantPerfilesSecundarios = ((input.ancho_m / (input.separacionSecundarios_cm / 100)) + 1) * input.largo_m;
  
  // Placas
  const cantPlacas = area_m2 / placa.m2_por_placa;

  // Fijaciones (estimaciones estándar)
  const fijacionesPARED = perimetro_ml * 3; // 3 fijaciones por metro lineal de ángulo
  const tornillosT1 = area_m2 * 15; // 15 tornillos T1 por m2 de placa
  const tornillosT2 = (cantPerfilesPrimarios + (cantPerfilesSecundarios / perfilSecundario.largo_m)) * 4;

  // Tratamiento de Juntas
  const mlJuntas = area_m2 * 2.5; // Estimación estándar
  const cantMasilla_kg = mlJuntas * 0.4;
  const cantCinta_ml = mlJuntas;

  // --- 3. Resultado Final con Desperdicio ---
  return {
    area_m2: parseFloat(area_m2.toFixed(2)),
    materiales: {
      angulos_ajuste_un: Math.ceil(cantAngulosPerimetrales * mult),
      perfiles_primarios_un: Math.ceil(cantPerfilesPrimarios * mult),
      perfiles_secundarios_ml: parseFloat((cantPerfilesSecundarios * mult).toFixed(2)), // Se suele comprar por ML o KG
      placas_un: Math.ceil(cantPlacas * mult),
      fijaciones_un: Math.ceil(fijacionesPARED * mult),
      t1_aguja_un: Math.ceil(tornillosT1 * mult),
      t2_mecha_un: Math.ceil(tornillosT2 * mult),
      cinta_ml: parseFloat((cantCinta_ml * mult).toFixed(2)),
      masilla_kg: parseFloat((cantMasilla_kg * mult).toFixed(2)),
    }
  };
}