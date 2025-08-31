// lib/project/storage.ts
import { db } from "@/lib/db";
import type { Project, Partida, MaterialRow } from "./types";

const ACTIVE_PROJECT_KEY = "bob_seco_active_project_v1";
const isBrowser = () => typeof window !== "undefined";
const now = () => Date.now();

// === PROYECTOS ===
export async function listProjects(): Promise<Project[]> {
  if (!isBrowser()) return [];
  // Ordenados por nombre como en Gasista
  return await db.projects.orderBy("name").toArray();
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isBrowser()) return null;
  return (await db.projects.get(id)) ?? null;
}

// (compat) por si algo del código viejo lo usaba
export async function saveProject(p: Project): Promise<void> {
  await db.projects.put({ ...p, updatedAt: now() });
}

export async function createProject(data: { name: string; client?: string; siteAddress?: string; notes?: string; }): Promise<Project> {
  const t = now();
  const project: Project = {
    id: crypto.randomUUID(),
    name: (data?.name ?? "Nuevo proyecto") || "Nuevo proyecto",
    client: data?.client ?? "",
    siteAddress: data?.siteAddress ?? "",
    notes: data?.notes ?? "",
    partes: [],
    createdAt: t,
    updatedAt: t,
  };
  await db.projects.put(project);
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id" | "createdAt" | "partes">>
): Promise<Project | null> {
  const current = await getProject(id);
  if (!current) return null;
  const updated: Project = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: now(),
  };
  await db.projects.put(updated);
  return updated;
}

export async function deleteProject(projectId: string): Promise<void> {
  if (!isBrowser()) return;
  await db.projects.delete(projectId);
  if (getActiveProjectId() === projectId) {
    try { localStorage.removeItem(ACTIVE_PROJECT_KEY); } catch {}
  }
}

// === PARTIDAS ===
type AddPartidaData =
  | { kind: string; title: string; items: MaterialRow[]; raw?: any; inputs?: Record<string, any>; outputs?: Record<string, any> }
  | Omit<Partida, "id" | "createdAt">;

export async function addPartida(projectId: string, data: AddPartidaData): Promise<Partida | null> {
  const p = await getProject(projectId);
  if (!p) return null;

  const t = now();
  let part: Partida;

  if ("kind" in data && "items" in data) {
    // Nueva forma: { kind, title, items, raw? }
    part = {
      id: crypto.randomUUID(),
      kind: data.kind,
      title: (data.title ?? "").trim() || "Cálculo",
      inputs: (data as any).inputs ?? {},
      outputs: (data as any).outputs ?? {},
      materials: data.items,
      createdAt: t,
      updatedAt: t,
    };
  } else {
    // Compat: venía una Partida sin id/createdAt
    const d = data as Omit<Partida, "id" | "createdAt">;
    part = {
      ...d,
      id: crypto.randomUUID(),
      createdAt: t,
      updatedAt: t,
      inputs: (d as any).inputs ?? {},
      outputs: (d as any).outputs ?? {},
    };
  }

  const updatedProject: Project = { ...p, partes: [...p.partes, part], updatedAt: now() };
  await db.projects.put(updatedProject);
  return part;
}

export async function getPartida(projectId: string, partidaId: string): Promise<Partida | null> {
  const p = await getProject(projectId);
  if (!p) return null;
  return p.partes.find((x) => x.id === partidaId) ?? null;
}

export async function updatePartida(
  projectId: string,
  partidaId: string,
  patch: Partial<Omit<Partida, "id" | "createdAt">>
): Promise<Partida | null> {
  const p = await getProject(projectId);
  if (!p) return null;

  const i = p.partes.findIndex((x) => x.id === partidaId);
  if (i === -1) return null;

  const curr = p.partes[i];
  const next: Partida = {
    ...curr,
    ...patch,
    id: curr.id,
    createdAt: curr.createdAt,
    updatedAt: now(),
  };

  const partes = [...p.partes];
  partes[i] = next;

  await db.projects.put({ ...p, partes, updatedAt: now() });
  return next;
}

// --- ESTA ES LA FUNCIÓN CORREGIDA ---
export async function removePartidaById(projectId: string, partidaId: string): Promise<void> {
  const p = await getProject(projectId);
  if (!p) return;
  const partes = p.partes.filter((x) => x.id !== partidaId);
  await db.projects.put({ ...p, partes, updatedAt: now() });
}

// === Compatibilidad: “proyecto activo” sigue en localStorage ===
export function setActiveProjectId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function getActiveProjectId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}