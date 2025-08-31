// app/proyecto/[id]/export/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/lib/project/storage";
import { aggregateMaterials } from "@/lib/project/compute";
import type { Project } from "@/lib/project/types";

export default function ProyectoExportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar proyecto (async con Dexie)
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

  if (loading) {
    return <div className="text-center p-8">Cargando proyecto…</div>;
  }
  if (!project) return null;

  const mat = aggregateMaterials(project);
  const date = new Date().toLocaleDateString("es-AR");

  return (
    // En pantalla: fondo de la app; al imprimir: blanco, sin márgenes
    <div className="mx-auto max-w-4xl bg-background print:bg-white text-foreground print:text-black">
      {/* Botonera (no se imprime) */}
      <div className="print:hidden flex justify-between items-center mb-4 p-4">
        <button onClick={() => router.back()} className="btn-secondary">
          ← Volver
        </button>
        <div className="flex gap-2">
          <Link className="btn-secondary" href={`/proyecto/${project.id}`}>
            Ver Proyecto
          </Link>
          <button onClick={() => window.print()} className="btn">
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Contenido del reporte */}
      <div className="p-8 border border-border rounded-lg print:border-none">
        {/* Encabezado */}
        <header className="mb-8 pb-4 border-b border-border print:border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Cómputo de Materiales</h1>
              <div className="text-foreground/70 print:text-gray-600">
                <p>
                  Proyecto: <strong>{project.name}</strong>
                </p>
                {project.client && <p>Cliente: {project.client}</p>}
                {project.siteAddress && <p>Obra: {project.siteAddress}</p>}
                <p>Fecha de Emisión: {date}</p>
              </div>
            </div>
            {project.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.logoUrl}
                alt="Logo"
                className="max-w-[120px] max-h-[80px] print:block hidden"
              />
            )}
          </div>
        </header>

        {/* Resumen de Materiales */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Resumen de Materiales</h2>
          {mat.length === 0 ? (
            <p className="text-sm text-foreground/60 print:text-gray-500">Sin materiales aún.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-foreground/60 print:text-gray-500">
                <tr className="border-b border-border print:border-gray-200">
                  <th className="py-2 font-medium">Material</th>
                  <th className="py-2 font-medium text-right">Cantidad</th>
                  <th className="py-2 font-medium pl-4">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {mat.map((m, i) => (
                  <tr
                    key={`${m.key ?? `${m.label}-${m.unit}`}-${i}`}
                    className="border-b border-border print:border-gray-200"
                  >
                    <td className="py-2">{m.label}</td>
                    <td className="py-2 text-right font-medium">{m.qty}</td>
                    <td className="py-2 pl-4">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Detalle de Partidas */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Partidas Incluidas</h2>
          {project.partes.length === 0 ? (
            <p className="text-sm text-foreground/60 print:text-gray-500">No hay partidas cargadas.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-foreground/60 print:text-gray-500">
                <tr className="border-b border-border print:border-gray-200">
                  <th className="py-2 font-medium">Descripción</th>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {project.partes.map((part) => (
                  <tr key={part.id} className="border-b border-border print:border-gray-200">
                    <td className="py-2">{part.title}</td>
                    <td className="py-2">{part.kind}</td>
                    <td className="py-2">
                      {new Date(part.createdAt).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-8 pt-4 border-t border-border print:border-gray-200 text-xs text-foreground/60 print:text-gray-500">
          * Documento generado automáticamente para estimación de materiales. No reemplaza memorias
          de cálculo ni cómputos profesionales.
        </footer>
      </div>
    </div>
  );
}
