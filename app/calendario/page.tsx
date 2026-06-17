'use client';

import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarDays, CalendarRange, Calendar as CalendarIcon, Plus, Filter, AlertCircle, ChevronLeft, ChevronRight, Download, Upload, Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAppointments, useUpdateAppointment, useDeleteAppointment, useCreateAppointment } from '@/lib/hooks/use-appointments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { AppointmentModal } from '@/components/calendar/AppointmentModal';
import { AppointmentSidebar } from '@/components/calendar/AppointmentSidebar';
import { expandRecurringAppointments, type RecurringAppointment } from '@/lib/utils/recurrence';
import { exportToICS, exportToCSV, downloadFile } from '@/lib/utils/calendar-export';
import { parseICS, parseCSV, validateImportedAppointments } from '@/lib/utils/calendar-import';
import AppShell from '@/components/layout/AppShell';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

type ViewMode = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

const VIEW_LABELS: Record<ViewMode, string> = {
  timeGridDay: 'Diario',
  timeGridWeek: 'Semanal',
  dayGridMonth: 'Mensual',
};

function CalendarContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeGridWeek');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarKey, setCalendarKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // Fetch real appointments data
  const { data: appointments, isLoading, error, refetch } = useAppointments();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const createAppointment = useCreateAppointment();

  // Transform appointments to FullCalendar format with recurrence expansion
  const events = appointments?.reduce((acc: any[], apt) => {
    // Check if appointment has recurrence pattern
    const pattern = (apt as any).recurrence_pattern;
    if (pattern && pattern.type !== 'none') {
      // Expand recurring appointments for the current view
      const viewStart = selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date());
      const viewEnd = addMonths(viewStart, 3); // Expand 3 months ahead
      
      const recurringApt = apt as unknown as RecurringAppointment;
      const expanded = expandRecurringAppointments(
        recurringApt,
        viewStart,
        viewEnd
      );
      
      // Add expanded instances
      expanded.forEach(instance => {
        const startDate = new Date(instance.fecha_inicio);
        const endDate = new Date(instance.fecha_fin);
        acc.push({
          id: instance.id,
          title: instance.titulo,
          start: startDate,
          end: endDate,
          allDay: false,
          extendedProps: {
            isRecurring: true,
            seriesId: instance.series_id,
          },
        });
      });
    } else {
      // Non-recurring appointment
      const startDate = new Date(apt.fecha_inicio);
      const endDate = new Date(apt.fecha_fin);
      acc.push({
        id: apt.id,
        title: apt.titulo,
        start: startDate,
        end: endDate,
        allDay: false,
        extendedProps: {
          isRecurring: false,
        },
      });
    }
    return acc;
  }, []) || [];

  // Days that have appointments (for mini calendar highlighting)
  const bookedDays = appointments?.map((apt) => new Date(apt.fecha_inicio)) || [];

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setViewMode('timeGridDay');
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        api.changeView('timeGridDay');
        api.gotoDate(date);
      }
    }
  };

  const handlePrevious = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
      setSelectedDate(calendarRef.current.getApi().getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
      setSelectedDate(calendarRef.current.getApi().getDate());
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      setSelectedDate(new Date());
    }
  };

  const handleViewChange = (value: ViewMode) => {
    setViewMode(value);
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.changeView(value);
      api.gotoDate(selectedDate || new Date());
    }
  };

  const handleEventClick = (info: any) => {
    const appointment = appointments?.find((apt) => apt.id === info.event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
    }
  };

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(null);
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment.mutateAsync(id);
      toast.success('Cita eliminada exitosamente');
      refetch();
    } catch (error) {
      toast.error('Error al eliminar la cita');
    }
  };

  const handleExportICS = () => {
    if (!appointments || appointments.length === 0) {
      toast.error('No hay citas para exportar');
      return;
    }
    
    try {
      const icsContent = exportToICS(appointments);
      const filename = `drwallet-calendario-${formatDateForFilename(new Date())}.ics`;
      downloadFile(icsContent, filename, 'text/calendar');
      toast.success('Calendario exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar calendario');
    }
  };

  const handleExportCSV = () => {
    if (!appointments || appointments.length === 0) {
      toast.error('No hay citas para exportar');
      return;
    }
    
    try {
      const csvContent = exportToCSV(appointments);
      const filename = `drwallet-calendario-${formatDateForFilename(new Date())}.csv`;
      downloadFile(csvContent, filename, 'text/csv');
      toast.success('Calendario exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar calendario');
    }
  };

  const handleImportICS = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    try {
      const text = await file.text();
      const parsed = parseICS(text);
      const { valid, invalid } = validateImportedAppointments(parsed);
      if (valid.length === 0) {
        toast.error('No se encontraron citas válidas en el archivo');
        return;
      }
      await Promise.all(valid.map(apt => createAppointment.mutateAsync(apt)));
      toast.success(`${valid.length} cita(s) importada(s)${invalid.length > 0 ? `, ${invalid.length} ignorada(s) por errores` : ''}`);
      refetch();
    } catch {
      toast.error('Error al importar archivo ICS');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const { valid, invalid } = validateImportedAppointments(parsed);
      if (valid.length === 0) {
        toast.error('No se encontraron citas válidas en el archivo');
        return;
      }
      await Promise.all(valid.map(apt => createAppointment.mutateAsync(apt)));
      toast.success(`${valid.length} cita(s) importada(s)${invalid.length > 0 ? `, ${invalid.length} ignorada(s) por errores` : ''}`);
      refetch();
    } catch {
      toast.error('Error al importar archivo CSV');
    }
  };

  const formatDateForFilename = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nueva cita
          </Button>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".ics"
            onChange={handleImportICS}
            className="hidden"
            id="import-ics"
          />
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
            id="import-csv"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 size-4" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Exp</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportICS}>
                Exportar ICS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 size-4" />
                <span className="hidden sm:inline">Importar</span>
                <span className="sm:hidden">Imp</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => document.getElementById('import-ics')?.click()}>
                Importar ICS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.getElementById('import-csv')?.click()}>
                Importar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-200px)]">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
          {/* Mini Month Navigation - shadcn Calendar */}
          <Card>
            <CardContent className="p-2 pt-4">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    if (selectedDate) {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      handleSelectDate(newDate);
                    }
                  }}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium">
                  {selectedDate ? format(selectedDate, 'MMMM yyyy', { locale: es }) : ''}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    if (selectedDate) {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      handleSelectDate(newDate);
                    }
                  }}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                modifiers={{ booked: bookedDays }}
                modifiersClassNames={{
                  booked: 'font-bold text-primary relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary',
                }}
                className="w-full relative"
                disableNavigation
                classNames={{
                  nav: 'hidden',
                  button_previous: 'hidden',
                  button_next: 'hidden',
                  caption_label: 'hidden',
                }}
              />
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Filtros</CardTitle>
              <Filter className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Próximamente...</p>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Leyenda</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="size-3 rounded-sm bg-primary" />
                <span>Consultas</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-3 rounded-sm" style={{ backgroundColor: '#14B8A6' }} />
                <span>Cirugías</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-3 rounded-sm" style={{ backgroundColor: '#845ef7' }} />
                <span>Revisiones</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80">
            <div className="flex flex-col gap-4 mt-4">
              <Card>
                <CardContent className="p-2 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        if (selectedDate) {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          handleSelectDate(newDate);
                        }
                      }}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {selectedDate ? format(selectedDate, 'MMMM yyyy', { locale: es }) : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        if (selectedDate) {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          handleSelectDate(newDate);
                        }
                      }}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      handleSelectDate(date);
                      setSidebarOpen(false);
                    }}
                    modifiers={{ booked: bookedDays }}
                    modifiersClassNames={{
                      booked: 'font-bold text-primary relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary',
                    }}
                    className="w-full relative"
                    disableNavigation
                    classNames={{
                      nav: 'hidden',
                      button_previous: 'hidden',
                      button_next: 'hidden',
                      caption_label: 'hidden',
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Leyenda</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="size-3 rounded-sm bg-primary" />
                    <span>Consultas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="size-3 rounded-sm" style={{ backgroundColor: '#14B8A6' }} />
                    <span>Cirugías</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="size-3 rounded-sm" style={{ backgroundColor: '#845ef7' }} />
                    <span>Revisiones</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Calendar */}
        <Card className="flex flex-col min-h-0 overflow-hidden h-full">
          <CardHeader className="pb-3 flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 border-b gap-2 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleToday}>
                <CalendarIcon className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Tabs
                value={viewMode}
                onValueChange={(value) => handleViewChange(value as ViewMode)}
                className="w-full sm:w-auto"
              >
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="timeGridDay" className="flex-1 sm:flex-none">
                    <CalendarIcon className="mr-1 sm:mr-2 size-4" />
                    <span className="hidden sm:inline">Diario</span>
                    <span className="sm:hidden">Día</span>
                  </TabsTrigger>
                  <TabsTrigger value="timeGridWeek" className="flex-1 sm:flex-none">
                    <CalendarRange className="mr-1 sm:mr-2 size-4" />
                    <span className="hidden sm:inline">Semanal</span>
                    <span className="sm:hidden">Sem</span>
                  </TabsTrigger>
                  <TabsTrigger value="dayGridMonth" className="flex-1 sm:flex-none">
                    <CalendarDays className="mr-1 sm:mr-2 size-4" />
                    <span className="hidden sm:inline">Mensual</span>
                    <span className="sm:hidden">Mes</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-auto p-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Error al cargar las citas. Por favor intenta nuevamente.</span>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Reintentar
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={viewMode}
                initialDate={selectedDate}
                headerToolbar={false}
                events={events}
                editable={true}
                selectable={true}
                dayMaxEvents={true}
                height="100%"
                locale="es"
                slotMinTime="00:00:00"
                slotMaxTime="23:59:59"
                nowIndicator={true}
                firstDay={1}
                buttonText={{
                  today: 'Hoy',
                  month: 'Mes',
                  week: 'Semana',
                  day: 'Día',
                }}
                eventClick={handleEventClick}
                datesSet={(dateInfo) => {
                  setSelectedDate(dateInfo.start);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
      
      <AppointmentModal 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            refetch();
            setEditingAppointment(null);
          }
        }}
        selectedDate={selectedDate}
        editingAppointment={editingAppointment}
      />
      
      {selectedAppointment && (
        <Sheet open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
          <SheetContent side="right" className="w-full sm:w-96 overflow-y-auto">
            <AppointmentSidebar
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              onEdit={handleEditAppointment}
              onDelete={handleDeleteAppointment}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AppShell nombre="Calendario">
      <CalendarContent />
    </AppShell>
  );
}
