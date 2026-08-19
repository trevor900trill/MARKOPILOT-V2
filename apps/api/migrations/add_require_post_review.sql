-- Add require_post_review column to brands table
-- When true, AI-generated social posts go to 'pending_review' status instead of 'queued'
ALTER TABLE brands ADD COLUMN IF NOT EXISTS require_post_review BOOLEAN DEFAULT false;
