-- ────────────────────────────────────────────
-- 008: MANUAL M-PESA PAYMENTS & ADMIN SUBSCRIPTION ENHANCEMENTS
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manual_payment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    transaction_code VARCHAR(100),
    mpesa_message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_manual_payments_user_id ON manual_payment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_created_at ON manual_payment_submissions(created_at DESC);
