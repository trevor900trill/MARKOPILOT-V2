// Shared TypeScript types used across the frontend
// These mirror the backend models and API contracts

export interface User {
  id: string;
  googleId: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  onboardingCompleted: boolean;
  subscriptionId: string | null;
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  planName: 'starter' | 'growth' | 'scale';
  currentPeriodEnd: string | null;
  quotaLeadsPerMonth: number;
  quotaPostsPerMonth: number;
  quotaBrandsAllowed: number;
  quotaLeadsUsed: number;
  quotaPostsUsed: number;
  quotaResetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  industry: string;
  industryCustom: string | null;
  targetAudienceDescription: string | null;
  targetJobTitles: string[];
  targetPainPoints: string[];
  targetGeographies: string[];
  brandVoiceFormality: 'casual' | 'professional' | 'executive';
  brandVoiceHumour: 'none' | 'subtle' | 'playful';
  brandVoiceAssertiveness: 'soft' | 'balanced' | 'bold';
  brandVoiceEmpathy: 'low' | 'medium' | 'high';
  contentPillars: string[];
  automationPostsEnabled: boolean;
  automationPostsPerWeek: number;
  automationPostingDays: string[];
  automationPostingTimeUtc: string;
  automationLeadsEnabled: boolean;
  automationLeadsPerDay: number;
  automationOutreachEnabled: boolean;
  automationOutreachDelayHours: number;
  automationOutreachDailyLimit: number;
  businessAddress: string | null;
  twitterConnected: boolean;
  twitterUsername: string | null;
  linkedinConnected: boolean;
  linkedinProfileName: string | null;
  instagramConnected: boolean;
  instagramUsername: string | null;
  tiktokConnected: boolean;
  tiktokUsername: string | null;
  gmailConnected: boolean;
  gmailEmail: string | null;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  brandId: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'tiktok';
  contentPillar: string | null;
  generatedCopy: string;
  hashtags: string[];
  mediaUrl: string | null;
  scheduledFor: string;
  status: 'queued' | 'published' | 'failed' | 'cancelled';
  publishedAt: string | null;
  platformPostId: string | null;
  engagementLikes: number;
  engagementComments: number;
  engagementReposts: number;
  engagementImpressions: number;
  engagementFetchedAt: string | null;
  errorMessage: string | null;
  generatedAt: string;
}

export interface Lead {
  id: string;
  brandId: string;
  discoveredVia: string | null;
  sourceUrl: string | null;
  name: string | null;
  jobTitle: string | null;
  company: string | null;
  email: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  location: string | null;
  aiSummary: string | null;
  leadScore: number;
  status: 'new' | 'contacted' | 'replied' | 'converted' | 'disqualified';
  discoveredAt: string;
  updatedAt: string;
}

export interface OutreachEmail {
  id: string;
  brandId: string;
  leadId: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  status: 'queued' | 'sent' | 'bounced' | 'replied' | 'failed';
  gmailMessageId: string | null;
  sentAt: string | null;
  followUpScheduled: boolean;
  followUpSent: boolean;
  followUpSentAt: string | null;
  errorMessage: string | null;
  generatedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  brandId: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'quota_warning' | 'token_error' | 'post_published' | 'lead_milestone' | 'subscription_event';
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Plan configuration
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 19,
    brands: 1,
    postsPerMonth: 30,
    leadsPerMonth: 100,
  },
  growth: {
    name: 'Growth',
    price: 49,
    brands: 3,
    postsPerMonth: 120,
    leadsPerMonth: 500,
    popular: true,
  },
  scale: {
    name: 'Scale',
    price: 149,
    brands: 10,
    postsPerMonth: Infinity,
    leadsPerMonth: 2000,
  },
} as const;

export const INDUSTRIES = [
  'Software & SaaS',
  'Ecommerce',
  'Professional Services',
  'Creative Agency',
  'Consulting',
  'Real Estate',
  'Healthcare',
  'Education',
  'Food & Beverage',
  'Non-Profit',
  'Personal Brand',
  'Other',
] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type PlanName = keyof typeof PLANS;
