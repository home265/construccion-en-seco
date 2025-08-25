// components/ui/ResultTable.tsx
"use client";

export type ResultRow = {
  label: string;
  qty: string | number;
  unit?: string;
  hint?: string;
};

type Props = {
  title?: string;
  items: ResultRow[];
};

export default function ResultTable({ title = "Resultado", items }: Props) {
  if (items.length === 0) {
    return (
      <div className="card p-4">
        <h2 className="font-medium mb-2">{title}</h2>
        <p className="text-sm text-foreground/60">
          Ingresá datos para ver el resultado.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 card--table">
      <h2 className="font-medium mb-3">{title}</h2>
      <table className="w-full text-sm">
        <thead className="text-foreground/60">
          <tr>
            <th className="text-left py-1 font-normal">Concepto</th>
            <th className="text-right py-1 font-normal">Cantidad</th>
            <th className="text-left py-1 pl-4 font-normal">Unidad</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-1.5">
                {item.label}
                {item.hint && (
                  <span className="block text-xs text-foreground/60">
                    {item.hint}
                  </span>
                )}
              </td>
              <td className="py-1.5 text-right font-semibold">{item.qty}</td>
              <td className="py-1.5 pl-4">{item.unit ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}