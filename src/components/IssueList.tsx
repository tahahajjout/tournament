import { isWarning, type Issue } from "../domain/validate";
import { issueMessage } from "../i18n";

export function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <ul className="space-y-1">
      {issues.map((i, k) => (
        <li key={k} className={`px-4 py-3 font-semibold ${isWarning(i) ? "bg-[#efe1c4] text-ink" : "bg-flag text-white"}`}>
          {issueMessage(i)}
        </li>
      ))}
    </ul>
  );
}
