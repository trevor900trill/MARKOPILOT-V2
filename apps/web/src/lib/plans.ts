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
  { id: "starter", name: "Starter", price: "$29", posts: "45 Posts", leads: "150 Leads", brands: "1 Brand" },
  { id: "growth",  name: "Growth",  price: "$79", posts: "180 Posts", leads: "750 Leads", brands: "3 Brands", featured: true },
  { id: "scale",   name: "Scale",   price: "$199", posts: "600 Posts", leads: "2,500 Leads", brands: "10 Brands" },
];

export const DEFAULT_PLAN = "starter";

export function getPlanById(id: string): PlanDefinition {
  return PLANS.find(p => p.id === id.toLowerCase()) ?? PLANS[0];
}
