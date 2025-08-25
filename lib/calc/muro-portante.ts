// lib/calc/muro-portante.ts
import type { MuroPortanteInput, MuroPortanteResult, Catalogs, Perfil } from "@/lib/types/seco";

export function calculateMuroPortante(
  input: MuroPortanteInput,
  catalogs: Catalogs
): MuroPortanteResult {

  // --- 1. Calcular la Carga Total que el Muro Debe Soportar ---
  
  // Carga del entrepiso (peso propio + carga de uso)
  const areaEntrepiso = input.entrepiso_ancho_apoyo_m * input.entrepiso_largo_apoyo_m;
  const pesoPropioEntrepiso_kg = areaEntrepiso * catalogs.cargas.peso_entrepiso_seco_kg_m2;
  const cargaUsoEntrepiso_kg = areaEntrepiso * catalogs.cargas.carga_uso_vivienda_kg_m2;
  
  // Carga del techo (si aplica)
  let pesoTecho_kg = 0;
  if (input.tieneTechoArriba && input.techo_tipo) {
    const pesoTecho_kg_m2 = input.techo_tipo === 'chapa' 
      ? catalogs.cargas.peso_techo_chapa_kg_m2 
      : catalogs.cargas.peso_techo_teja_kg_m2;
    // Asumimos que el techo tiene la misma superficie que el entrepiso que lo soporta
    pesoTecho_kg = areaEntrepiso * pesoTecho_kg_m2; 
  }

  const cargaTotal_kg = pesoPropioEntrepiso_kg + cargaUsoEntrepiso_kg + pesoTecho_kg;
  const cargaLineal_kg_ml = cargaTotal_kg / input.largo_m;
  // Convertimos a Kilonewtons/metro para cálculos estructurales (1 kgf ≈ 9.81 N)
  const cargaLineal_kn_m = (cargaLineal_kg_ml * 9.81) / 1000;

  // --- 2. Recomendar Perfil y Separación ---
  
  const perfilesEstructurales = catalogs.perfiles
    .filter(p => p.uso === 'estructural' && p.tipo === 'pgc')
    .sort((a, b) => (a.resistencia_kn_m || 0) - (b.resistencia_kn_m || 0)); // Ordenamos de menor a mayor resistencia
  
  let perfilRecomendado: Perfil | undefined;
  const separacionRecomendada: 40 | 60 = 40; // Por seguridad, siempre recomendamos la separación más robusta (40cm)

  // Buscamos el perfil más económico (el primero en la lista ordenada) que soporte la carga
  perfilRecomendado = perfilesEstructurales.find(p => (p.resistencia_kn_m || 0) > cargaLineal_kn_m);
  
  // Si ninguna resistencia es suficiente, se recomienda el más robusto disponible
  if (!perfilRecomendado) {
    perfilRecomendado = perfilesEstructurales[perfilesEstructurales.length - 1];
  }
  
  // --- 3. Recomendar Anclajes ---

  // Simplificación de cálculo de corte: asumimos que la fuerza de corte es un 20% de la carga vertical
  const fuerzaCorteTotal_kn = cargaLineal_kn_m * input.largo_m * 0.2;
  const anclajesNecesariosEstimados = Math.ceil(input.largo_m / 1.0); // 1 anclaje cada 1m
  const fuerzaPorAnclaje_kn = fuerzaCorteTotal_kn / anclajesNecesariosEstimados;
  
  const anclajeRecomendado = catalogs.anclajes
    .sort((a, b) => a.resistencia_corte_kn - b.resistencia_corte_kn) // Ordenamos de menor a mayor resistencia
    .find(a => a.resistencia_corte_kn > fuerzaPorAnclaje_kn) || catalogs.anclajes[catalogs.anclajes.length - 1];

  // --- 4. Calcular Cantidades de Materiales ---
  const mult = 1 + (input.desperdicioPct / 100);
  const placa = catalogs.placas.find(p => p.id === input.placaId);
  const pguBorde = catalogs.perfiles.find(p => p.id.includes('pgu') && p.medidas_mm.ancho === perfilRecomendado.medidas_mm.ancho);
  const areaMuro = input.largo_m * input.alto_m;

  const cantPGC = ((input.largo_m / (separacionRecomendada / 100)) + 1);
  const cantPGU = (input.largo_m * 2) / (pguBorde?.largo_m || 6);
  const cantPlacas = (areaMuro * 2) / (placa?.m2_por_placa || 2.88); // Emplacado en ambas caras
  const cantAnclajes = Math.ceil(input.largo_m / 0.8); // Fijación a platea cada 80cm
  
  return {
    cargaEstimada_kg_ml: parseFloat(cargaLineal_kg_ml.toFixed(2)),
    perfilRecomendadoId: perfilRecomendado.id,
    separacionRecomendada_cm: separacionRecomendada,
    anclajeRecomendadoId: anclajeRecomendado.id,
    materiales: {
      perfiles_pgc_un: Math.ceil(cantPGC * mult),
      perfiles_pgu_un: Math.ceil(cantPGU * mult),
      placas_un: Math.ceil(cantPlacas * mult),
      anclajes_un: Math.ceil(cantAnclajes * mult),
      tornillos_hex_un: Math.ceil(cantPGC * 10 * mult), // Estimación de tornillos estructurales
    },
    notaImportante: "Este es un cómputo de materiales preliminar. El dimensionado y la ingeniería de un muro portante DEBEN ser verificados por un profesional matriculado."
  };
}