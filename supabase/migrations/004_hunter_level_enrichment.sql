-- =====================================================
-- Migration 004: Hunter-Level Email Enrichment
-- =====================================================

-- 1. Upgrade leads table with advanced enrichment fields
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS email_confidence DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS email_source VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_catch_all BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- 2. Upgrade domain_email_patterns table with intelligence fields
ALTER TABLE domain_email_patterns
    ADD COLUMN IF NOT EXISTS is_catch_all BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS mail_provider VARCHAR(100),
    ADD COLUMN IF NOT EXISTS mx_records TEXT,
    ADD COLUMN IF NOT EXISTS pattern_weights_json JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS verification_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bounce_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS success_count INTEGER DEFAULT 0;

-- 3. Update existing indexes if necessary (already have good ones from 003)

-- 4. Track last bounce check per brand for stateful feedback processing
ALTER TABLE brands ADD COLUMN IF NOT EXISTS last_bounce_check_at TIMESTAMPTZ;
