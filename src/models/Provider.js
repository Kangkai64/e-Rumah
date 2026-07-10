// Provider Model
// Handles reverse mortgage provider account data.
// Provider accounts are provisioned manually (auth.users + providers row
// created directly in Supabase, exactly like admins/customer_supports) -
// this model only covers self-profile access and admin activate/deactivate.
// NO imports from other models allowed!

import { supabase } from "../config/supabase";

const Provider = {
  async getProfile(providerId) {
    try {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("id", providerId)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching provider profile:", error);
      return { success: false, error: error.message };
    }
  },

  async updateProfile(providerId, patch = {}) {
    try {
      const { data, error } = await supabase
        .from("providers")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", providerId)
        .select("*")
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating provider profile:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Admin: list all providers for a "Manage Providers" panel.
   */
  async getAllProviders() {
    try {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .order("company_name", { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error fetching providers:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Admin: enable/disable a provider's bidding access.
   */
  async setActive(providerId, isActive) {
    try {
      const { data, error } = await supabase
        .from("providers")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", providerId)
        .select("*")
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating provider status:", error);
      return { success: false, error: error.message };
    }
  },
};

export default Provider;
