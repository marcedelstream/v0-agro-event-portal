-- Solicitud de evento destacado desde "Publicar evento".
-- La persona marca que quiere destacar su evento; el admin confirma el pago y lo aprueba como destacado.
ALTER TABLE event_submissions ADD COLUMN IF NOT EXISTS wants_premium boolean DEFAULT false;

COMMENT ON COLUMN event_submissions.wants_premium IS 'La persona pidio publicar el evento como destacado (pago a confirmar por el admin)';
