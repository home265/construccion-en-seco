// components/ui/NumberInput.tsx
"use client";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  step?: number;
  min?: number;
};

export default function NumberInput({ label, value, onChange, unit, step = 1, min = 0 }: Props) {
  return (
    <label className="text-sm flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full px-3 py-2"
          step={step}
          min={min}
        />
        {unit && <span className="text-foreground/70">{unit}</span>}
      </div>
    </label>
  );
}