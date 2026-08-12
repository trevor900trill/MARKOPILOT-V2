-- =====================================================
-- Migration 005: Media Generation & Outreach Review Mode
-- =====================================================

-- 1. Add media type to posts (image, video, or null for text-only)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type VARCHAR(50);

-- 2. Add outreach review mode toggle to brands (default false = fully autonomous)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS require_email_approval BOOLEAN DEFAULT FALSE;

-- 3. Add email_enrichment_attempted_at to leads (tracks when enrichment was last attempted)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_enrichment_attempted_at TIMESTAMPTZ;

-- 4. Index for pending approval emails (used by the review queue)
CREATE INDEX IF NOT EXISTS idx_outreach_pending_approval 
    ON outreach_emails(brand_id, generated_at DESC) 
    WHERE status = 'pending_approval';

-- 5. Create Supabase Storage bucket for social media assets
-- NOTE: Run this via Supabase dashboard or CLI if not using migrations for storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('social-media', 'social-media', true)
-- ON CONFLICT (id) DO NOTHING;
