-- Migration: Add name field to users table
-- This allows users to have a display name in addition to their email

ALTER TABLE users ADD COLUMN name TEXT;
