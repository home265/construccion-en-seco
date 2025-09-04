// lib/calc/muro-portante.ts
import type { MuroPortanteInput, MuroPortanteResult, Catalogs, Perfil } from "@/lib/types/seco";

export function calculateMuroPortante(
  input: MuroPortanteInput,
  catalogs: Catalogs
): MuroPortanteResult {

  // --- 1. Calcular la Carga Total que el Muro Debe Soportar (Lógica Actualizada) ---
  const cargas = catalogs.cargas as Record<string, number>;
  const areaEntrepiso = input.entrepiso_ancho_apoyo_m * input.entrepiso_largo_apoyo_m;

  // Peso propio del entrepiso según la cubierta seleccionada
  let pesoPropioEntrepiso_kg_m2 = 0;
  switch(input.entrepiso_tipo_cubierta) {
      case 'osb': 
        pesoPropioEntrepiso_kg_m2 = cargas.peso_entrepiso_seco_kg_m2 || 40; 
        break;
      case 'placa_cementicia': 
        pesoPropioEntrepiso_kg_m2 = cargas.peso_entrepiso_seco_cemento_kg_m2 || 55; 
        break;
      case 'losa_humeda_liviana': 
        pesoPropioEntrepiso_kg_m2 = cargas.peso_entrepiso_humedo_liviano_kg_m2 || 80; 
        break;
  }
  
  const pesoPropioEntrepiso_kg = areaEntrepiso * pesoPropioEntrepiso_kg_m2;
  // Se utiliza la carga de uso variable del input en lugar de un valor fijo
  const cargaUsoEntrepiso_kg = areaEntrepiso * input.cargaUso_kg_m2;
  
  // Carga del techo (si aplica)
  let pesoTecho_kg = 0;
  if (input.tieneTechoArriba && input.techo_tipo) {
    const pesoTecho_kg_m2 = input.techo_tipo === 'chapa' 
      ? cargas.peso_techo_chapa_kg_m2 
      : cargas.peso_techo_teja_kg_m2;
    pesoTecho_kg = areaEntrepiso * pesoTecho_kg_m2; 
  }

  const cargaTotal_kg = pesoPropioEntrepiso_kg + cargaUsoEntrepiso_kg + pesoTecho_kg;
  // Se evita la división por cero si el largo es 0
  const cargaLineal_kg_ml = input.largo_m > 0 ? cargaTotal_kg / input.largo_m : 0;
  const cargaLineal_kn_m = (cargaLineal_kg_ml * 9.81) / 1000;

  // --- 2. Recomendar Perfil y Separación (Lógica sin cambios) ---
  
  const perfilesEstructurales = catalogs.perfiles
    .filter(p => p.uso === 'estructural' && p.tipo === 'pgc')
    .sort((a, b) => (a.resistencia_kn_m || 0) - (b.resistencia_kn_m || 0));
  
  let perfilRecomendado: Perfil | undefined;
  const separacionRecomendada: 40 | 60 = 40;

  perfilRecomendado = perfilesEstructurales.find(p => (p.resistencia_kn_m || 0) > cargaLineal_kn_m);
  
  if (!perfilRecomendado) {
    perfilRecomendado = perfilesEstructurales[perfilesEstructurales.length - 1];
  }
  
  // --- 3. Recomendar Anclajes (Lógica sin cambios) ---
  const anclajes = catalogs.anclajes as { resistencia_corte_kn: number }[];
  const fuerzaCorteTotal_kn = cargaLineal_kn_m * input.largo_m * 0.2;
  const anclajesNecesariosEstimados = Math.ceil(input.largo_m / 1.0);
  const fuerzaPorAnclaje_kn = anclajesNecesariosEstimados > 0 ? fuerzaCorteTotal_kn / anclajesNecesariosEstimados : 0;
  
  const anclajeRecomendado = anclajes
    .sort((a, b) => a.resistencia_corte_kn - b.resistencia_corte_kn)
    .find(a => a.resistencia_corte_kn > fuerzaPorAnclaje_kn) || anclajes[anclajes.length - 1];

  // --- 4. Calcular Cantidades de Materiales (Lógica sin cambios) ---
  const mult = 1 + (input.desperdicioPct / 100);
  const placa = catalogs.placas.find(p => p.id === input.placaId);
  const pguBorde = catalogs.perfiles.find(p => p.tipo === 'pgu' && p.medidas_mm.ancho === perfilRecomendado.medidas_mm.ancho);
  const areaMuro = input.largo_m * input.alto_m;

  const cantPGC = ((input.largo_m / (separacionRecomendada / 100)) + 1);
  const cantPGU = (input.largo_m * 2) / (pguBorde?.largo_m || 6);
  const cantPlacas = (areaMuro * 2) / (placa?.m2_por_placa || 2.88);
  const cantAnclajes = Math.ceil(input.largo_m / 0.8);
  
  return {
    cargaEstimada_kg_ml: parseFloat(cargaLineal_kg_ml.toFixed(2)),
    perfilRecomendadoId: perfilRecomendado.id,
    separacionRecomendada_cm: separacionRecomendada,
    anclajeRecomendadoId: (anclajeRecomendado as unknown as { id: string }).id,
    materiales: {
      perfiles_pgc_un: Math.ceil(cantPGC * mult),
      perfiles_pgu_un: Math.ceil(cantPGU * mult),
      placas_un: Math.ceil(cantPlacas * mult),
      anclajes_un: Math.ceil(cantAnclajes * mult),
      tornillos_hex_un: Math.ceil(cantPGC * 10 * mult),
    },
    notaImportante: "Este es un pre-dimensionado de materiales. El cálculo estructural final y la verificación de cargas DEBEN ser realizados por un profesional matriculado según normas CIRSOC."
  };
}