-- Tabla para galeria de imagenes de eventos
CREATE TABLE IF NOT EXISTS event_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view gallery" ON event_gallery FOR SELECT USING (true);
CREATE POLICY "Anon can insert gallery" ON event_gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can delete gallery" ON event_gallery FOR DELETE USING (true);
