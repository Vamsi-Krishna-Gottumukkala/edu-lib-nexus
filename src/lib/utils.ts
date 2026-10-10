import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts ISO strings or yyyy-mm-dd to dd-mm-yyyy for display. */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  
  // Quick check for pure yyyy-mm-dd
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const dd = date.getDate().toString().padStart(2, '0');
    const mth = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mth}-${yyyy}`;
  } catch {
    return d;
  }
}

/** Returns the local yyyy-mm-dd string (ignoring UTC offset shifts) */
export function getLocalISODate(date: Date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().split('T')[0];
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

/** Exports an array of objects to a CSV file and triggers download */
export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h];
      const strVal = val === null || val === undefined ? '' : String(val);
      // Escape quotes
      return `"${strVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
