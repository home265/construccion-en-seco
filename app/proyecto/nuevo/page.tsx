// app/proyecto/nuevo/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/project/storage";

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject = createProject({
      name: name || "Proyecto sin nombre",
      client: client,
    });
    // Redirigimos al usuario a la página del nuevo proyecto
    router.push(`/proyecto/${newProject.id}`);
  };

  return (
    <section className="container mx-auto px-4 max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Crear Nuevo Proyecto</h1>
      <form onSubmit={handleSubmit} className="card p-4 space-y-4">
        <label className="text-sm flex flex-col gap-1">
          <span className="font-medium">Nombre del Proyecto</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Casa López"
            className="w-full px-3 py-2"
            required
          />
        </label>
        <label className="text-sm flex flex-col gap-1">
          <span className="font-medium">Cliente (Opcional)</span>
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Ej: Familia López"
            className="w-full px-3 py-2"
          />
        </label>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn">Crear Proyecto</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </section>
  );
}