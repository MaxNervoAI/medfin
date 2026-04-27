-- Add snooze functionality for alerts
-- Allows users to temporarily hide alerts for a specified duration

ALTER TABLE prestaciones
ADD COLUMN alerta_snoozed_until TIMESTAMP WITH TIME ZONE;
