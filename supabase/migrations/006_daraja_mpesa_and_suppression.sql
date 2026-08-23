-- ────────────────────────────────────────────
-- 006: M-PESA DARAJA BILLING & SUPPRESSION ENHANCEMENTS
-- ────────────────────────────────────────────

-- 1. M-PESA TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    checkout_request_id VARCHAR(100) UNIQUE,
    merchant_request_id VARCHAR(100),
    mpesa_receipt_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, cancelled
    result_code INT,
    result_desc TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mpesa_user_id ON mpesa_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_req ON mpesa_transactions(checkout_request_id);

-- 2. COUNTRY WAITLIST (FOR NON-MPESA REGIONS)
CREATE TABLE IF NOT EXISTS country_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    country_code VARCHAR(10),
    country_name VARCHAR(100),
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_country_waitlist_email ON country_waitlist(email);

-- 3. ENSURE TRIAL_ENDS_AT ON USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
