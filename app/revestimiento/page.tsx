// app/revestimiento/page.tsx
"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Componentes
import ResultTable, { ResultRow } from "@/components/ui/ResultTable";
import NumberInput from "@/components/ui/NumberInput";
import OpeningsGroup, { OpeningVM } from "@/components/inputs/OpeningsGroup";
import AddToProject from "@/components/project/AddToProject";

// Tipos, catálogos, funciones
import { Catalogs, RevestimientoInput, RevestimientoResult } from "@/lib/types/seco";
import { MaterialRow } from "@/lib/project/types";
import { loadAllCatalogs } from "@/lib/data/catalogs";
import { calculateRevestimiento } from "@/lib/calc/revestimiento";
import { getPartida } from "@/lib/project/storage";
import { keyToLabel, keyToUnit } from "@/components/ui/result-mappers";

// Esquema de validación para el formulario de Revestimientos
const formSchema = z.object({
  largo_m: z.number().min(0.1, "Debe ser mayor a 0"),
  alto_m: z.number().min(0.1, "Debe ser mayor a 0"),
  tipoRevestimiento: z.enum(['directo', 'omega']),
  placaId: z.string().min(1, "Seleccioná una placa"),
  perfilOmegaId: z.string().optional(),
  separacionOmegas_cm: z.number().optional(),
  desperdicioPct: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

function RevestimientoCalculator() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const partidaId = searchParams.get("partidaId");

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [vanos, setVanos] = useState<OpeningVM[]>([]);
  const [result, setResult] = useState<RevestimientoResult | null>(null);
  
  const formResolver: Resolver<FormValues> = zodResolver(formSchema) as Resolver<FormValues>;
  const { register, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({
    resolver: formResolver,
    defaultValues: {
      largo_m: 0,
      alto_m: 0,
      tipoRevestimiento: 'omega',
      desperdicioPct: 10,
    },
  });

  useEffect(() => {
    loadAllCatalogs().then(setCatalogs);
  }, []);

  // Lógica de edición desde un proyecto (deep-linking)
  useEffect(() => {
    if (projectId && partidaId && catalogs) {
      (async () => {
        const partida = await getPartida(projectId, partidaId);
        if (partida && partida.inputs) {
          const inputs = partida.inputs as RevestimientoInput;
          setValue("largo_m", inputs.largo_m);
          setValue("alto_m", inputs.alto_m);
          setValue("tipoRevestimiento", inputs.tipoRevestimiento);
          setValue("placaId", inputs.placaId);
          setValue("perfilOmegaId", inputs.perfilOmegaId);
          setValue("separacionOmegas_cm", inputs.separacionOmegas_cm);
          setValue("desperdicioPct", inputs.desperdicioPct);
          setVanos(inputs.vanos || []);
        }
      })();
    }
  }, [projectId, partidaId, catalogs, setValue]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!catalogs) return;
    const input: RevestimientoInput = { ...data, vanos };
    const calcResult = calculateRevestimiento(input, catalogs);
    setResult(calcResult);
  };
  
  const formValues = watch(); 

  const { resultRows, itemsForProject, defaultTitle } = useMemo(() => {
    const title = `Revestimiento ${formValues.largo_m || 0}m × ${formValues.alto_m || 0}m`;
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
  
  if (!catalogs) {
    return <div className="text-center p-8">Cargando catálogos...</div>;
  }

  const tipoRevestimientoSeleccionado = watch('tipoRevestimiento');

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora de Revestimientos</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Columna de Inputs */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="Largo (m)" value={watch('largo_m')} onChange={v => setValue('largo_m', v)} step={0.1} />
            <NumberInput label="Alto (m)" value={watch('alto_m')} onChange={v => setValue('alto_m', v)} step={0.1} />
            
            <label className="text-sm flex flex-col gap-1 col-span-2">
              <span className="font-medium">Método de Revestimiento</span>
              <select {...register("tipoRevestimiento")} className="w-full px-3 py-2">
                <option value="omega">Sobre Perfil Omega</option>
                <option value="directo">Directo a Muro (con adhesivo)</option>
              </select>
            </label>

            {tipoRevestimientoSeleccionado === 'omega' && (
              <>
                <label className="text-sm flex flex-col gap-1">
                  <span className="font-medium">Perfil Omega</span>
                  <select {...register("perfilOmegaId")} className="w-full px-3 py-2" defaultValue="">
                     <option value="" disabled>Seleccionar...</option>
                    {catalogs.perfiles.filter(p => p.tipo === 'omega').map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm flex flex-col gap-1">
                  <span className="font-medium">Separación Omegas</span>
                  <select {...register("separacionOmegas_cm", { valueAsNumber: true })} className="w-full px-3 py-2">
                    <option value={40}>Cada 40 cm</option>
                    <option value={60}>Cada 60 cm</option>
                  </select>
                </label>
              </>
            )}
            
            <label className="text-sm flex flex-col gap-1 col-span-2">
              <span className="font-medium">Tipo de Placa</span>
              <select {...register("placaId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.placas.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Vanos a Descontar (Puertas/Ventanas)</h3>
            <OpeningsGroup items={vanos} onChange={setVanos} />
          </div>

          <NumberInput label="Desperdicio (%)" value={watch('desperdicioPct')} onChange={v => setValue('desperdicioPct', v)} />

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn">Calcular</button>
          </div>
        </form>

        {/* Columna de Resultados */}
        <div className="space-y-4">
          <ResultTable title="Materiales Estimados" items={resultRows} />
        </div>
      </div>
      
      {result && (
        <AddToProject
          kind="revestimiento"
          defaultTitle={defaultTitle}
          items={itemsForProject}
          raw={{ 
            input: { ...getValues(), vanos }, 
            result: result 
          }}
        />
      )}
    </section>
  );
}

// Envoltorio con Suspense para evitar errores de build
export default function RevestimientoPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RevestimientoCalculator />
    </Suspense>
  );
}
