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

export function parseFlexibleDate(dateInput: any): { day: number; month: number; year?: number } | null {
  if (dateInput === null || dateInput === undefined || dateInput === '') return null;

  // 1. Date object (e.g. from XLSX or Date instance)
  if (dateInput instanceof Date) {
    if (!isNaN(dateInput.getTime())) {
      return {
        day: dateInput.getUTCDate(),
        month: dateInput.getUTCMonth() + 1,
        year: dateInput.getUTCFullYear()
      };
    }
    return null;
  }

  // 2. Numeric input (e.g. Excel serial date)
  if (typeof dateInput === 'number' && !isNaN(dateInput)) {
    // Excel serial dates: e.g. 10000 to 60000
    if (dateInput > 1000 && dateInput < 80000) {
      const date = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return {
          day: date.getUTCDate(),
          month: date.getUTCMonth() + 1,
          year: date.getUTCFullYear()
        };
      }
    }
    return null;
  }

  const s = String(dateInput).trim();
  if (!s) return null;

  // Check if string contains only digits representing an Excel serial number
  if (/^\d{4,5}$/.test(s)) {
    const serial = parseInt(s, 10);
    if (serial > 1000 && serial < 80000) {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return {
          day: date.getUTCDate(),
          month: date.getUTCMonth() + 1,
          year: date.getUTCFullYear()
        };
      }
    }
  }

  // 3. Match DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y };
    }
  }

  // 4. Match YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y };
    }
  }

  // 5. Match Day & Month only: DD-MM, DD/MM, DD.MM (No year)
  const dmMatch = s.match(/^(\d{1,2})[-\/.](\d{1,2})$/);
  if (dmMatch) {
    const p1 = parseInt(dmMatch[1], 10);
    const p2 = parseInt(dmMatch[2], 10);
    // Standard DD/MM
    if (p2 >= 1 && p2 <= 12 && p1 >= 1 && p1 <= 31) {
      return { day: p1, month: p2 };
    }
    // Swapped MM/DD if p1 <= 12 and p2 > 12
    if (p1 >= 1 && p1 <= 12 && p2 > 12 && p2 <= 31) {
      return { day: p2, month: p1 };
    }
  }

  // 6. Match month names: e.g. "15th April", "15 April", "April 15", "15-Apr-1995", "15 Apr"
  const cleanStr = s.replace(/(\d+)(st|nd|rd|th)/gi, '$1').replace(/,/g, ' ').replace(/\s+/g, ' ');
  const monthMap: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6,
    jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
  };

  // e.g. "15 April 1995" or "15-Apr-1995" or "15 Apr"
  const dayMonthMatch = cleanStr.match(/^(\d{1,2})[-\/\s]([a-zA-Z]{3,9})(?:[-\/\s](\d{2,4}))?$/);
  if (dayMonthMatch) {
    const d = parseInt(dayMonthMatch[1], 10);
    const mStr = dayMonthMatch[2].toLowerCase();
    const m = monthMap[mStr];
    const y = dayMonthMatch[3] ? parseInt(dayMonthMatch[3], 10) : undefined;
    if (m && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y && y < 100 ? (y > 50 ? 1900 + y : 2000 + y) : y };
    }
  }

  // e.g. "April 15 1995" or "April 15"
  const monthDayMatch = cleanStr.match(/^([a-zA-Z]{3,9})[-\/\s](\d{1,2})(?:[-\/\s](\d{2,4}))?$/);
  if (monthDayMatch) {
    const mStr = monthDayMatch[1].toLowerCase();
    const d = parseInt(monthDayMatch[2], 10);
    const m = monthMap[mStr];
    const y = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : undefined;
    if (m && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y && y < 100 ? (y > 50 ? 1900 + y : 2000 + y) : y };
    }
  }

  // 7. Fallback to standard JS Date parser
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    const day = parsed.getDate();
    const month = parsed.getMonth() + 1;
    const year = parsed.getFullYear();
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return {
        day,
        month,
        year: year >= 1900 && year <= new Date().getFullYear() + 1 ? year : undefined
      };
    }
  }

  return null;
}

export function formatFullDate(day: number, month: number, year?: number | null): string {
  const mName = getMonthName(month);
  const dStr = String(day).padStart(2, '0');
  if (year) {
    return `${dStr} ${mName}, ${year}`;
  }
  return `${dStr} ${mName}`;
}
