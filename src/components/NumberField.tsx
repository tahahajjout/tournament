type Props = { label: string; value: number; onChange: (v: number) => void; min?: number };

export function NumberField({ label, value, onChange, min = 0 }: Props) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      {label}
      <input
        type="number"
        min={min}
        className="w-24 rounded border border-slate-300 px-2 py-1 text-right"
        value={value}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          if (Number.isInteger(v) && v >= min) onChange(v);
        }}
      />
    </label>
  );
}
