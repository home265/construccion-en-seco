// lib/db.ts
import Dexie, { type Table } from "dexie";
// Importamos los tipos desde su archivo de origen y los re-exportamos para que otros archivos los puedan usar.
import type { Project, Partida } from "./project/types";
export type { Project, Partida };

export class AppDatabase extends Dexie {
  // Tabla: projects (clave primaria: id)
  projects!: Table<Project, string>;

  constructor() {
    // Nombre de la base en el navegador
    super("bob_seco_db_v1");

    // Versión y esquema (índices)
    this.version(1).stores({
      // PK: id | Índices: name, updatedAt (para ordenar/buscar)
      projects: "id, name, updatedAt",
    });
  }
}

// --- LÍNEA CORREGIDA ---
// Instancia única para usar en toda la app (con un solo 'new')
export const db = new AppDatabase();