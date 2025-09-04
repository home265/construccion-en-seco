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
import OpeningsGroup from "@/components/inputs/OpeningsGroup";
import AddToProject from "@/components/project/AddToProject";
import BatchList from "@/components/project/BatchList";
import AddToProjectBatch from "@/components/project/AddToProjectBatch";
import HelpPopover from "@/components/ui/HelpPopover";

// Tipos, catálogos, funciones
import { Catalogs, TabiqueInput, TabiqueResult, Vano } from "@/lib/types/seco"; // <-- Vano importado
import { MaterialRow } from "@/lib/project/types";
import { loadAllCatalogs } from "@/lib/data/catalogs";
import { calculateTabique } from "@/lib/calc/tabique";
import { getPartida } from "@/lib/project/storage";
import { keyToLabel, keyToUnit } from "@/components/ui/result-mappers";

// El esquema de validación actualizado
const formSchema = z.object({
  largo_m: z.number().min(0.1, "Debe ser mayor a 0"),
  alto_m: z.number().min(0.1, "Debe ser mayor a 0"),
  perfilId: z.string().min(1, "Seleccioná un perfil"),
  placaId: z.string().min(1, "Seleccioná una placa"),
  separacionMontantes_cm: z.number(),
  esDoblePlaca: z.boolean(),
  llevaAislante: z.boolean(),
  aislanteId: z.string().optional(),
  requiereArriostramiento: z.boolean(), // <-- Nuevo campo
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
  const [vanos, setVanos] = useState<Vano[]>([]); // <-- Tipo actualizado
  const [result, setResult] = useState<TabiqueResult | null>(null);
  const [batch, setBatch] = useState<BatchItem[]>([]);
  
  const formResolver: Resolver<FormValues> = zodResolver(formSchema) as Resolver<FormValues>;
  const { register, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({
    resolver: formResolver,
    defaultValues: {
      largo_m: 0,
      alto_m: 2.6,
      separacionMontantes_cm: 40,
      esDoblePlaca: false,
      llevaAislante: true,
      requiereArriostramiento: true, // <-- Valor por defecto
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
          setValue("requiereArriostramiento", inputs.requiereArriostramiento); // <-- Se carga el valor guardado
          setValue("desperdicioPct", inputs.desperdicioPct);
          setVanos(inputs.vanos || []);
        }
      })();
    }
  }, [projectId, partidaId, catalogs, setValue]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!catalogs) return;
    const input: TabiqueInput = { ...data, vanos };
    const calcResult = calculateTabique(input, catalogs);
    setResult(calcResult);
    // Para depuración, muestra el detalle de cortes en la consola del navegador
    console.log("Detalle de optimización de cortes:", calcResult.optimizacion);
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
      materials.push({ key, label: label, qty: value, unit: unit });
    }

    return { resultRows: rows, itemsForProject: materials, defaultTitle: title };
  }, [result, formValues]);

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
            {/* --- CAMPOS DE LARGO, ALTO, PERFIL, SEPARACIÓN Y PLACA SIN CAMBIOS --- */}
            <NumberInput 
              label={ <span className="flex items-center">Largo (m)<HelpPopover>Longitud total del tabique a construir.</HelpPopover></span> } 
              value={watch('largo_m')} onChange={v => setValue('largo_m', v)} step={0.1} 
            />
            <NumberInput 
              label={ <span className="flex items-center">Alto (m)<HelpPopover>Altura del tabique, generalmente de piso a techo.</HelpPopover></span> } 
              value={watch('alto_m')} onChange={v => setValue('alto_m', v)} step={0.1} 
            />
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Perfil (Montante/Solera)<HelpPopover>Selecciona el ancho del perfil. La app calculará tanto las Soleras (horizontales) como los Montantes (verticales) del mismo ancho.</HelpPopover></span>
              <select {...register("perfilId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.perfiles.filter(p => p.uso === 'divisorio' && p.tipo === 'montante').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Separación Montantes<HelpPopover>Distancia entre los ejes de los perfiles verticales (montantes). La separación estándar es de 40 cm para mayor rigidez.</HelpPopover></span>
              <select {...register("separacionMontantes_cm", { valueAsNumber: true })} className="w-full px-3 py-2">
                <option value={40}>Cada 40 cm</option>
                <option value={60}>Cada 60 cm</option>
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1 col-span-2">
              <span className="font-medium flex items-center">Tipo de Placa<HelpPopover>Elige la placa de yeso a utilizar. La placa RH (verde) es para ambientes húmedos como baños y cocinas.</HelpPopover></span>
              <select {...register("placaId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.placas.map(p => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
              </select>
            </label>
          </div>
          
          <div className="space-y-2 pt-2">
              <label htmlFor="doblePlaca" className="flex items-center gap-3 text-sm font-medium">
                  <input type="checkbox" {...register("esDoblePlaca")} id="doblePlaca" />
                  Usar doble placa por cara
                  <HelpPopover>Marcar esta opción si se requiere mayor resistencia al impacto o mejor aislación acústica.</HelpPopover>
              </label>
              <label htmlFor="conAislante" className="flex items-center gap-3 text-sm font-medium">
                  <input type="checkbox" {...register("llevaAislante")} id="conAislante" />
                  Agregar aislación interior
                  <HelpPopover>Añade un material aislante en el interior del tabique para mejorar el confort térmico y acústico.</HelpPopover>
              </label>
              {/* --- INICIO DEL CAMBIO --- */}
              <label htmlFor="conArriostramiento" className="flex items-center gap-3 text-sm font-medium">
                  <input type="checkbox" {...register("requiereArriostramiento")} id="conArriostramiento" />
                  Requiere arriostramiento (Cruz de San Andrés)
                  <HelpPopover>Añade el fleje metálico para dar rigidez al tabique. Obligatorio en zonas sísmicas o para tabiques altos.</HelpPopover>
              </label>
              {/* --- FIN DEL CAMBIO --- */}
          </div>
          
          {watch('llevaAislante') && (
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Tipo de Aislante</span>
              <select {...register("aislanteId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.aislantes.map(a => (<option key={String((a as {id:string}).id)} value={String((a as {id:string}).id)}>{String((a as {nombre:string}).nombre)}</option>))}
              </select>
            </label>
          )}
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center">Vanos a Descontar (Puertas/Ventanas)</h3>
            <OpeningsGroup items={vanos} onChange={setVanos} />
          </div>

          <NumberInput 
            label={ <span className="flex items-center">Desperdicio (%)<HelpPopover>Porcentaje de material extra para compensar cortes y ajustes. Un valor recomendado es entre 10% y 15%.</HelpPopover></span> } 
            value={watch('desperdicioPct')} 
            onChange={v => setValue('desperdicioPct', v)} 
          />

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn">Calcular</button>
            <button type="button" onClick={addCurrentToBatch} className="btn btn-secondary">Añadir al lote</button>
          </div>
        </form>

        <div className="space-y-4">
          <ResultTable title="Materiales Estimados" items={resultRows} />
           {/* --- INICIO DEL CAMBIO --- */}
           {result?.optimizacion && (
              <div className="card p-4">
                  <h3 className="font-medium mb-2">Sugerencia de Optimización de Cortes</h3>
                  <div className="text-xs space-y-2 text-foreground/80">
                      <p><strong>Montantes:</strong> Se usarán <strong>{(result.optimizacion.montantes as unknown[]).length}</strong> perfiles. Para ver el detalle de cortes por perfil, revisá la consola del navegador (F12).</p>
                      <p><strong>Soleras:</strong> Se usarán <strong>{(result.optimizacion.soleras as unknown[]).length}</strong> perfiles para soleras, dinteles y antepechos.</p>
                  </div>
              </div>
          )}
          {/* --- FIN DEL CAMBIO --- */}
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

export default function TabiqueDivisorioPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <TabiqueCalculator />
    </Suspense>
  );
}