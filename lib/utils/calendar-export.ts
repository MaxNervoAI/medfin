import { format, parseISO } from 'date-fns';

export interface Appointment {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  notas?: string | null;
  institucion_id?: string | null;
}

/**
 * Export appointments to ICS/iCal format
 */
export function exportToICS(appointments: Appointment[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dr Wallet Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  appointments.forEach((apt) => {
    const startDate = parseISO(apt.fecha_inicio);
    const endDate = parseISO(apt.fecha_fin);
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${apt.id}@drwallet.app`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(startDate)}`);
    lines.push(`DTEND:${formatICSDate(endDate)}`);
    lines.push(`SUMMARY:${escapeICS(apt.titulo)}`);
    
    if (apt.descripcion) {
      lines.push(`DESCRIPTION:${escapeICS(apt.descripcion)}`);
    }
    
    if (apt.notas) {
      lines.push(`DESCRIPTION:${escapeICS(apt.notas)}`);
    }
    
    lines.push(`STATUS:${mapStatusToICS(apt.estado)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Format date for ICS format (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Map appointment status to ICS status
 */
function mapStatusToICS(status: string): string {
  switch (status) {
    case 'programada':
      return 'TENTATIVE';
    case 'completada':
      return 'CONFIRMED';
    case 'cancelada':
      return 'CANCELLED';
    default:
      return 'TENTATIVE';
  }
}

/**
 * Export appointments to CSV format
 */
export function exportToCSV(appointments: Appointment[]): string {
  const headers = [
    'ID',
    'Título',
    'Descripción',
    'Fecha Inicio',
    'Fecha Fin',
    'Estado',
    'Notas',
    'Institución ID',
  ];

  const rows = appointments.map((apt) => [
    apt.id,
    escapeCSV(apt.titulo),
    escapeCSV(apt.descripcion || ''),
    apt.fecha_inicio,
    apt.fecha_fin,
    apt.estado,
    escapeCSV(apt.notas || ''),
    apt.institucion_id || '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Escape special characters for CSV format
 */
function escapeCSV(text: string): string {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
