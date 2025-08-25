// components/project/AddToProject.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listProjects, createProject, addPartida } from "@/lib/project/storage";
import { Project, MaterialRow } from "@/lib/project/types";

type Props = {
  kind: string;
  defaultTitle: string;
  items: MaterialRow[];
  raw: any; // El objeto de resultado completo
};

export default function AddToProject({ kind, defaultTitle, items, raw }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("new");
  const [newProjectName, setNewProjectName] = useState("");
  const [title, setTitle] = useState(defaultTitle);

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  const handleSave = () => {
    let projectId = selectedProjectId;

    if (projectId === "new") {
      const newProject = createProject({ name: newProjectName || "Proyecto sin nombre" });
      projectId = newProject.id;
    }
    
    addPartida(projectId, {
      kind,
      title,
      inputs: raw.input, // Asumimos que el objeto raw tiene una clave 'input'
      outputs: raw.result, // y una clave 'result'
      materials: items,
    });
    
    // Redirigir al proyecto
    router.push(`/proyecto/${projectId}`);
  };

  return (
    <div className="card p-4 space-y-4">
      <h2 className="font-medium">Agregar al proyecto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm flex flex-col gap-1">
          <span>Título de partida</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2"
          />
        </label>
      </div>
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
        Agregar al proyecto
      </button>
    </div>
  );
}