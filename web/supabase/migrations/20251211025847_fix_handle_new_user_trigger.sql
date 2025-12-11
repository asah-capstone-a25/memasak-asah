-- Fix handle_new_user trigger to use SECURITY DEFINER
-- 
-- Problem: 
--   INSERT policy "Admins can insert users" creates circular dependency during signup.
--   New user cannot be inserted because they don't exist in users table yet to check admin role.
--
-- Solution:
--   Use SECURITY DEFINER on trigger function to bypass RLS during signup.
--   This allows:
--   1. Signup via form → Trigger bypasses RLS → INSERT succeeds
--   2. Admin manual create via API → Still uses "Admins can insert users" policy
--   3. Admin update role → Still uses "Admins can update any user" policy

-- Recreate trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypass RLS when called from trigger
SET search_path = public  -- Security best practice with SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, username, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if user already exists
  
  RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated users (for the trigger)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
