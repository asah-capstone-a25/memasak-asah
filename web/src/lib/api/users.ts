import { createClient } from "@/lib/supabase/server";
import type { User, UserSummary, CreateUserPayload, UpdateUserPayload } from "@/types";

/**
 * Get all users (admin only in practice, but RLS allows read for all).
 * 
 * @param limit - Maximum number of users to return
 * @returns Array of users
 */
export async function getUsers(limit = 100): Promise<User[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return (data || []) as User[];
}

/**
 * Get a single user by ID.
 * 
 * @param id - User UUID (same as auth.users.id)
 * @returns User details or null if not found
 */
export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching user:", error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data as User;
}

/**
 * Get a user by username.
 * 
 * @param username - Unique username
 * @returns User details or null if not found
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching user by username:", error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data as User;
}

/**
 * Get the current authenticated user's profile.
 * 
 * @returns Current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  // Get auth user first
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  // Get profile from users table
  return getUserById(authUser.id);
}

/**
 * Create a new user profile.
 * Usually called automatically via database trigger on auth.users insert.
 * 
 * @param payload - User data
 * @returns The created user
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating user:", error);
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data as User;
}

/**
 * Update a user profile.
 * 
 * @param id - User UUID
 * @param updates - Fields to update
 * @returns The updated user
 */
export async function updateUser(
  id: string,
  updates: UpdateUserPayload
): Promise<User> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data as User;
}

/**
 * Delete a user (admin only).
 * Note: This only deletes from users table. Auth user remains.
 * 
 * @param id - User UUID
 */
export async function deleteUser(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    console.error("Error deleting user:", error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Check if a username is available.
 * 
 * @param username - Username to check
 * @returns true if available, false if taken
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Error checking username:", error);
    throw new Error(`Failed to check username: ${error.message}`);
  }

  return data === null;
}

/**
 * Get users by role.
 * 
 * @param role - User role ("admin" or "user")
 * @returns Array of users with the specified role
 */
export async function getUsersByRole(
  role: "admin" | "user"
): Promise<UserSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, name, role")
    .eq("role", role)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching users by role:", error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return (data || []) as UserSummary[];
}

/**
 * Update user role (admin only).
 * 
 * @param id - User UUID
 * @param role - New role
 * @returns The updated user
 */
export async function updateUserRole(
  id: string,
  role: "admin" | "user"
): Promise<User> {
  return updateUser(id, { role });
}
