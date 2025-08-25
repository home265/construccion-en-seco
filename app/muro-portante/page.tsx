// app/muro-portante/page.tsx
"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import ResultTable, { ResultRow } from "@/components/ui/ResultTable";
import NumberInput from "@/components/ui/NumberInput";
import AddToProject from "@/components/project/AddToProject";

import { Catalogs, MuroPortanteInput, MuroPortanteResult } from "@/lib/types/seco";
import { MaterialRow } from "@/lib/project/types";
import { loadAllCatalogs } from "@/lib/data/catalogs";
import { calculateMuroPortante } from "@/lib/calc/muro-portante";
import { getPartida } from "@/lib/project/storage";
import { keyToLabel, keyToUnit } from "@/components/ui/result-mappers";

const formSchema = z.object({
  largo_m: z.number().min(0.1),
  alto_m: z.number().min(0.1),
  entrepiso_ancho_apoyo_m: z.number().min(0),
  entrepiso_largo_apoyo_m: z.number().min(0),
  entrepiso_tipo_cubierta: z.enum(['osb', 'placa_cementicia', 'losa_humeda_liviana']),
  tieneTechoArriba: z.boolean(),
  techo_tipo: z.enum(['chapa', 'teja']).optional(),
  placaId: z.string().min(1),
  desperdicioPct: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

function MuroPortanteCalculator() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const partidaId = searchParams.get("partidaId");

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [result, setResult] = useState<MuroPortanteResult | null>(null);
  
  const { register, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      largo_m: 0,
      alto_m: 0,
      entrepiso_ancho_apoyo_m: 0,
      entrepiso_largo_apoyo_m: 0,
      entrepiso_tipo_cubierta: 'osb',
      tieneTechoArriba: false,
      desperdicioPct: 15,
    },
  });

  useEffect(() => {
    loadAllCatalogs().then(setCatalogs);
  }, []);

  const onSubmit = (data: FormValues) => {
    if (!catalogs) return;
    const input: MuroPortanteInput = data;
    const calcResult = calculateMuroPortante(input, catalogs);
    setResult(calcResult);
  };
  
  const { resultRows, itemsForProject, defaultTitle } = useMemo(() => {
    const title = `Muro Portante ${getValues().largo_m || 0}m × ${getValues().alto_m || 0}m`;
    if (!result) return { resultRows: [], itemsForProject: [], defaultTitle: title };
    
    const perfilRecomendado = catalogs?.perfiles.find(p => p.id === result.perfilRecomendadoId)?.nombre || result.perfilRecomendadoId;
    const anclajeRecomendado = catalogs?.anclajes.find(a => a.id === result.anclajeRecomendadoId)?.nombre || result.anclajeRecomendadoId;
    
    const rows: ResultRow[] = [
      { label: "Carga Lineal Estimada", qty: result.cargaEstimada_kg_ml, unit: "kg/m" },
      { label: "Perfil PGC Recomendado", qty: perfilRecomendado, hint: `Separación recomendada: ${result.separacionRecomendada_cm} cm` },
      { label: "Anclaje Recomendado", qty: anclajeRecomendado },
    ];
    const materials: MaterialRow[] = [];

    for (const [key, value] of Object.entries(result.materiales)) {
      const label = keyToLabel(key) || key;
      const unit = keyToUnit(key);
      rows.push({ label: `Cant. ${label}`, qty: value, unit: unit });
      materials.push({ key, label, qty: value, unit });
    }

    return { resultRows: rows, itemsForProject: materials, defaultTitle: title };
  }, [result, catalogs, getValues]);
  
  if (!catalogs) {
    return <div className="text-center p-8">Cargando...</div>;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora de Muros Portantes (Steel Framing)</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-6">
          <div>
            <h3 className="font-medium mb-2">Dimensiones del Muro</h3>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="Largo (m)" value={watch('largo_m')} onChange={v => setValue('largo_m', v)} step={0.1} />
              <NumberInput label="Alto (m)" value={watch('alto_m')} onChange={v => setValue('alto_m', v)} step={0.1} />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Cargas del Entrepiso Superior</h3>
            <div className="grid grid-cols-2 gap-4">
               <NumberInput label="Ancho Apoyo (m)" value={watch('entrepiso_ancho_apoyo_m')} onChange={v => setValue('entrepiso_ancho_apoyo_m', v)} step={0.1} />
              <NumberInput label="Largo Apoyo (m)" value={watch('entrepiso_largo_apoyo_m')} onChange={v => setValue('entrepiso_largo_apoyo_m', v)} step={0.1} />
              <label className="text-sm flex flex-col gap-1 col-span-2">
                <span className="font-medium">Terminación del Entrepiso</span>
                <select {...register("entrepiso_tipo_cubierta")} className="w-full px-3 py-2">
                  <option value="osb">Placa OSB o Fenólico</option>
                  <option value="placa_cementicia">Placa Cementicia</option>
                  <option value="losa_humeda_liviana">Losa Húmeda Liviana</option>
                </select>
              </label>
            </div>
          </div>
          <div>
             <h3 className="font-medium mb-2">Otras Cargas</h3>
            <div className="flex items-center gap-4">
                <input type="checkbox" {...register("tieneTechoArriba")} id="tieneTecho" />
                <label htmlFor="tieneTecho" className="text-sm font-medium">Soporta un techo arriba</label>
            </div>
            {watch('tieneTechoArriba') && (
              <label className="text-sm flex flex-col gap-1 mt-4">
                <span className="font-medium">Tipo de Techo</span>
                <select {...register("techo_tipo")} className="w-full px-3 py-2">
                  <option value="chapa">Techo de Chapa (Liviano)</option>
                  <option value="teja">Techo de Teja (Pesado)</option>
                </select>
              </label>
            )}
          </div>
           <div>
            <h3 className="font-medium mb-2">Configuración del Muro</h3>
             <label className="text-sm flex flex-col gap-1 col-span-2">
                <span className="font-medium">Tipo de Placa (Emplacado)</span>
                <select {...register("placaId")} className="w-full px-3 py-2" defaultValue="">
                    <option value="" disabled>Seleccionar...</option>
                    {catalogs.placas.map(p => ( <option key={p.id} value={p.id}>{p.nombre}</option>))}
                </select>
            </label>
            <div className="mt-4">
                <NumberInput label="Desperdicio (%)" value={watch('desperdicioPct')} onChange={v => setValue('desperdicioPct', v)} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn">Calcular</button>
          </div>
        </form>

        <div className="space-y-4">
          <ResultTable title="Pre-dimensionado y Materiales" items={resultRows} />
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
          kind="muro-portante"
          defaultTitle={defaultTitle}
          items={itemsForProject}
          raw={{ input: getValues(), result: result }}
        />
      )}
    </section>
  );
}

export default function MuroPortantePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MuroPortanteCalculator />
    </Suspense>
  );
}