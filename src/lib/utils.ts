import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts yyyy-mm-dd → dd-mm-yyyy for display. Passes through anything else. */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}

/** Converts any name (ALL CAPS, lowercase, mixed) to Title Case.
 *  e.g. "ABOTHULA TARUN KUMAR" → "Abothula Tarun Kumar"
 *       "akshitha balireddy"   → "Akshitha Balireddy"
 */
export function toTitleCase(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
