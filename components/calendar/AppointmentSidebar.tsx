'use client';

import { useState } from 'react';
import { X, Edit, Trash2, Calendar, Clock, MapPin, FileText, Building, User, FileCheck, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: string;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  institucion_id: string;
  estado: string;
  tipo: string;
  monto_bruto: number;
  horas: number;
  tarifa_hora: number;
  notas: string;
  archivo_boleta_url?: string;
  institucion?: {
    nombre: string;
  };
}

interface AppointmentSidebarProps {
  appointment: Appointment | null;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

export function AppointmentSidebar({ appointment, onClose, onEdit, onDelete }: AppointmentSidebarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!appointment) return null;

  const startDate = new Date(appointment.fecha_inicio);
  const endDate = new Date(appointment.fecha_fin);

  const statusColors: Record<string, string> = {
    programada: 'bg-blue-500',
    realizada: 'bg-green-500',
    completada: 'bg-green-600',
    cancelada: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    programada: 'Programada',
    realizada: 'Realizada',
    completada: 'Completada',
    cancelada: 'Cancelada',
  };

  const handleDelete = () => {
    onDelete(appointment.id);
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <>
      <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Detalles de Cita</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <h3 className="text-xl font-bold">{appointment.titulo}</h3>
            <p className="text-sm text-muted-foreground mt-1">{appointment.descripcion}</p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge className={statusColors[appointment.estado] || 'bg-gray-500'}>
              {statusLabels[appointment.estado] || appointment.estado}
            </Badge>
            <Badge variant="outline">{appointment.tipo}</Badge>
          </div>

          {/* Date and Time */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="size-4" />
                Fecha y Hora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span>
                  {format(startDate, 'EEEE, d MMMM yyyy', { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <span>
                  {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {appointment.institucion && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="size-4" />
                  Institución
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {appointment.institucion.nombre}
              </CardContent>
            </Card>
          )}

          {/* Financial Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="size-4" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horas:</span>
                <span>{appointment.horas || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarifa/Hora:</span>
                <span>${(appointment.tarifa_hora || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Monto Total:</span>
                <span>${(appointment.monto_bruto || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {appointment.notas && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="size-4" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {appointment.notas}
              </CardContent>
            </Card>
          )}

          {/* File Attachment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {appointment.archivo_boleta_url ? (
                  <FileCheck className="size-4 text-green-500" />
                ) : (
                  <FileX className="size-4 text-muted-foreground" />
                )}
                Boleta/Factura
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {appointment.archivo_boleta_url ? (
                <div className="flex items-center gap-2 text-green-600">
                  <FileCheck className="size-4" />
                  <span>Archivo adjunto disponible</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileX className="size-4" />
                  <span>Sin archivo adjunto</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 p-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(appointment)}
          >
            <Edit className="mr-2 size-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar la cita "{appointment.titulo}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
