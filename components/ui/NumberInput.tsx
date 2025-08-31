// components/ui/NumberInput.tsx
"use client";
import React from "react";

// El único cambio es aquí: `label` ahora puede ser un texto o un componente.
type Props = {
  label: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  step?: number;
  min?: number;
};

// El resto del componente permanece funcionalmente igual.
export default function NumberInput({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min = 0,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.valueAsNumber;
    if (!isNaN(num)) {
      onChange(num);
    } else if (e.target.value === "") {
      onChange(0); // O manejar como prefieras el campo vacío
    }
  };

  return (
    <label className="text-sm flex flex-col gap-1">
      <span className="font-medium flex items-center">{label}</span>
      <div className="flex items-center">
        <input
          type="number"
          value={value}
          onChange={handleChange}
          step={step}
          min={min}
          className="w-full h-10 px-3"
        />
        {unit && <span className="pl-2 text-foreground/60">{unit}</span>}
      </div>
    </label>
  );
}