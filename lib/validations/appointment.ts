import { z } from 'zod';

export const appointmentSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(200, 'El título no puede exceder 200 caracteres'),
  descripcion: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').optional(),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
  estado: z.enum(['programada', 'completada', 'cancelada']),
  notas: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
  institucion_id: z.string().uuid('ID de institución inválido').optional().nullable(),
}).refine(
  (data) => new Date(data.fecha_fin) > new Date(data.fecha_inicio),
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fecha_fin'],
  }
);

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
