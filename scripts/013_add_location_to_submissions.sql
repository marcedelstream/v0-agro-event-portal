-- Add location fields to event_submissions table
ALTER TABLE event_submissions 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS maps_url TEXT;
