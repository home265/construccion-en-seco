// app/proyecto/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProjects, deleteProject } from "@/lib/project/storage";
import type { Project } from "@/lib/project/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";


export default function ProyectosPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [toDelete, setToDelete] = useState<Project | null>(null);

  // Carga y recarga la lista de proyectos
  const refreshProjects = () => {
    setProjects(listProjects());
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const handleDelete = () => {
    if (toDelete) {
      deleteProject(toDelete.id);
      setToDelete(null); // Cierra el modal
      refreshProjects(); // Actualiza la lista en pantalla
    }
  };

  return (
    <section className="container mx-auto px-4 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <Link href="/proyecto/nuevo" className="btn">
          + Nuevo proyecto
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Aún no hay proyectos. Creá uno nuevo o guardá un cálculo desde una de las calculadoras.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="card p-4 flex flex-col justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-foreground/60">{p.client || "—"}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn" onClick={() => router.push(`/proyecto/${p.id}`)}>Abrir</button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setToDelete(p)}
                  title="Eliminar proyecto"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar Proyecto"
        message={`¿Estás seguro de que querés eliminar el proyecto "${toDelete?.name}"? Se borrarán todas sus partidas y esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}