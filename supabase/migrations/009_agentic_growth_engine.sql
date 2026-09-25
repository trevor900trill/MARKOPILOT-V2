-- =========================================================================
-- Migration 009: Agentic Growth Engine
-- Multi-source signals, AI-driven opportunities, action queue & learning outcomes
-- =========================================================================

-- 1. Extend brands table for agent configuration
ALTER TABLE brands ADD COLUMN IF NOT EXISTS growth_goal TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS target_market_context TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS competitor_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS watch_keywords JSONB DEFAULT '[]'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS watch_hashtags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS agent_autonomy_level VARCHAR(50) DEFAULT 'ApproveOutreach';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN DEFAULT true;

-- 2. Universal Signals Table (Perceive layer)
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- 'Rss', 'WebSearch', 'Reddit', 'TwitterMention', 'CompetitorDiff', 'GoogleTrends'
    source_name TEXT,
    source_url TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    author_profile_url TEXT,
    raw_metadata JSONB DEFAULT '{}'::jsonb,
    relevance_score FLOAT,
    is_processed BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_brand_unprocessed ON signals (brand_id, is_processed) WHERE NOT is_processed;
CREATE INDEX IF NOT EXISTS idx_signals_ingested ON signals (ingested_at DESC);

-- 3. Opportunities Table (Reasoning layer)
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES signals(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    relevance_score FLOAT NOT NULL DEFAULT 0,
    urgency VARCHAR(30) DEFAULT 'ActThisWeek',
    status VARCHAR(30) DEFAULT 'Pending', -- 'Pending', 'Planning', 'Planned', 'Expired', 'Dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_brand_status ON opportunities (brand_id, status, created_at DESC);

-- 4. Action Queue Table (Decision & execution layer)
CREATE TABLE IF NOT EXISTS action_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    priority INT DEFAULT 3,
    reasoning TEXT,
    draft_content JSONB DEFAULT '{}'::jsonb,
    target_entity JSONB DEFAULT '{}'::jsonb,
    approval_required BOOLEAN DEFAULT true,
    status VARCHAR(30) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Executing', 'Completed', 'Failed', 'Rejected'
    scheduled_for TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_queue_pending ON action_queue (brand_id, status) WHERE status IN ('Pending', 'Approved');
CREATE INDEX IF NOT EXISTS idx_action_queue_exec ON action_queue (status, scheduled_for);

-- 5. Agent Outcomes Table (Learning layer)
CREATE TABLE IF NOT EXISTS agent_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES action_queue(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'engagement', 'reply', 'click', 'conversion', 'open_rate'
    metric_value FLOAT NOT NULL,
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_outcomes_brand ON agent_outcomes (brand_id, measured_at DESC);
