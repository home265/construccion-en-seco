// app/proyecto/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
// --- 1. IMPORTAMOS LIBRERÍAS PARA PDF ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { getProject, removePartidaById } from "@/lib/project/storage"; // Asumimos que la función se llama removePartidaById como en el modelo
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

  const mat = useMemo(() => (project ? aggregateMaterials(project) : []), [project]);
  const safeName = useMemo(
    () => (project ? project.name.replace(/[^\w\-]+/g, "_").toLowerCase() : "proyecto"),
    [project]
  );

  // --- 2. AÑADIMOS LA FUNCIÓN PARA DESCARGAR PDF ---
  async function handleDownloadPdf() {
    if (!project) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Resumen de Proyecto", 14, 22);
    doc.setFontSize(12);
    doc.text(project.name, 14, 32);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Cliente: ${project.client || "-"}`, 14, 38);
    // Asumimos que puede existir siteAddress como en el modelo
    doc.text(`Obra: ${project.siteAddress || "-"}`, 14, 44);

    autoTable(doc, {
      startY: 55,
      head: [['Material', 'Cantidad', 'Unidad']],
      body: mat.map(m => [m.label, m.qty.toLocaleString('es-AR'), m.unit]),
      theme: 'grid',
      headStyles: { fillColor: [46, 79, 79] },
    });

    doc.save(`proyecto_${safeName}.pdf`);
  }


  const makeEditHref = (kind: string, partidaId: string) => {
    const base = KIND_ROUTES[kind] ?? `/${kind}`;
    const sp = new URLSearchParams({ projectId: id, partidaId });
    return `${base}?${sp.toString()}`;
  };

  const handleRemovePartida = async () => {
    if (!toDelete || !project) return;
    // Usamos removePartidaById como en el modelo para consistencia
    await removePartidaById(project.id, toDelete.partidaId);
    setToDelete(null);
    const refreshed = await getProject(project.id);
    setProject(refreshed);
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-center p-8">Cargando proyecto...</p>
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <div className="text-sm text-foreground/60">
            {project.client ? `Cliente: ${project.client} · ` : ""}{project.siteAddress || ""}
          </div>
        </div>
        {/* --- 3. ACTUALIZAMOS LOS BOTONES --- */}
        <div className="flex items-center space-x-2">
            <Link className="btn btn-secondary" href={`/proyecto/${project.id}/export`}>
              Vista Previa (Imprimir / PDF)
            </Link>
            <button className="btn btn-primary" onClick={handleDownloadPdf}>
              Descargar PDF
            </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Columna Izquierda: Partidas del Proyecto */}
        <div className="card p-4">
          {/* --- 4. ACTUALIZAMOS LOS TEXTOS --- */}
          <h2 className="font-medium mb-3">Partidas del Proyecto</h2>
          {project.partes.length === 0 ? (
            <p className="text-sm text-foreground/60">Aún no se ha guardado ningún cálculo para este proyecto.</p>
          ) : (
            <ul className="space-y-2">
              {project.partes.map(part => (
                <li key={part.id} className="border border-border rounded p-3 flex justify-between items-center gap-2">
                  <div>
                    <div className="text-sm font-medium">{part.title}</div>
                    <div className="text-xs text-foreground/70 uppercase">{part.kind.replace("_", " ")}</div>
                  </div>
                   {/* --- 5. AJUSTAMOS BOTONES DE PARTIDA --- */}
                   <div className="flex items-center gap-1">
                    <button
                      className="btn btn-secondary text-xs px-3 py-1"
                      onClick={() => router.push(makeEditHref(part.kind, part.id))}
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-ghost text-xs px-3 py-1"
                      onClick={() => { setToDelete({ partidaId: part.id, title: part.title }); }}
                      title="Eliminar"
                    >
                      X
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Columna Derecha: Resumen de Materiales */}
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
                    <td className="py-1.5">{m.label}</td>
                    <td className="py-1.5 text-right">{m.qty.toLocaleString('es-AR')}</td>
                    <td className="py-1.5 pl-4">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-xs text-foreground/60">Funciona offline (PWA)</p>

      {/* Dialogo de confirmación para eliminar */}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar partida"
        message={toDelete ? `¿Seguro que querés eliminar “${toDelete.title}” del proyecto?` : ""}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleRemovePartida}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}