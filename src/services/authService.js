// Authentication Service
// Handles all authentication operations with Supabase Auth

import { supabase } from "../config/supabase";

/**
 * Sign up a new user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {object} metadata - Additional user data (full_name, ic_number, phone)
 * @returns {Promise<{user, error}>}
 */
export const signUp = async (email, password, metadata = {}) => {
  try {
    const normalizedMetadata = {
      ...metadata,
    };

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: normalizedMetadata, // Stores in auth.users.raw_user_meta_data
      },
    });

    if (authError) throw authError;

    // 2. Keep profile data on the auth user itself so the app does not depend
    // on a public.users REST endpoint being available.
    if (authData.user) {
      console.log(
        "✅ Auth user created with profile metadata:",
        normalizedMetadata,
      );
    }

    return { user: authData.user, error: null };
  } catch (error) {
    console.error("❌ Sign up error:", error);
    return { user: null, error };
  }
};

/**
 * Sign in existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{user, session, error}>}
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error("Sign in error:", error);
    return { user: null, session: null, error };
  }
};

/**
 * Sign out current user
 * @returns {Promise<{error}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error };
  }
};

/**
 * Get current session
 * @returns {Promise<{session, error}>}
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error) {
    console.error("Get session error:", error);
    return { session: null, error };
  }
};

/**
 * Get current user
 * @returns {Promise<{user, error}>}
 */
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    // Silently handle missing session - this is normal when not logged in
    if (error.name === "AuthSessionMissingError") {
      return { user: null, error: null };
    }
    console.error("Get user error:", error);
    return { user: null, error };
  }
};

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<{user, error}>}
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error) {
    console.error("Update password error:", error);
    return { user: null, error };
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<{error}>}
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error };
  }
};

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function (event, session) => {}
 * @returns {object} Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
