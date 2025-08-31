// app/proyecto/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<{ partidaId: string; title: string } | null>(null);

  // Cargar proyecto (Dexie, async)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = await getProject(id);
      if (!mounted) return;
      if (!p) {
        router.replace("/proyecto");
        return;
      }
      setProject(p);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  const mat = useMemo(() => aggregateMaterials(project), [project]);

  const makeEditHref = (kind: string, partidaId: string) => {
    const base = KIND_ROUTES[kind] ?? `/${kind}`;
    const sp = new URLSearchParams({ projectId: id, partidaId });
    return `${base}?${sp.toString()}`;
  };

  const handleRemovePartida = async () => {
    if (!toDelete || !project) return;
    await removePartida(project.id, toDelete.partidaId);
    setToDelete(null);
    const refreshed = await getProject(project.id);
    setProject(refreshed);
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-foreground/60">Cargando proyecto…</p>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="space-y-6">
        <p className="text-sm">Proyecto no encontrado. Redirigiendo…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Encabezado estilo Gasista */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <div className="text-sm text-foreground/60">
            {project.client ? `Cliente: ${project.client}` : ""}
          </div>
        </div>
        <div className="flex gap-2">
          <Link className="btn" href={`/proyecto/${project.id}/export`}>
            Vista previa (Imprimir / PDF)
          </Link>
          {/* Si luego sumamos jsPDF: agregar botón “Descargar PDF” aquí */}
        </div>
      </div>

      {/* Dos columnas: Partidas / Resumen */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Partidas */}
        <div className="card p-4">
          <h2 className="font-medium mb-3">Partidas calculadas</h2>
          {project.partes.length === 0 ? (
            <p className="text-sm text-foreground/60">Todavía no agregaste partidas.</p>
          ) : (
            <ul className="space-y-2">
              {project.partes.map((part) => (
                <li
                  key={part.id}
                  className="border border-border rounded p-2 flex items-center justify-between gap-2"
                >
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

        {/* Resumen de materiales */}
        <div className="card p-4 overflow-x-auto">
          <h2 className="font-medium mb-3">Resumen de materiales</h2>
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
                  <tr key={`${m.key ?? m.label}-${i}`} className="border-t border-border">
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
