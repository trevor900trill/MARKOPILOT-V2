-- =====================================================
-- Migration 003: Email Enrichment Feature
-- =====================================================

-- 1. Create domain_email_patterns (pattern learning cache)
CREATE TABLE IF NOT EXISTS domain_email_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) UNIQUE NOT NULL,
    pattern VARCHAR(100) NOT NULL,
    confirmed_count INTEGER DEFAULT 1,
    last_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_email_patterns_domain
    ON domain_email_patterns(domain);

-- 2. New column on leads: email_enrichment_attempted_at
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS email_enrichment_attempted_at TIMESTAMPTZ;

-- 3. Index to help the enrichment worker query
CREATE INDEX IF NOT EXISTS idx_leads_email_enrichment
    ON leads(email, email_status, name, company)
    WHERE email IS NULL AND name IS NOT NULL AND company IS NOT NULL;
