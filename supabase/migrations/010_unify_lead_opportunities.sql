-- Make opportunities the shared coordination layer for market signals and leads.
ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_lead_id
    ON opportunities (lead_id)
    WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_opportunity_id
    ON leads (opportunity_id)
    WHERE opportunity_id IS NOT NULL;
