import { format, parseISO } from "date-fns";

/** start/end are local ISO strings; written as floating local times (no time zone). */
export type IcsEvent = { uid: string; start: string; end: string; summary: string; description?: string };

const dateTime = (iso: string) => format(parseISO(iso), "yyyyMMdd'T'HHmmss");
const escape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

/** RFC 5545 line folding (continuation lines start with a space), by code point to keep characters intact. */
function fold(line: string): string {
  const chars = Array.from(line);
  const parts: string[] = [];
  for (let i = 0; i < chars.length; i += 60) parts.push(chars.slice(i, i + 60).join(""));
  return parts.join("\r\n ");
}

export function toIcs(events: IcsEvent[], stamp: Date): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tournoi-6v6//FR",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dateTime(e.start)}`,
      `DTEND:${dateTime(e.end)}`,
      `SUMMARY:${escape(e.summary)}`,
      ...(e.description ? [`DESCRIPTION:${escape(e.description)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
