/**
 * Returns number of days in a given year and month (1-indexed: 1 = Jan, 12 = Dec).
 * Properly handles 28, 29 (leap year), 30, and 31 days.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns start of month Date object in UTC
 */
export function getStartOfMonth(year: number, month: number): Date {
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  return new Date(`${year}-${monthStr}-01T00:00:00.000Z`);
}

/**
 * Returns end of month Date object in UTC
 */
export function getEndOfMonth(year: number, month: number): Date {
  const totalDays = getDaysInMonth(year, month);
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const dayStr = totalDays < 10 ? `0${totalDays}` : `${totalDays}`;
  return new Date(`${year}-${monthStr}-${dayStr}T23:59:59.999Z`);
}

/**
 * Formats a Date object or string to YYYY-MM-DD format in UTC.
 */
export function formatToYYYYMMDD(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date).split('T')[0];
  return d.toISOString().split('T')[0];
}

/**
 * Checks if a given date falls within the target year and 1-indexed month in UTC.
 */
export function isDateInMonth(date: Date | string, targetYear: number, targetMonth: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  return d.getUTCFullYear() === targetYear && (d.getUTCMonth() + 1) === targetMonth;
}

/**
 * Normalizes a Date or date string into a UTC Date object at 00:00:00.000.
 */
export function parseAsUTCDate(dateStr: string): Date {
  const cleanDateStr = dateStr.split('T')[0];
  return new Date(`${cleanDateStr}T00:00:00.000Z`);
}
