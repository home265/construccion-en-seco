// lib/calc/tabique.ts
import type { TabiqueInput, TabiqueResult, Catalogs, Vano, Perfil } from "@/lib/types/seco";
import { optimizeCuts, Piece } from "./nesting";

export function calculateTabique(
  input: TabiqueInput,
  catalogs: Catalogs
): TabiqueResult {

  // --- 1. Cálculos de Geometría ---
  const areaBruta_m2 = input.largo_m * input.alto_m;
  const areaVanos_m2 = input.vanos.reduce((sum, vano) => sum + (vano.lv * vano.hv), 0);
  const areaNeta_m2 = areaBruta_m2 - areaVanos_m2;

  // --- 2. Búsqueda de Materiales Seleccionados ---
  const perfilSeleccionado = catalogs.perfiles.find(p => p.id === input.perfilId);
  const placaSeleccionada = catalogs.placas.find(p => p.id === input.placaId);
  const soleraAsociada = catalogs.perfiles.find(p => p.tipo === 'solera' && (p as Perfil).medidas_mm.ancho === perfilSeleccionado?.medidas_mm.ancho);

  if (!perfilSeleccionado || !placaSeleccionada || !soleraAsociada) {
    throw new Error("Perfil, solera asociada o placa seleccionada no se encuentra en los catálogos.");
  }
  
  const mult = 1 + (input.desperdicioPct / 100);

  // --- 3. Cálculo Detallado de Perfiles con Optimización ---
  
  // Montantes
  let montantesNormalesQty = Math.ceil(input.largo_m / (input.separacionMontantes_cm / 100)) + 1;
  let dintel_ml_total = 0;
  let antepecho_ml_total = 0;
  let cripples_ml_total = 0; // Montantes cortos bajo la ventana

  input.vanos.forEach(vano => {
    montantesNormalesQty += 2; // 2 montantes "jack" por vano para sostener el dintel
    dintel_ml_total += vano.lv + 0.2; // Dintel siempre es un poco más ancho que el vano
    if (vano.tipo === 'ventana') {
      antepecho_ml_total += vano.lv + 0.2; // Antepecho para ventanas
      const cripplesCount = Math.floor(vano.lv / (input.separacionMontantes_cm / 100));
      if (cripplesCount > 0) {
        // Altura de cripples = altura del antepecho. Asumimos 0.9m de altura de antepecho estándar
        const alturaAntepecho = 0.9;
        cripples_ml_total += cripplesCount * alturaAntepecho;
      }
    }
  });

  const piezasMontantes: Piece[] = Array(montantesNormalesQty).fill(null).map((_, i) => ({ id: `M${i}`, length: input.alto_m }));
  if (cripples_ml_total > 0) {
      piezasMontantes.push({ id: 'Cripples', length: cripples_ml_total });
  }
  const optimizacionMontantes = optimizeCuts(piezasMontantes, perfilSeleccionado.largo_m);
  const montantes_un_total = optimizacionMontantes.length;

  // Soleras (incluye soleras, dinteles y antepechos)
  const piezasSolera: Piece[] = [
      { id: 'Soleras', length: input.largo_m * 2 },
      { id: 'Dinteles', length: dintel_ml_total },
      { id: 'Antepechos', length: antepecho_ml_total }
  ];
  const optimizacionSoleras = optimizeCuts(piezasSolera.filter(p => p.length > 0), soleraAsociada.largo_m);
  const soleras_un_total = optimizacionSoleras.length;


  // --- 4. Cálculo de Otros Materiales ---
  const caras = 2;
  const capas = input.esDoblePlaca ? 2 : 1;
  const cantidadPlacas = (areaNeta_m2 * caras * capas) / placaSeleccionada.m2_por_placa;

  const tornilleria = catalogs.tornilleria as Record<string, { rendimiento_m2?: number; rendimiento_montante?: number; rendimiento_ml_solera?: number }>;
  const cantidadT1 = areaNeta_m2 * caras * capas * (tornilleria.T1_aguja.rendimiento_m2 ?? 15);
  const cantidadT2 = (montantes_un_total + soleras_un_total) * 10; // Estimación más robusta por perfil
  const cantidadFijaciones = (input.largo_m * 2) * (tornilleria.fijacion_8mm.rendimiento_ml_solera ?? 2);
  
  const perimetroVanos_ml = input.vanos.reduce((sum, vano) => sum + (2 * vano.lv + 2 * vano.hv), 0);
  const mlJuntas = ((montantesNormalesQty -1) * input.alto_m * caras * capas) + perimetroVanos_ml;
  const cantidadMasilla_kg = mlJuntas * 0.4;
  const cantidadCinta_ml = mlJuntas;

  // --- 5. Armar el Objeto de Resultado Final ---
  const materiales: Record<string, number> = {
    soleras_un: Math.ceil(soleras_un_total * mult),
    montantes_un: Math.ceil(montantes_un_total * mult),
    placas_un: Math.ceil(cantidadPlacas * mult),
    t1_aguja_un: Math.ceil(cantidadT1 * mult),
    t2_mecha_un: Math.ceil(cantidadT2 * mult),
    fijaciones_un: Math.ceil(cantidadFijaciones * mult),
    cinta_ml: parseFloat((cantidadCinta_ml * mult).toFixed(2)),
    masilla_kg: parseFloat((cantidadMasilla_kg * mult).toFixed(2)),
  };

  if (input.llevaAislante) {
      materiales.aislante_m2 = parseFloat((areaNeta_m2 * mult).toFixed(2));
  }
  
  if (input.requiereArriostramiento) {
      const fleje = catalogs.accesorios.find(a => (a as { id: string }).id === 'fleje_arriostramiento') as { largo_m: number };
      if(fleje) {
        const largoDiagonal = Math.sqrt(Math.pow(input.largo_m, 2) + Math.pow(input.alto_m, 2));
        // Se multiplica por 2 por ser una cruz
        materiales.fleje_arriostramiento_un = Math.ceil((largoDiagonal * 2) / fleje.largo_m);
        // Tornillos hexagonales para fijar el fleje a los perfiles
        materiales.tornillos_hex_un = Math.ceil(montantesNormalesQty * 4 * mult);
      }
  }

  const resultado: TabiqueResult = {
    areaNeta_m2: parseFloat(areaNeta_m2.toFixed(2)),
    materiales,
    optimizacion: {
      montantes: optimizacionMontantes,
      soleras: optimizacionSoleras,
    }
  };

  return resultado;
}