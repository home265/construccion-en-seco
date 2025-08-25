// lib/project/storage.ts
import type { Project, Partida } from "./types";

const PROJECTS_KEY = "bob_seco_projects_v1";
const ACTIVE_PROJECT_KEY = "bob_seco_active_project_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): Project[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAll(list: Project[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Error guardando proyectos:", e);
  }
}

export function listProjects(): Project[] {
  return readAll();
}

export function getProject(id: string): Project | null {
  return readAll().find((p) => p.id === id) || null;
}

export function saveProject(p: Project): void {
  const all = readAll();
  const i = all.findIndex((x) => x.id === p.id);
  if (i >= 0) {
    all[i] = p;
  } else {
    all.push(p);
  }
  writeAll(all);
}

// 👇 ESTA ES LA FUNCIÓN CORREGIDA Y SIMPLIFICADA 👇
export function createProject(data: Partial<Project>): Project {
  const now = Date.now();
  
  const p: Project = {
    // Propiedades obligatorias con su valor inicial
    id: crypto.randomUUID(),
    name: "Nuevo proyecto",
    partes: [],
    createdAt: now,
    updatedAt: now,
    
    // Propiedades opcionales con un valor por defecto
    client: "",
    siteAddress: "",
    notes: "",
    
    // El 'data' que llega puede sobreescribir los valores por defecto
    ...data,
  };

  saveProject(p);
  return p;
}

export function deleteProject(projectId: string): void {
  if (!isBrowser()) return;
  const all = readAll();
  const newList = all.filter((p) => p.id !== projectId);
  writeAll(newList);
  if (getActiveProjectId() === projectId) {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
}

export function addPartida(projectId: string, part: Omit<Partida, "id" | "createdAt">): Partida {
  const p = getProject(projectId);
  if (!p) throw new Error("Proyecto no encontrado");
  const nueva: Partida = { ...part, id: crypto.randomUUID(), createdAt: Date.now() };
  p.partes.push(nueva);
  p.updatedAt = Date.now();
  saveProject(p);
  return nueva;
}

export function removePartida(projectId: string, partidaId: string): void {
  const p = getProject(projectId);
  if (!p) return;
  p.partes = p.partes.filter((x) => x.id !== partidaId);
  p.updatedAt = Date.now();
  saveProject(p);
}

export function getPartida(projectId: string, partidaId: string): Partida | null {
  const p = getProject(projectId);
  if (!p) return null;
  return p.partes.find(x => x.id === partidaId) || null;
}

export function updatePartida(projectId: string, partidaId: string, patch: Partial<Omit<Partida, "id" | "createdAt">>): Partida {
  const p = getProject(projectId);
  if (!p) throw new Error("Proyecto no encontrado");
  const i = p.partes.findIndex(x => x.id === partidaId);
  if (i === -1) throw new Error("Partida no encontrada");

  const actual = p.partes[i];
  const actualizado: Partida = {
    ...actual,
    ...patch,
    id: actual.id,
    createdAt: actual.createdAt,
  };

  p.partes[i] = actualizado;
  p.updatedAt = Date.now();
  saveProject(p);
  return actualizado;
}

export function setActiveProjectId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function getActiveProjectId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}