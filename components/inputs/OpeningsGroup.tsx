// components/inputs/OpeningsGroup.tsx
"use client";

import NumberInput from "../ui/NumberInput";

export type OpeningVM = {
  lv: number; // Largo vano (m)
  hv: number; // Alto vano (m)
  sv?: number; // Superficie vano (m²) opcional
};

type Props = {
  items: OpeningVM[];
  onChange: (items: OpeningVM[]) => void;
};

export default function OpeningsGroup({ items, onChange }: Props) {
  const updateItem = (index: number, field: keyof OpeningVM, value: number) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const addItem = () => {
    onChange([...items, { lv: 0, hv: 0 }]);
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
              <span className="font-bold text-sm">Vano {i + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Eliminar
              </button>
            </div>
            <NumberInput
              label="Longitud (LV)"
              unit="m"
              value={item.lv}
              onChange={(v) => updateItem(i, "lv", v)}
              step={0.1}
            />
            <NumberInput
              label="Altura (HV)"
              unit="m"
              value={item.hv}
              onChange={(v) => updateItem(i, "hv", v)}
              step={0.1}
            />
            <div className="text-xs text-foreground/60 pt-1">
              * Si no se ingresa L y H, se usará la superficie.
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="btn-secondary text-sm"
      >
        + Agregar vano
      </button>
    </div>
  );
}