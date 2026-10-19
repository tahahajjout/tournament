import { t } from "../i18n";

export function RemoveButton({ onClick, label = t.common.remove }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="text-sm text-red-700 hover:underline">
      {label}
    </button>
  );
}
