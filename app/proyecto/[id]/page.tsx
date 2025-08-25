// app/proyecto/[id]/page.tsx
"use client";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link"; // <--- Importamos Link
import { getProject, removePartida } from "@/lib/project/storage";
import { aggregateMaterials } from "@/lib/project/compute";
import type { Project } from "@/lib/project/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";


const KIND_ROUTES: Record<string, string> = {
  "tabique-divisorio": "/tabique-divisorio",
  "cielorraso": "/cielorraso",
  "revestimiento": "/revestimiento",
  "muro-portante": "/muro-portante",
  "entrepiso-estructural": "/entrepiso-estructural",
};

export default function ProyectoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState(() => getProject(id));
  const [toDelete, setToDelete] = useState<{ partidaId: string; title: string } | null>(null);

  const handleRemovePartida = () => {
    if (toDelete && project) {
      removePartida(project.id, toDelete.partidaId);
      setToDelete(null);
      setProject(getProject(id));
    }
  };
  
  if (!project) {
    if (typeof window !== "undefined") router.replace("/proyecto");
    return <p>Proyecto no encontrado, redirigiendo...</p>;
  }

  const mat = aggregateMaterials(project);

  const makeEditHref = (kind: string, partidaId: string) => {
    const base = KIND_ROUTES[kind] ?? `/${kind}`;
    const sp = new URLSearchParams({ projectId: project.id, partidaId });
    return `${base}?${sp.toString()}`;
  };

  return (
    <section className="space-y-6 container mx-auto px-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <div className="text-sm text-foreground/60">
            {project.client ? `Cliente: ${project.client}` : ""}
          </div>
        </div>
        {/* 👇 BOTÓN AÑADIDO 👇 */}
        <div className="flex gap-2">
            <Link className="btn" href={`/proyecto/${project.id}/export`}>
              Imprimir / PDF
            </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-medium mb-3">Partidas Calculadas</h2>
          {project.partes.length === 0 ? (
            <p className="text-sm text-foreground/60">Todavía no agregaste partidas.</p>
          ) : (
            <ul className="space-y-2">
              {project.partes.map(part => (
                <li key={part.id} className="border border-border rounded p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{part.title}</div>
                    <div className="text-xs text-foreground/60">{part.kind}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => router.push(makeEditHref(part.kind, part.id))}
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => setToDelete({ partidaId: part.id, title: part.title })}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4 overflow-x-auto">
          <h2 className="font-medium mb-3">Resumen de Materiales</h2>
          {mat.length === 0 ? (
            <p className="text-sm text-foreground/60">Sin materiales aún.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="text-left py-1 font-normal">Material</th>
                  <th className="text-right py-1 font-normal">Cantidad</th>
                  <th className="text-left py-1 pl-4 font-normal">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {mat.map((m, i) => (
                  <tr key={`${m.key}-${i}`} className="border-t border-border">
                    <td className="py-1">{m.label}</td>
                    <td className="py-1 text-right">{m.qty}</td>
                    <td className="py-1 pl-4">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar Partida"
        message={toDelete ? `¿Seguro que querés eliminar "${toDelete.title}" del proyecto?` : ""}
        confirmLabel="Sí, eliminar"
        onConfirm={handleRemovePartida}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}