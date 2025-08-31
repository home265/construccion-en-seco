// lib/project/types.ts

// Define las unidades de medida que usaremos en toda la app
export type Unit = "u" | "m" | "m2" | "m3" | "kg" | "l" | "caja" | "rollo";

// Representa una línea de material en el resumen final
export type MaterialRow = {
  key: string;
  label: string;
  qty: number;
  unit: Unit;
};

// Representa un cálculo guardado (un "ítem" dentro de un proyecto)
export interface Partida {
  id: string;
  createdAt: number;
  // agregado para el guardado moderno; lo dejo opcional para no romper nada que ya funcione
  updatedAt?: number;
  kind: string; // "tabique-divisorio", "cielorraso", etc.
  title: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  materials: MaterialRow[];
}

// Representa un proyecto completo
export interface Project {
  // 👇 CORRECCIÓN AQUÍ 👇
  logoUrl?: string; // Se hace opcional (?) y se define como un string, no 'any'.
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  client?: string;
  siteAddress?: string;
  notes?: string;
  partes: Partida[];
}
