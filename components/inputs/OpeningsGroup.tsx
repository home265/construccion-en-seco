// components/inputs/OpeningsGroup.tsx
"use client";

import NumberInput from "../ui/NumberInput";
import type { Vano } from "@/lib/types/seco";

type Props = {
  items: Vano[];
  onChange: (items: Vano[]) => void;
};

export default function OpeningsGroup({ items, onChange }: Props) {
  const updateItem = (index: number, field: keyof Vano, value: number | string) => {
    const next = [...items];
    const currentItem = next[index];
    
    // Aseguramos que el tipo de dato sea correcto
    const updatedValue = typeof currentItem[field] === 'number' ? Number(value) : value;

    next[index] = { ...currentItem, [field]: updatedValue };
    onChange(next);
  };

  const addItem = () => {
    // Por defecto, se agrega una puerta con medidas estándar para agilizar
    onChange([...items, { lv: 0.8, hv: 2.05, tipo: 'puerta' }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div key={i} className="card p-3 space-y-2 bg-muted">
            <div className="flex items-center justify-between">
              {/* --- INICIO DEL CAMBIO --- */}
              <select
                value={item.tipo}
                onChange={(e) => updateItem(i, "tipo", e.target.value)}
                className="font-bold text-sm bg-transparent border-0 p-0 focus:ring-0 appearance-none"
              >
                <option value="puerta">Puerta {i + 1}</option>
                <option value="ventana">Ventana {i + 1}</option>
              </select>
              {/* --- FIN DEL CAMBIO --- */}
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Eliminar
              </button>
            </div>
            <NumberInput
              label="Ancho (m)"
              value={item.lv}
              onChange={(v) => updateItem(i, "lv", v)}
              step={0.1}
            />
            <NumberInput
              label="Alto (m)"
              value={item.hv}
              onChange={(v) => updateItem(i, "hv", v)}
              step={0.1}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="btn btn-secondary text-sm"
      >
        + Agregar Vano
      </button>
    </div>
  );
}