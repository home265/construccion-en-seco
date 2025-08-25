// app/proyecto/[id]/export/page.tsx
"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject } from "@/lib/project/storage";
import { aggregateMaterials } from "@/lib/project/compute";


export default function ProyectoExportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const p = getProject(id);

  useEffect(() => {
    if (!p) {
      router.replace("/proyecto");
    }
  }, [p, router]);

  // Usamos un return temprano para evitar renderizar si no hay proyecto
  if (!p) {
    return <div className="text-center p-8">Cargando proyecto...</div>;
  }

  const mat = aggregateMaterials(p);
  const date = new Date().toLocaleDateString('es-AR');

  return (
    // Contenedor principal: en pantalla usa el fondo de la app, al imprimir es blanco y sin márgenes.
    <div className="mx-auto max-w-4xl bg-background print:bg-white text-foreground print:text-black">
      
      {/* Botonera que no se imprime */}
      <div className="print:hidden flex justify-between items-center mb-4 p-4">
        <button onClick={() => router.back()} className="btn-secondary">← Volver al Proyecto</button>
        <button onClick={() => window.print()} className="btn">Imprimir / Guardar PDF</button>
      </div>

      {/* Contenido del reporte */}
      <div className="p-8 border-border print:border-none border rounded-lg">
        {/* Encabezado del Reporte */}
        <header className="mb-8 pb-4 border-b border-border print:border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Cómputo de Materiales</h1>
              <div className="text-foreground/70 print:text-gray-600">
                <p>Proyecto: <strong>{p.name}</strong></p>
                {p.client && <p>Cliente: {p.client}</p>}
                {p.siteAddress && <p>Obra: {p.siteAddress}</p>}
                <p>Fecha de Emisión: {date}</p>
              </div>
            </div>
            {p.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logoUrl} alt="Logo" className="max-w-[120px] max-h-[80px] print:block hidden" />
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
                  <tr key={`${m.key}-${i}`} className="border-b border-border print:border-gray-200">
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
          {p.partes.length === 0 ? (
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
                {p.partes.map(part => (
                  <tr key={part.id} className="border-b border-border print:border-gray-200">
                    <td className="py-2">{part.title}</td>
                    <td className="py-2">{part.kind}</td>
                    <td className="py-2">{new Date(part.createdAt).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-8 pt-4 border-t border-border print:border-gray-200 text-xs text-foreground/60 print:text-gray-500">
          * Documento generado automáticamente para estimación de materiales. No reemplaza memorias de cálculo ni cómputos profesionales.
        </footer>
      </div>
    </div>
  );
}