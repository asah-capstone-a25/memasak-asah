-- Rollback: Restore original state before fix migrations
-- This reverts changes from:
-- - 20251211025847_fix_handle_new_user_trigger.sql
-- - 20251211030531_fix_users_insert_policy.sql

-- Drop the policy created in fix migration
DROP POLICY IF EXISTS "Allow user creation" ON public.users;

-- Restore original INSERT policy from 20251207105559
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
        OR 
        auth.uid() = id
    );

-- Restore original trigger function (without explicit SECURITY DEFINER in signature)
-- Note: Original already had SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
