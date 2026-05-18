import { parse, format } from 'date-fns';

export interface ImportedAppointment {
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  notas?: string;
  institucion_id?: string;
}

/**
 * Parse ICS/iCal file content
 */
export function parseICS(icsContent: string): ImportedAppointment[] {
  const appointments: ImportedAppointment[] = [];
  const lines = icsContent.split(/\r?\n/);
  
  let currentEvent: Partial<ImportedAppointment> = {};
  let inEvent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }
    
    if (line === 'END:VEVENT') {
      if (currentEvent.titulo && currentEvent.fecha_inicio && currentEvent.fecha_fin) {
        currentEvent.estado = currentEvent.estado || 'programada';
        appointments.push(currentEvent as ImportedAppointment);
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }
    
    if (!inEvent) continue;
    
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    
    switch (key) {
      case 'SUMMARY':
        currentEvent.titulo = value;
        break;
      case 'DESCRIPTION':
        currentEvent.descripcion = value;
        currentEvent.notas = value;
        break;
      case 'DTSTART':
        currentEvent.fecha_inicio = parseICSDate(value);
        break;
      case 'DTEND':
        currentEvent.fecha_fin = parseICSDate(value);
        break;
      case 'STATUS':
        currentEvent.estado = mapICSStatus(value);
        break;
    }
  }
  
  return appointments;
}

/**
 * Parse ICS date format (YYYYMMDDTHHmmssZ) to ISO string
 */
function parseICSDate(icsDate: string): string {
  // Handle various ICS date formats
  const cleanDate = icsDate.replace(/[ZT]/g, '');
  
  const year = parseInt(cleanDate.substring(0, 4));
  const month = parseInt(cleanDate.substring(4, 6)) - 1;
  const day = parseInt(cleanDate.substring(6, 8));
  const hours = cleanDate.length > 8 ? parseInt(cleanDate.substring(8, 10)) : 0;
  const minutes = cleanDate.length > 10 ? parseInt(cleanDate.substring(10, 12)) : 0;
  const seconds = cleanDate.length > 12 ? parseInt(cleanDate.substring(12, 14)) : 0;
  
  const date = new Date(year, month, day, hours, minutes, seconds);
  return date.toISOString();
}

/**
 * Map ICS status to appointment status
 */
function mapICSStatus(status: string): string {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return 'completada';
    case 'CANCELLED':
      return 'cancelada';
    case 'TENTATIVE':
    default:
      return 'programada';
  }
}

/**
 * Parse CSV file content
 */
export function parseCSV(csvContent: string): ImportedAppointment[] {
  const lines = csvContent.split(/\r?\n/);
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const appointments: ImportedAppointment[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const appointment: Partial<ImportedAppointment> = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      switch (header.toLowerCase()) {
        case 'título':
        case 'titulo':
        case 'title':
          appointment.titulo = value;
          break;
        case 'descripción':
        case 'descripcion':
        case 'description':
          appointment.descripcion = value;
          break;
        case 'fecha inicio':
        case 'fecha_inicio':
        case 'start date':
        case 'start':
          appointment.fecha_inicio = value;
          break;
        case 'fecha fin':
        case 'fecha_fin':
        case 'end date':
        case 'end':
          appointment.fecha_fin = value;
          break;
        case 'estado':
        case 'status':
          appointment.estado = value;
          break;
        case 'notas':
        case 'notes':
          appointment.notas = value;
          break;
        case 'institución id':
        case 'institucion_id':
        case 'institution id':
          appointment.institucion_id = value;
          break;
      }
    });
    
    if (appointment.titulo && appointment.fecha_inicio && appointment.fecha_fin) {
      appointment.estado = appointment.estado || 'programada';
      appointments.push(appointment as ImportedAppointment);
    }
  }
  
  return appointments;
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  values.push(currentValue);
  return values;
}

/**
 * Validate imported appointments
 */
export function validateImportedAppointments(appointments: ImportedAppointment[]): {
  valid: ImportedAppointment[];
  invalid: { appointment: ImportedAppointment; errors: string[] }[];
} {
  const valid: ImportedAppointment[] = [];
  const invalid: { appointment: ImportedAppointment; errors: string[] }[] = [];
  
  appointments.forEach((apt) => {
    const errors: string[] = [];
    
    if (!apt.titulo || apt.titulo.trim() === '') {
      errors.push('El título es requerido');
    }
    
    if (!apt.fecha_inicio) {
      errors.push('La fecha de inicio es requerida');
    } else if (!isValidISODate(apt.fecha_inicio)) {
      errors.push('La fecha de inicio no es válida');
    }
    
    if (!apt.fecha_fin) {
      errors.push('La fecha de fin es requerida');
    } else if (!isValidISODate(apt.fecha_fin)) {
      errors.push('La fecha de fin no es válida');
    }
    
    if (apt.fecha_inicio && apt.fecha_fin && new Date(apt.fecha_fin) <= new Date(apt.fecha_inicio)) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    
    if (apt.estado && !['programada', 'completada', 'cancelada'].includes(apt.estado)) {
      errors.push('El estado debe ser programada, completada o cancelada');
    }
    
    if (errors.length > 0) {
      invalid.push({ appointment: apt, errors });
    } else {
      valid.push(apt);
    }
  });
  
  return { valid, invalid };
}

/**
 * Check if string is valid ISO date
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
