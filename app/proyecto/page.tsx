// app/proyecto/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProjects, createProject, deleteProject } from "@/lib/project/storage";
import type { Project } from "@/lib/project/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ProyectosPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<Project | null>(null);

  // Carga inicial (async con Dexie)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await listProjects();
      if (mounted) setProjects(list);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async () => {
    const clean = name.trim();
    if (!clean) return;
    const p = await createProject({ name: clean });
    setName("");
    const list = await listProjects();
    setProjects(list);
    // Flujo estilo Gasista: ir directo al cálculo del proyecto
    router.push(`/proyecto/${p.id}`);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteProject(toDelete.id);
    setToDelete(null);
    const list = await listProjects();
    setProjects(list);
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mis Proyectos de Seco</h1>
        <p className="text-sm text-foreground/70">
          Crea un proyecto nuevo o continúa con uno existente.
        </p>
      </div>

      {/* Crear nuevo proyecto */}
      <div className="card p-4 space-y-3">
        <h2 className="font-medium">Crear Nuevo Proyecto</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            placeholder="Ej: Casa Familia Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3"
          />
          <button className="btn btn-primary h-10" onClick={handleCreate}>
            Crear y Abrir Calculadora
          </button>
        </div>
      </div>

      {/* Lista de proyectos existentes */}
      <div className="card p-4">
        <h2 className="font-medium mb-3">Proyectos Existentes</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-foreground/60">
            No hay proyectos todavía. ¡Crea el primero!
          </p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className="border rounded p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <span className="font-medium">{p.name}</span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <Link className="btn btn-primary text-center" href={`/proyecto/${p.id}`}>
  Editar/Ver Cálculo
</Link>
                  <Link className="btn btn-secondary text-center" href={`/proyecto/${p.id}/export`}>
                    Ver Resumen y Exportar
                  </Link>
                  <button className="btn btn-danger" onClick={() => setToDelete(p)}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar Proyecto"
        message={`¿Estás seguro de eliminar el proyecto “${toDelete?.name ?? ""}”? Se borrarán todas sus partidas y esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
