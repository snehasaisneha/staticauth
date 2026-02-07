-- Migration 004: Add notify_private_app_requests column to users table
-- This allows super-admins to opt-in for email notifications when users request access to private apps

ALTER TABLE users ADD COLUMN notify_private_app_requests BOOLEAN DEFAULT FALSE;
