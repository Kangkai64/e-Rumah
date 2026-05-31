import { supabase } from "../config/supabase";
import { corsProxyUpdate } from "../services/corsProxyService";
import LoanDisbursement from "./LoanDisbursement";

class User {
  /**
   * Get dashboard data for user including loan overview, disbursements, property value
   * @param {string} userId - User ID from auth
   * @returns {Promise<Object>} Dashboard data
   */
  static async getDashboardData(userId) {
    try {
      const [loanOverview, disbursements, propertyValue, payoutDetails] =
        await Promise.all([
          this.getLoanOverview(userId),
          this.getDisbursements(userId),
          this.getPropertyValue(userId),
          this.getPayoutDetails(userId),
        ]);

      return {
        loanOverview,
        disbursements,
        propertyValue,
        payoutDetails,
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  }

  /**
   * Get loan overview including total eligible amount, disbursed amount, remaining balance, status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Loan overview data
   */
  static async getLoanOverview(userId) {
    try {
      const result = await LoanDisbursement.getUserLoanOverview(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    } catch (error) {
      console.error("Error fetching loan overview:", error);
      throw error;
    }
  }

  /**
   * Get loan disbursement records
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options { limit: number }
   * @returns {Promise<Array>} Disbursement records
   */
  static async getDisbursements(userId, filters = {}) {
    try {
      return await LoanDisbursement.getUserDisbursements(userId, filters);
    } catch (error) {
      console.error("Error fetching disbursements:", error);
      throw error;
    }
  }

  /**
   * Get property value estimation
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Property value data
   */
  static async getPropertyValue(userId) {
    try {
      const { data: application, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          properties (
            indicative_market_value,
            expected_market_value,
            valuation_date,
            updated_at
          )
        `,
        )
        .eq("user_id", userId)
        .eq("status", "approved")
        .single();

      if (error || !application?.properties) {
        return {
          currentEstimatedValue: 0,
          lastChecked: null,
        };
      }

      return {
        currentEstimatedValue:
          application.properties.expected_market_value ||
          application.properties.indicative_market_value ||
          0,
        lastChecked:
          application.properties.valuation_date ||
          application.properties.updated_at,
      };
    } catch (error) {
      console.error("Error fetching property value:", error);
      throw error;
    }
  }

  /**
   * Get payout details including monthly/lump-sum information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Payout details
   */
  static async getPayoutDetails(userId) {
    try {
      const result = await LoanDisbursement.getUserPayoutDetails(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    } catch (error) {
      console.error("Error fetching payout details:", error);
      throw error;
    }
  }

  /**
   * Get user profile information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  static async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  static async updateProfile(userId, profileData) {
    try {
      const result = await corsProxyUpdate("users", userId, {
        ...profileData,
        updated_at: new Date().toISOString(),
      });

      if (!result.success) throw new Error(result.error);
      return result.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
}

export default User;
