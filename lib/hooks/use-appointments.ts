'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAppointmentsInRange, 
  getAllAppointments, 
  createAppointment, 
  updateAppointment, 
  deleteAppointment,
  type Appointment 
} from '@/lib/supabase/queries/appointments';

const APPOINTMENTS_QUERY_KEY = ['appointments'];

/**
 * Hook to fetch all appointments for the current user
 */
export function useAppointments() {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEY,
    queryFn: getAllAppointments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch appointments for a specific date range
 */
export function useAppointmentsInRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [...APPOINTMENTS_QUERY_KEY, 'range', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => getAppointmentsInRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create a new appointment
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to create appointment:', error);
    },
  });
}

/**
 * Hook to update an existing appointment
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Appointment> }) =>
      updateAppointment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to update appointment:', error);
    },
  });
}

/**
 * Hook to delete an appointment
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to delete appointment:', error);
    },
  });
}
