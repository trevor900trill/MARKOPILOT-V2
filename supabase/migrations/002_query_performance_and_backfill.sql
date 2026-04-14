-- =====================================================
-- Migration 002: Query Performance & Lead Backfill
-- =====================================================

-- 1. Create Query History table
CREATE TABLE IF NOT EXISTS search_query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    leads_generated INT DEFAULT 0,
    high_quality_count INT DEFAULT 0,
    average_lead_score FLOAT DEFAULT 0.0,
    last_run_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, query_text)
);

-- 2. Generate fingerprints for existing leads to enable instant deduplication
UPDATE leads 
SET fingerprint = encode(sha256((COALESCE(email, name || company))::bytea), 'hex')
WHERE fingerprint IS NULL;

-- 3. Back-populate existing rows
UPDATE leads SET email_status = 'unverified' WHERE email_status IS NULL;
