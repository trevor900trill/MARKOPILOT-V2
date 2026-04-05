-- ============================================
-- Markopilot V2 — Initial Schema Migration
-- ============================================
-- Run: supabase db reset
-- All tables include RLS policies and indexes.

-- ────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    subscription_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'trialing',
    plan_name VARCHAR(50) DEFAULT 'starter',
    current_period_end TIMESTAMPTZ,
    quota_leads_per_month INTEGER DEFAULT 100,
    quota_posts_per_month INTEGER DEFAULT 30,
    quota_brands_allowed INTEGER DEFAULT 1,
    quota_leads_used INTEGER DEFAULT 0,
    quota_posts_used INTEGER DEFAULT 0,
    quota_reset_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read/write their own record"
    ON users FOR ALL USING (auth.uid() = id);

-- ────────────────────────────────────────────
-- 2. BRANDS
-- ────────────────────────────────────────────
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    website_url VARCHAR(500),
    logo_url TEXT,
    industry VARCHAR(100) NOT NULL,
    industry_custom VARCHAR(255),
    target_audience_description TEXT,
    target_job_titles JSONB DEFAULT '[]',
    target_pain_points JSONB DEFAULT '[]',
    target_geographies JSONB DEFAULT '[]',
    brand_voice_formality VARCHAR(50) DEFAULT 'professional',
    brand_voice_humour VARCHAR(50) DEFAULT 'subtle',
    brand_voice_assertiveness VARCHAR(50) DEFAULT 'balanced',
    brand_voice_empathy VARCHAR(50) DEFAULT 'medium',
    content_pillars JSONB DEFAULT '[]',
    automation_posts_enabled BOOLEAN DEFAULT TRUE,
    automation_posts_per_week INTEGER DEFAULT 5,
    automation_posting_days JSONB DEFAULT '["monday","wednesday","friday"]',
    automation_posting_time_utc VARCHAR(10) DEFAULT '08:00',
    automation_leads_enabled BOOLEAN DEFAULT TRUE,
    automation_leads_per_day INTEGER DEFAULT 10,
    automation_outreach_enabled BOOLEAN DEFAULT TRUE,
    automation_outreach_delay_hours INTEGER DEFAULT 4,
    automation_outreach_daily_limit INTEGER DEFAULT 20,
    business_address TEXT,
    -- Encrypted social tokens (AES-256, application-level encryption)
    twitter_access_token TEXT,
    twitter_refresh_token TEXT,
    twitter_token_expires_at TIMESTAMPTZ,
    twitter_username VARCHAR(255),
    twitter_connected BOOLEAN DEFAULT FALSE,
    linkedin_access_token TEXT,
    linkedin_refresh_token TEXT,
    linkedin_token_expires_at TIMESTAMPTZ,
    linkedin_profile_name VARCHAR(255),
    linkedin_connected BOOLEAN DEFAULT FALSE,
    instagram_access_token TEXT,
    instagram_account_id VARCHAR(255),
    instagram_username VARCHAR(255),
    instagram_connected BOOLEAN DEFAULT FALSE,
    tiktok_access_token TEXT,
    tiktok_refresh_token TEXT,
    tiktok_token_expires_at TIMESTAMPTZ,
    tiktok_username VARCHAR(255),
    tiktok_connected BOOLEAN DEFAULT FALSE,
    gmail_access_token TEXT,
    gmail_refresh_token TEXT,
    gmail_token_expires_at TIMESTAMPTZ,
    gmail_email VARCHAR(255),
    gmail_connected BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own brands"
    ON brands FOR ALL USING (owner_id = auth.uid());

CREATE INDEX idx_brands_owner_id ON brands(owner_id);

-- ────────────────────────────────────────────
-- 3. POSTS
-- ────────────────────────────────────────────
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    content_pillar VARCHAR(255),
    generated_copy TEXT NOT NULL,
    hashtags JSONB DEFAULT '[]',
    media_url TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    published_at TIMESTAMPTZ,
    platform_post_id VARCHAR(255),
    engagement_likes INTEGER DEFAULT 0,
    engagement_comments INTEGER DEFAULT 0,
    engagement_reposts INTEGER DEFAULT 0,
    engagement_impressions INTEGER DEFAULT 0,
    engagement_fetched_at TIMESTAMPTZ,
    error_message TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand owner can access posts"
    ON posts FOR ALL USING (
        brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid())
    );

CREATE INDEX idx_posts_brand_id ON posts(brand_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_for ON posts(scheduled_for);

-- ────────────────────────────────────────────
-- 4. LEADS
-- ────────────────────────────────────────────
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    discovered_via TEXT,
    source_url TEXT,
    name VARCHAR(255),
    job_title VARCHAR(255),
    company VARCHAR(255),
    email VARCHAR(255),
    linkedin_url TEXT,
    twitter_handle VARCHAR(255),
    location VARCHAR(255),
    ai_summary TEXT,
    lead_score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'new',
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand owner can access leads"
    ON leads FOR ALL USING (
        brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid())
    );

CREATE INDEX idx_leads_brand_id ON leads(brand_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_discovered_at ON leads(discovered_at DESC);

-- ────────────────────────────────────────────
-- 5. OUTREACH EMAILS
-- ────────────────────────────────────────────
CREATE TABLE outreach_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    gmail_message_id VARCHAR(255),
    sent_at TIMESTAMPTZ,
    scheduled_send_at TIMESTAMPTZ,
    follow_up_scheduled BOOLEAN DEFAULT FALSE,
    follow_up_sent BOOLEAN DEFAULT FALSE,
    follow_up_sent_at TIMESTAMPTZ,
    error_message TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand owner can access outreach"
    ON outreach_emails FOR ALL USING (
        brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid())
    );

CREATE INDEX idx_outreach_brand_id ON outreach_emails(brand_id);
CREATE INDEX idx_outreach_status ON outreach_emails(status);
CREATE INDEX idx_outreach_scheduled ON outreach_emails(scheduled_send_at) WHERE status = 'queued';

-- ────────────────────────────────────────────
-- 6. SUPPRESSION LIST
-- ────────────────────────────────────────────
CREATE TABLE suppression_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    reason VARCHAR(100) DEFAULT 'unsubscribed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, email)
);

CREATE INDEX idx_suppression_brand_email ON suppression_list(brand_id, email);

-- ────────────────────────────────────────────
-- 7. ACTIVITY LOG
-- ────────────────────────────────────────────
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_brand_id ON activity_log(brand_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at DESC);

-- ────────────────────────────────────────────
-- 8. NOTIFICATIONS
-- ────────────────────────────────────────────
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- ────────────────────────────────────────────
-- 9. SPRINT 2 SCAFFOLD: INFLUENCER PROFILES
-- ────────────────────────────────────────────
CREATE TABLE influencer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    flutterwave_subaccount_id VARCHAR(255),
    bank_verified BOOLEAN DEFAULT FALSE,
    niche VARCHAR(100),
    follower_count INTEGER,
    platforms JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- 10. SPRINT 2 SCAFFOLD: CAMPAIGNS
-- ────────────────────────────────────────────
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES influencer_profiles(id),
    flutterwave_transaction_ref VARCHAR(255),
    budget_usd DECIMAL(10,2),
    platform_fee_usd DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'draft',
    escrow_released BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- FUNCTIONS: Auto-update updated_at
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────
-- Enable Supabase Realtime for notifications
-- ────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
