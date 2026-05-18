import { isBefore, isAfter, isSameDay, parseISO } from 'date-fns';

export interface Appointment {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  titulo: string;
  estado: string;
}

export interface Conflict {
  appointment: Appointment;
  type: 'exact' | 'overlap' | 'adjacent';
  severity: 'error' | 'warning';
}

/**
 * Check if two time ranges overlap
 */
function rangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return isBefore(start1, end2) && isAfter(end1, start2);
}

/**
 * Detect conflicts between a new appointment and existing appointments
 */
export function detectConflicts(
  newAppointment: { fecha_inicio: string; fecha_fin: string },
  existingAppointments: Appointment[],
  excludeId?: string
): Conflict[] {
  const conflicts: Conflict[] = [];
  const newStart = parseISO(newAppointment.fecha_inicio);
  const newEnd = parseISO(newAppointment.fecha_fin);

  for (const apt of existingAppointments) {
    // Skip the appointment being edited
    if (excludeId && apt.id === excludeId) {
      continue;
    }

    // Skip canceled appointments
    if (apt.estado === 'cancelada') {
      continue;
    }

    const aptStart = parseISO(apt.fecha_inicio);
    const aptEnd = parseISO(apt.fecha_fin);

    if (rangesOverlap(newStart, newEnd, aptStart, aptEnd)) {
      // Determine conflict type
      const isExactOverlap = isSameDay(newStart, aptStart) && 
                           isSameDay(newEnd, aptEnd) &&
                           newStart.getHours() === aptStart.getHours() &&
                           newStart.getMinutes() === aptStart.getMinutes();

      conflicts.push({
        appointment: apt,
        type: isExactOverlap ? 'exact' : 'overlap',
        severity: 'error',
      });
    }
  }

  return conflicts;
}

/**
 * Check if a specific time slot is available
 */
export function isTimeSlotAvailable(
  start: Date,
  end: Date,
  existingAppointments: Appointment[],
  excludeId?: string
): boolean {
  const conflicts = detectConflicts(
    { fecha_inicio: start.toISOString(), fecha_fin: end.toISOString() },
    existingAppointments,
    excludeId
  );
  return conflicts.length === 0;
}

/**
 * Get available time slots for a given day
 */
export function getAvailableTimeSlots(
  date: Date,
  existingAppointments: Appointment[],
  slotDurationMinutes: number = 60
): { start: Date; end: Date }[] {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const availableSlots: { start: Date; end: Date }[] = [];
  const slotDuration = slotDurationMinutes * 60 * 1000; // Convert to milliseconds

  // Filter appointments for the given day
  const dayAppointments = existingAppointments.filter(apt => {
    const aptDate = parseISO(apt.fecha_inicio);
    return isSameDay(aptDate, date) && apt.estado !== 'cancelada';
  });

  // Sort appointments by start time
  dayAppointments.sort((a, b) => {
    const aStart = parseISO(a.fecha_inicio).getTime();
    const bStart = parseISO(b.fecha_inicio).getTime();
    return aStart - bStart;
  });

  let currentTime = startOfDay.getTime();
  
  for (const apt of dayAppointments) {
    const aptStart = parseISO(apt.fecha_inicio).getTime();
    const aptEnd = parseISO(apt.fecha_fin).getTime();

    // Add available slot before this appointment
    if (currentTime + slotDuration <= aptStart) {
      availableSlots.push({
        start: new Date(currentTime),
        end: new Date(currentTime + slotDuration),
      });
    }

    // Move current time to after this appointment
    currentTime = Math.max(currentTime, aptEnd);
  }

  // Add slot after last appointment
  if (currentTime + slotDuration <= endOfDay.getTime()) {
    availableSlots.push({
      start: new Date(currentTime),
      end: new Date(Math.min(currentTime + slotDuration, endOfDay.getTime())),
    });
  }

  return availableSlots;
}

/**
 * Calculate conflict severity based on overlap amount
 */
export function calculateConflictSeverity(
  conflict: Conflict
): 'error' | 'warning' {
  if (conflict.type === 'exact') {
    return 'error';
  }
  return 'warning';
}

/**
 * Format conflict message for display
 */
export function formatConflictMessage(conflict: Conflict): string {
  const apt = conflict.appointment;
  const startTime = new Date(apt.fecha_inicio).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = new Date(apt.fecha_fin).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  switch (conflict.type) {
    case 'exact':
      return `Conflicto exacto con "${apt.titulo}" (${startTime} - ${endTime})`;
    case 'overlap':
      return `Solapamiento con "${apt.titulo}" (${startTime} - ${endTime})`;
    case 'adjacent':
      return `Cita adyacente a "${apt.titulo}" (${startTime} - ${endTime})`;
    default:
      return `Conflicto con "${apt.titulo}"`;
  }
}
