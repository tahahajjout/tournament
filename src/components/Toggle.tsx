export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4">
      {label}
      <input type="checkbox" className="h-5 w-5 accent-pitch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
