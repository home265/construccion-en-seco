// lib/db.ts
import Dexie, { type Table } from "dexie";
import type { Project } from "./project/types";

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

// Instancia única para usar en toda la app
export const db = new AppDatabase();
