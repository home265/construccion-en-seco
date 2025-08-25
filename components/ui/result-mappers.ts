// components/ui/result-mappers.ts
import { Unit } from "@/lib/project/types";

// Mapea una clave de material a una etiqueta legible
export function keyToLabel(key: string): string {
  const labels: Record<string, string> = {
    soleras_un: "Soleras",
    montantes_un: "Montantes",
    placas_un: "Placas de Yeso",
    t1_aguja_un: "Tornillos T1 (aguja)",
    t2_mecha_un: "Tornillos T2 (mecha)",
    fijaciones_un: "Fijaciones (Tarugo+Tornillo)",
    cinta_ml: "Cinta para juntas",
    masilla_kg: "Masilla",
    aislante_m2: "Aislante",
    // Agrega más claves a medida que las necesites para otras calculadoras
  };
  return labels[key] || key.replace(/_/g, " ");
}

// Mapea una clave de material a su unidad de medida
export function keyToUnit(key: string): Unit {
  if (key.endsWith("_un")) return "u";
  if (key.endsWith("_ml")) return "m";
  if (key.endsWith("_m2")) return "m2";
  if (key.endsWith("_m3")) return "m3";
  if (key.endsWith("_kg")) return "kg";
  return "u";
}