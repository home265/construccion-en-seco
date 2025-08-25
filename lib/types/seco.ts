// lib/types/seco.ts

// Tipos para los datos que vendrán de nuestros archivos JSON
export interface Perfil {
  id: string;
  nombre: string;
  tipo: 'solera' | 'montante' | 'omega' | 'pgu' | 'pgc';
  uso: 'divisorio' | 'revestimiento' | 'cielorraso' | 'estructural';
  medidas_mm: { ancho: number; alto: number };
  espesor_chapa_mm: number;
  largo_m: number;
  resistencia_kn_m?: number; // Propiedad añadida para perfiles estructurales
}

export interface Placa {
  id: string;
  nombre: string;
  tipo: 'ST' | 'RH' | 'RF' | 'Cementicia';
  espesor_mm: number;
  ancho_m: number;
  largo_m: number;
  m2_por_placa: number;
}

export interface Catalogs {
  perfiles: Perfil[];
  placas: Placa[];
  tornilleria: Record<string, any>;
  aislantes: any[];
  masillasCintas: Record<string, any>;
  accesorios: any[];
  cargas: Record<string, any>; // Catálogo de cargas añadido
  anclajes: any[]; // Catálogo de anclajes añadido
}

// --- Tipos para la Calculadora de Tabiques ---
export interface TabiqueInput {
  largo_m: number;
  alto_m: number;
  perfilId: string;
  placaId: string;
  separacionMontantes_cm: number;
  esDoblePlaca: boolean;
  llevaAislante: boolean;
  aislanteId?: string; // Corregido a opcional
  vanos: { lv: number; hv: number }[];
  desperdicioPct: number;
}

export interface TabiqueResult {
  areaNeta_m2: number;
  materiales: Record<string, number>;
}


// --- Tipos para Cielorraso ---
export interface CielorrasoInput {
  largo_m: number;
  ancho_m: number;
  perfilPrimarioId: string;
  perfilSecundarioId: string;
  separacionPrimarios_cm: number;
  separacionSecundarios_cm: number;
  placaId: string;
  desperdicioPct: number;
}

export interface CielorrasoResult {
  area_m2: number;
  materiales: Record<string, number>;
}


// --- Tipos para Revestimiento ---
export interface RevestimientoInput {
  largo_m: number;
  alto_m: number;
  tipoRevestimiento: 'directo' | 'omega';
  placaId: string;
  perfilOmegaId?: string;
  separacionOmegas_cm?: number; // Antes era: 40 | 60;
  vanos: { lv: number; hv: number }[];
  desperdicioPct: number;
}

export interface RevestimientoResult {
  areaNeta_m2: number;
  materiales: Record<string, number>;
}


// --- Tipos para Entrepiso Estructural ---
export interface EntrepisoInput {
  largo_m: number;
  ancho_m: number;
  perfilVigaId: string;
  perfilBordeId: string;
  separacionVigas_cm: number;
  tipoCubierta: 'osb' | 'fenolico' | 'placa_cementicia';
  desperdicioPct: number;
}

export interface EntrepisoResult {
  area_m2: number;
  materiales: Record<string, number>;
  notaImportante: string;
}

// --- 👇 NUEVOS TIPOS PARA MURO PORTANTE 👇 ---
export interface MuroPortanteInput {
  // Dimensiones del muro que estamos calculando
  largo_m: number;
  alto_m: number;

  // Cargas que soporta el muro
  entrepiso_ancho_apoyo_m: number;
  entrepiso_largo_apoyo_m: number;
  entrepiso_tipo_cubierta: 'osb' | 'placa_cementicia' | 'losa_humeda_liviana';
  
  tieneTechoArriba: boolean;
  techo_tipo?: 'chapa' | 'teja';

  // Configuración del muro en sí
  placaId: string;
  desperdicioPct: number;
}

export interface MuroPortanteResult {
  // Resultados del cálculo de cargas
  cargaEstimada_kg_ml: number;

  // Recomendaciones de la app
  perfilRecomendadoId: string;
  separacionRecomendada_cm: 40 | 60;
  anclajeRecomendadoId: string;
  
  // Lista de materiales
  materiales: Record<string, number>;
  notaImportante: string;
}