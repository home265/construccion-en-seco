// components/ui/NumberInput.tsx
"use client";
import React, { useState, useEffect } from 'react';

type Props = {
  label: React.ReactNode;
  // 1. EL CONTRATO SE VUELVE ESTRICTO: Solo aceptamos y devolvemos números.
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  step?: number;
  min?: number;
};

export default function NumberInput({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min = 0,
}: Props) {
  // El estado interno sigue siendo un string para dar flexibilidad al usuario.
  const [internalValue, setInternalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sincroniza el valor del padre si no estamos escribiendo en el input.
  useEffect(() => {
    if (!isFocused) {
      setInternalValue(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // 2. PERMITIMOS EL CAMPO VACÍO VISUALMENTE:
    // Actualizamos el estado interno para que el usuario vea el campo vacío,
    // pero NO llamamos a onChange. El formulario todavía tiene el valor anterior.
    setInternalValue(val);

    // Si el valor es un número válido, actualizamos el formulario en tiempo real.
    const num = parseFloat(val);
    if (!isNaN(num)) {
        onChange(num);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let num = parseFloat(internalValue);
    
    // 3. LA MAGIA DEL "onBlur":
    // Al salir del campo, hacemos la limpieza final.
    // Si está vacío o no es un número, lo seteamos al valor mínimo (o 0).
    if (isNaN(num)) {
      num = min;
    }

    // Aseguramos que no sea menor al mínimo.
    if (num < min) {
      num = min;
    }
    
    // Sincronizamos el estado del formulario y el visual con el valor final y limpio.
    onChange(num);
    setInternalValue(String(num));
  };

  return (
    <label className="text-sm flex flex-col gap-1">
      <span className="font-medium flex items-center">{label}</span>
      <div className="flex items-center">
        <input
          type="text" // Cambiado a "text" con un patrón para mejor control
          inputMode="decimal" // Esto muestra el teclado numérico en móviles
          pattern="[0-9]*\.?[0-9]*"
          value={internalValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className="w-full h-10 px-3"
        />
        {unit && <span className="pl-2 text-foreground/60">{unit}</span>}
      </div>
    </label>
  );
}