type Props = { label: string; value: number; onChange: (v: number) => void; min?: number };

export function NumberField({ label, value, onChange, min = 0 }: Props) {
  return (
    <label className="flex items-center justify-between gap-4">
      {label}
      <input
        type="number"
        min={min}
        className="field w-24 text-right tabular-nums"
        value={value}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          if (Number.isInteger(v) && v >= min) onChange(v);
        }}
      />
    </label>
  );
}
