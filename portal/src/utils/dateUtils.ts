/**
 * Utility functions for Indian Date formatting (DD/MM/YYYY)
 */

export function formatToIndianDate(dateStr?: string | null): string {
  if (!dateStr) return '—';

  // If already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle YYYY-MM-DD strings directly to prevent UTC timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return dateStr;
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDobInput(text: string): string {
  let cleaned = text.replace(/\D/g, '').slice(0, 8);

  if (cleaned.length >= 2) {
    let day = parseInt(cleaned.slice(0, 2), 10);
    if (day < 1) day = 1;
    if (day > 31) day = 31;
    cleaned = day.toString().padStart(2, '0') + cleaned.slice(2);
  }
  if (cleaned.length >= 4) {
    let month = parseInt(cleaned.slice(2, 4), 10);
    if (month < 1) month = 1;
    if (month > 12) month = 12;
    cleaned = cleaned.slice(0, 2) + month.toString().padStart(2, '0') + cleaned.slice(4);
  }
  if (cleaned.length >= 8) {
    let year = parseInt(cleaned.slice(4, 8), 10);
    const currentYear = new Date().getFullYear();
    if (year > currentYear) year = currentYear;
    cleaned = cleaned.slice(0, 4) + year.toString().padStart(4, '0');
  }

  if (cleaned.length > 4) return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
  if (cleaned.length > 2) return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
  return cleaned;
}

export function formatTo12HourTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  if (/am|pm/i.test(timeStr)) return timeStr;

  const [hStr, mStr] = timeStr.split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr || '00';
  if (isNaN(hour)) return timeStr;

  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${period}`;
}
