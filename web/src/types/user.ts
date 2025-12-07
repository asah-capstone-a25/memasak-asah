/**
 * User role types
 */
export type UserRole = "admin" | "user";

/**
 * User - application user profile linked to Supabase Auth
 */
export interface User {
  id: string; // UUID from Supabase Auth
  username: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * User for display (minimal info)
 */
export interface UserSummary {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

/**
 * Payload for creating a new user (during signup)
 */
export interface CreateUserPayload {
  id: string; // Must match auth.users.id
  username: string;
  name: string;
  role?: UserRole;
}

/**
 * Payload for updating user profile
 */
export interface UpdateUserPayload {
  username?: string;
  name?: string;
  role?: UserRole; // Only admin can change this
}

/**
 * Auth session user (from Supabase Auth)
 */
export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    username?: string;
    name?: string;
    role?: UserRole;
  };
}

/**
 * Combined user with auth info
 */
export interface UserWithAuth extends User {
  email: string;
}
