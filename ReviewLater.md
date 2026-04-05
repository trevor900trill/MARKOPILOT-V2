# Markopilot V2 — Progress Audit & Mock/Stub Inventory

**Date:** 2026-04-05  
**Scope:** Full codebase audit against DOCUMENTATION.md Section 22 implementation order  
**Overall Status:** Steps 1–18 structurally complete. Heavy stubbing/mocking throughout — noted for future completion pass.

---

## Section 22 Step-by-Step Progress

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Scaffold repo structure | ✅ Done | All directories match spec Section 3.4–3.6 |
| 2 | Supabase migrations | ✅ Done | [001_initial_schema.sql](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/supabase/migrations/001_initial_schema.sql) exists |
| 3 | Hangfire + Redis setup | ✅ Done | Both [Api/Program.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Program.cs) and [Workers/Program.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Workers/Program.cs) configure Hangfire+Redis. `GlobalRateLimiter` is **real** (Redis sliding window + circuit breaker). |
| 4 | .NET models & interfaces | ✅ Done | All model classes + all interfaces defined in [IServices.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Interfaces/IServices.cs) |
| 5 | Supabase repository | ✅ Done | [SupabaseRepository.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Supabase/SupabaseRepository.cs) — 519 lines, real Npgsql queries for Users, Brands, Posts, Leads, Outreach, Suppression, Activity, Notifications |
| 6 | Token encryption | ✅ Done | [TokenEncryptionService.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Services/TokenEncryptionService.cs) — **real AES-256-CBC**, not mocked |
| 7 | Authentication | ⚠️ Partial | [AuthMiddleware.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Middleware/AuthMiddleware.cs) is real JWT validation. Frontend [auth.ts](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/web/src/lib/auth.ts) exists (NextAuth). |
| 8 | Landing page | ⚠️ Partial | [page.tsx](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/web/src/app/page.tsx) — 185 lines. Missing several sections from spec (FAQ, trust bar, closing CTA completeness). |
| 9 | Legal pages | ⚠️ Minimal | [privacy/page.tsx](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/web/src/app/privacy/page.tsx) (45 lines), [terms/page.tsx](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/web/src/app/terms/page.tsx) (45 lines) — likely placeholder content |
| 10 | Onboarding flow | ⚠️ Minimal | [onboarding/page.tsx](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/web/src/app/onboarding/page.tsx) — **10 lines**, clearly a placeholder |
| 11 | App shell | ⚠️ Partial | [AppSidebar.tsx](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/web/src/components/dashboard/AppSidebar.tsx), [AppTopbar.tsx](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/web/src/components/dashboard/AppTopbar.tsx), [dashboard layout](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/web/src/app/(dashboard)/layout.tsx) exist |
| 12 | Brand management | ⚠️ Partial | [BrandsController.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/BrandsController.cs) has CRUD. No archive endpoint. No brand settings forms on frontend |
| 13 | Subscription & billing | ⚠️ Stubbed | [LemonSqueezyClient.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/LemonSqueezy/LemonSqueezyClient.cs) is real API code. **Controllers are stubbed** (TODO comments). Webhook handler has stubbed update logic |
| 14 | Social platform OAuth | ⚠️ **Heavily Mocked** | See mock inventory below |
| 15 | AI routing service | ⚠️ **Wrong Implementation** | Built as [AiGenerationService.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Google/AiGenerationService.cs) using **direct Gemini API** instead of **OpenRouter** with model routing per spec Section 3.2 |
| 16 | Search service | ❌ **Mocked** | [MockLeadDiscoveryClient.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Search/MockLeadDiscoveryClient.cs) returns fake data. No `SerperClient.cs` or `ExaClient.cs` |
| 17 | Content generation service | ⚠️ **Partially Mocked** | `AiGenerationService` has real Gemini calls but falls back to mock data when API key is missing |
| 18 | Social posting worker | ⚠️ **Heavily Stubbed** | See mock inventory below |

Steps 19–30 have **not been started** yet.

---

## Complete Mock/Stub/Scaffold Inventory

> [!IMPORTANT]
> These are ALL places where functionality is mocked, stubbed, scaffolded, or has TODO comments. Each item needs to be replaced with real implementation in the completion pass.

---

### 🔴 Category 1: Mock Implementations (Fake Data / No Real Logic)

#### 1. MockLeadDiscoveryClient.cs
**File:** [MockLeadDiscoveryClient.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Search/MockLeadDiscoveryClient.cs)  
**What it does:** Returns hardcoded fake leads with random names/titles  
**What it should do:** Implement real `SerperClient.cs` + `ExaClient.cs` with search routing per spec Section 3.3  
**DI Registration:** [Program.cs:75](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Program.cs#L75), registering `MockLeadDiscoveryClient` as `ILeadDiscoveryClient`  
**Severity:** 🔴 Critical — core feature is completely fake

> [!WARNING]
> This mock also uses `FirstName`/`LastName` and `CompanyName` properties that **don't exist** on the actual `Lead.cs` model (which uses `Name` and `Company`). This will cause **compilation errors** when called.

#### 2. OAuthService.ExchangeCodeForTokenAsync()
**File:** [OAuthService.cs:35-42](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Social/OAuthService.cs#L35-L42)  
**What it does:** Returns `"mock_access_token_{platform}_{Guid}"` after a 200ms delay  
**What it should do:** POST to each platform's token endpoint with client_id, client_secret, code, grant_type  
**Severity:** 🔴 Critical — no social platform will actually connect

#### 3. AiGenerationService Mock Fallbacks
**File:** [AiGenerationService.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Infrastructure/Google/AiGenerationService.cs)  
**3a.** Line 31-32: `GenerateSocialPostsAsync` returns `"Mock Post {i} for {brand.Name}"` when API key missing  
**3b.** Line 84: `ScoreLeadAsync` returns hardcoded `85` when API key missing  
**3c.** Line 120: `GenerateOutreachEmailAsync` returns template string when API key missing  
**What it should do:** Use **OpenRouter** (not direct Gemini), with model routing per `AiTask` enum  
**Severity:** 🔴 Critical — completely wrong AI integration architecture

> [!WARNING]
> This class also references `lead.FirstName`, `lead.LastName`, and `lead.CompanyName` which **don't exist** on the `Lead.cs` model. Compilation errors.

#### 4. SocialPublishingWorker.GetEncryptedTokenStubAsync()
**File:** [SocialPublishingWorker.cs:84-89](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Workers/SocialPublishingWorker.cs#L84-L89)  
**What it does:** Returns `"mock_encrypted_blob"` after 10ms delay  
**What it should do:** Query brand's encrypted OAuth token from DB via `SupabaseRepository`  
**Severity:** 🔴 Critical — publishing pipeline will never use real tokens

---

### 🟠 Category 2: Stubbed Logic (Correct Structure, Missing Implementation)

#### 5. SocialPublishingWorker — Commented-Out DB Operations
**File:** [SocialPublishingWorker.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Workers/SocialPublishingWorker.cs)  
- Line 61-62: `// await _repo.UpdatePostStatusAsync(post.Id, "failed");` — commented out
- Line 73-74: `// await _repo.UpdatePostStatusAsync(post.Id, "published");` — commented out  
- Line 74: `// await _repo.InsertActivityAsync(...)` — commented out
- Line 79: `// await _repo.UpdatePostStatusAsync(post.Id, "failed");` — commented out
**Impact:** Posts publish but status is never updated in DB; no activity logging

#### 6. LeadExtractionWorker — Method Name Mismatch
**File:** [LeadExtractionWorker.cs:72](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Workers/LeadExtractionWorker.cs#L72)  
**What it calls:** `_repo.InsertLeadsAsync(qualifiedLeads)`  
**What repo exposes:** `BulkInsertLeadsAsync(List<Lead>)`  
**Impact:** 🔴 **Compilation error** — method doesn't exist

#### 7. QuotaService — Multiple TODO Stubs
**File:** [QuotaService.cs](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Core/Services/QuotaService.cs)  
- Line 34: `GetQuotaStatusAsync()` — returns hardcoded `starter` defaults, no Redis cache, no DB query
- Line 64: `IncrementPostsUsedAsync()` — only invalidates cache, doesn't update DB  
- Line 70: `IncrementLeadsUsedAsync()` — only invalidates cache, doesn't update DB  
- Line 76: `ResetQuotaAsync()` — only invalidates cache, doesn't reset DB

#### 8. WebhooksController — Stubbed Subscription Update
**File:** [WebhooksController.cs:64-69](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/WebhooksController.cs#L64-L69)  
**What it does:** Logs the event but doesn't actually call `_repo.UpdateUserSubscription()`  
**What it should do:** Call `UpdateUserSubscriptionAsync()`, reset quotas, handle all event types per spec Section 6.1

---

### 🟡 Category 3: TODO Controllers (Endpoint Exists, No Implementation)

| Controller | Method | Line | TODO |
|-----------|--------|------|------|
| [SubscriptionsController](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/SubscriptionsController.cs) | `GetSubscriptionStatus()` | 36 | Return user's subscription & quota |
| SubscriptionsController | `GetBillingPortalUrl()` | 43 | Generate LemonSqueezy portal URL |
| [LeadsController](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/LeadsController.cs) | `GetLeads()` | 28 | Implement with filters |
| LeadsController | `GetLead()` | 35 | Get single lead details |
| LeadsController | `QueueForOutreach()` | 42 | Queue lead for email |
| LeadsController | `Disqualify()` | 49 | Mark lead as disqualified |
| LeadsController | `DeleteLead()` | 56 | GDPR hard delete |
| [SocialController](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/SocialController.cs) | `GetPosts()` | 32 | Implement with repo |
| SocialController | `CreatePost()` | 39 | Manual post creation |
| SocialController | `CancelPost()` | 46 | Cancel queued post |
| SocialController | `OAuthCallback()` | 79 | Persist encrypted token to DB |
| SocialController | `Disconnect()` | 96 | Clear tokens, set connected=false |
| [OutreachController](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/OutreachController.cs) | All methods | — | Returns empty arrays / no-ops |

---

### 🟣 Category 4: Sprint 2 Scaffolds (Intentional — Do Not Build Yet)

| Item | File | Notes |
|------|------|-------|
| Flutterwave webhook handler | [WebhooksController.cs:76-91](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/apps/api/Markopilot.Api/Controllers/WebhooksController.cs#L76-L91) | ✅ Correct — spec says scaffold only |
| `FlutterwaveClient.cs` | **Missing** | Spec says to create with `CreateSubaccount()` method, not called yet |
| Sprint 2 DB tables | [001_initial_schema.sql](file:///Users/trevormugo/Desktop/PROJECTS/MARKOPILOT/MARKOPILOTFULL/MARKOPILOT-V2/supabase/migrations/001_initial_schema.sql) | Should exist per spec Section 4.9 |

---

### ⬛ Category 5: Missing Files (Specified in Spec but Not Created)

| Expected File | Spec Section | Status |
|--------------|-------------|--------|
| `SerperClient.cs` | Section 3.3, 8.1 | ❌ Not created |
| `ExaClient.cs` | Section 3.3, 8.1 | ❌ Not created |
| `AiRoutingService.cs` (OpenRouter) | Section 3.2 | ❌ Not created (replaced by wrong `AiGenerationService`) |
| `ContentGenerationService.cs` | Section 3.6 | ❌ Not created |
| `SocialPostingService.cs` | Section 3.6 | ❌ Not created |
| `LeadDiscoveryService.cs` | Section 3.6 | ❌ Not created |
| `LeadEnrichmentService.cs` | Section 3.6 | ❌ Not created |
| `EmailOutreachService.cs` | Section 3.6 | ❌ Not created |
| `SubscriptionService.cs` | Section 3.6 | ❌ Not created |
| `GmailService.cs` | Section 3.6 | ❌ Not created |
| `LinkedInClient.cs` | Section 3.6 | ❌ Not created |
| `InstagramClient.cs` | Section 3.6 | ❌ Not created |
| `TikTokClient.cs` | Section 3.6 | ❌ Not created |
| `FlutterwaveClient.cs` | Section 3.6 | ❌ Not created |
| `BrandService.cs` | Section 3.6 | ❌ Not created |
| `OutreachWorker.cs` | Section 3.6 | ❌ Not created |
| `ErrorHandlingMiddleware.cs` | Section 3.6 | ✅ Exists |
| `infra/docker/*` | Section 21 | ❌ Not created |

---

### ⚠️ Category 6: Compilation-Breaking Issues Found

> [!CAUTION]
> These will prevent a clean `dotnet build` and must be fixed before anything else in the next pass.

1. **`Lead.cs` model mismatch** — The model uses `Name`, `Company`, `Email` but `MockLeadDiscoveryClient.cs`, `AiGenerationService.cs`, and `LeadExtractionWorker.cs` reference `FirstName`, `LastName`, `CompanyName` which **do not exist**.

2. **`InsertLeadsAsync` vs `BulkInsertLeadsAsync`** — `LeadExtractionWorker.cs:72` calls `_repo.InsertLeadsAsync()` but the repository method is named `BulkInsertLeadsAsync()`.

3. **Missing interface implementations** — 10+ interfaces defined in `IServices.cs` have **no implementing classes**:
   - `IBrandService`, `IAiRoutingService`, `IContentGenerationService`, `ISocialPostingService`, `ILeadDiscoveryService`, `ILeadEnrichmentService`, `IEmailOutreachService`, `ISubscriptionService`, `INotificationService`, `IActivityLogService`, `ISuppressionService`

---

## What's Real vs. What's Fake — Summary

### ✅ Real, Working Implementations
- `TokenEncryptionService.cs` — AES-256-CBC, fully functional
- `GlobalRateLimiter.cs` — Redis sliding window + circuit breaker
- `SupabaseRepository.cs` — Real Npgsql queries, 519 lines
- `AuthMiddleware.cs` — Real JWT validation
- `TwitterPublisher.cs` — Real Twitter v2 API integration
- `LemonSqueezyClient.cs` — Real LemonSqueezy API checkout
- `WebhooksController.cs` — Real HMAC verification
- `BrandsController.cs` — Real CRUD (uses repo directly)
- Hangfire configuration — Both API and Workers properly configured
- AI prompt templates — All 7 prompt files in `packages/ai-prompts/`

### ❌ Fake / Mocked / Stubbed
- Lead discovery pipeline (100% mock)
- OAuth token exchange (returns fake tokens)
- AI service (wrong provider, mock fallbacks)
- Social publishing token retrieval (hardcoded mock)
- All post-publish DB updates (commented out)
- Quota enforcement (hardcoded defaults, no DB integration)
- Subscription webhook processing (logs only, no DB update)
- All Lead/Social/Outreach/Subscription controller endpoints (TODO stubs)

---

## Next Steps for Completion Pass

When you're ready for the completion pass, the priority order should be:

1. **Fix compilation errors** (Lead model mismatch, method name mismatch)
2. **Implement `AiRoutingService.cs`** with OpenRouter (replaces wrong `AiGenerationService`)
3. **Implement `SerperClient.cs` + `ExaClient.cs`** (replaces `MockLeadDiscoveryClient`)
4. **Implement real `OAuthService.ExchangeCodeForTokenAsync()`** per platform
5. **Wire up `QuotaService` to DB** (remove hardcoded defaults)
6. **Uncomment and fix worker DB operations**
7. **Implement all TODO controller endpoints**
8. **Create missing service implementations** for all interfaces
9. **Continue Steps 19–30** (Lead discovery worker, Gmail, Outreach, Notifications, Frontend pages, etc.)
