// lib/calc/cielorraso.ts
import type { CielorrasoInput, CielorrasoResult, Catalogs, Perfil } from "@/lib/types/seco";

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
  const angulo = catalogs.accesorios.find(a => (a as { id: string }).id === 'angulo_ajuste') as { largo_m: number };
  
  if (!perfilPrimario || !perfilSecundario || !placa || !angulo) {
    throw new Error("No se encontraron algunos de los materiales base en los catálogos.");
  }

  // --- 2. Cálculo de Materiales (Neto) ---
  const materiales: Record<string, number> = {};

  // Estructura
  const cantAngulosPerimetrales = perimetro_ml / angulo.largo_m;
  // Asumiendo que los primarios se colocan a lo largo de la dimensión MÁS CORTA para mayor eficiencia
  const ladoCorto = Math.min(input.largo_m, input.ancho_m);
  const ladoLargo = Math.max(input.largo_m, input.ancho_m);
  const cantPerfilesPrimarios = Math.ceil(ladoLargo / (input.separacionPrimarios_cm / 100)) + 1;
  const mlPerfilesSecundarios = (Math.ceil(ladoCorto / (input.separacionSecundarios_cm / 100)) + 1) * ladoLargo;
  
  // Placas
  const cantPlacas = area_m2 / placa.m2_por_placa;

  // Fijaciones y Juntas
  const fijacionesPARED = perimetro_ml * 3;
  const tornillosT1 = area_m2 * 15;
  const mlJuntas = area_m2 * 2.5;
  const cantMasilla_kg = mlJuntas * 0.4;
  const cantCinta_ml = mlJuntas;
  
  // --- 3. Lógica Adicional Profesional ---

  // Velas Rígidas (Cuelgues)
  if (input.alturaCuelgue_cm > 0) {
      const alturaCuelgue_m = input.alturaCuelgue_cm / 100;
      // Una vela cada 1.2m a lo largo de cada perfil primario
      const cantVelas = cantPerfilesPrimarios * Math.floor(ladoCorto / 1.2);
      const mlVelas = cantVelas * alturaCuelgue_m * 2; // *2 porque son dobles (montante enfrentado)
      // Usamos montantes de 35mm para las velas por estándar
      const perfilVela = catalogs.perfiles.find(p => p.id === 'montante_34mm');
      if(perfilVela) {
          materiales.velas_rigidas_un = Math.ceil(mlVelas / perfilVela.largo_m);
      }
      // Tornillos extra para armar velas y unirlas
      materiales.t2_mecha_un = Math.ceil(cantVelas * 4 + (cantPerfilesPrimarios * (mlPerfilesSecundarios / perfilSecundario.largo_m)));
  } else {
      materiales.t2_mecha_un = (cantPerfilesPrimarios + (mlPerfilesSecundarios / perfilSecundario.largo_m)) * 4;
  }

  // Banda Acústica Perimetral
  if (input.usaBandaAcustica) {
      const banda = catalogs.accesorios.find(a => (a as {id: string}).id === 'banda_acustica_70mm') as { largo_m: number };
      if (banda) {
          materiales.banda_acustica_rollo = Math.ceil(perimetro_ml / banda.largo_m);
      }
  }


  // --- 4. Armado del Objeto Final con Desperdicio ---
  materiales.angulos_ajuste_un = Math.ceil(cantAngulosPerimetrales * mult);
  materiales.perfiles_primarios_un = Math.ceil(cantPerfilesPrimarios * mult);
  materiales.perfiles_secundarios_ml = parseFloat((mlPerfilesSecundarios * mult).toFixed(2));
  materiales.placas_un = Math.ceil(cantPlacas * mult);
  materiales.fijaciones_un = Math.ceil(fijacionesPARED * mult);
  materiales.t1_aguja_un = Math.ceil(tornillosT1 * mult);
  materiales.cinta_ml = parseFloat((cantCinta_ml * mult).toFixed(2));
  materiales.masilla_kg = parseFloat((cantMasilla_kg * mult).toFixed(2));

  // Aplicar desperdicio a los tornillos T2 calculados previamente
  materiales.t2_mecha_un = Math.ceil(materiales.t2_mecha_un * mult);
  
  return {
    area_m2: parseFloat(area_m2.toFixed(2)),
    materiales
  };
}