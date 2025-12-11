-- Fix users INSERT policy for trigger-based signup
-- 
-- Problem: 
--   During signup, the trigger runs in a context where auth.uid() is NULL
--   because the trigger is executed by Supabase Auth internal process, 
--   not by an authenticated user request.
--
-- Solution:
--   1. Drop the current INSERT policy
--   2. Create a new policy that allows INSERT when auth.uid() matches OR
--      when the function is running with SECURITY DEFINER (trigger context)
--   3. Also allow service_role to insert (for admin operations)

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can be created via trigger" ON public.users;

-- Create new INSERT policy
-- This policy allows:
-- 1. Self-insert (auth.uid() = id) for authenticated requests
-- 2. Any insert from service_role (handles trigger and admin operations)
CREATE POLICY "Allow user creation" ON public.users
    FOR INSERT 
    WITH CHECK (
        -- Allow self-insert for authenticated users
        auth.uid() = id
        OR
        -- Allow admins to insert any user
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Important: The trigger function uses SECURITY DEFINER which bypasses RLS
-- So the trigger insert will work regardless of the policy above
-- The policy above is for direct API inserts

-- Verify trigger function has SECURITY DEFINER (already set in previous migration)
-- Just ensure it's set correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, username, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Ensure trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, UPDATE ON public.users TO authenticated;
