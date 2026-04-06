# MARKOPILOT V2 — MASTER PROJECT SPECIFICATION
### "The Autonomous Growth Engine for Any Business"
**Version:** 2.0.0 — Single Authoritative Document  
**Target Platform:** Google Antigravity IDE (Agent-First Autonomous Execution)  
**Date:** April 2026

---

> **AGENT INSTRUCTIONS:** This document is your single source of truth. Read it completely before beginning any task. Every section is intentional. Do not skip sections, do not make assumptions where specifics are given, and do not simplify described behaviour. Build exactly what is described. Scaffold the entire project structure first, then implement feature by feature in the order described in Section 22. Verify each module compiles and passes its tests before proceeding to the next. When a section says "autonomous," it means zero user intervention after initial setup. When a section says "persistent," it means the behaviour survives server restarts, token expiry, and cold starts. Also you will be given a clean slate. but dont just create folders and say you have created the project, pplease use commands available in the environment, and make sure you use nvm use 20 on the frontd end side. on the backend dont just create folders create the project from the cli using the dotnet new command. and make sure you use the correct template for the project. 

---

## 1. VISION & MISSION

### 1.1 What Markopilot Is

Markopilot is a **business growth automation platform** built for founders, solopreneurs, agency operators, and any professional who wants to grow their brand's digital presence and lead pipeline without hiring a marketing team. The platform operates as an autonomous co-pilot: once a user configures their brand, Markopilot takes over all repetitive marketing and outreach work, running silently in the background 24/7.

The core thesis is: **builders should build, not market.** A SaaS founder should spend time coding their product, not writing LinkedIn posts. A freelance designer should be designing, not cold-emailing prospects. A restaurant owner should be serving customers, not scheduling Instagram posts. Markopilot exists to collapse the gap between "building something" and "growing something" by making the growth layer entirely autonomous.

### 1.2 What "Autonomous" Means in This Context

"Autonomous" is not a marketing word here — it is a strict technical contract. It means:

- Once a brand is configured and social accounts are connected, posts are generated, scheduled, and published without the user touching anything.
- Once target lead criteria are configured, the platform continuously discovers, enriches, and contacts new leads without the user initiating any action.
- Token expiry is handled silently via refresh tokens; the user is only notified if re-authorisation is absolutely required.
- AI content generation happens on a scheduled cadence defined per brand, not on-demand.
- All results (published posts, discovered leads, sent emails) are visible in a read-only audit dashboard, allowing the user to review what happened without being required to approve anything in advance.

### 1.3 Who It Serves (Multi-Industry by Design)

Markopilot explicitly serves any business vertical, not just software startups. The platform's brand configuration system is industry-agnostic. Each brand defines its own industry category from a broad taxonomy: Software/SaaS, Ecommerce, Professional Services, Creative Agency, Consulting, Real Estate, Healthcare, Education, Food & Beverage, Non-Profit, Personal Brand, and "Other" with a free-text description field. Every AI prompt is parameterised by this configuration, meaning a restaurant and a SaaS company produce entirely different content and lead strategies without any code differences.

---

## 2. PRODUCT SCOPE

### 2.1 In Scope (Must Ship — Sprint 1)

1. Public marketing website (landing page) with full SEO metadata.
2. Legal pages: Privacy Policy and Terms & Conditions.
3. Authentication: Google OAuth 2.0 login only (no email/password, no other providers).
4. Multi-step onboarding flow for new users.
5. Multi-brand workspace: each user can create and manage multiple brands.
6. Brand configuration dashboard.
7. Social media automation engine (X/Twitter, LinkedIn, Instagram, TikTok).
8. Lead generation engine (search-based discovery + web scraping + AI enrichment).
9. Automated email outreach engine via Gmail OAuth with anti-spam compliance.
10. AI content generation pipeline (multi-model routing via OpenRouter).
11. Subscription and quota management via Lemon Squeezy.
12. Marketplace payment infrastructure via Flutterwave (scaffolded now, activated in Sprint 2).
13. In-app notification system.
14. Activity audit log per brand.
15. User account settings and billing portal.

### 2.2 Out of Scope (Sprint 2 — Do Not Build Now)

- Influencer marketplace UI (brand-side and creator-side).
- Escrow payment flows for influencer campaigns (Flutterwave subaccount activation).
- Campaign performance analytics for influencer collaborations.
- White-label or agency reseller mode.
- Mobile native apps (iOS/Android).

> **Note for agents:** Sprint 2 database tables and Flutterwave subaccount scaffolding ARE created in Sprint 1 (schema only, no UI). This avoids migration pain later. See Section 4.7.

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Technology Stack — Mandatory, Do Not Substitute

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Frontend | Next.js | 15 (App Router) | Server components by default; client components only where interactivity is required. |
| Styling | Tailwind CSS | v4 | No component library. Custom components only. |
| Animation | Framer Motion | latest | Page transitions, dashboard reveals, onboarding steps. |
| Backend API | .NET | 10.0 Web API | RESTful; minimal controllers + service-layer architecture. |
| Background Workers | .NET | 10.0 Worker Service | Hangfire-backed job queues for all automation. |
| Job Queue | Hangfire | latest | Backed by Supabase PostgreSQL. Priority queues by subscription tier. |
| Database | Supabase (PostgreSQL) | latest | Relational schema; Row-Level Security; PgBouncer pooling built in. |
| Cache / Rate Limiting | Upstash Redis | serverless | Session cache, quota cache, global rate limiters, daily send counters. |
| AI Gateway | OpenRouter | latest API | Single endpoint routing to multiple AI providers. See Section 3.3 for model map. |
| Search (Primary) | Serper.dev | v1 | Google SERPs at $1/1000 queries. |
| Search (Secondary) | Exa.ai | v1 | Semantic people/company discovery. Free tier: 1000/month. |
| Payments — Subscriptions | Lemon Squeezy | latest API | Merchant of Record; handles global VAT; works from Kenya. |
| Payments — Marketplace | Flutterwave | v3 API | Split payments, subaccounts, M-Pesa; scaffolded in Sprint 1, activated in Sprint 2. |
| Auth | Google OAuth 2.0 | via NextAuth.js v5 | Google login only. |
| Email Outreach | Gmail API | v1 | Sends on behalf of user's own Gmail account. |
| Social Auth | OAuth 2.0 + Refresh Tokens | Per platform | X, LinkedIn, Instagram Graph API, TikTok for Developers. |

### 3.2 AI Model Routing (OpenRouter)

All AI calls go through OpenRouter (`https://openrouter.ai/api/v1`). OpenRouter uses an OpenAI-compatible request format. Implement `AiRoutingService.cs` in `Markopilot.Infrastructure` that selects the model based on the task enum:

```csharp
public enum AiTask
{
    LeadQueryGeneration,
    EntityExtraction,
    LeadScoring,
    SocialPostGeneration,
    EmailOutreachCopy,
    ContentPillarSuggestion
}

private static readonly Dictionary<AiTask, string> ModelMap = new()
{
    { AiTask.LeadQueryGeneration,      "groq/llama-3.3-70b-versatile" },
    { AiTask.EntityExtraction,         "groq/llama-3.1-8b-instant"    },
    { AiTask.LeadScoring,              "groq/llama-3.1-8b-instant"    },
    { AiTask.SocialPostGeneration,     "google/gemini-2.0-flash-001"  },
    { AiTask.EmailOutreachCopy,        "google/gemini-2.5-flash"      },
    { AiTask.ContentPillarSuggestion,  "groq/llama-3.3-70b-versatile" }
};
```

**Rationale per task:**
- Lead query generation and content pillar suggestions: Groq Llama 70B — fast structured output, cheap at ~$0.60/million tokens.
- Entity extraction and lead scoring: Groq Llama 8B — simplest reasoning task, highest volume, cheapest at $0.05/million tokens.
- Social post generation: Gemini 2.0 Flash — creative writing quality matters for brand-facing content; $0.10/million tokens.
- Email outreach copy: Gemini 2.5 Flash — highest stakes content; quality directly affects reply rates; worth the premium at $0.30/million input.

**Prompt caching:** Construct every prompt so the large stable system prompt (brand context) comes first, followed by the small variable user prompt. This maximises cache hit rates on providers that support it (Google: 90% cost reduction on cached input; Groq: 50%).

**Batch API:** For background worker tasks (lead enrichment, query generation), use OpenRouter's batch endpoint where available. Async tasks that process within 24 hours qualify for Google's 50% batch discount.

### 3.3 Search Routing

Implement `LeadSearchService.cs` in `Markopilot.Infrastructure` that wraps both search providers:

- **Serper.dev**: Primary. Used for broad keyword-based discovery. Returns Google Search results as structured JSON. Cost: $1 per 1,000 queries.
- **Exa.ai**: Secondary. Used when the generated search query targets specific people or job titles (detected by matching patterns like "linkedin.com/in", job title keywords, or "speaker" / "author" patterns). Exa understands semantic intent and surfaces actual people pages more reliably than keyword search for this use case.

### 3.4 Repository Structure

```
markopilot-v2/
├── apps/
│   ├── web/                        # Next.js 15 frontend
│   └── api/                        # .NET 10.0 Web API + Worker Service
├── packages/
│   ├── shared-types/               # Shared TypeScript types
│   └── ai-prompts/                 # Versioned AI prompt templates (plain text files)
├── supabase/
│   ├── migrations/                 # SQL migration files (numbered, sequential)
│   └── seed.sql                    # Development seed data
├── infra/
│   └── docker/                     # Dockerfiles and docker-compose.yml
├── docs/
│   └── architecture.md
├── .env.example                    # Documented env variable template
└── README.md                       # Full developer setup guide
```

### 3.5 Frontend Application Structure (`apps/web/`)

```
apps/web/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                # Landing page
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── layout.tsx              # Nav + footer
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx      # Brand switcher + summary
│   │   ├── brands/
│   │   │   ├── new/page.tsx        # Brand creation wizard
│   │   │   └── [brandId]/
│   │   │       ├── page.tsx        # Brand overview
│   │   │       ├── settings/page.tsx
│   │   │       ├── social/page.tsx
│   │   │       ├── leads/page.tsx
│   │   │       ├── outreach/page.tsx
│   │   │       └── activity/page.tsx
│   │   ├── account/page.tsx
│   │   └── layout.tsx              # App shell (sidebar + topbar)
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   │   └── unsubscribe/route.ts    # Lead unsubscribe handler
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── marketing/
│   ├── auth/
│   ├── dashboard/
│   ├── brands/
│   ├── social/
│   ├── leads/
│   ├── outreach/
│   ├── shared/
│   └── providers/
├── lib/
│   ├── api-client.ts
│   ├── auth.ts                     # NextAuth config
│   └── utils.ts
├── hooks/
├── types/
└── public/
    ├── images/
    ├── fonts/
    └── og-image.png
```

### 3.6 Backend Application Structure (`apps/api/`)

```
apps/api/
├── Markopilot.Api/
│   ├── Controllers/
│   │   ├── BrandsController.cs
│   │   ├── SocialController.cs
│   │   ├── LeadsController.cs
│   │   ├── OutreachController.cs
│   │   ├── SubscriptionsController.cs
│   │   └── WebhooksController.cs   # Lemon Squeezy + Flutterwave webhooks
│   ├── Middleware/
│   │   ├── AuthMiddleware.cs        # Validates Supabase JWT tokens
│   │   └── ErrorHandlingMiddleware.cs
│   └── Program.cs
├── Markopilot.Core/
│   ├── Services/
│   │   ├── BrandService.cs
│   │   ├── AiRoutingService.cs      # OpenRouter model routing
│   │   ├── ContentGenerationService.cs
│   │   ├── SocialPostingService.cs
│   │   ├── LeadDiscoveryService.cs
│   │   ├── LeadEnrichmentService.cs
│   │   ├── EmailOutreachService.cs
│   │   ├── QuotaService.cs
│   │   ├── SubscriptionService.cs
│   │   └── GlobalRateLimiter.cs    # Redis token bucket per external service
│   ├── Models/
│   │   ├── Brand.cs
│   │   ├── SocialPost.cs
│   │   ├── Lead.cs
│   │   ├── OutreachEmail.cs
│   │   └── Subscription.cs
│   └── Interfaces/
├── Markopilot.Infrastructure/
│   ├── Supabase/
│   │   └── SupabaseRepository.cs
│   ├── Search/
│   │   ├── SerperClient.cs
│   │   └── ExaClient.cs
│   ├── Social/
│   │   ├── TwitterClient.cs
│   │   ├── LinkedInClient.cs
│   │   ├── InstagramClient.cs
│   │   └── TikTokClient.cs
│   ├── Google/
│   │   └── GmailService.cs
│   ├── LemonSqueezy/
│   │   └── LemonSqueezyClient.cs
│   └── Flutterwave/
│       └── FlutterwaveClient.cs
├── Markopilot.Workers/
│   ├── Workers/
│   │   ├── SocialPostingWorker.cs
│   │   ├── LeadDiscoveryWorker.cs
│   │   └── OutreachWorker.cs
│   └── Program.cs
└── Markopilot.sln
```

---

## 4. DATABASE SCHEMA (SUPABASE / POSTGRESQL)

All migrations live in `supabase/migrations/` as numbered SQL files (e.g. `001_initial_schema.sql`). Use `supabase db reset` during development. Enable Row-Level Security on every table.

### 4.1 `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    subscription_id VARCHAR(255),              -- Lemon Squeezy subscription ID
    subscription_status VARCHAR(50) DEFAULT 'trialing',
    plan_name VARCHAR(50) DEFAULT 'starter',   -- starter | growth | scale
    current_period_end TIMESTAMPTZ,
    quota_leads_per_month INTEGER DEFAULT 100,
    quota_posts_per_month INTEGER DEFAULT 30,
    quota_brands_allowed INTEGER DEFAULT 1,
    quota_leads_used INTEGER DEFAULT 0,
    quota_posts_used INTEGER DEFAULT 0,
    quota_reset_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read/write their own record"
    ON users FOR ALL USING (auth.uid() = id);
```

### 4.2 `brands`
```sql
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
    business_address TEXT,                     -- Required for CAN-SPAM compliance
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
    status VARCHAR(50) DEFAULT 'active',       -- active | paused | archived
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own brands"
    ON brands FOR ALL USING (owner_id = auth.uid());

CREATE INDEX idx_brands_owner_id ON brands(owner_id);
```

### 4.3 `posts`
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    platform VARCHAR(50) NOT NULL,             -- twitter | linkedin | instagram | tiktok
    content_pillar VARCHAR(255),
    generated_copy TEXT NOT NULL,
    hashtags JSONB DEFAULT '[]',
    media_url TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',       -- queued | published | failed | cancelled
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
```

### 4.4 `leads`
```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    discovered_via TEXT,                       -- The search query that found this lead
    source_url TEXT,
    name VARCHAR(255),
    job_title VARCHAR(255),
    company VARCHAR(255),
    email VARCHAR(255),
    linkedin_url TEXT,
    twitter_handle VARCHAR(255),
    location VARCHAR(255),
    ai_summary TEXT,                           -- 2-sentence relevance summary
    lead_score INTEGER DEFAULT 0,              -- 0-100
    status VARCHAR(50) DEFAULT 'new',          -- new | contacted | replied | converted | disqualified
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
```

### 4.5 `outreach_emails`
```sql
CREATE TABLE outreach_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',       -- queued | sent | bounced | replied | failed
    gmail_message_id VARCHAR(255),
    sent_at TIMESTAMPTZ,
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
```

### 4.6 `suppression_list`
```sql
-- Anti-spam: leads who unsubscribed or bounced. Never contact these again.
CREATE TABLE suppression_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    reason VARCHAR(100) DEFAULT 'unsubscribed', -- unsubscribed | bounced | complained
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, email)
);

CREATE INDEX idx_suppression_brand_email ON suppression_list(brand_id, email);
```

### 4.7 `activity_log`
```sql
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
```

### 4.8 `notifications`
```sql
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
```

### 4.9 Sprint 2 Scaffold Tables (Schema Only — No UI)
```sql
-- Create now so Sprint 2 requires no schema migration
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
```

---

## 5. AUTHENTICATION & AUTHORISATION

### 5.1 Google OAuth via NextAuth.js v5

Authentication is handled exclusively via Google OAuth 2.0 through NextAuth.js v5 on the frontend.

**NextAuth configuration (`apps/web/lib/auth.ts`):**
- Provider: `GoogleProvider` with scopes `openid profile email`.
- Session strategy: JWT.
- On first sign-in: create a `/users` row in Supabase with the user's Google profile data.
- On every sign-in: update `display_name` and `photo_url` if changed.
- The JWT session must include: `userId` (Supabase UUID), `email`, `planName`, `subscriptionStatus`.

**Frontend flow:**
1. User visits `/login`, clicks "Continue with Google".
2. NextAuth redirects to Google OAuth consent screen.
3. On success, NextAuth creates session, user is redirected to `/dashboard` (or `/onboarding` if `onboarding_completed = false`).

**Backend validation:**
- Every API request to the .NET backend must include `Authorization: Bearer <supabase_jwt>`.
- `AuthMiddleware.cs` validates the JWT using Supabase's JWT secret, extracts `userId`, attaches to request context.
- No endpoint is publicly accessible except the Lemon Squeezy and Flutterwave webhook endpoints (which use HMAC signature verification instead).

### 5.2 Social OAuth (Brand-Level Connections)

Social connections are brand-level, not user-level. Each is initiated from the brand's settings page. All tokens are AES-256 encrypted at the application level before storage and decrypted only in `Markopilot.Infrastructure`. Tokens must never appear in logs or API responses.

**Encryption implementation in `TokenEncryptionService.cs`:**
```csharp
// AES-256-CBC encryption using keys from environment variables
// Encryption__AesKey (256-bit, base64) and Encryption__AesIv (128-bit, base64)
public string Encrypt(string plaintext) { ... }
public string Decrypt(string ciphertext) { ... }
```

**Per-platform OAuth requirements:**

- **Twitter (X) OAuth 2.0 with PKCE:** Scopes: `tweet.read tweet.write users.read offline.access`. Store access + refresh token. Refresh when token is within 60 seconds of expiry.
- **LinkedIn OAuth 2.0:** Scopes: `r_liteprofile w_member_social`. 60-day token expiry. Refresh 7 days before expiry. If refresh fails: set `linkedin_connected = false`, log error, notify user.
- **Instagram Graph API:** Requires Facebook Developer app. 60-day long-lived token. Refresh 7 days before expiry. Scopes: `instagram_basic instagram_content_publish`.
- **TikTok for Developers:** Scopes: `user.info.basic video.publish`. Implement refresh per TikTok V2 API docs.
- **Gmail API:** Scopes: `https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly`. Refresh silently via Google's token endpoint. Per-brand connection (not global).

---

## 6. SUBSCRIPTION & BILLING

### 6.1 Lemon Squeezy (SaaS Subscriptions)

Lemon Squeezy is a Merchant of Record — they handle VAT, sales tax, and global payment compliance. This makes it ideal for a Kenya-based operator selling subscriptions internationally. Supports Visa, Mastercard, PayPal from customers worldwide with no US/EU entity required.

**Plan structure:**

| Plan | Price | Brands | Posts/Month | Leads/Month |
|---|---|---|---|---|
| Starter | $19/month | 1 | 30 | 100 |
| Growth | $49/month | 3 | 120 | 500 |
| Scale | $149/month | 10 | Unlimited | 2,000 |

All plans: all four social platforms, automated email outreach, Gmail integration, AI content generation, lead enrichment. **14-day free trial on all plans. No credit card required to start trial.**

**Webhook handler (`POST /api/webhooks/lemon-squeezy`):**
- Verify `X-Signature` header using HMAC-SHA256 with the Lemon Squeezy signing secret. Reject with HTTP 401 if invalid.
- Handle: `subscription_created`, `subscription_updated`, `subscription_payment_success` (reset quota counters, extend period), `subscription_payment_failed` (notify user), `subscription_cancelled`, `subscription_expired` (pause all brand automations).
- Respond HTTP 200 within 5 seconds. Process asynchronously via Hangfire if needed.

**Billing portal:** "Manage Billing" button in account settings generates a Lemon Squeezy Customer Portal URL and redirects the user. Portal handles upgrades, downgrades, cancellations, invoice history.

### 6.2 Flutterwave (Marketplace — Scaffolded in Sprint 1)

Flutterwave is the chosen provider for the Sprint 2 influencer marketplace because it natively supports split payments, payout subaccounts, M-Pesa disbursements, and multi-currency (KES, NGN, USD, GBP, EUR). It is fully operational in Kenya.

**Sprint 1 actions (implement now):**
- Create `FlutterwaveClient.cs` in `Markopilot.Infrastructure/Flutterwave/`.
- Implement `CreateSubaccount()` method (POST `/v3/subaccounts`) but do not call it yet.
- Add `FLUTTERWAVE_SECRET_KEY` to environment variables.
- The Sprint 2 campaign payment flow is described below for reference only — do not build it yet:
  - Brand pays for campaign → Flutterwave split: 85% to influencer subaccount, 15% platform fee retained.
  - Influencer subaccount pays out to M-Pesa or bank on campaign completion approval.

### 6.3 Quota Engine

`QuotaService.cs` enforces all quota rules:

- Before any post is generated or published: check `quota_posts_used < quota_posts_per_month`. If exceeded, pause automation for this brand, log `quota_warning` activity event, send in-app notification.
- Before any lead is saved: check `quota_leads_used < quota_leads_per_month`. Same pause-and-warn behaviour.
- Quota counters reset on `quota_reset_date` (set at subscription payment success). Handled by the Lemon Squeezy webhook.
- On plan upgrade: recalculate quotas immediately from new plan limits, not at next reset.
- Cache quota object in Redis for 5 minutes (`quota:{userId}`). Invalidate on any quota mutation.

---

## 7. JOB QUEUE & SCALING ARCHITECTURE

This section addresses what happens when 1000 users have automation running simultaneously. Without architecture this causes: 5,000 search API calls in burst, 50,000 AI extraction requests, 3,000 social posts publishing concurrently, and database write storms. The solution is Hangfire with priority queues, Redis rate limiting, and horizontal worker scaling.

### 7.1 Hangfire Setup

Hangfire stores jobs in Supabase PostgreSQL — no additional infrastructure required.

```csharp
// Markopilot.Workers/Program.cs
builder.Services.AddHangfire(config => config
    .UsePostgreSqlStorage(connectionString, new PostgreSqlStorageOptions
    {
        QueuePollInterval = TimeSpan.FromSeconds(5),
        InvisibilityTimeout = TimeSpan.FromMinutes(30),
        DistributedLockTimeout = TimeSpan.FromMinutes(10),
    }));

builder.Services.AddHangfireServer(options =>
{
    options.Queues = new[] { "critical", "scale", "growth", "starter", "default" };
    options.WorkerCount = 20; // per container instance; scale horizontally
});
```

Mount the Hangfire dashboard at `/hangfire` behind authentication (only accessible to authenticated admin users).

### 7.2 Priority Queue Architecture

| Queue | Who | Jobs | Processing Order |
|---|---|---|---|
| `critical` | All users | Token refresh, subscription events | Always first |
| `scale` | Scale plan | Lead discovery, social posting, outreach | Second |
| `growth` | Growth plan | Lead discovery, social posting, outreach | Third |
| `starter` | Starter/trial | Lead discovery, social posting, outreach | Fourth |
| `default` | System | Cleanup, analytics aggregation | When others are empty |

In `QuotaService.cs`:
```csharp
public string GetQueueForUser(string planName) => planName switch
{
    "scale"   => "scale",
    "growth"  => "growth",
    "starter" => "starter",
    _         => "starter"
};
```

This ensures Scale plan users never wait behind Starter users. Paying more = faster automation. This is a retention mechanism, not just an engineering detail.

### 7.3 Global Rate Limiter (Redis Token Bucket)

Implement `GlobalRateLimiter.cs` using Upstash Redis. Enforces global rate limits across all worker instances simultaneously, preventing collective API saturation regardless of how many users run at once.

```csharp
public class GlobalRateLimiter
{
    // Rate limits are global across ALL worker instances
    public const string SerperDev         = "rate:serper:global";   // 300 req/min
    public const string ExaAi             = "rate:exa:global";      // 100 req/min
    public const string GroqOpenRouter    = "rate:or:groq:global";  // 500 req/min
    public const string GoogleOpenRouter  = "rate:or:google:global";// 100 req/min
    public const string GmailSend         = "rate:gmail:global";    // 250 units/sec

    // Sliding window implementation using Redis INCR + EXPIRE
    public async Task<bool> TryAcquireAsync(string key, int ratePerMinute)
    {
        // Increment counter; if over limit, return false
        // Caller waits with exponential backoff and retries
    }
}
```

**Concurrency limits per job type (enforced via Hangfire server configuration):**

| Job Type | Max Concurrent | Rationale |
|---|---|---|
| SearchJob (Serper.dev) | 50 | 50 × 6 req/min = 300 req/min max |
| SearchJob (Exa.ai) | 20 | Exa tier limits |
| ScrapingJob | 100 | Network I/O bound; high concurrency is fine |
| EntityExtractionJob | 200 | Groq handles 500 RPM; each job tiny |
| SocialPostPublishJob | 30 | Twitter: 300 posts/15min/app |
| EmailSendJob | 20 | Gmail quota units |

### 7.4 Horizontal Scaling (Google Cloud Run)

Deploy the Worker Service as a Docker container on Google Cloud Run:

```
Min instances: 1          # Always on; no cold start on queue drain
Max instances: 50         # Auto-scales as queue depth grows
CPU: 1 vCPU per instance
Memory: 512MB per instance
Workers per instance: 20  # Hangfire WorkerCount
Max total concurrent: 50 × 20 = 1,000 concurrent jobs
```

Hangfire uses PostgreSQL advisory locks — when multiple instances run, each job executes on exactly one instance. No duplicate processing. Cloud Run scales on CPU utilisation: when all 20 workers on an instance are busy (CPU ~80%), a second instance spins up automatically.

### 7.5 Caching Strategy (Upstash Redis)

| Cache Key | TTL | Purpose |
|---|---|---|
| `quota:{userId}` | 5 min | Avoid DB round-trip on every job quota check |
| `brand_config_hash:{brandId}` | 24h | Detect if brand config changed (for query cache reuse) |
| `lead_queries:{brandId}` | 24h | Reuse AI-generated search queries if brand unchanged |
| `rate:{service}:global` | Sliding | Token bucket counters for external API rate limiting |
| `daily_send:{brandId}:{date}` | 25h | Fast outreach daily limit check |
| `token_valid:{brandId}:{platform}` | 10 min | Avoid decrypt+validate on every job |
| `session:{userId}` | 1h | Reduce auth middleware DB lookups |

### 7.6 Cost at 1000 Active Users (The Real Numbers)

**Revenue:** 1000 × $49/month (avg Growth) = **$49,000/month**

| Cost Category | Monthly |
|---|---|
| Supabase Pro | $25 |
| Upstash Redis | $10 |
| Cloud Run (API) | ~$15 |
| Cloud Run (Workers, avg 5 instances) | ~$100 |
| Serper.dev (150,000 queries) | $150 |
| Exa.ai (15,000 queries) | $15 |
| AI — Groq (entity extraction + scoring + queries) | ~$20 |
| AI — Google via OpenRouter (posts + outreach emails) | ~$77 |
| **Total** | **~$412/month** |

**Gross margin: ~99.2%.** The unit economics are excellent from the start.

---

## 8. LEAD GENERATION PIPELINE (COMPLETE SPECIFICATION)

### 8.1 Full Pipeline Flow

```
Trigger (Scheduled daily at brand's configured time, or Manual "Run Now")
    │
    ▼
[QuotaGuard]
    ├── quota_leads_used >= quota_leads_per_month ──► log quota_warning, notify user, STOP
    └── quota OK ──► continue
    │
    ▼
[QueryGenerationJob] — Groq llama-3.3-70b via OpenRouter
    ├── Check Redis: lead_queries:{brandId} exists?
    │   ├── YES and brand config unchanged ──► use cached queries, skip AI call
    │   └── NO or brand config changed ──► call AI, cache result for 24h
    └── Output: JSON array of 5 search query strings
    │
    ▼
For each of 5 queries:
    │
    ▼
[RouteDecision]
    ├── Query targets person/title/linkedin ──► Exa.ai
    └── Broad keyword query ──► Serper.dev
    │
    ▼
[SearchJob] ──► Returns up to 10 result URLs per query (max 50 URLs total per run)
    │
    ▼
[DeduplicationFilter]
    ├── URL already in leads.source_url for this brand ──► skip
    └── New URL ──► continue
    │
    ▼
[ScrapingJob] — HttpClient GET, 10s timeout, follow redirects
    ├── 200 OK ──► strip HTML tags/scripts/styles, keep visible text
    ├── 4xx/5xx ──► log, skip URL
    └── Timeout ──► log, skip URL
    │
    ▼
[EntityExtractionJob] — Groq llama-3.1-8b via OpenRouter
    Output: { name, jobTitle, company, email, linkedinUrl, twitterHandle, location, confidence }
    │
    ├── confidence = "low" OR all fields null ──► discard
    └── confidence = "medium" or "high" ──► continue
    │
    ▼
[LeadScoringJob] — Groq llama-3.1-8b via OpenRouter
    Output: { score: 0-100, summary: "2-sentence relevance explanation" }
    │
    ├── score < 30 ──► discard (poor fit; save no DB row)
    └── score >= 30 ──► continue
    │
    ▼
[EmailValidationCheck]
    ├── email present ──► regex format check + MX record lookup
    │   ├── invalid MX ──► save lead but mark email as unverified
    │   └── valid MX ──► mark email as verified
    └── no email ──► save lead (manual LinkedIn follow-up still possible)
    │
    ▼
[BatchLeadSave] — PostgreSQL bulk INSERT (never row-by-row in a loop)
    ├── INSERT into leads table
    ├── INCREMENT quota_leads_used on users table
    └── INSERT activity_log: type=lead_discovered
    │
    ▼
[OutreachQueueDecision]
    ├── email verified AND outreach_enabled AND not in suppression_list
    │   └── INSERT into outreach_emails: status=queued,
    │         scheduled_send_at = NOW() + outreach_delay_hours
    └── otherwise ──► lead saved for manual review only
```

### 8.2 Search Query Generation Prompt

File: `packages/ai-prompts/lead-queries.txt`

```
You are an expert B2B lead generation strategist. Generate 5 high-intent search queries that will surface real people who could be potential customers or clients for this business.

BUSINESS CONTEXT:
Brand: {brandName}
Industry: {industry}
What the brand does: {brandDescription}
Target audience: {targetAudienceDescription}
Specific job titles to target: {jobTitles}
Key pain points the brand solves: {painPoints}
Geographic focus: {geographies}

SEARCH STRATEGY GUIDELINES:
- Generate exactly 5 queries, each targeting a different discovery angle.
- Mix these query types: (1) LinkedIn profile pages of target titles, (2) "about us" or team pages of target companies, (3) industry directories or membership lists, (4) conference speaker pages or attendee lists, (5) blog authors or podcast guests in the target industry.
- Queries must surface INDIVIDUALS, not just companies or generic articles.
- If a geographic target was provided, incorporate it into at least 2 queries.
- Do NOT generate queries that return competitor analysis or news articles.

Return ONLY a JSON array of 5 strings. No explanations, no markdown, no preamble:
["query1", "query2", "query3", "query4", "query5"]
```

### 8.3 Entity Extraction Prompt

File: `packages/ai-prompts/entity-extraction.txt`

```
Extract contact information from the following web page content. Return only structured data. If a field is not present, return null.

WEB PAGE CONTENT:
{scrapedText}

Return ONLY this JSON structure, no preamble:
{
  "name": "string | null",
  "jobTitle": "string | null",
  "company": "string | null",
  "email": "string | null",
  "linkedinUrl": "string | null",
  "twitterHandle": "string | null",
  "location": "string | null",
  "confidence": "low | medium | high"
}

Set confidence to "high" if name + job title + company all found. "medium" if at least 2 of those 3 found. "low" otherwise.
```

### 8.4 Lead Scoring Prompt

File: `packages/ai-prompts/lead-scoring.txt`

```
Score this potential lead on a scale of 0-100 based on fit with the target customer profile.

BRAND TARGET PROFILE:
Brand: {brandName}
Industry: {industry}
Target audience: {targetAudienceDescription}
Target job titles: {jobTitles}
Pain points the brand solves: {painPoints}

LEAD DATA:
Name: {name}
Job Title: {jobTitle}
Company: {company}
Location: {location}
Found at: {sourceUrl}

SCORING GUIDE:
80-100: Near-perfect match. Job title, company type, and geography all align.
60-79: Good match. Most criteria align with minor gaps.
40-59: Partial match. Some criteria align but significant gaps exist.
0-39: Poor match. Do not score below 30 unless clearly irrelevant.

Return ONLY this JSON, no preamble:
{
  "score": <integer 0-100>,
  "summary": "<exactly 2 sentences explaining the fit>"
}
```

---

## 9. EMAIL OUTREACH PIPELINE (COMPLETE SPECIFICATION)

### 9.1 Full Pipeline Flow

`OutreachWorker` runs every 30 minutes as a Hangfire recurring job.

```
SELECT from outreach_emails WHERE:
    status = 'queued'
    AND scheduled_send_at <= NOW()
    AND brand.automation_outreach_enabled = true
    AND user.subscription_status IN ('active', 'trialing')
LIMIT 10 per brand per worker run
    │
    ▼
For each queued outreach item:
    │
    ▼
[DailyLimitCheck]
    ├── Redis: daily_send:{brandId}:{today} >= automation_outreach_daily_limit ──► defer 24h, STOP
    └── Within limit ──► continue
    │
    ▼
[SuppressionCheck]
    ├── email in suppression_list for this brand ──► mark outreach 'cancelled', update lead to 'disqualified', STOP
    └── Not suppressed ──► continue
    │
    ▼
[GmailTokenRefresh]
    ├── token expires within 5 min ──► call Google token endpoint to refresh
    │   ├── refresh failed ──► set gmail_connected=false, notify user, STOP
    │   └── refresh success ──► update encrypted tokens in DB
    └── Token valid ──► continue
    │
    ▼
[EmailGenerationJob] — Gemini 2.5 Flash via OpenRouter
    Output: { subject, bodyText, bodyHtml }
    (See prompt template in Section 9.2)
    │
    ▼
[SpamSignalCheck] (heuristics, no external API)
    ├── Subject all-caps ──► lowercase and rewrite
    ├── Body < 80 words ──► regenerate (max 1 retry)
    ├── Body > 350 words ──► regenerate (max 1 retry)
    ├── Spam trigger words present ──► flag, do not send, log warning
    └── Passes all checks ──► inject unsubscribe footer, continue
    │
    ▼
[GmailSend] — POST to Gmail API /v1/users/me/messages/send
    RFC 2822 MIME message, From = brand's Gmail account
    │
    ├── success ──► UPDATE outreach_emails status='sent', sent_at=NOW()
    │              UPDATE leads status='contacted'
    │              INCR Redis daily_send counter (TTL 25h)
    │              schedule follow-up check job in 4 days (Hangfire delayed job)
    │              INSERT activity_log: type=email_sent
    │
    ├── 429 Rate Limited ──► exponential backoff: 60s → 120s → 240s, max 3 retries
    │
    └── error ──► UPDATE outreach_emails status='failed', store error_message
                  INSERT activity_log: type=error
```

### 9.2 Outreach Email Generation Prompt

File: `packages/ai-prompts/outreach-email.txt`

```
You are an expert B2B outreach copywriter. Write a cold outreach email that sounds human, personal, and genuinely interested — not salesy or templated.

SENDER BRAND:
Name: {brandName}
Industry: {industry}
What we do: {brandDescription}
Voice — Formality: {formality}, Humour: {humour}, Assertiveness: {assertiveness}, Empathy: {empathy}

RECIPIENT:
Name: {leadName}
Job Title: {leadJobTitle}
Company: {leadCompany}
Relevance: {leadSummary}

EMAIL REQUIREMENTS:
Subject line: 6-8 words. Curiosity-driving. Do NOT start with "I" or the recipient's name.
Body: 3 short paragraphs maximum.
  - Paragraph 1: Reference something specific about the lead or their company. Show you know who they are.
  - Paragraph 2: One sentence introducing the value proposition. No hype.
  - Paragraph 3: Simple, low-friction call to action. Suggest a 15-minute call or ask one yes/no question.
Sign off: Use the brand name, not a personal name.

BANNED PHRASES — Do not use any of these: "I hope this email finds you well", "synergy", "leverage", "reach out", "circle back", "game-changing", "revolutionary", "disruptive", "touch base".

Respond ONLY as this JSON structure:
{
  "subject": "...",
  "bodyText": "...",
  "bodyHtml": "..."
}
```

### 9.3 Anti-Spam Hard Limits (Cannot Be Overridden by User Settings)

| Limit | Value | Enforcement |
|---|---|---|
| Max emails per Gmail account per day | 50 | Redis counter, TTL 25h |
| Min time between emails to same domain | 48 hours | DB check on domain of recipient_email |
| Max follow-ups per lead | 1 | `follow_up_sent` boolean in DB |
| Min delay after lead discovery | 2 hours | Enforced in queue scheduler |
| Min time between sends | 30 seconds | Redis mutex per brand |

### 9.4 Follow-Up Detection (Runs After 4 Days)

A Hangfire delayed job scheduled at send time runs after 4 days per sent email:

1. Gmail API: `GET /v1/users/me/messages?q=in:inbox from:{leadEmail} after:{sentTimestamp}`
2. If reply found → UPDATE lead status = `replied`, set `follow_up_scheduled = false`, INSERT activity `lead_replied`. Do not send follow-up.
3. If no reply AND `follow_up_sent = false` → generate and send follow-up email using `packages/ai-prompts/follow-up-email.txt` (write a short 2-paragraph bump referencing the original). Set `follow_up_sent = true`.

### 9.5 Unsubscribe System (Legally Required)

Every outreach email `bodyHtml` must include this footer **before** sending. Inject it in the email generation step, not in the prompt:

```html
<p style="font-size:11px;color:#999;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
  {brandName} uses Markopilot for business outreach.
  <a href="{NEXT_PUBLIC_BASE_URL}/api/unsubscribe?token={unsubscribeToken}">
    Click here to unsubscribe
  </a> — you will never be contacted by this brand again.
  <br/>{brandBusinessAddress}
</p>
```

**`unsubscribeToken`**: A signed JWT (`{ leadEmail, brandId, exp: 90 days }`) using `NEXTAUTH_SECRET`.

**`/api/unsubscribe` route handler:**
1. Verify and decode the JWT.
2. INSERT into `suppression_list (brand_id, email, reason='unsubscribed')` — ON CONFLICT DO NOTHING.
3. UPDATE lead `status = 'disqualified'`.
4. Return a simple HTML page: "You have been unsubscribed. You will not receive further emails from {brandName}."

---

## 10. SOCIAL POSTING ENGINE

### 10.1 Content Generation Pipeline

`SocialPostingWorker` triggers at the brand's configured posting time, determined by `automation_posting_days` and `automation_posting_time_utc`. Implemented as a Hangfire recurring job with a cron expression built from these settings.

**Generation Logic:**
1. Check quota: `quota_posts_used >= quota_posts_per_month` → pause, warn, stop.
2. Select content pillar: rotate sequentially through `content_pillars` array for balanced coverage.
3. For each connected platform: call `ContentGenerationService.cs` → `AiRoutingService.cs` with `AiTask.SocialPostGeneration`.
4. Parse response → INSERT into `posts` table with `status = 'queued'`, `scheduled_for = NOW() + (0 to 30 minutes random offset to avoid burst publishing)`.
5. INCREMENT `quota_posts_used`.

### 10.2 Social Post Generation Prompt

File: `packages/ai-prompts/social-post.txt`

```
You are a professional social media copywriter. Write a post for the following brand.

Brand: {brandName}
Industry: {industry}
Description: {brandDescription}
Voice — Formality: {formality}, Humour: {humour}, Assertiveness: {assertiveness}, Empathy: {empathy}
Content pillar for this post: {contentPillar}
Target audience: {audienceDescription}
Platform: {platform}

Platform requirements:
- twitter: Max 280 characters. No hashtags in body; add 1-2 at the very end.
- linkedin: 150-300 words. Professional tone, line breaks for readability. 3-5 hashtags.
- instagram: 100-200 words. Conversational, engaging. 10-15 hashtags at the end separated from caption.
- tiktok: 50-150 characters. Energetic, trend-aware. 3-5 hashtags.

Return ONLY this JSON:
{
  "copy": "...",
  "hashtags": ["...", "..."]
}
```

### 10.3 Publishing Pipeline

A second Hangfire recurring job runs every 5 minutes, picking up `queued` posts where `scheduled_for <= NOW()`:

1. Retrieve and decrypt platform token.
2. Call platform client.
3. **Success:** UPDATE `status = 'published'`, store `platform_post_id`, INSERT activity `post_published`.
4. **Token expired:** Attempt silent refresh. If refresh succeeds, retry publish. If refresh fails: UPDATE `status = 'failed'`, set `{platform}_connected = false`, INSERT activity `error`, send notification to re-authorise.
5. **Other failure:** UPDATE `status = 'failed'`, store `error_message`, INSERT activity `error`.

---

## 11. LANDING PAGE & MARKETING SITE

### 11.1 Design System

**Colour palette (CSS variables in `globals.css`):**
```css
:root {
  --bg-primary:      #09090b;
  --bg-surface:      #111114;
  --bg-elevated:     #1c1c21;
  --accent-primary:  #7c6eff;
  --accent-glow:     rgba(124, 110, 255, 0.15);
  --text-primary:    #f4f4f5;
  --text-secondary:  #a1a1aa;
  --text-muted:      #52525b;
  --border:          rgba(255, 255, 255, 0.07);
  --success:         #22c55e;
  --warning:         #f59e0b;
  --error:           #ef4444;
}
```

**Typography (import from Google Fonts):**
- Display: `Instrument Serif` — all H1/H2 headings on marketing pages.
- Body: `DM Sans` — body copy, labels, UI elements throughout the app.
- Mono: `JetBrains Mono` — code snippets or technical callouts.

### 11.2 Landing Page Sections (in order)

**Navigation Bar**
- Fixed; `backdrop-filter: blur(12px)` glass effect on scroll.
- Logo: "Markopilot" in `Instrument Serif`, bold, white.
- Links: "Features", "How It Works", "Pricing", "Blog" (placeholder).
- CTA: "Start Free Trial" → `/login`.
- Mobile: hamburger with slide-down drawer.

**Hero**
- Full-viewport height.
- H1: "Your Brand, Running Itself." — `Instrument Serif`, `clamp(48px, 7vw, 96px)`.
- Sub: "Markopilot autonomously handles your social media, lead generation, and outreach — so you can focus entirely on building." — `DM Sans`, `--text-secondary`.
- Two CTAs: Primary "Start Free Trial" (filled accent), Secondary "See How It Works" (ghost, smooth-scrolls to `#how-it-works`).
- Background: Animated dot grid with radial gradient glow centred on accent colour. Subtle pulsing animation (CSS keyframes, low opacity).
- Right side (desktop) / below (mobile): CSS/SVG illustration of the dashboard.

**Trust Bar**
- Headline: "Built for every kind of business."
- Horizontal scrolling row of industry chips: Software & SaaS, Ecommerce, Creative Agency, Consulting, Real Estate, Personal Brand, Food & Beverage, Education, Non-Profit.
- Platform logos: X, LinkedIn, Instagram, TikTok, Gmail.

**Features — "How It Works"** (`id="how-it-works"`)
- Three alternating text-left/image-right sub-sections:
  1. Autonomous Social Posting (4 platforms, AI copy, schedule control).
  2. Intelligent Lead Generation (search + scrape + score, industry-agnostic).
  3. Automated Email Outreach (Gmail-native, personalised, controlled cadence).

**Pricing** (`id="pricing"`)
- Three plan cards: Starter, Growth (highlighted "Most Popular"), Scale.
- Monthly/annual toggle (annual = "Coming Soon" badge, not yet implemented).
- Each card: plan name, price, quota limits, feature list, "Start Free Trial" CTA.
- Below cards: "All plans include a 14-day free trial. No credit card required."

**FAQ** (accordion, minimum 8 questions covering trial, supported countries, content quality, automation pausing, lead discovery method, data privacy, platform API compliance, plan upgrades).

**Closing CTA**
- Large headline: "Stop marketing manually."
- Single CTA: "Start Free Trial — No Card Needed"

**Footer**
- Links: Privacy Policy, Terms & Conditions, Contact (`mailto:hello@markopilot.com`).
- Copyright: `© 2026 Markopilot. All rights reserved.`

### 11.3 SEO Requirements

```html
<title>Markopilot — Autonomous Social Media & Lead Generation for Any Business</title>
<meta name="description" content="...155 char keyword-rich description..." />
<meta property="og:title" content="Markopilot — Autonomous Social Media & Lead Generation" />
<meta property="og:description" content="..." />
<meta property="og:image" content="{NEXT_PUBLIC_BASE_URL}/og-image.png" />
<meta property="og:url" content="{NEXT_PUBLIC_BASE_URL}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href="{NEXT_PUBLIC_BASE_URL}" />
```

JSON-LD structured data: `SoftwareApplication` schema with `name`, `description`, `applicationCategory: "BusinessApplication"`, `offers` (pricing plans).

---

## 12. LEGAL PAGES

Both pages use the marketing layout (nav + footer) and are accessible from the footer.

### 12.1 Privacy Policy (`/privacy`)

Write a full plain-English privacy policy covering these sections:

1. **Introduction** — Who we are, effective date, what this policy covers.
2. **Information We Collect** — Google account data via OAuth; brand configuration; social tokens (encrypted at rest); discovered lead data; outreach email content; usage analytics; payment/billing data (processed by Lemon Squeezy — we never store card numbers).
3. **How We Use Your Information** — Operate automation features; generate AI content on behalf of brands; send outreach emails at user direction via their own Gmail; manage subscriptions; improve the platform.
4. **Data Sharing** — Google (Firebase optional, Gemini AI via OpenRouter, Gmail API, Custom Search); Lemon Squeezy (billing); Flutterwave (marketplace payments, Sprint 2); social platforms (via their APIs for posting only); no data sold to third parties.
5. **Data Retention** — User data: retained while active + 30 days after deletion request. Lead data: 12 months. Outreach logs: 6 months.
6. **Your Rights** — Access, correct, export, delete. Contact: `privacy@markopilot.com`.
7. **Children's Privacy** — Not intended for users under 16.
8. **Cookies** — Session cookies via NextAuth; no advertising cookies.
9. **International Transfers** — Data stored on infrastructure that may be outside your country.
10. **Policy Changes** — Material changes notified via email and in-app notification.
11. **Contact** — `privacy@markopilot.com`.

### 12.2 Terms & Conditions (`/terms`)

Write full Terms covering:

1. Acceptance of Terms.
2. Eligibility (16+, legal capacity to contract).
3. Account Responsibilities (security, accurate info, no sharing).
4. Acceptable Use (no spam, illegal activity, harassment, impersonation, reselling).
5. Social Media & Outreach Compliance — Users are responsible for compliance with each platform's ToS and applicable anti-spam laws (CAN-SPAM, GDPR, etc.). Markopilot is the tool; the user is the operator. The unsubscribe mechanism provided is a compliance aid, not a guarantee.
6. AI-Generated Content — AI content is automated. Markopilot does not guarantee accuracy, legality, or appropriateness. Users should periodically review published content.
7. Subscription, Billing & Refunds — Trial terms, payment via Lemon Squeezy, no refunds for partial months, cancellation effective at end of billing period.
8. Quota Limits — Automation pauses when quota is exhausted; no overage charges.
9. Data & Privacy — Reference to Privacy Policy; user retains ownership of their brand data and AI-generated content.
10. Intellectual Property — Markopilot name, logo, and codebase are proprietary.
11. Limitation of Liability — Platform provided "as is"; not liable for missed business opportunities, platform bans, or third-party API outages.
12. Termination — We may suspend accounts that violate these terms.
13. Governing Law — Laws of Kenya (note: review with a lawyer before production launch).
14. Contact — `legal@markopilot.com`.

---

## 13. ONBOARDING FLOW

On first sign-in (`onboarding_completed = false`), redirect to multi-step wizard instead of dashboard.

**Step 1 — Welcome**
Display user's Google profile photo and name. Headline: "Welcome to Markopilot, [First Name]." Brief explanation of what happens next. Button: "Let's get started."

**Step 2 — Create Your First Brand**
Fields: Brand name (required), Short description (required), Website URL (optional), Industry (dropdown from taxonomy), Industry custom (conditional, shown when "Other" selected). Validate all required fields before proceeding.

**Step 3 — Define Your Target Audience**
Fields: Audience description (textarea), Job titles (tag input, up to 10 — user types and presses Enter), Pain points (tag input, up to 5), Target geographies (tag input, up to 5).

**Step 4 — Set Brand Voice**
Four segmented-control inputs: Formality (Casual / Professional / Executive), Humour (None / Subtle / Playful), Assertiveness (Soft / Balanced / Bold), Empathy (Low / Medium / High).

**Step 5 — Choose Content Pillars**
Tag input for up to 5 topics. Include an AI-powered "Suggest Pillars" button: calls backend → Groq 70B with brand context → returns 5 suggested topics user can accept or edit.

**Step 6 — Choose a Plan**
Embedded pricing table (three plans). Clicking a plan redirects to Lemon Squeezy checkout with pre-filled customer email. Option: "Skip for now (continue with free trial)" activates Starter trial without payment.

**Step 7 — Complete**
"Your brand is ready. Automation starts in a few minutes." Set `onboarding_completed = true` in Supabase. Redirect to brand dashboard.

---

## 14. APP SHELL & DASHBOARD

### 14.1 App Shell Layout

**Left Sidebar (240px, desktop):**
- Markopilot logo.
- Brand switcher dropdown (active brand name, switch brands, "+ New Brand" option).
- Nav items for active brand: Overview, Social Posting, Lead Generation, Email Outreach, Activity Log.
- Divider, then: Account Settings.
- Bottom: Plan name + compact quota progress bars (leads used/allowed, posts used/allowed).
- Collapse toggle.

**Top Bar:**
- Brand name + status badge (Active / Paused / Archived).
- Automation master toggle (pauses/resumes all workers for current brand).
- Notification bell with unread count. Click → popover of 10 most recent notifications. "Mark all read" button.
- User avatar dropdown: Account Settings, Billing, Sign Out.

**Mobile:** Bottom tab navigation (Overview, Social, Leads, Outreach, Activity). Top bar: logo + hamburger.

### 14.2 Brand Overview Page

- **Automation Status Card:** Running / Paused + reason if paused (user-toggled / quota exceeded / token error) + action button.
- **Weekly Stats:** Posts published, leads discovered, emails sent — as card widgets.
- **Quota Meters:** Two progress bars with percentage labels.
- **Upcoming Posts:** Next 3 scheduled posts (platform icon, content preview, scheduled time).
- **Recent Leads:** Last 5 leads (name, company, score badge, status).
- **Recent Activity:** Last 8 activity log entries.

### 14.3 Social Posting Page (`/brands/[brandId]/social`)

- Post calendar (weekly view, colour-coded by platform).
- Post queue table (queued posts, platform, content preview, scheduled time, "Cancel" action).
- Published posts table with engagement stats.
- "Create Post Now" button → modal for manual post creation.
- Platform connection status cards per platform (connect / reconnect buttons).

### 14.4 Lead Generation Page (`/brands/[brandId]/leads`)

- Paginated lead table (20/page): Name, Job Title, Company, Lead Score (colour-coded badge), Status, Discovered At.
- Filters: status, score range, date range.
- Lead detail right-side drawer: full enriched profile, source URL, AI summary, action buttons ("Queue for Outreach", "Disqualify").
- Discovery settings card: frequency, next run, "Run Now" button (manual, uses quota).

### 14.5 Email Outreach Page (`/brands/[brandId]/outreach`)

- Outreach queue table (pending leads with email, name, company, score, scheduled send time, "Cancel" action).
- Sent emails table (status, sent date, "View Email" to see content).
- Gmail connection card (connect / reconnect button).
- Outreach settings form: delay hours, follow-up toggle, follow-up delay days, daily send limit.

### 14.6 Activity Log Page (`/brands/[brandId]/activity`)

Chronological log, 50 entries/page. Each entry: type icon (colour-coded), description, timestamp ("2 hours ago" for recent, full date for older), expandable metadata JSON panel for debugging. Filters: event type, date range.

### 14.7 Account & Billing Page (`/account`)

User profile section (read-only: name, email from Google). Current plan display. Quota summary. "Manage Billing" button (generates Lemon Squeezy Customer Portal URL, redirects user). "Delete Account" button (soft-delete flow with confirmation modal).

---

## 15. NOTIFICATION SYSTEM

Notifications stored in `notifications` table. Real-time updates via Supabase Realtime WebSocket subscription on `notifications` filtered by `user_id`. Notification bell shows unread count. Popover shows 10 most recent. Types: `quota_warning`, `token_error`, `post_published`, `lead_milestone`, `subscription_event`.

---

## 16. ERROR HANDLING & RESILIENCE

### 16.1 API Error Envelope
```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### 16.2 Worker Resilience

- All workers implement retry with exponential backoff for transient failures: wait 30s → 60s → 120s, max 3 retries (handled by Hangfire automatically with configured retry policy).
- Exceptions are caught per brand — one brand's failure never prevents other brands from processing.
- **Circuit Breaker pattern** in `GlobalRateLimiter.cs`: opens after 5 consecutive failures on a service, stays open for 60 seconds, then moves to half-open (1 probe request).
- After 3 failed retries, log an `error` activity event for the brand and stop retrying. Do not silently drop failures.

### 16.3 Frontend Error Handling

- Global `ErrorBoundary` for unexpected rendering errors.
- Toast notifications for all action results.
- Field-level validation on all forms.
- Skeleton loaders (not spinners) for data loading states.

---

## 17. COMPLIANCE ARCHITECTURE

### 17.1 Anti-Spam (Hard Limits, Cannot Be Bypassed)

See Section 9.3 for the full table. These limits are enforced at the infrastructure level — `OutreachWorker` checks Redis counters before every send. No UI setting can override them.

### 17.2 Data Deletion

Users can request account deletion from Account Settings. Deletion flow:
1. SET `users.status = 'deleting'` immediately (prevents new job scheduling).
2. Cancel all pending Hangfire jobs for this user's brands.
3. Cancel Lemon Squeezy subscription via API.
4. Anonymise or delete all associated records across all tables after 30 days (run as a scheduled cleanup job).
5. DELETE the user row after 30 days.

Provide a "Delete a specific lead's data" option in the lead detail drawer (GDPR right to erasure). This immediately hard-deletes the lead row and any associated outreach records.

---

## 18. SECURITY REQUIREMENTS

- All .NET API endpoints require a valid Supabase JWT in `Authorization: Bearer` header, validated by `AuthMiddleware.cs`.
- All social tokens and Gmail tokens in Supabase are AES-256 encrypted at the application level. Keys from `Encryption__AesKey` and `Encryption__AesIv` environment variables. Never log decrypted values.
- Lemon Squeezy webhook: validate HMAC-SHA256 signature on every request. Reject with 401 if invalid.
- Flutterwave webhook: validate Flutterwave hash signature on every request.
- CORS: configured on .NET API to allow only the Next.js frontend origin.
- Rate limiting on .NET API: 60 requests/min/user for standard endpoints, 10 requests/min for trigger endpoints ("Run Now").
- Content Security Policy headers on Next.js.
- Supabase Row-Level Security policies on all tables (user can only access their own data).

---

## 19. ENVIRONMENT VARIABLES

Document all variables in `.env.example`. Group by service.

**Frontend (`apps/web/.env.local`):**
```
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID=
NEXT_PUBLIC_LEMON_SQUEEZY_STARTER_VARIANT_ID=
NEXT_PUBLIC_LEMON_SQUEEZY_GROWTH_VARIANT_ID=
NEXT_PUBLIC_LEMON_SQUEEZY_SCALE_VARIANT_ID=
```

**Backend (`apps/api/appsettings.json` or environment):**
```
Supabase__Url=
Supabase__ServiceRoleKey=
Supabase__JwtSecret=
Redis__ConnectionString=          # Upstash Redis connection string
OpenRouter__ApiKey=
Serper__ApiKey=
Exa__ApiKey=
LemonSqueezy__ApiKey=
LemonSqueezy__WebhookSigningSecret=
LemonSqueezy__StoreId=
Flutterwave__SecretKey=
Flutterwave__WebhookHash=
Encryption__AesKey=               # 256-bit base64
Encryption__AesIv=                # 128-bit base64
Twitter__ClientId=
Twitter__ClientSecret=
LinkedIn__ClientId=
LinkedIn__ClientSecret=
Instagram__AppId=
Instagram__AppSecret=
TikTok__ClientKey=
TikTok__ClientSecret=
```

---

## 20. TESTING REQUIREMENTS

- **Unit tests** for all service classes in `Markopilot.Core` using xUnit. Mock all external dependencies.
- **Integration tests** for all API controllers covering happy path and primary error cases.
- **Frontend tests** using Vitest + React Testing Library for form components, brand switcher, quota display, and onboarding step navigation.
- **E2E tests** using Playwright: sign-in (Google mocked), brand creation, social account connection, manual post creation, lead detail drawer, plan upgrade flow, unsubscribe flow.

---

## 21. DEPLOYMENT CONFIGURATION

- **Next.js** → Vercel. Include `vercel.json` with environment variable references.
- **.NET API** → Docker container on Google Cloud Run. Provide `infra/docker/api.Dockerfile`.
- **Worker Service** → Docker container on Google Cloud Run (scheduled via Cloud Scheduler for Hangfire polling trigger). Provide `infra/docker/worker.Dockerfile`.
- **Supabase** → Managed by Supabase cloud. Run `supabase db push` for migrations. Include `supabase/config.toml`.
- **Local dev** → `infra/docker/docker-compose.yml` starts .NET API + Worker Service together. Frontend runs with `npm run dev` separately.
- **README.md** at repo root must include: prerequisites, step-by-step env variable setup, Supabase project setup, Lemon Squeezy configuration, Flutterwave configuration, OpenRouter + Serper + Exa account setup, and how to run locally end-to-end.

---

## 22. IMPLEMENTATION ORDER (EXECUTE IN THIS EXACT SEQUENCE)

1. **Scaffold repo structure** — Create all directories and placeholder files per Section 3.4 and 3.5 and 3.6.
2. **Supabase migrations** — Write and apply all SQL migrations for every table in Section 4 including indexes and RLS policies. Run `supabase db reset` to verify.
3. **Hangfire + Redis setup** — Configure Hangfire with Supabase PostgreSQL backing store, four priority queues, and worker count. Initialise Upstash Redis client. Implement `GlobalRateLimiter.cs`.
4. **.NET Core models and interfaces** — Create all C# model classes and service interfaces with no implementations yet.
5. **Supabase repository** — Implement `SupabaseRepository.cs` with typed CRUD operations for all tables.
6. **Token encryption** — Implement `TokenEncryptionService.cs` (AES-256-CBC). Write unit tests.
7. **Authentication** — NextAuth.js v5 Google OAuth on frontend; `AuthMiddleware.cs` JWT validation on backend. Test sign-in and sign-out fully before proceeding.
8. **Landing page** — Full marketing page per Section 11, including all 8 sections, design system, and SEO metadata.
9. **Legal pages** — Privacy Policy and Terms & Conditions per Section 12.
10. **Onboarding flow** — Multi-step wizard per Section 13.
11. **App shell** — Sidebar, top bar, and layout scaffolding per Section 14.1.
12. **Brand management** — Create, read, update, archive brands. All brand settings forms with validation.
13. **Subscription & billing** — Lemon Squeezy checkout, webhook handler, quota engine, billing portal redirect. Flutterwave client scaffolded (`FlutterwaveClient.cs` with methods, not called).
14. **Social platform OAuth flows** — Connect/disconnect flows for all 4 platforms. Token storage (encrypted). Token refresh logic per platform.
15. **AI routing service** — `AiRoutingService.cs` with OpenRouter integration and full model map.
16. **Search service** — `LeadSearchService.cs` wrapping Serper.dev and Exa.ai with routing logic.
17. **Content generation service** — `ContentGenerationService.cs` using AI routing for social posts.
18. **Social posting worker** — Hangfire recurring job for generation and publishing pipeline. Social posting UI.
19. **Lead discovery service** — Query generation, search, scraping, entity extraction, scoring, deduplication.
20. **Lead discovery worker** — Hangfire scheduled job running full pipeline per Section 8.1. Lead UI.
21. **Gmail OAuth** — Connect/disconnect flow. Token storage and refresh.
22. **Email outreach service** — Email generation, spam checks, Gmail send, unsubscribe token injection.
23. **Outreach worker** — Hangfire recurring job per Section 9.1. Follow-up detection. Outreach UI.
24. **Suppression / unsubscribe** — `/api/unsubscribe` route handler, suppression check in outreach worker.
25. **Notification system** — Activity logging, in-app notifications, Supabase Realtime subscription for bell.
26. **Activity log page** — Chronological log with filters.
27. **Account page** — Profile, billing portal link, quota display, delete account flow.
28. **Brand overview dashboard** — All widgets: stats, quota meters, upcoming posts, recent leads, recent activity.
29. **Testing** — Write and run all unit, integration, and E2E tests per Section 20.
30. **Deployment** — Dockerfiles, Vercel config, Cloud Run setup, Supabase CLI config, README.

---

*This is the complete, self-contained specification for Markopilot V2. No other document is required. Build in the order defined in Section 22. Every feature described is required for Sprint 1.*

    // Aquinas123***Aquinas123
