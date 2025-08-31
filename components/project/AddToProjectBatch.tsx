// components/project/AddToProjectBatch.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listProjects, createProject, addPartida } from "@/lib/project/storage";
import { Project, Partida } from "@/lib/project/types";

type Props = {
  items: Omit<Partida, "id" | "createdAt">[];
  onSaved: () => void;
};

export default function AddToProjectBatch({ items, onSaved }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("new");
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listProjects();
      if (!cancelled) setProjects(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    let projectId = selectedProjectId;

    if (projectId === "new") {
      const newProject = await createProject({ name: newProjectName || "Proyecto sin nombre" });
      projectId = newProject.id;
    }
    
    // Agregamos cada ítem del lote como una partida
    for (const item of items) {
      await addPartida(projectId, item);
    }
    
    onSaved(); // Limpiamos el lote local
    router.push(`/proyecto/${projectId}`); // Redirigimos al proyecto
  };

  return (
    <div className="border-t border-border pt-4 mt-4 space-y-3">
      <h3 className="font-medium">Guardar Lote en Proyecto</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm flex flex-col gap-1">
          <span>Proyecto existente</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2"
          >
            <option value="new">— Crear nuevo —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        {selectedProjectId === "new" && (
          <label className="text-sm flex flex-col gap-1">
            <span>Nombre del nuevo proyecto</span>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Ej: Casa López"
              className="w-full px-3 py-2"
            />
          </label>
        )}
      </div>
      <button onClick={handleSave} className="btn">
        Guardar Lote ({items.length} ítems)
      </button>
    </div>
  );
}
