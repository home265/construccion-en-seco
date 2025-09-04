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
  resistencia_kn_m?: number;
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
  tornilleria: Record<string, unknown>;
  aislantes: Record<string, unknown>[];
  masillasCintas: Record<string, unknown>;
  accesorios: Record<string, unknown>[];
  cargas: Record<string, unknown>;
  anclajes: Record<string, unknown>[];
  // 👇 NUEVOS CATÁLOGOS 👇
  adhesivos: Record<string, unknown>[];
  barrerasHidrofugas: Record<string, unknown>[];
}

// --- Tipos para la Calculadora de Tabiques ---
export interface Vano {
  lv: number;
  hv: number;
  // 👇 NUEVO CAMPO PARA DIFENCIAR PUERTAS/VENTANAS 👇
  tipo: 'puerta' | 'ventana';
}

export interface TabiqueInput {
  largo_m: number;
  alto_m: number;
  perfilId: string;
  placaId: string;
  separacionMontantes_cm: number;
  esDoblePlaca: boolean;
  llevaAislante: boolean;
  aislanteId?: string;
  vanos: Vano[]; // <-- Tipo actualizado
  desperdicioPct: number;
  // 👇 NUEVOS INPUTS 👇
  requiereArriostramiento: boolean;
}

export interface TabiqueResult {
  areaNeta_m2: number;
  materiales: Record<string, number>;
  // 👇 RESULTADO DE OPTIMIZACIÓN 👇
  optimizacion?: {
    montantes: unknown;
    soleras: unknown;
  }
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
  // 👇 NUEVOS INPUTS 👇
  alturaCuelgue_cm: number;
  usaBandaAcustica: boolean;
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
  separacionOmegas_cm?: number;
  vanos: Vano[]; // <-- Tipo actualizado
  desperdicioPct: number;
  // 👇 NUEVOS INPUTS 👇
  adhesivoId?: string;
  esRevestimientoExterior: boolean;
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
  // 👇 NUEVO INPUT 👇
  usaBlockings: boolean;
}

export interface EntrepisoResult {
  area_m2: number;
  materiales: Record<string, number>;
  notaImportante: string;
}

// --- Tipos para Muro Portante ---
export interface MuroPortanteInput {
  largo_m: number;
  alto_m: number;
  entrepiso_ancho_apoyo_m: number;
  entrepiso_largo_apoyo_m: number;
  entrepiso_tipo_cubierta: 'osb' | 'placa_cementicia' | 'losa_humeda_liviana';
  cargaUso_kg_m2: number; // Input más detallado
  tieneTechoArriba: boolean;
  techo_tipo?: 'chapa' | 'teja';
  placaId: string;
  desperdicioPct: number;
}

export interface MuroPortanteResult {
  cargaEstimada_kg_ml: number;
  perfilRecomendadoId: string;
  separacionRecomendada_cm: 40 | 60;
  anclajeRecomendadoId: string;
  materiales: Record<string, number>;
  notaImportante: string;
}