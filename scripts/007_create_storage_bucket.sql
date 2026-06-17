-- Crear bucket para imágenes de eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir subida pública de imágenes de eventos
CREATE POLICY "Permitir subida pública de imágenes de eventos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'event-images');

-- Política para permitir lectura pública de imágenes de eventos
CREATE POLICY "Permitir lectura pública de imágenes de eventos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'event-images');

-- Política para permitir eliminación de imágenes de eventos
CREATE POLICY "Permitir eliminación de imágenes de eventos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'event-images');

-- Política para permitir subida pública de banners
CREATE POLICY "Permitir subida pública de banners"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'banners');

-- Política para permitir lectura pública de banners
CREATE POLICY "Permitir lectura pública de banners"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'banners');

-- Política para permitir eliminación de banners
CREATE POLICY "Permitir eliminación de banners"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'banners');
