-- Add new fields to apps table for public visibility and metadata
-- Migration: 002_add_app_fields

-- Add is_public column (defaults to FALSE for existing apps)
ALTER TABLE apps ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;

-- Add description column (nullable text)
ALTER TABLE apps ADD COLUMN description TEXT;

-- Add app_url column (nullable, stores the app's URL for direct linking)
ALTER TABLE apps ADD COLUMN app_url TEXT;
