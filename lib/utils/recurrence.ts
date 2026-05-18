import { addDays, addWeeks, addMonths, differenceInDays, isSameDay, isBefore, isAfter, setDay, setDate, startOfDay, endOfDay } from 'date-fns';
import { RecurrencePattern } from '@/components/calendar/RecurrencePattern';

export interface RecurringAppointment {
  id: string;
  series_id?: string;
  fecha_inicio: string;
  fecha_fin: string;
  titulo: string;
  descripcion?: string;
  institucion_id?: string;
  estado: string;
  tipo?: string;
  monto_bruto?: number;
  horas?: number;
  tarifa_hora?: number;
  notas?: string;
  archivo_boleta_url?: string;
  recurrence_pattern?: RecurrencePattern;
  is_exception?: boolean;
}

/**
 * Expand a recurring appointment into individual instances within a date range
 */
export function expandRecurringAppointments(
  appointment: RecurringAppointment,
  startDate: Date,
  endDate: Date
): RecurringAppointment[] {
  const { recurrence_pattern } = appointment;
  
  if (!recurrence_pattern || recurrence_pattern.type === 'none') {
    return [appointment];
  }

  const instances: RecurringAppointment[] = [];
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  const appointmentStart = new Date(appointment.fecha_inicio);
  const appointmentEnd = new Date(appointment.fecha_fin);
  const duration = differenceInDays(appointmentEnd, appointmentStart);

  let currentDate = startOfDay(appointmentStart);
  let occurrenceCount = 0;
  const maxOccurrences = recurrence_pattern.occurrences || Infinity;
  const patternEndDate = recurrence_pattern.endDate ? endOfDay(recurrence_pattern.endDate) : null;

  // Generate occurrences until we reach the end date, pattern end date, or max occurrences
  while (
    isBefore(currentDate, end) &&
    (!patternEndDate || isBefore(currentDate, patternEndDate || end)) &&
    occurrenceCount < maxOccurrences
  ) {
    // Check if current date matches the recurrence pattern
    if (matchesRecurrencePattern(currentDate, recurrence_pattern, appointmentStart)) {
      // Only include if within the requested date range
      if (isAfter(currentDate, start) || isSameDay(currentDate, start)) {
        const instanceStart = new Date(currentDate);
        const instanceEnd = addDays(currentDate, duration);
        
        // Preserve the time from the original appointment
        instanceStart.setHours(appointmentStart.getHours(), appointmentStart.getMinutes(), appointmentStart.getSeconds());
        instanceEnd.setHours(appointmentEnd.getHours(), appointmentEnd.getMinutes(), appointmentEnd.getSeconds());

        instances.push({
          ...appointment,
          id: `${appointment.id}-${occurrenceCount}`,
          series_id: appointment.id,
          fecha_inicio: instanceStart.toISOString(),
          fecha_fin: instanceEnd.toISOString(),
          is_exception: false,
        });
      }
      occurrenceCount++;
    }

    // Move to next potential occurrence
    currentDate = getNextOccurrence(currentDate, recurrence_pattern);
  }

  return instances;
}

/**
 * Check if a date matches the recurrence pattern
 */
function matchesRecurrencePattern(
  date: Date,
  pattern: RecurrencePattern,
  originalDate: Date
): boolean {
  const dayOfWeek = date.getDay();

  switch (pattern.type) {
    case 'daily':
      return true;
    
    case 'weekly':
      if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
        return true;
      }
      return pattern.daysOfWeek.includes(dayOfWeek);
    
    case 'monthly':
      if (pattern.dayOfMonth) {
        return date.getDate() === pattern.dayOfMonth;
      }
      // Default to same day of month as original
      return date.getDate() === originalDate.getDate();
    
    case 'custom':
      // For custom patterns, we use the interval logic
      return true;
    
    default:
      return false;
  }
}

/**
 * Calculate the next occurrence date based on the pattern
 */
function getNextOccurrence(date: Date, pattern: RecurrencePattern): Date {
  const { interval = 1 } = pattern;

  switch (pattern.type) {
    case 'daily':
      return addDays(date, interval);
    
    case 'weekly':
      return addWeeks(date, interval);
    
    case 'monthly':
      return addMonths(date, interval);
    
    case 'custom':
      // For custom, default to daily with interval
      return addDays(date, interval);
    
    default:
      return addDays(date, 1);
  }
}

/**
 * Calculate all occurrence dates for a pattern (for preview)
 */
export function calculateOccurrenceDates(
  startDate: Date,
  pattern: RecurrencePattern,
  maxOccurrences: number = 10
): Date[] {
  const dates: Date[] = [];
  let currentDate = startOfDay(startDate);
  let occurrenceCount = 0;
  const patternEndDate = pattern.endDate ? endOfDay(pattern.endDate) : null;
  const maxOcc = pattern.occurrences || maxOccurrences;

  while (occurrenceCount < maxOcc) {
    if (patternEndDate && isAfter(currentDate, patternEndDate)) {
      break;
    }

    if (matchesRecurrencePattern(currentDate, pattern, startDate)) {
      dates.push(new Date(currentDate));
      occurrenceCount++;
    }

    currentDate = getNextOccurrence(currentDate, pattern);
    
    // Safety break to prevent infinite loops
    if (occurrenceCount > 1000) {
      break;
    }
  }

  return dates;
}

/**
 * Validate a recurrence pattern
 */
export function validateRecurrencePattern(pattern: RecurrencePattern): { valid: boolean; error?: string } {
  if (pattern.type === 'none') {
    return { valid: true };
  }

  if (pattern.interval < 1) {
    return { valid: false, error: 'El intervalo debe ser al menos 1' };
  }

  if (pattern.type === 'weekly') {
    if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
      return { valid: false, error: 'Debes seleccionar al menos un día de la semana' };
    }
  }

  if (pattern.type === 'monthly') {
    if (!pattern.dayOfMonth || pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
      return { valid: false, error: 'El día del mes debe estar entre 1 y 31' };
    }
  }

  if (pattern.occurrences && pattern.occurrences < 1) {
    return { valid: false, error: 'El número de ocurrencias debe ser al menos 1' };
  }

  if (pattern.endDate && pattern.endDate < new Date()) {
    return { valid: false, error: 'La fecha de fin debe ser en el futuro' };
  }

  return { valid: true };
}
