-- =========================================================================
-- Migration 007: Brand Impact Intelligence
-- Supports high-scale source-centric ingestion, inverted brand matching,
-- impact severity tracking, and automated action hooks.
-- =========================================================================

-- 1. Intelligence Sources (Global catalog of trusted news, developer blogs, gov/policy feeds)
CREATE TABLE IF NOT EXISTS intelligence_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    feed_url TEXT,
    source_type VARCHAR(50) NOT NULL DEFAULT 'rss', -- 'rss', 'search_sweep', 'api_blog', 'gov_feed'
    category VARCHAR(100) NOT NULL DEFAULT 'tech',  -- 'tech_platforms', 'regulation', 'ai_updates', 'ecommerce', 'general_business'
    target_industries JSONB DEFAULT '[]'::jsonb,
    trust_score INT NOT NULL DEFAULT 85,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_sources_active ON intelligence_sources (is_active, last_scraped_at);

-- 2. Ingested Articles / Updates (Deduplicated by URL or content hash)
CREATE TABLE IF NOT EXISTS intelligence_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES intelligence_sources(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    content_snippet TEXT,
    full_content TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    tags JSONB DEFAULT '[]'::jsonb,
    industry_categories JSONB DEFAULT '[]'::jsonb,
    key_entities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_articles_published ON intelligence_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_articles_url ON intelligence_articles (url);

-- 3. Brand Impact Events (Matched impacts per brand with AI-analyzed severity & recommended actions)
CREATE TABLE IF NOT EXISTS brand_impact_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    article_id UUID REFERENCES intelligence_articles(id) ON DELETE SET NULL,
    impact_level VARCHAR(20) NOT NULL DEFAULT 'info', -- 'critical', 'high', 'moderate', 'low', 'info'
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    auto_draft_hook TEXT,
    source_url TEXT,
    source_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'actioned', 'dismissed'
    actioned_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    email_alert_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_brand_article UNIQUE (brand_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_impact_events_brand ON brand_impact_events (brand_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_impact_events_severity ON brand_impact_events (impact_level, created_at DESC);

-- Seed initial trusted intelligence sources
INSERT INTO intelligence_sources (name, url, feed_url, source_type, category, target_industries, trust_score)
VALUES 
('Meta for Developers Blog', 'https://developers.facebook.com/blog/', 'https://developers.facebook.com/blog/rss', 'api_blog', 'tech_platforms', '["tech", "marketing", "social_media", "ecommerce", "saas"]'::jsonb, 98),
('OpenAI News & Policy', 'https://openai.com/news/', 'https://openai.com/news/rss.xml', 'api_blog', 'ai_updates', '["tech", "ai", "saas", "developer_tools"]'::jsonb, 99),
('Google Search Central Blog', 'https://developers.google.com/search/blog', 'https://developers.google.com/search/blog/feeds/posts/default', 'api_blog', 'tech_platforms', '["seo", "marketing", "ecommerce", "tech"]'::jsonb, 98),
('TechCrunch Policy & Enterprise', 'https://techcrunch.com/category/enterprise/', 'https://techcrunch.com/category/enterprise/feed/', 'rss', 'general_business', '["saas", "enterprise", "fintech", "startup"]'::jsonb, 92),
('FTC & Consumer Policy Updates', 'https://www.ftc.gov/news-events/news/press-releases', 'https://www.ftc.gov/news-events/news/press-releases/feed', 'gov_feed', 'regulation', '["ecommerce", "advertising", "fintech", "saas"]'::jsonb, 95)
ON CONFLICT DO NOTHING;
