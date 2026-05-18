'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, FileText, Building } from 'lucide-react';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAppointment, useUpdateAppointment, useAppointments } from '@/lib/hooks/use-appointments';
import { toast } from 'sonner';
import { appointmentSchema, type AppointmentFormData } from '@/lib/validations/appointment';
import { getInstitutions, type Institution } from '@/lib/supabase/queries/appointments';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { detectConflicts, formatConflictMessage, type Conflict } from '@/lib/utils/conflicts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  editingAppointment?: any;
}

export function AppointmentModal({ open, onOpenChange, selectedDate, editingAppointment }: AppointmentModalProps) {
  const [formData, setFormData] = useState<Partial<AppointmentFormData>>({
    titulo: '',
    descripcion: '',
    fecha_inicio: selectedDate ? selectedDate.toISOString() : '',
    fecha_fin: selectedDate 
      ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString()
      : '',
    institucion_id: '',
    notas: '',
    estado: 'programada',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [overrideConflicts, setOverrideConflicts] = useState(false);

  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const { data: appointments } = useAppointments();

  // Pre-populate form when editing
  useEffect(() => {
    if (editingAppointment) {
      setFormData({
        titulo: editingAppointment.titulo || '',
        descripcion: editingAppointment.descripcion || '',
        fecha_inicio: editingAppointment.fecha_inicio || '',
        fecha_fin: editingAppointment.fecha_fin || '',
        institucion_id: editingAppointment.institucion_id || '',
        notas: editingAppointment.notas || '',
        estado: editingAppointment.estado || 'programada',
      });
    } else if (selectedDate && open) {
      // Reset to default for new appointment
      setFormData({
        titulo: '',
        descripcion: '',
        fecha_inicio: selectedDate.toISOString(),
        fecha_fin: new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString(),
        institucion_id: '',
        notas: '',
        estado: 'programada',
      });
    }
  }, [editingAppointment, selectedDate, open]);

  // Fetch institutions when modal opens
  useEffect(() => {
    if (open) {
      setIsLoadingInstitutions(true);
      getInstitutions()
        .then(setInstitutions)
        .catch((error) => {
          console.error('Error fetching institutions:', error);
          toast.error('Error al cargar instituciones');
        })
        .finally(() => setIsLoadingInstitutions(false));
    }
  }, [open]);

  // Detect conflicts when form data changes
  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin && appointments) {
      const detectedConflicts = detectConflicts(
        { fecha_inicio: formData.fecha_inicio, fecha_fin: formData.fecha_fin },
        appointments,
        editingAppointment?.id
      );
      setConflicts(detectedConflicts);
      setOverrideConflicts(false);
    } else {
      setConflicts([]);
    }
  }, [formData.fecha_inicio, formData.fecha_fin, appointments, editingAppointment?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for conflicts and require override confirmation
    if (conflicts.length > 0 && !overrideConflicts) {
      toast.error('Hay conflictos con otras citas. Por favor confirma que deseas continuar.');
      return;
    }

    // Validate with Zod
    try {
      appointmentSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    try {
      if (editingAppointment) {
        // Update existing appointment
        await updateAppointment.mutateAsync({
          id: editingAppointment.id,
          updates: {
            institucion_id: formData.institucion_id || null,
            titulo: formData.titulo!,
            descripcion: formData.descripcion || null,
            fecha_inicio: formData.fecha_inicio!,
            fecha_fin: formData.fecha_fin!,
            estado: formData.estado!,
            notas: formData.notas || null,
          },
        });
        toast.success('Cita actualizada exitosamente');
      } else {
        // Create new appointment
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          toast.error('Debes estar autenticado para crear citas');
          return;
        }

        await createAppointment.mutateAsync({
          user_id: user.id,
          institucion_id: formData.institucion_id || null,
          titulo: formData.titulo!,
          descripcion: formData.descripcion || null,
          fecha_inicio: formData.fecha_inicio!,
          fecha_fin: formData.fecha_fin!,
          estado: formData.estado!,
          notas: formData.notas || null,
        });
        toast.success('Cita creada exitosamente');
      }

      onOpenChange(false);
      // Reset form
      setFormData({
        titulo: '',
        descripcion: '',
        fecha_inicio: selectedDate ? selectedDate.toISOString() : '',
        fecha_fin: selectedDate 
          ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString()
          : '',
        estado: 'programada',
        notas: '',
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Error al crear la cita. Verifica que estés autenticado.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingAppointment ? 'Editar Cita' : 'Crear Nueva Cita'}</DialogTitle>
          <DialogDescription>
            {editingAppointment 
              ? 'Actualiza los detalles de la cita existente.'
              : 'Ingresa los detalles de la nueva cita para agregarla a tu calendario.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Conflict Warning */}
        {conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Conflicto Detectado</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                {conflicts.map((conflict, index) => (
                  <p key={index} className="text-sm">
                    {formatConflictMessage(conflict)}
                  </p>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="override-conflicts"
                    checked={overrideConflicts}
                    onChange={(e) => setOverrideConflicts(e.target.checked)}
                    className="accent-destructive"
                  />
                  <label htmlFor="override-conflicts" className="text-sm font-medium">
                    Confirmar que deseo continuar a pesar de los conflictos
                  </label>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">
              <CalendarIcon className="mr-2 inline size-4" />
              Título
            </Label>
            <Input
              id="titulo"
              placeholder="Ej: Consulta cardíaca"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
            {errors.titulo && <p className="text-sm text-destructive">{errors.titulo}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="institucion">
              <Building className="mr-2 inline size-4" />
              Institución
            </Label>
            <Select 
              value={formData.institucion_id || ''} 
              onValueChange={(value) => setFormData({ ...formData, institucion_id: value || null })}
              disabled={isLoadingInstitutions}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una institución" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.institucion_id && <p className="text-sm text-destructive">{errors.institucion_id}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">
              <FileText className="mr-2 inline size-4" />
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              placeholder="Detalles adicionales de la cita..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
            />
            {errors.descripcion && <p className="text-sm text-destructive">{errors.descripcion}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">
                <Clock className="mr-2 inline size-4" />
                Inicio
              </Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {formData.fecha_inicio 
                      ? format(new Date(formData.fecha_inicio), 'dd/MM/yyyy HH:mm', { locale: es })
                      : 'Selecciona fecha y hora'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_inicio ? new Date(formData.fecha_inicio) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Preserve the time if already set, otherwise use current time
                        const existingDate = formData.fecha_inicio ? new Date(formData.fecha_inicio) : new Date();
                        const newDate = new Date(date);
                        newDate.setHours(existingDate.getHours(), existingDate.getMinutes());
                        setFormData({ ...formData, fecha_inicio: newDate.toISOString() });
                      }
                      setStartDateOpen(false);
                    }}
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={formData.fecha_inicio ? format(new Date(formData.fecha_inicio), 'HH:mm') : ''}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const existingDate = formData.fecha_inicio ? new Date(formData.fecha_inicio) : new Date();
                        existingDate.setHours(parseInt(hours), parseInt(minutes));
                        setFormData({ ...formData, fecha_inicio: existingDate.toISOString() });
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {errors.fecha_inicio && <p className="text-sm text-destructive">{errors.fecha_inicio}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin">
                <Clock className="mr-2 inline size-4" />
                Fin
              </Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {formData.fecha_fin 
                      ? format(new Date(formData.fecha_fin), 'dd/MM/yyyy HH:mm', { locale: es })
                      : 'Selecciona fecha y hora'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_fin ? new Date(formData.fecha_fin) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const existingDate = formData.fecha_fin ? new Date(formData.fecha_fin) : new Date();
                        const newDate = new Date(date);
                        newDate.setHours(existingDate.getHours(), existingDate.getMinutes());
                        setFormData({ ...formData, fecha_fin: newDate.toISOString() });
                      }
                      setEndDateOpen(false);
                    }}
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={formData.fecha_fin ? format(new Date(formData.fecha_fin), 'HH:mm') : ''}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const existingDate = formData.fecha_fin ? new Date(formData.fecha_fin) : new Date();
                        existingDate.setHours(parseInt(hours), parseInt(minutes));
                        setFormData({ ...formData, fecha_fin: existingDate.toISOString() });
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {errors.fecha_fin && <p className="text-sm text-destructive">{errors.fecha_fin}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">
              <MapPin className="mr-2 inline size-4" />
              Estado
            </Label>
            <Select 
              value={formData.estado} 
              onValueChange={(value) => setFormData({ ...formData, estado: value as "programada" | "completada" | "cancelada" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado && <p className="text-sm text-destructive">{errors.estado}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              placeholder="Notas adicionales..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
            />
            {errors.notas && <p className="text-sm text-destructive">{errors.notas}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAppointment.isPending}>
              {createAppointment.isPending ? 'Creando...' : 'Crear Cita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
