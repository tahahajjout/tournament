import { useState } from "react";
import { parseBackup } from "../domain/backup";
import { download } from "../download";
import { t } from "../i18n";
import { exportData, useTournament } from "../store/useTournament";

export function BackupSection() {
  const importData = useTournament((s) => s.importData);
  const loadExample = useTournament((s) => s.loadExample);
  const [error, setError] = useState("");

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = parseBackup(await file.text());
      setError("");
      if (confirm(t.backup.confirmImport)) importData(data);
    } catch (e) {
      setError(t.backup.invalid(e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="btn btn-quiet"
        onClick={() => download("tournoi.json", JSON.stringify(exportData(), null, 2), "application/json")}
      >
        {t.backup.export}
      </button>
      <label className="cursor-pointer btn btn-quiet">
        {t.backup.import}
        <input
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <button className="btn btn-quiet" onClick={() => confirm(t.example.confirm) && loadExample()}>
        {t.example.load}
      </button>
      {error && <p className="w-full text-sm text-flag">{error}</p>}
    </div>
  );
}
