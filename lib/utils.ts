import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "Unknown";
}

export function parseFlexibleDate(dateStr: string): { day: number; month: number; year?: number } | null {
  if (!dateStr) return null;
  const s = dateStr.trim();

  // Try matching strictly DD-MM-YYYY first to avoid US MM-DD-YYYY swap
  const dmyMatch = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1]);
    const m = parseInt(dmyMatch[2]);
    const y = parseInt(dmyMatch[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y };
    }
  }

  // Try matching YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1]);
    const m = parseInt(ymdMatch[2]);
    const d = parseInt(ymdMatch[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y };
    }
  }

  // Attempt JS Date parsing for natural text (e.g., "January 1, 2000")
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    // We must be careful because JS interprets "01/02/2000" as Jan 2nd in some envs
    // But for text like "Jan 1, 2000" it's well-supported.
    return {
      day: parsed.getDate(),
      month: parsed.getMonth() + 1,
      year: parsed.getFullYear()
    };
  }

  return null; // Invalid date
}

export function formatFullDate(day: number, month: number, year?: number | null): string {
  const mName = getMonthName(month);
  const dStr = String(day).padStart(2, '0');
  if (year) {
    return `${dStr} ${mName}, ${year}`;
  }
  return `${dStr} ${mName}`;
}
