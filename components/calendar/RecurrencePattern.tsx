'use client';

import { useState } from 'react';
import { Repeat, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[]; // for weekly: [1, 3, 5] for Mon, Wed, Fri
  dayOfMonth?: number; // for monthly: 15 for 15th of each month
  endDate?: Date | null;
  occurrences?: number | null;
}

interface RecurrencePatternProps {
  value: RecurrencePattern;
  onChange: (value: RecurrencePattern) => void;
}

export function RecurrencePattern({ value, onChange }: RecurrencePatternProps) {
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleTypeChange = (type: RecurrenceType) => {
    if (type === 'none') {
      onChange({ type: 'none', interval: 1 });
    } else if (type === 'daily') {
      onChange({ ...value, type: 'daily', interval: 1 });
    } else if (type === 'weekly') {
      onChange({ ...value, type: 'weekly', interval: 1, daysOfWeek: [1] });
    } else if (type === 'monthly') {
      onChange({ ...value, type: 'monthly', interval: 1, dayOfMonth: 1 });
    } else if (type === 'custom') {
      onChange({ ...value, type: 'custom', interval: 1 });
    }
  };

  const handleIntervalChange = (interval: number) => {
    onChange({ ...value, interval: Math.max(1, interval) });
  };

  const handleDayOfWeekToggle = (day: number) => {
    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    onChange({ ...value, daysOfWeek: newDays });
  };

  const handleDayOfMonthChange = (day: number) => {
    onChange({ ...value, dayOfMonth: Math.min(31, Math.max(1, day)) });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onChange({ ...value, endDate: date || null, occurrences: null });
  };

  const handleOccurrencesChange = (occurrences: number) => {
    onChange({ ...value, occurrences: Math.max(1, occurrences), endDate: null });
  };

  const daysOfWeek = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' },
    { value: 0, label: 'Dom' },
  ];

  if (value.type === 'none') {
    return (
      <div className="space-y-2">
        <Label>Repetición</Label>
        <Select value={value.type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="No se repite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No se repite</SelectItem>
            <SelectItem value="daily">Diariamente</SelectItem>
            <SelectItem value="weekly">Semanalmente</SelectItem>
            <SelectItem value="monthly">Mensualmente</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-4 border p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <Repeat className="size-4" />
        <h4 className="font-medium">Repetición</h4>
      </div>

      {/* Recurrence Type */}
      <div className="space-y-2">
        <Label>Tipo de repetición</Label>
        <Select value={value.type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No se repite</SelectItem>
            <SelectItem value="daily">Diariamente</SelectItem>
            <SelectItem value="weekly">Semanalmente</SelectItem>
            <SelectItem value="monthly">Mensualmente</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interval */}
      <div className="space-y-2">
        <Label>Repetir cada</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            value={value.interval}
            onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground self-center">
            {value.type === 'daily' && 'días'}
            {value.type === 'weekly' && 'semanas'}
            {value.type === 'monthly' && 'meses'}
            {value.type === 'custom' && 'períodos'}
          </span>
        </div>
      </div>

      {/* Days of Week (for weekly) */}
      {value.type === 'weekly' && (
        <div className="space-y-2">
          <Label>Días de la semana</Label>
          <div className="flex gap-1 flex-wrap">
            {daysOfWeek.map((day) => (
              <Button
                key={day.value}
                type="button"
                variant={value.daysOfWeek?.includes(day.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDayOfWeekToggle(day.value)}
                className="min-w-[40px]"
              >
                {day.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Day of Month (for monthly) */}
      {value.type === 'monthly' && (
        <div className="space-y-2">
          <Label>Día del mes</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={value.dayOfMonth || 1}
            onChange={(e) => handleDayOfMonthChange(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
      )}

      {/* End Date or Occurrences */}
      <div className="space-y-2">
        <Label>Terminar</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="end-never"
              name="end-type"
              checked={!value.endDate && !value.occurrences}
              onChange={() => onChange({ ...value, endDate: null, occurrences: null })}
              className="accent-primary"
            />
            <label htmlFor="end-never" className="text-sm">
              Nunca
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="end-date"
              name="end-type"
              checked={!!value.endDate}
              onChange={() => onChange({ ...value, endDate: new Date(), occurrences: null })}
              className="accent-primary"
            />
            <label htmlFor="end-date" className="text-sm">
              En fecha específica
            </label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!value.endDate}
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 size-4" />
                  {value.endDate ? format(value.endDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={value.endDate || undefined}
                  onSelect={handleEndDateChange}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="end-occurrences"
              name="end-type"
              checked={!!value.occurrences}
              onChange={() => onChange({ ...value, endDate: null, occurrences: 10 })}
              className="accent-primary"
            />
            <label htmlFor="end-occurrences" className="text-sm">
              Después de
            </label>
            <Input
              type="number"
              min="1"
              value={value.occurrences || ''}
              onChange={(e) => handleOccurrencesChange(parseInt(e.target.value) || 0)}
              disabled={!value.occurrences}
              className="w-20 h-8"
            />
            <span className="text-sm text-muted-foreground">ocurrencias</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
        <Info className="size-4 mt-0.5 flex-shrink-0" />
        <p>
          {value.type === 'daily' && `Esta cita se repetirá cada ${value.interval} día${value.interval > 1 ? 's' : ''}.`}
          {value.type === 'weekly' && `Esta cita se repetirá cada ${value.interval} semana${value.interval > 1 ? 's' : ''} en ${daysOfWeek.filter(d => value.daysOfWeek?.includes(d.value)).map(d => d.label).join(', ')}.`}
          {value.type === 'monthly' && `Esta cita se repetirá cada ${value.interval} mes${value.interval > 1 ? 'es' : ''} el día ${value.dayOfMonth}.`}
          {value.type === 'custom' && `Esta cita se repetirá cada ${value.interval} período${value.interval > 1 ? 's' : ''} con configuración personalizada.`}
        </p>
      </div>
    </div>
  );
}
