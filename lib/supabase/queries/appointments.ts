import { createClient } from '@/lib/supabase/client';

export type Appointment = {
  id: string;
  user_id: string;
  institucion_id: string | null;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type Institution = {
  id: string;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
};

/**
 * Get appointments for a date range
 */
export async function getAppointmentsInRange(
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('fecha_inicio', startDate.toISOString())
    .lte('fecha_fin', endDate.toISOString())
    .order('fecha_inicio');

  if (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all appointments for the current user
 */
export async function getAllAppointments(): Promise<Appointment[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('fecha_inicio');

  if (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all institutions
 */
export async function getInstitutions(): Promise<Institution[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('instituciones')
    .select('*')
    .order('nombre');

  if (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
): Promise<Appointment> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select()
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }

  return data;
}

/**
 * Update an appointment
 */
export async function updateAppointment(
  id: string,
  updates: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>
): Promise<Appointment> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
}
