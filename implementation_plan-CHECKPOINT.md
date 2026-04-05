# Fix Foundation — Replace All Mocks/Stubs Before Steps 18–30

Addressing every item in `ReviewLater.md` with real implementations. No stubbing, no mocking.

---

## User Review Required

> [!IMPORTANT]
> **Architecture decision:** The current workers (`SocialPublishingWorker.cs`, `LeadExtractionWorker.cs`) live in `Markopilot.Core` but reference `Markopilot.Infrastructure` (SupabaseRepository, AiGenerationService) and `Hangfire`. Core should NOT depend on Infrastructure (that's a circular dependency). **The plan moves workers to `Markopilot.Workers` where they belong** — this is where Hangfire references already exist.

> [!IMPORTANT]
> **AI architecture change:** The spec (Section 3.2) mandates OpenRouter for ALL AI calls, with model routing per `AiTask`. The current `AiGenerationService.cs` calls Gemini directly — this is wrong. The plan replaces it with a proper `AiRoutingService.cs` using the OpenRouter OpenAI-compatible endpoint, then builds `ContentGenerationService.cs` on top.

> [!WARNING]
> **Missing files that are NOT in scope for this fix pass (they belong to Steps 19–30):**
> - `LeadDiscoveryService.cs`, `LeadEnrichmentService.cs` — Step 19
> - `OutreachWorker.cs`, `EmailOutreachService.cs` — Steps 22–23
> - `GmailService.cs` — Step 21
> - `BrandService.cs`, `SubscriptionService.cs` — Step 12/13 (service layer over repo)
> - `NotificationService`, `ActivityLogService`, `SuppressionService` — Steps 24–26
> - `FlutterwaveClient.cs` — Sprint 2 scaffold
> - Social platform clients (`LinkedInClient.cs`, `InstagramClient.cs`, `TikTokClient.cs`) — Step 14 completion
> - Frontend pages — Steps 18–28
> - `infra/docker/*` — Step 30
>
> These will be built properly when we reach their respective steps.

---

## Proposed Changes

### Phase 1: Fix Compilation Errors (Critical Path)

The build currently has **15 errors**. Nothing else works until these are fixed.

---

#### Fix 1A: Move workers from Core → Workers (architecture fix)

Workers depend on Infrastructure and Hangfire, which Core must not reference.

##### [DELETE] [SocialPublishingWorker.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Workers/SocialPublishingWorker.cs)
Delete from `Markopilot.Core/Workers/`

##### [DELETE] [LeadExtractionWorker.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Workers/LeadExtractionWorker.cs)
Delete from `Markopilot.Core/Workers/`

##### [NEW] SocialPublishingWorker.cs
**Location:** `Markopilot.Workers/Workers/SocialPublishingWorker.cs`
- Depend on interfaces from Core (`ITokenEncryptionService`, `ISocialPublisher`)
- Depend on `SupabaseRepository` from Infrastructure (Workers already references Infrastructure)
- Use `[AutomaticRetry(Attempts = 2)]` from Hangfire (Workers already has Hangfire)
- Replace `GetEncryptedTokenStubAsync()` with real DB query: get brand by ID → decrypt platform token
- Uncomment all DB operations (`UpdatePostStatusAsync`, `InsertActivityAsync`)
- Add `UpdatePostStatusAsync` method to `SupabaseRepository`

##### [NEW] LeadExtractionWorker.cs
**Location:** `Markopilot.Workers/Workers/LeadExtractionWorker.cs`
- Depend on `ILeadDiscoveryClient` interface (not mock directly)
- Depend on `IAiRoutingService` interface (not concrete `AiGenerationService`)
- Fix method call: `_repo.BulkInsertLeadsAsync(...)` (not `InsertLeadsAsync`)
- Use `lead.Name` / `lead.Company` (not FirstName/LastName/CompanyName)

##### [MODIFY] [Markopilot.Core.csproj](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Markopilot.Core.csproj)
- Remove `using Hangfire` — Core should never reference Hangfire
- Delete the `Workers/` directory from Core entirely

##### [MODIFY] [Markopilot.Workers.csproj](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Workers/Markopilot.Workers.csproj)
- Already references Core + Infrastructure + Hangfire ✅

---

#### Fix 1B: Add missing SupabaseRepository methods

##### [MODIFY] [SupabaseRepository.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Supabase/SupabaseRepository.cs)
Add these real methods with Npgsql queries:
- `UpdatePostStatusAsync(Guid postId, string status, string? platformPostId = null, string? errorMessage = null)` — UPDATE posts SET status, published_at, platform_post_id, error_message
- `GetBrandSocialTokenAsync(Guid brandId, string platform)` — SELECT the encrypted token column for the specific platform from brands table
- `GetLeadsByBrandAsync(Guid brandId, int page, int pageSize, string? status, int? minScore, int? maxScore)` — paginated lead query with filters
- `GetLeadByIdAsync(Guid brandId, Guid leadId)` — single lead
- `UpdateLeadStatusAsync(Guid leadId, string status)` — UPDATE leads SET status
- `DeleteLeadAndOutreachAsync(Guid brandId, Guid leadId)` — DELETE from leads and outreach_emails (GDPR)
- `GetPostsByBrandAsync(Guid brandId, int page, int pageSize)` — paginated posts
- `CancelPostAsync(Guid postId)` — UPDATE posts SET status = 'cancelled'
- `GetUserByIdAsync(Guid userId)` — already exists ✅
- `GetQueuedOutreachEmailsAsync(Guid brandId, int limit)` — for outreach worker
- `UpdateOutreachEmailStatusAsync(Guid emailId, string status, string? gmailMessageId, string? errorMessage)` — UPDATE outreach_emails
- `GetActivityLogAsync(Guid brandId, int page, int pageSize, string? typeFilter)` — paginated activity log
- `GetNotificationsAsync(Guid userId, int count)` — recent notifications
- `MarkNotificationsReadAsync(Guid userId)` — mark all read
- `GetUnreadNotificationCountAsync(Guid userId)` — count unread
- `UpdateBrandSocialTokenAsync(Guid brandId, string platform, string encryptedAccessToken, string? encryptedRefreshToken, DateTimeOffset? expiresAt, string? username, bool connected)` — persist OAuth tokens
- `DisconnectBrandPlatformAsync(Guid brandId, string platform)` — clear tokens, set connected = false

---

### Phase 2: AiRoutingService (OpenRouter) — Replaces AiGenerationService

Per spec Section 3.2, ALL AI calls go through OpenRouter.

##### [NEW] AiRoutingService.cs
**Location:** `Markopilot.Infrastructure/OpenRouter/AiRoutingService.cs`
- Implements `IAiRoutingService` from Core interfaces
- Single HttpClient to `https://openrouter.ai/api/v1/chat/completions`
- Auth header: `Authorization: Bearer {OpenRouter:ApiKey}`
- Model routing map per spec:
  ```
  LeadQueryGeneration    → groq/llama-3.3-70b-versatile
  EntityExtraction       → groq/llama-3.1-8b-instant
  LeadScoring            → groq/llama-3.1-8b-instant
  SocialPostGeneration   → google/gemini-2.0-flash-001
  EmailOutreachCopy      → google/gemini-2.5-flash
  ContentPillarSuggestion→ groq/llama-3.3-70b-versatile
  ```
- OpenAI-compatible request format (system message + user message)
- Prompt caching: brand context first (large, stable), variable content second
- Returns `AiCompletionResponse` with content, model used, token counts
- Proper error handling: log failures, throw typed exceptions
- No mock fallbacks — if the API key is missing, throw `InvalidOperationException`

##### [DELETE] [AiGenerationService.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Google/AiGenerationService.cs)
- Remove the wrong direct-Gemini implementation entirely

##### [MODIFY] [Api/Program.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Program.cs)
- Register `AiRoutingService` as `IAiRoutingService`
- Remove old `AiGenerationService` HttpClient registration

##### [MODIFY] [Workers/Program.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Workers/Program.cs)
- Register `AiRoutingService` as `IAiRoutingService`

---

### Phase 3: ContentGenerationService — Uses AiRoutingService + Prompt Templates

##### [NEW] ContentGenerationService.cs
**Location:** `Markopilot.Infrastructure/AI/ContentGenerationService.cs`
- Implements `IContentGenerationService`
- Depends on `IAiRoutingService` (injected)
- `GeneratePostAsync(brand, contentPillar, platform)`:
  - Reads `packages/ai-prompts/social-post.txt`, fills placeholders with brand context
  - Calls `IAiRoutingService.CompleteAsync()` with `AiTask.SocialPostGeneration`
  - Parses JSON response → `GeneratedPost { Copy, Hashtags }`
- `GenerateOutreachEmailAsync(brand, lead)`:
  - Reads `packages/ai-prompts/outreach-email.txt`, fills placeholders
  - Calls with `AiTask.EmailOutreachCopy`
  - Parses → `GeneratedEmail { Subject, BodyText, BodyHtml }`
- `GenerateFollowUpEmailAsync(brand, lead, originalSubject)`:
  - Reads `packages/ai-prompts/follow-up-email.txt`
  - Calls with `AiTask.EmailOutreachCopy`
- `SuggestContentPillarsAsync(brand)`:
  - Reads `packages/ai-prompts/content-pillars.txt`
  - Calls with `AiTask.ContentPillarSuggestion`
  - Parses → `List<string>`
- `GenerateSearchQueriesAsync(brand)`:
  - Reads `packages/ai-prompts/lead-queries.txt`
  - Calls with `AiTask.LeadQueryGeneration`
  - Parses → `List<string>` (5 queries)

##### [MODIFY] [Api/Program.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Program.cs)
- Register `ContentGenerationService` as `IContentGenerationService`

##### [MODIFY] [Workers/Program.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Workers/Program.cs)
- Register `ContentGenerationService` as `IContentGenerationService`

---

### Phase 4: Real Search Clients — Replace MockLeadDiscoveryClient

##### [NEW] SerperClient.cs
**Location:** `Markopilot.Infrastructure/Search/SerperClient.cs`
- HttpClient POST to `https://google.serper.dev/search`
- Auth: `X-API-KEY: {Serper:ApiKey}`
- Request: `{ "q": "query", "num": 10 }`
- Parse response → `List<SearchResult>` (title, url, snippet)
- Rate limit aware: calls `IGlobalRateLimiter.TryAcquireAsync(SerperDev, 300)` before every request

##### [NEW] ExaClient.cs
**Location:** `Markopilot.Infrastructure/Search/ExaClient.cs`
- HttpClient POST to `https://api.exa.ai/search`
- Auth: `Authorization: Bearer {Exa:ApiKey}`
- Request: `{ "query": "query", "numResults": 10, "type": "neural" }`
- Parse response → `List<SearchResult>`
- Rate limit aware: calls `IGlobalRateLimiter.TryAcquireAsync(ExaAi, 100)`

##### [DELETE] [MockLeadDiscoveryClient.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Search/MockLeadDiscoveryClient.cs)

##### [MODIFY] [ILeadDiscoveryClient.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Interfaces/ILeadDiscoveryClient.cs)
- Rename interface to `ISearchClient` and change method signature to `SearchAsync(string query, int limit)` → `List<SearchResult>` — this aligns with the `ILeadDiscoveryService` interface pattern in `IServices.cs` where the search is a lower-level component
- OR keep `ILeadDiscoveryClient` but change it to match what SerperClient/ExaClient actually do

> [!IMPORTANT]
> **Decision needed:** The current `ILeadDiscoveryClient` takes a `Brand` and returns `List<Lead>` — that's too high-level for search clients (they return raw search results, not enriched leads). The spec separates search (Serper/Exa) from enrichment (scraping + AI extraction). I propose replacing the `ILeadDiscoveryClient` interface with per-client interfaces or a shared `ISearchClient` interface, and having the higher-level `LeadDiscoveryService` (Step 19) orchestrate the full pipeline. This change would not break anything since `LeadExtractionWorker` is being rewritten anyway.

##### [MODIFY] [Api/Program.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Program.cs)
- Remove `MockLeadDiscoveryClient` registration
- Register `SerperClient` and `ExaClient` 

---

### Phase 5: Real OAuth Token Exchange

##### [MODIFY] [OAuthService.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Social/OAuthService.cs)
Replace `ExchangeCodeForTokenAsync()` with real implementation:

- **Twitter/X:** POST to `https://api.twitter.com/2/oauth2/token` with `client_id`, `code`, `grant_type=authorization_code`, `redirect_uri`, `code_verifier`. Returns `access_token` + `refresh_token`.
- **LinkedIn:** POST to `https://www.linkedin.com/oauth/v2/accessToken` with `client_id`, `client_secret`, `code`, `grant_type=authorization_code`, `redirect_uri`. Returns `access_token` + `expires_in`.
- **Instagram:** POST to `https://api.instagram.com/oauth/access_token` with `client_id`, `client_secret`, `code`, `grant_type=authorization_code`, `redirect_uri`. Then exchange short-lived for long-lived token via `https://graph.instagram.com/access_token`.
- **TikTok:** POST to `https://open.tiktokapis.com/v2/oauth/token/` with `client_key`, `client_secret`, `code`, `grant_type=authorization_code`, `redirect_uri`. Returns `access_token` + `refresh_token`.

Return a structured `OAuthTokenResult` (not just a string) with: `accessToken`, `refreshToken`, `expiresAt`, `username/profileName`.

Also fix `GetAuthorizationUrl()`:
- Twitter: Implement proper PKCE (generate code_verifier + code_challenge, store verifier in session/Redis)
- Instagram: Fix scopes to `instagram_basic,instagram_content_publish` per spec

##### [MODIFY] [SocialController.cs OAuthCallback](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/SocialController.cs)
- After getting real token from `ExchangeCodeForTokenAsync()`:
  - Encrypt with `ITokenEncryptionService`
  - Persist via `_repo.UpdateBrandSocialTokenAsync(brandId, platform, encryptedToken, encryptedRefresh, expiresAt, username, connected: true)`
  - Log activity: `_repo.InsertActivityAsync(brandId, "social_connected", ...)`

##### [MODIFY] [SocialController.cs Disconnect](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/SocialController.cs)
- Call `_repo.DisconnectBrandPlatformAsync(brandId, platform)`
- Log activity

---

### Phase 6: Wire Up Remaining Stubs

#### 6A: QuotaService → Real DB Integration

##### [MODIFY] [QuotaService.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Services/QuotaService.cs)
- **Problem:** QuotaService is in Core but needs SupabaseRepository (Infrastructure). 
- **Solution:** Add an `IUserRepository` interface to Core that QuotaService depends on. SupabaseRepository implements it. OR inject SupabaseRepository directly and move QuotaService to Infrastructure.
- `GetQuotaStatusAsync()`: Check Redis cache → if miss, query DB via repo → cache for 5 min → return real data
- `IncrementPostsUsedAsync()`: UPDATE users SET quota_posts_used = quota_posts_used + @count → invalidate cache
- `IncrementLeadsUsedAsync()`: UPDATE users SET quota_leads_used = quota_leads_used + @count → invalidate cache
- `ResetQuotaAsync()`: UPDATE users SET quota_leads_used = 0, quota_posts_used = 0 → invalidate cache

#### 6B: WebhooksController → Real Subscription Processing

##### [MODIFY] [WebhooksController.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/WebhooksController.cs)
- Replace stubbed logic with actual calls to `_repo.UpdateUserSubscriptionAsync()`
- Handle each event type per spec Section 6.1:
  - `subscription_created` / `subscription_updated`: update plan, quotas
  - `subscription_payment_success`: reset quota counters, extend period
  - `subscription_payment_failed`: create notification for user
  - `subscription_cancelled` / `subscription_expired`: pause all brand automations

#### 6C: Implement TODO Controller Endpoints

##### [MODIFY] [SubscriptionsController.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/SubscriptionsController.cs)
- `GetSubscriptionStatus()`: Query repo for user → return plan, quotas, period end
- `GetBillingPortalUrl()`: Call LemonSqueezy API to generate Customer Portal URL

##### [MODIFY] [LeadsController.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/LeadsController.cs)
- `GetLeads()`: Call `_repo.GetLeadsByBrandAsync()` with filters
- `GetLead()`: Call `_repo.GetLeadByIdAsync()`
- `QueueForOutreach()`: Create outreach_email record with status=queued
- `Disqualify()`: Call `_repo.UpdateLeadStatusAsync(leadId, "disqualified")`
- `DeleteLead()`: Call `_repo.DeleteLeadAndOutreachAsync()` (GDPR)

##### [MODIFY] [SocialController.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/SocialController.cs)
- `GetPosts()`: Call `_repo.GetPostsByBrandAsync()` with pagination
- `CreatePost()`: Accept post body → insert via `_repo.CreatePostAsync()` with status=queued
- `CancelPost()`: Call `_repo.CancelPostAsync()`

##### [MODIFY] [OutreachController.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/OutreachController.cs)
- Inject `SupabaseRepository`
- `GetQueue()`: Query outreach_emails where status=queued for brand
- `GetSent()`: Query outreach_emails where status=sent for brand
- `GetEmail()`: Single email by ID
- `CancelEmail()`: Update status to cancelled

#### 6D: Add the missing LemonSqueezy billing portal method

##### [MODIFY] [LemonSqueezyClient.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/LemonSqueezy/LemonSqueezyClient.cs)
- Add `GetCustomerPortalUrlAsync(string customerId)` — POST to LemonSqueezy customer portal API

---

## Open Questions

> [!IMPORTANT]
> **ILeadDiscoveryClient interface redesign:** The current interface returns `List<Lead>` from a `Brand` — that's the full pipeline in one call. The spec clearly separates search (Serper/Exa return URLs) from scraping and enrichment (AI extraction). Should I:
> - **Option A:** Replace `ILeadDiscoveryClient` with a simpler `ISearchClient { SearchAsync(query) → List<SearchResult> }` and build the full pipeline in `LeadDiscoveryService` during Step 19?
> - **Option B:** Keep `ILeadDiscoveryClient` as-is and build a composite implementation that calls Serper/Exa internally?
> 
> I recommend **Option A** as it matches the spec's separation of concerns.

> [!IMPORTANT]
> **QuotaService location:** QuotaService needs DB access but lives in Core (which shouldn't reference Infrastructure). Should I:
> - **Option A:** Define a small `IUserRepository` interface in Core, implement in Infrastructure, inject into QuotaService
> - **Option B:** Move QuotaService to Infrastructure
> 
> I recommend **Option A** to maintain clean layering.

---

## Verification Plan

### After Each Phase
```bash
cd apps/api && dotnet build
```
Must produce **0 errors** before moving to the next phase.

### After All Phases
```bash
cd apps/api && dotnet build
```
Must produce 0 errors, 0 warnings related to our code (NuGet warnings are acceptable).

### Functional Verification
- All controller endpoints return proper responses (not empty arrays or bare `Ok()`)
- AiRoutingService makes real HTTP calls to OpenRouter (verified by log output with configured API key)
- QuotaService reads from and writes to Redis + DB
- OAuth URLs are correctly formed per platform specs
