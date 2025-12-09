-- Migration: Create campaign_runs and leads tables
-- Description: Core tables for storing campaign metadata and lead scoring results

-- =============================================================================
-- TABLE: campaign_runs
-- Stores metadata for each CSV upload/scoring campaign
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaign_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign identification
    name TEXT NOT NULL,
    source_filename TEXT NOT NULL,
    
    -- Row statistics
    total_rows INTEGER NOT NULL,
    processed_rows INTEGER NOT NULL,
    dropped_rows INTEGER NOT NULL DEFAULT 0,
    
    -- Scoring summary
    avg_probability NUMERIC(5,4),  -- 0.0000 to 1.0000
    conversion_high INTEGER DEFAULT 0,
    conversion_medium INTEGER DEFAULT 0,
    conversion_low INTEGER DEFAULT 0,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,  -- For failed campaigns
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing campaigns by date (most recent first)
CREATE INDEX idx_campaign_runs_created_at ON campaign_runs(created_at DESC);


-- =============================================================================
-- TABLE: leads
-- Stores individual lead records with customer features and model scores
-- =============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to campaign
    campaign_run_id UUID NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,  -- Original CSV row index
    
    -- Customer demographic features
    age INTEGER NOT NULL,
    job TEXT NOT NULL,
    marital TEXT NOT NULL,
    education TEXT NOT NULL,
    
    -- Customer financial features
    default_credit TEXT NOT NULL,  -- 'default' is a reserved keyword
    balance INTEGER NOT NULL,
    housing TEXT NOT NULL,
    loan TEXT NOT NULL,
    
    -- Campaign contact features
    contact TEXT NOT NULL,
    day INTEGER NOT NULL,
    month TEXT NOT NULL,
    campaign INTEGER NOT NULL,
    pdays INTEGER NOT NULL,
    previous INTEGER NOT NULL,
    poutcome TEXT NOT NULL,
    
    -- Model prediction results
    probability NUMERIC(5,4) NOT NULL,  -- 0.0000 to 1.0000
    prediction INTEGER NOT NULL CHECK (prediction IN (0, 1)),
    prediction_label TEXT NOT NULL CHECK (prediction_label IN ('yes', 'no')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
    
    -- SHAP explanation (top 5 reason codes)
    reason_codes JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique row per campaign
    UNIQUE (campaign_run_id, row_index)
);

-- Primary index: Get leads for a campaign sorted by probability (priority list)
CREATE INDEX idx_leads_campaign_probability ON leads(campaign_run_id, probability DESC);

-- Index for filtering by risk level within a campaign
CREATE INDEX idx_leads_campaign_risk ON leads(campaign_run_id, risk_level);

-- GIN index for JSONB reason_codes
CREATE INDEX idx_leads_reason_codes ON leads USING GIN (reason_codes);


-- =============================================================================
-- TRIGGER: Auto-update updated_at on campaign_runs
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaign_runs_updated_at
    BEFORE UPDATE ON campaign_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE campaign_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (adjust based on auth requirements later)
CREATE POLICY "Allow all operations on campaign_runs" ON campaign_runs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on leads" ON leads
    FOR ALL USING (true) WITH CHECK (true);


-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE campaign_runs IS 'Stores metadata for each CSV upload/scoring campaign';
COMMENT ON TABLE leads IS 'Stores individual lead records with customer features and model scores';
COMMENT ON COLUMN leads.default_credit IS 'Whether customer has credit in default (yes/no)';
COMMENT ON COLUMN leads.reason_codes IS 'Top 5 SHAP reason codes: [{feature, direction, shap_value}, ...]';
