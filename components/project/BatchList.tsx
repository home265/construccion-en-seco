// components/project/BatchList.tsx
"use client";

type Item = {
  title: string;
};

type Props = {
  items: Item[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
};

export default function BatchList({ items, onEdit, onRemove }: Props) {
  return (
    <div className="border rounded-lg p-2">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="bg-muted p-2 rounded-md flex items-center justify-between gap-2">
            <span className="text-sm truncate">{item.title}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="btn-secondary text-xs" onClick={() => onEdit(i)}>Editar</button>
              <button className="btn-danger text-xs" onClick={() => onRemove(i)}>Quitar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}