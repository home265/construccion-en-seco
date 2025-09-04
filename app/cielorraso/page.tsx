// app/cielorraso/page.tsx
"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Componentes
import ResultTable, { ResultRow } from "@/components/ui/ResultTable";
import NumberInput from "@/components/ui/NumberInput";
import AddToProject from "@/components/project/AddToProject";

// Tipos, catálogos, funciones
import { Catalogs, CielorrasoInput, CielorrasoResult } from "@/lib/types/seco";
import { MaterialRow } from "@/lib/project/types";
import { loadAllCatalogs } from "@/lib/data/catalogs";
import { calculateCielorraso } from "@/lib/calc/cielorraso";
import { getPartida } from "@/lib/project/storage";
import { keyToLabel, keyToUnit } from "@/components/ui/result-mappers";
import HelpPopover from "@/components/ui/HelpPopover";

// Esquema de validación actualizado para el formulario de Cielorrasos
const formSchema = z.object({
  largo_m: z.number().min(0.1, "Debe ser mayor a 0"),
  ancho_m: z.number().min(0.1, "Debe ser mayor a 0"),
  perfilPrimarioId: z.string().min(1, "Seleccioná un perfil"),
  perfilSecundarioId: z.string().min(1, "Seleccioná un perfil"),
  separacionPrimarios_cm: z.number(),
  separacionSecundarios_cm: z.number(),
  placaId: z.string().min(1, "Seleccioná una placa"),
  desperdicioPct: z.number().min(0),
  // --- NUEVOS CAMPOS ---
  alturaCuelgue_cm: z.number().min(0),
  usaBandaAcustica: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function CielorrasoCalculator() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const partidaId = searchParams.get("partidaId");

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [result, setResult] = useState<CielorrasoResult | null>(null);

  const formResolver: Resolver<FormValues> = zodResolver(formSchema) as Resolver<FormValues>;
  
  const { register, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({
    resolver: formResolver,
    defaultValues: {
      largo_m: 0,
      ancho_m: 0,
      separacionPrimarios_cm: 120,
      separacionSecundarios_cm: 40,
      desperdicioPct: 10,
      alturaCuelgue_cm: 20, // <-- Valor por defecto
      usaBandaAcustica: true, // <-- Valor por defecto
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
          const inputs = partida.inputs as CielorrasoInput;
          setValue("largo_m", inputs.largo_m);
          setValue("ancho_m", inputs.ancho_m);
          setValue("perfilPrimarioId", inputs.perfilPrimarioId);
          setValue("perfilSecundarioId", inputs.perfilSecundarioId);
          setValue("separacionPrimarios_cm", inputs.separacionPrimarios_cm);
          setValue("separacionSecundarios_cm", inputs.separacionSecundarios_cm);
          setValue("placaId", inputs.placaId);
          setValue("desperdicioPct", inputs.desperdicioPct);
          setValue("alturaCuelgue_cm", inputs.alturaCuelgue_cm); // <-- Se carga el valor guardado
          setValue("usaBandaAcustica", inputs.usaBandaAcustica); // <-- Se carga el valor guardado
        }
      })();
    }
  }, [projectId, partidaId, catalogs, setValue]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!catalogs) return;
    const calcResult = calculateCielorraso(data, catalogs);
    setResult(calcResult);
  };
  
  const formValues = watch(); 

  const { resultRows, itemsForProject, defaultTitle } = useMemo(() => {
    const title = `Cielorraso ${formValues.largo_m || 0}m × ${formValues.ancho_m || 0}m`;
    if (!result) return { resultRows: [], itemsForProject: [], defaultTitle: title };
    
    const rows: ResultRow[] = [
      { label: "Área a cubrir", qty: result.area_m2, unit: "m²" },
    ];
    const materials: MaterialRow[] = [];

    for (const [key, value] of Object.entries(result.materiales)) {
      const label = keyToLabel(key) || key;
      const unit = keyToUnit(key);
      rows.push({ label, qty: value, unit });
      materials.push({ key, label, qty: value, unit: unit });
    }

    return { resultRows: rows, itemsForProject: materials, defaultTitle: title };
  }, [result, formValues]);
  
  if (!catalogs) {
    return <div className="text-center p-8">Cargando catálogos...</div>;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora de Cielorrasos</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
             {/* --- CAMPOS DE GEOMETRÍA Y PERFILES SIN CAMBIOS --- */}
            <NumberInput 
              label={<span className="flex items-center">Largo (m)<HelpPopover>Largo de la habitación.</HelpPopover></span>} 
              value={watch('largo_m')} onChange={v => setValue('largo_m', v)} step={0.1} 
            />
            <NumberInput 
              label={<span className="flex items-center">Ancho (m)<HelpPopover>Ancho de la habitación.</HelpPopover></span>} 
              value={watch('ancho_m')} onChange={v => setValue('ancho_m', v)} step={0.1} 
            />
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Perfil Primario<HelpPopover>Perfiles principales que se cuelgan del techo original (ej: Montante 70mm).</HelpPopover></span>
              <select {...register("perfilPrimarioId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.perfiles.filter(p => p.uso === 'cielorraso' || p.uso === 'divisorio').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Perfil Secundario<HelpPopover>Perfiles sobre los que se fijan las placas (ej: Solera 35mm).</HelpPopover></span>
              <select {...register("perfilSecundarioId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.perfiles.filter(p => p.uso === 'cielorraso' || p.uso === 'divisorio').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Separación Primarios<HelpPopover>Distancia entre ejes de perfiles primarios.</HelpPopover></span>
              <select {...register("separacionPrimarios_cm", { valueAsNumber: true })} className="w-full px-3 py-2">
                <option value={120}>Cada 120 cm</option>
                <option value={80}>Cada 80 cm</option>
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Separación Secundarios<HelpPopover>Distancia entre ejes de perfiles secundarios. 40 cm es lo más común.</HelpPopover></span>
              <select {...register("separacionSecundarios_cm", { valueAsNumber: true })} className="w-full px-3 py-2">
                <option value={40}>Cada 40 cm</option>
                <option value={60}>Cada 60 cm</option>
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1 col-span-2">
              <span className="font-medium flex items-center">Tipo de Placa<HelpPopover>Elige el tipo de placa de yeso a utilizar.</HelpPopover></span>
              <select {...register("placaId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.placas.map(p => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
              </select>
            </label>
          </div>
          
           {/* --- INICIO DE NUEVOS INPUTS --- */}
           <div className="pt-2 space-y-4">
               <NumberInput
                    label={
                        <span className="flex items-center">
                            Altura de Cuelgue (cm)
                            <HelpPopover>Distancia vertical desde el techo original hasta la estructura. Ingresar 0 si se fija directo.</HelpPopover>
                        </span>
                    }
                    value={watch('alturaCuelgue_cm')}
                    onChange={v => setValue('alturaCuelgue_cm', v)}
                    step={1}
                />
               <label htmlFor="usaBandaAcustica" className="flex items-center gap-3 text-sm font-medium">
                    <input type="checkbox" {...register("usaBandaAcustica")} id="usaBandaAcustica" />
                    Incluir banda acústica perimetral
                    <HelpPopover>Mejora la aislación acústica del cielorraso, evitando la transmisión de vibraciones al muro.</HelpPopover>
                </label>
           </div>
           {/* --- FIN DE NUEVOS INPUTS --- */}

          <NumberInput 
            label={ <span className="flex items-center"> Desperdicio (%) <HelpPopover>Porcentaje de material extra para compensar cortes y ajustes. Típicamente entre 10% y 15%.</HelpPopover> </span> } 
            value={watch('desperdicioPct')} 
            onChange={v => setValue('desperdicioPct', v)} 
          />

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn">Calcular</button>
          </div>
        </form>

        <div className="space-y-4">
          <ResultTable title="Materiales Estimados" items={resultRows} />
        </div>
      </div>

      {result && itemsForProject.length > 0 && (
        <AddToProject
          kind="cielorraso"
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

export default function CielorrasoPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CielorrasoCalculator />
    </Suspense>
  );
}