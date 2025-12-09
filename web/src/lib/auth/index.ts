import { createClient } from "@/lib/supabase/server";
import type { User, UserRole } from "@/types";

/**
 * Sign up a new user with email and password.
 * 
 * @param email - User email
 * @param password - User password
 * @param metadata - Additional user metadata (username, name, role)
 * @returns The auth user or error
 */
export async function signUp(
  email: string,
  password: string,
  metadata: {
    username: string;
    name: string;
    role?: UserRole;
  }
) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: metadata.username,
        name: metadata.name,
        role: metadata.role || "user",
      },
    },
  });

  if (error) {
    console.error("Sign up error:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in with email and password.
 * 
 * @param email - User email
 * @param password - User password
 * @returns The auth session or error
 */
export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out error:", error);
    throw new Error(error.message);
  }
}

/**
 * Get the current authenticated user from Supabase Auth.
 * 
 * @returns Auth user or null
 */
export async function getAuthUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Get the current session.
 * 
 * @returns Session or null
 */
export async function getSession() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

/**
 * Check if user is authenticated.
 * 
 * @returns true if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

/**
 * Check if current user has admin role.
 * 
 * @returns true if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return false;
  }

  // Check in users table for role
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  return user?.role === "admin";
}

/**
 * Get current user with profile data.
 * 
 * @returns User profile or null
 */
export async function getCurrentUserWithProfile(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (error || !user) {
    return null;
  }

  return user as User;
}

/**
 * Request password reset email.
 * 
 * @param email - User email
 */
export async function requestPasswordReset(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    console.error("Password reset error:", error);
    throw new Error(error.message);
  }
}

/**
 * Update password for authenticated user.
 * 
 * @param newPassword - New password
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Update password error:", error);
    throw new Error(error.message);
  }
}
