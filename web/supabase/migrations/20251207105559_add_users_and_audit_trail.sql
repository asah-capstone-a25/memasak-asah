-- Migration: Add users table and created_by audit trail to campaign_runs
-- Description: User management with Supabase Auth integration and audit trail

-- =============================================================================
-- TABLE: users
-- Application-level user profile linked to Supabase Auth
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User profile
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for username lookup
CREATE INDEX idx_users_username ON users(username);

-- Index for role filtering
CREATE INDEX idx_users_role ON users(role);

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- ALTER: campaign_runs - Add created_by for audit trail
-- =============================================================================
ALTER TABLE campaign_runs 
    ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for filtering campaigns by creator
CREATE INDEX idx_campaign_runs_created_by ON campaign_runs(created_by);


-- =============================================================================
-- ROW LEVEL SECURITY (RLS) for users table
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read all user profiles (for display purposes)
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Only admins can insert new users (or self during signup)
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
        OR 
        auth.uid() = id
    );

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- =============================================================================
-- UPDATE RLS for campaign_runs - Add creator-based policies
-- =============================================================================
DROP POLICY IF EXISTS "Allow all operations on campaign_runs" ON campaign_runs;

CREATE POLICY "Anyone can view campaigns" ON campaign_runs
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create campaigns" ON campaign_runs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own campaigns, admins can update any" ON campaign_runs
    FOR UPDATE USING (
        created_by = auth.uid() 
        OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can delete own campaigns, admins can delete any" ON campaign_runs
    FOR DELETE USING (
        created_by = auth.uid() 
        OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );


-- =============================================================================
-- UPDATE RLS for leads
-- =============================================================================
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;

CREATE POLICY "Anyone can view leads" ON leads
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert leads" ON leads
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update leads from own campaigns" ON leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM campaign_runs 
            WHERE campaign_runs.id = leads.campaign_run_id 
            AND (campaign_runs.created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Users can delete leads from own campaigns" ON leads
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM campaign_runs 
            WHERE campaign_runs.id = leads.campaign_run_id 
            AND (campaign_runs.created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
        )
    );


-- =============================================================================
-- FUNCTION: Handle new user signup
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE users IS 'Application user profiles linked to Supabase Auth';
COMMENT ON COLUMN users.id IS 'References auth.users(id) - Supabase Auth UUID';
COMMENT ON COLUMN users.role IS 'User role: admin or user';
COMMENT ON COLUMN campaign_runs.created_by IS 'User who created this campaign (audit trail)';
