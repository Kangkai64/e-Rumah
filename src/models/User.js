import { supabase } from "../config/supabase";
import { corsProxyUpdate } from "../services/corsProxyService";
import LoanDisbursement from "./LoanDisbursement";

const STRATA_PROPERTY_TYPES = new Set([
  "Condominium/Apartment",
  "Flat",
  "Low-Cost Flat",
]);

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getPropertyEstimatorUrl = () => {
  const baseUrl = import.meta.env.VITE_PROPERTY_ESTIMATOR_API_URL;
  if (!baseUrl) {
    throw new Error("Property estimator service is not configured.");
  }

  return `${baseUrl.replace(/\/$/, "")}/estimate`;
};

const normalizeSchemeName = (schemeName) =>
  String(schemeName || "")
    .replace(/\bTAMAN\b/gi, "TMN")
    .replace(/\s+/g, " ")
    .trim();

const buildPropertyEstimatePayload = (formData = {}, property = {}) => {
  const propertyType = property.property_type || "";
  const schemeName = normalizeSchemeName(
    formData.schemeName || property.scheme_name || "",
  );
  const district = String(formData.district || property.district || "").trim();
  const mukim = String(formData.mukim || property.mukim || "").trim();
  const floorAreaSqm = toNumber(
    formData.buildUpArea || formData.build_up_area || property.build_up_area,
  );
  const rawLandAreaSqm =
    formData.landArea ?? formData.land_area ?? property.land_area;
  const landAreaSqm =
    rawLandAreaSqm === null ||
    rawLandAreaSqm === undefined ||
    rawLandAreaSqm === ""
      ? STRATA_PROPERTY_TYPES.has(propertyType)
        ? 0
        : null
      : toNumber(rawLandAreaSqm);
  const tenure = String(
    formData.tenure || formData.tenureTitle || property.tenure_title || "",
  ).trim();
  const approvedDate = property.approved_at
    ? new Date(property.approved_at)
    : new Date();
  const txnYear = toNumber(formData.purchaseYear || approvedDate.getFullYear());
  const txnMonth = toNumber(
    formData.purchaseMonth || approvedDate.getMonth() + 1,
  );

  return {
    propertyType,
    schemeName,
    district,
    mukim,
    floorAreaSqm,
    landAreaSqm,
    tenure,
    txnYear,
    txnMonth,
  };
};

const buildPropertyEstimateFallback = (property = {}) => ({
  currentEstimatedValue:
    property.expected_market_value || property.indicative_market_value || 0,
  lastChecked: property.valuation_date || property.updated_at || null,
  lowerBoundRm: null,
  upperBoundRm: null,
  modelVersion: null,
  currency: "MYR",
  disclaimer: null,
});

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
            property_type,
            scheme_name,
            district,
            mukim,
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
   * Re-run the property estimator using the approved application data.
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated property value data
   */
  static async reestimatePropertyValue(userId) {
    try {
      const { data: application, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          approved_at,
          properties(
            property_type,
            scheme_name,
            district,
            mukim,
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

      if (error || !application) {
        return {
          success: false,
          error: "No approved application found for property estimation.",
        };
      }

      const { data: applicationData, error: applicationDataError } =
        await supabase
          .from("application_data")
          .select("form_data")
          .eq("application_id", application.id)
          .maybeSingle();

      if (applicationDataError) throw applicationDataError;

      const payload = buildPropertyEstimatePayload(
        applicationData?.form_data || {},
        {
          approved_at: application.approved_at,
          ...application.properties,
        },
      );

      const hasRequiredInputs =
        payload.propertyType &&
        payload.schemeName &&
        payload.district &&
        payload.mukim &&
        payload.floorAreaSqm !== null &&
        payload.floorAreaSqm > 0 &&
        payload.tenure &&
        payload.txnYear &&
        payload.txnMonth &&
        (payload.landAreaSqm !== null ||
          STRATA_PROPERTY_TYPES.has(payload.propertyType));

      if (!hasRequiredInputs) {
        return {
          success: false,
          error:
            "Property estimation data is incomplete. Please complete the approved application details first.",
        };
      }

      const response = await fetch(getPropertyEstimatorUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_type: payload.propertyType,
          scheme_name: payload.schemeName,
          district: payload.district,
          mukim: payload.mukim,
          floor_area_sqm: payload.floorAreaSqm,
          land_area_sqm: payload.landAreaSqm,
          tenure: payload.tenure,
          txn_year: payload.txnYear,
          txn_month: payload.txnMonth,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            result?.error ||
            "Failed to estimate property value.",
        );
      }

      const currentEstimatedValue =
        result?.estimated_price_rm ??
        result?.currentEstimatedValue ??
        result?.estimatedPriceRm ??
        0;

      return {
        success: true,
        data: {
          currentEstimatedValue,
          lastChecked: new Date().toISOString(),
          lowerBoundRm: result?.lower_bound_rm ?? null,
          upperBoundRm: result?.upper_bound_rm ?? null,
          modelVersion: result?.model_version ?? result?.model_used ?? null,
          currency: result?.currency ?? "MYR",
          disclaimer: result?.disclaimer ?? null,
        },
      };
    } catch (error) {
      console.error("Error re-estimating property value:", error);
      return { success: false, error: error.message };
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
