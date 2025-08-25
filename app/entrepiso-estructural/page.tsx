// app/entrepiso-estructural/page.tsx
"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Componentes
import ResultTable, { ResultRow } from "@/components/ui/ResultTable";
import NumberInput from "@/components/ui/NumberInput";
import AddToProject from "@/components/project/AddToProject";
// NOTA: Omitimos BatchList y AddToProjectBatch por ahora para simplificar, se pueden agregar luego.

// Tipos, catálogos, funciones
import { Catalogs, EntrepisoInput, EntrepisoResult } from "@/lib/types/seco";
import { MaterialRow } from "@/lib/project/types";
import { loadAllCatalogs } from "@/lib/data/catalogs";
import { calculateEntrepiso } from "@/lib/calc/entrepiso";
import { getPartida } from "@/lib/project/storage";
import { keyToLabel, keyToUnit } from "@/components/ui/result-mappers";

// 1. Nuevo Esquema de Validación para Muros Estructurales
const formSchema = z.object({
  largo_m: z.number().min(0.1, "Debe ser mayor a 0"),
  ancho_m: z.number().min(0.1, "Debe ser mayor a 0"),
  perfilVigaId: z.string().min(1, "Seleccioná un perfil PGC"),
  perfilBordeId: z.string().min(1, "Seleccioná un perfil PGU"),
  separacionVigas_cm: z.coerce.number(),
  tipoCubierta: z.enum(['osb', 'fenolico', 'placa_cementicia']),
  desperdicioPct: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

function MuroEstructuralCalculator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const partidaId = searchParams.get("partidaId");

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [result, setResult] = useState<EntrepisoResult | null>(null);
  
  const { register, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      largo_m: 0,
      ancho_m: 0,
      separacionVigas_cm: 40,
      tipoCubierta: 'osb',
      desperdicioPct: 10,
    },
  });

  useEffect(() => {
    loadAllCatalogs().then(setCatalogs);
  }, []);

  useEffect(() => {
    if (projectId && partidaId && catalogs) {
      const partida = getPartida(projectId, partidaId);
      if (partida && partida.inputs) {
        const inputs = partida.inputs as EntrepisoInput;
        setValue("largo_m", inputs.largo_m);
        setValue("ancho_m", inputs.ancho_m);
        setValue("perfilVigaId", inputs.perfilVigaId);
        setValue("perfilBordeId", inputs.perfilBordeId);
        setValue("separacionVigas_cm", inputs.separacionVigas_cm);
        setValue("tipoCubierta", inputs.tipoCubierta);
        setValue("desperdicioPct", inputs.desperdicioPct);
      }
    }
  }, [projectId, partidaId, catalogs, setValue]);

  // 2. La lógica ahora llama a `calculateEntrepiso`
  const onSubmit = (data: FormValues) => {
    if (!catalogs) return;
    const input: EntrepisoInput = data;
    const calcResult = calculateEntrepiso(input, catalogs);
    setResult(calcResult);
  };
  
  const formValues = watch(); 

  const { resultRows, itemsForProject, defaultTitle } = useMemo(() => {
    const title = `Muro Estructural ${formValues.largo_m || 0}m × ${formValues.ancho_m || 0}m`;
    if (!result) return { resultRows: [], itemsForProject: [], defaultTitle: title };
    
    const rows: ResultRow[] = [
      { label: "Área de Entrepiso", qty: result.area_m2, unit: "m²" },
    ];
    const materials: MaterialRow[] = [];

    for (const [key, value] of Object.entries(result.materiales)) {
      const label = keyToLabel(key) || key;
      const unit = keyToUnit(key);
      rows.push({ label, qty: value, unit });
      materials.push({ key, label, qty: value, unit });
    }

    return { resultRows: rows, itemsForProject: materials, defaultTitle: title };
  }, [result, formValues]);
  
  if (!catalogs) {
    return <div className="text-center p-8">Cargando catálogos de materiales...</div>;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora de Muros Portantes (Steel Framing)</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Columna de Inputs */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 3. Nuevos Inputs para el formulario */}
            <NumberInput label="Largo (m)" value={watch('largo_m')} onChange={v => setValue('largo_m', v)} step={0.1} />
            <NumberInput label="Ancho (m)" value={watch('ancho_m')} onChange={v => setValue('ancho_m', v)} step={0.1} />
            
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium">Perfil Vigas (PGC)</span>
              <select {...register("perfilVigaId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.perfiles.filter(p => p.uso === 'estructural' && p.tipo === 'pgc').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>

            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium">Perfil Bordes (PGU)</span>
              <select {...register("perfilBordeId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.perfiles.filter(p => p.uso === 'estructural' && p.tipo === 'pgu').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>

            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium">Separación Vigas</span>
              <select {...register("separacionVigas_cm")} className="w-full px-3 py-2">
                <option value={40}>Cada 40 cm</option>
                <option value={60}>Cada 60 cm</option>
              </select>
            </label>

            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium">Cubierta Superior</span>
              <select {...register("tipoCubierta")} className="w-full px-3 py-2">
                <option value="osb">Placa OSB</option>
                <option value="fenolico">Placa Fenólico</option>
                <option value="placa_cementicia">Placa Cementicia</option>
              </select>
            </label>
          </div>
          
          <NumberInput label="Desperdicio (%)" value={watch('desperdicioPct')} onChange={v => setValue('desperdicioPct', v)} />

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn">Calcular</button>
          </div>
        </form>

        {/* Columna de Resultados */}
        <div className="space-y-4">
          <ResultTable title="Materiales Estimados" items={resultRows} />

          {/* 4. Resultado con Advertencia */}
          {result?.notaImportante && (
            <div className="p-4 rounded-lg bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-sm">
              <p className="font-bold mb-1">¡Atención!</p>
              <p>{result.notaImportante}</p>
            </div>
          )}
        </div>
      </div>
      
      {result && (
        <AddToProject
          kind="entrepiso-estructural"
          defaultTitle={defaultTitle}
          items={itemsForProject}
          raw={{ 
            input: getValues(), 
            result: result 
          }}
        />
      )}
    </section>
  );
}


export default function EntrepisoEstructuralPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MuroEstructuralCalculator />
    </Suspense>
  );
}