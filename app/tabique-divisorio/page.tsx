// app/tabique-divisorio/page.tsx
"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Componentes
import ResultTable, { ResultRow } from "@/components/ui/ResultTable";
import NumberInput from "@/components/ui/NumberInput";
import OpeningsGroup, { OpeningVM } from "@/components/inputs/OpeningsGroup";
import AddToProject from "@/components/project/AddToProject";
import BatchList from "@/components/project/BatchList";
import AddToProjectBatch from "@/components/project/AddToProjectBatch";

// Tipos, catálogos, funciones
import { Catalogs, TabiqueInput, TabiqueResult } from "@/lib/types/seco";
import { MaterialRow } from "@/lib/project/types";
import { loadAllCatalogs } from "@/lib/data/catalogs";
import { calculateTabique } from "@/lib/calc/tabique";
import { getPartida } from "@/lib/project/storage";
import { keyToLabel, keyToUnit } from "@/components/ui/result-mappers";

// El esquema de validación ahora es más simple
const formSchema = z.object({
  largo_m: z.number().min(0.1, "Debe ser mayor a 0"),
  alto_m: z.number().min(0.1, "Debe ser mayor a 0"),
  perfilId: z.string().min(1, "Seleccioná un perfil"),
  placaId: z.string().min(1, "Seleccioná una placa"),
  // 👇 SIMPLIFICAMOS ESTA LÍNEA 👇
  separacionMontantes_cm: z.number(),
  esDoblePlaca: z.boolean(),
  llevaAislante: z.boolean(),
  aislanteId: z.string().optional(),
  desperdicioPct: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

type BatchItem = {
  kind: "tabique-divisorio";
  title: string;
  materials: MaterialRow[];
  inputs: TabiqueInput;
  outputs: TabiqueResult;
};

function TabiqueCalculator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const partidaId = searchParams.get("partidaId");

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [vanos, setVanos] = useState<OpeningVM[]>([]);
  const [result, setResult] = useState<TabiqueResult | null>(null);
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  const formResolver: Resolver<FormValues> = zodResolver(formSchema) as Resolver<FormValues>;
  const { register, handleSubmit, control, watch, setValue, getValues } = useForm<FormValues>({
    resolver: formResolver,
    defaultValues: {
      largo_m: 0,
      alto_m: 0,
      separacionMontantes_cm: 40,
      esDoblePlaca: false,
      llevaAislante: false,
      desperdicioPct: 10,
    },
  });

  useEffect(() => {
    loadAllCatalogs().then(setCatalogs);
  }, []);

  useEffect(() => {
    if (projectId && partidaId && catalogs) {
      (async () => {
        const partida = await getPartida(projectId, partidaId);
        if (partida && partida.inputs) {
          const inputs = partida.inputs as TabiqueInput;
          setValue("largo_m", inputs.largo_m);
          setValue("alto_m", inputs.alto_m);
          setValue("perfilId", inputs.perfilId);
          setValue("placaId", inputs.placaId);
          setValue("separacionMontantes_cm", inputs.separacionMontantes_cm);
          setValue("esDoblePlaca", inputs.esDoblePlaca);
          setValue("llevaAislante", inputs.llevaAislante);
          setValue("aislanteId", inputs.aislanteId);
          setValue("desperdicioPct", inputs.desperdicioPct);
          setVanos(inputs.vanos || []);
        }
      })();
    }
  }, [projectId, partidaId, catalogs, setValue]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!catalogs) return;
    // Ahora 'data' y 'TabiqueInput' son compatibles
    const input: TabiqueInput = { ...data, vanos };
    const calcResult = calculateTabique(input, catalogs);
    setResult(calcResult);
  };
  
  const formValues = watch(); 

  const { resultRows, itemsForProject, defaultTitle } = useMemo(() => {
    const title = `Tabique ${formValues.largo_m || 0}m × ${formValues.alto_m || 0}m`;
    if (!result) return { resultRows: [], itemsForProject: [], defaultTitle: title };
    
    const rows: ResultRow[] = [
      { label: "Área Neta a cubrir", qty: result.areaNeta_m2, unit: "m²" },
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

  // --- LÓGICA DE LOTE LOCAL ---
  const addCurrentToBatch = () => {
    if (!result) { 
        alert("Primero debés calcular los materiales.");
        return;
    };
    const currentInputs: TabiqueInput = { ...getValues(), vanos };
    const item: BatchItem = {
      kind: "tabique-divisorio",
      title: defaultTitle,
      materials: itemsForProject,
      inputs: currentInputs,
      outputs: result,
    };
    setBatch(prev => [...prev, item]);
  };
  
  if (!catalogs) {
    return <div className="text-center p-8">Cargando catálogos de materiales...</div>;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora de Tabiques Divisorios</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="Largo (m)" value={watch('largo_m')} onChange={v => setValue('largo_m', v)} step={0.1} />
            <NumberInput label="Alto (m)" value={watch('alto_m')} onChange={v => setValue('alto_m', v)} step={0.1} />
            
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium">Perfil (Montante/Solera)</span>
              <select {...register("perfilId")} className="w-full px-3 py-2">
                {catalogs.perfiles.filter(p => p.uso === 'divisorio' && p.tipo === 'montante').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>

            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium">Separación Montantes</span>
              <select {...register("separacionMontantes_cm", { valueAsNumber: true })} className="w-full px-3 py-2">
                <option value={40}>Cada 40 cm</option>
                <option value={60}>Cada 60 cm</option>
              </select>
            </label>

            <label className="text-sm flex flex-col gap-1 col-span-2">
              <span className="font-medium">Tipo de Placa</span>
              <select {...register("placaId")} className="w-full px-3 py-2">
                {catalogs.placas.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="flex items-center gap-4">
              <input type="checkbox" {...register("esDoblePlaca")} id="doblePlaca" />
              <label htmlFor="doblePlaca" className="text-sm font-medium">Usar doble placa por cara</label>
          </div>
          
          <div className="flex items-center gap-4">
              <input type="checkbox" {...register("llevaAislante")} id="conAislante" />
              <label htmlFor="conAislante" className="text-sm font-medium">Agregar aislación interior</label>
          </div>
          
          {watch('llevaAislante') && (
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium">Tipo de Aislante</span>
              <select {...register("aislanteId")} className="w-full px-3 py-2">
                {catalogs.aislantes.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </label>
          )}
          
          <div className="space-y-2">
            <h3 className="font-medium">Vanos a Descontar (Puertas/Ventanas)</h3>
            <OpeningsGroup items={vanos} onChange={setVanos} />
          </div>

          <NumberInput label="Desperdicio (%)" value={watch('desperdicioPct')} onChange={v => setValue('desperdicioPct', v)} />

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn">Calcular</button>
            <button type="button" onClick={addCurrentToBatch} className="btn-secondary">Añadir al lote</button>
          </div>
        </form>

        <div className="space-y-4">
          <ResultTable title="Materiales Estimados" items={resultRows} />
        </div>
      </div>

      {batch.length > 0 && (
          <div className="card p-4 space-y-3">
            <h2 className="font-medium">Lote Local (Tabiques)</h2>
            <BatchList items={batch} onEdit={() => {}} onRemove={() => {}} />
            <AddToProjectBatch items={batch} onSaved={() => setBatch([])} />
          </div>
      )}

      {result && itemsForProject.length > 0 && (
        <AddToProject
                  kind="tabique-divisorio"
                  defaultTitle={defaultTitle}
                  raw={{
                      input: { ...getValues(), vanos },
                      result: result
                  }} items={[]}        />
      )}
    </section>
  );
}

// Componente principal que exportamos, con el Suspense para evitar errores
export default function TabiqueDivisorioPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <TabiqueCalculator />
    </Suspense>
  );
}
