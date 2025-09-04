// app/entrepiso-estructural/page.tsx
"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Componentes
import ResultTable, { ResultRow } from "@/components/ui/ResultTable";
import NumberInput from "@/components/ui/NumberInput";
import AddToProject from "@/components/project/AddToProject";
import HelpPopover from "@/components/ui/HelpPopover";

// Tipos, catálogos, funciones
import { Catalogs, EntrepisoInput, EntrepisoResult } from "@/lib/types/seco";
import { MaterialRow } from "@/lib/project/types";
import { loadAllCatalogs } from "@/lib/data/catalogs";
import { calculateEntrepiso } from "@/lib/calc/entrepiso";
import { getPartida } from "@/lib/project/storage";
import { keyToLabel, keyToUnit } from "@/components/ui/result-mappers";

// Esquema de Validación actualizado
const formSchema = z.object({
  largo_m: z.number().min(0.1, "Debe ser mayor a 0"),
  ancho_m: z.number().min(0.1, "Debe ser mayor a 0"),
  perfilVigaId: z.string().min(1, "Seleccioná un perfil PGC"),
  perfilBordeId: z.string().min(1, "Seleccioná un perfil PGU"),
  separacionVigas_cm: z.number(),
  tipoCubierta: z.enum(['osb', 'fenolico', 'placa_cementicia']),
  desperdicioPct: z.number().min(0),
  // --- NUEVO CAMPO ---
  usaBlockings: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// --- NOMBRE DEL COMPONENTE CORREGIDO ---
function EntrepisoEstructuralCalculator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const partidaId = searchParams.get("partidaId");

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [result, setResult] = useState<EntrepisoResult | null>(null);
  
  const formResolver: Resolver<FormValues> = zodResolver(formSchema) as Resolver<FormValues>;
  const { register, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({
    resolver: formResolver,
    defaultValues: {
      largo_m: 0,
      ancho_m: 0,
      separacionVigas_cm: 40,
      tipoCubierta: 'osb',
      desperdicioPct: 10,
      usaBlockings: true, // <-- Valor por defecto
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
          const inputs = partida.inputs as EntrepisoInput;
          setValue("largo_m", inputs.largo_m);
          setValue("ancho_m", inputs.ancho_m);
          setValue("perfilVigaId", inputs.perfilVigaId);
          setValue("perfilBordeId", inputs.perfilBordeId);
          setValue("separacionVigas_cm", inputs.separacionVigas_cm);
          setValue("tipoCubierta", inputs.tipoCubierta);
          setValue("desperdicioPct", inputs.desperdicioPct);
          setValue("usaBlockings", inputs.usaBlockings); // <-- Se carga el valor guardado
        }
      })();
    }
  }, [projectId, partidaId, catalogs, setValue]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!catalogs) return;
    const calcResult = calculateEntrepiso(data, catalogs);
    setResult(calcResult);
  };
  
  const formValues = watch(); 

  const { resultRows, itemsForProject, defaultTitle } = useMemo(() => {
    // --- TÍTULO CORREGIDO ---
    const title = `Entrepiso Estructural ${formValues.largo_m || 0}m × ${formValues.ancho_m || 0}m`;
    if (!result) return { resultRows: [], itemsForProject: [], defaultTitle: title };
    
    const rows: ResultRow[] = [
      { label: "Área de Entrepiso", qty: result.area_m2, unit: "m²" },
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
    return <div className="text-center p-8">Cargando catálogos de materiales...</div>;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora de Entrepisos (Steel Framing)</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* --- CAMPOS EXISTENTES SIN CAMBIOS --- */}
            <NumberInput 
              label={ <span className="flex items-center"> Largo (m) <HelpPopover>Largo total del entrepiso, en la dirección de las vigas principales (PGC).</HelpPopover></span> } 
              value={watch('largo_m')} onChange={v => setValue('largo_m', v)} step={0.1} 
            />
            <NumberInput 
              label={ <span className="flex items-center"> Ancho (m) <HelpPopover>Ancho total del entrepiso. Sobre esta dimensión se distribuirán las vigas.</HelpPopover></span> } 
              value={watch('ancho_m')} onChange={v => setValue('ancho_m', v)} step={0.1} 
            />
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Perfil Vigas (PGC)<HelpPopover>Perfil principal que funcionará como viga o "joist".</HelpPopover></span>
              <select {...register("perfilVigaId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.perfiles.filter(p => p.uso === 'estructural' && p.tipo === 'pgc').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Perfil Bordes (PGU)<HelpPopover>Perfil perimetral o "track" donde se apoyan y fijan las vigas PGC.</HelpPopover></span>
              <select {...register("perfilBordeId")} className="w-full px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {catalogs.perfiles.filter(p => p.uso === 'estructural' && p.tipo === 'pgu').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Separación Vigas<HelpPopover>Distancia entre ejes de las vigas PGC.</HelpPopover></span>
              <select {...register("separacionVigas_cm", { valueAsNumber: true })} className="w-full px-3 py-2">
                <option value={40}>Cada 40 cm</option>
                <option value={60}>Cada 60 cm</option>
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="font-medium flex items-center">Cubierta Superior<HelpPopover>Placa o tablero que se fija sobre las vigas.</HelpPopover></span>
              <select {...register("tipoCubierta")} className="w-full px-3 py-2">
                <option value="osb">Placa OSB</option>
                <option value="fenolico">Placa Fenólico</option>
                <option value="placa_cementicia">Placa Cementicia</option>
              </select>
            </label>
          </div>
          
          {/* --- NUEVO CHECKBOX --- */}
          <div className="pt-2">
            <label htmlFor="usaBlockings" className="flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" {...register("usaBlockings")} id="usaBlockings" />
              Incluir arriostramiento (Blockings)
              <HelpPopover>Calcula los perfiles de bloqueo entre vigas para evitar el pandeo. Es un elemento estructural crítico.</HelpPopover>
            </label>
          </div>
          
          <NumberInput 
            label={ <span className="flex items-center"> Desperdicio (%) <HelpPopover>Porcentaje de material extra para compensar cortes y ajustes.</HelpPopover></span> } 
            value={watch('desperdicioPct')} 
            onChange={v => setValue('desperdicioPct', v)} 
          />

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn">Calcular</button>
          </div>
        </form>

        <div className="space-y-4">
          <ResultTable title="Materiales Estimados" items={resultRows} />
          {result?.notaImportante && (
            <div className="p-4 rounded-lg bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-sm">
              <p className="font-bold mb-1">¡Atención!</p>
              <p>{result.notaImportante}</p>
            </div>
          )}
        </div>
      </div>
      
      {result && itemsForProject.length > 0 && (
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
      <EntrepisoEstructuralCalculator />
    </Suspense>
  );
}