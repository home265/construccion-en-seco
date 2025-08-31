// app/proyecto/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProjects, createProject, deleteProject } from "@/lib/project/storage";
import type { Project } from "@/lib/project/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
// --- 1. IMPORTAMOS EL MODAL DE AYUDA ---
import HelpModal from "@/components/ui/HelpModal";

export default function ProyectosPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<Project | null>(null);

  // --- 2. AÑADIMOS ESTADOS PARA CONTROLAR EL MODAL ---
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [newlyCreatedProjectId, setNewlyCreatedProjectId] = useState<string | null>(null);

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

  // --- 3. MODIFICAMOS LA FUNCIÓN DE CREAR PARA MOSTRAR EL MODAL ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenimos el comportamiento por defecto del form
    const clean = name.trim();
    if (!clean) {
        alert("Por favor, ingresa un nombre para el proyecto.");
        return;
    }
    const p = await createProject({ name: clean });
    setName("");
    const list = await listProjects();
    setProjects(list);
    
    // Guardamos el ID del nuevo proyecto y abrimos el modal
    setNewlyCreatedProjectId(p.id);
    setIsHelpModalOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteProject(toDelete.id);
    setToDelete(null);
    const list = await listProjects();
    setProjects(list);
  };
  
  // --- 4. AÑADIMOS LA FUNCIÓN PARA CERRAR EL MODAL Y REDIRIGIR ---
  const handleCloseModal = () => {
      setIsHelpModalOpen(false);
      // Si tenemos un ID guardado, redirigimos al nuevo proyecto
      if (newlyCreatedProjectId) {
          router.push(`/proyecto/${newlyCreatedProjectId}`);
      }
  };


  return (
    <>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Mis Proyectos de Seco</h1>
          <p className="text-sm text-foreground/70">
            Crea un proyecto nuevo o continúa con uno existente.
          </p>
        </div>

        {/* Crear nuevo proyecto (envuelto en un form) */}
        <div className="card p-4 space-y-3">
          <h2 className="font-medium">Crear Nuevo Proyecto</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="Ej: Casa Familia Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3"
            />
            <button type="submit" className="btn btn-primary h-10">
              Crear y Abrir Calculadora
            </button>
          </form>
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

        {/* Modal de confirmación para eliminar */}
        <ConfirmDialog
          open={!!toDelete}
          title="Eliminar Proyecto"
          message={`¿Estás seguro de eliminar el proyecto “${toDelete?.name ?? ""}”? Se borrarán todas sus partidas y esta acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      </section>

      {/* --- 5. AÑADIMOS EL MODAL AL FINAL DEL ARCHIVO --- */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={handleCloseModal}
        title="¡Tu proyecto ha sido creado!"
      >
        <p>Ahora puedes seguir estos pasos:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
                <strong>Elige una Calculadora:</strong> Usa el menú de navegación de arriba (Tabiques, Revestimiento, etc.) para abrir la herramienta que necesites.
            </li>
            <li>
                <strong>Realiza tu Cálculo:</strong> Ingresa los datos en la calculadora y obtén tus resultados.
            </li>
            <li>
                <strong>Guarda en este Proyecto:</strong> Al final de cada calculadora, verás una sección para "Guardar en Proyecto". Tus cálculos guardados (llamados "partidas") aparecerán en la página de detalle de tu proyecto.
            </li>
        </ol>
      </HelpModal>
    </>
  );
}