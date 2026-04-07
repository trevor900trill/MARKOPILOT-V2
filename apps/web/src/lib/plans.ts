/**
 * Single source of truth for all plan definitions on the frontend.
 * Referenced by: OnboardingWizard, Landing Page, Account Page, AppSidebar.
 *
 * IMPORTANT: When changing plans, update ONLY this file on the frontend.
 * The backend equivalent is: apps/api/Markopilot.Core/Models/PlanCatalog.cs
 */

export interface PlanDefinition {
  id: string;
  name: string;
  price: string;
  posts: string;
  leads: string;
  brands: string;
  featured?: boolean;
}

export const PLANS: PlanDefinition[] = [
  { id: "starter", name: "Starter", price: "$19", posts: "30 Posts", leads: "100 Leads", brands: "1 Brand" },
  { id: "growth",  name: "Growth",  price: "$49", posts: "120 Posts", leads: "500 Leads", brands: "3 Brands", featured: true },
  { id: "scale",   name: "Scale",   price: "$149", posts: "Unlimited Posts", leads: "2,000 Leads", brands: "10 Brands" },
];

export const DEFAULT_PLAN = "starter";

export function getPlanById(id: string): PlanDefinition {
  return PLANS.find(p => p.id === id.toLowerCase()) ?? PLANS[0];
}
