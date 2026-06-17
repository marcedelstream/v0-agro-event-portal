-- Agregar columna end_date a event_submissions para eventos de varios dias
ALTER TABLE event_submissions ADD COLUMN IF NOT EXISTS end_date DATE;
