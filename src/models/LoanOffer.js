// LoanOffer Model
// Handles the reverse-mortgage provider auction: providers submit/withdraw
// competing offers on applications an admin has opened for auction, the
// applicant reviews and accepts one via the accept_loan_offer() RPC.
// NO imports from other models allowed!

import { supabase } from "../config/supabase";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Applications open for bidding - joined only to properties, never to users,
// so no applicant name/IC/contact ever crosses into a provider's session.
const mapAuctioningApplication = (application) => ({
  id: application.id,
  approvedAmount: toNumber(application.approved_amount),
  auctionOpenedAt: application.auction_opened_at,
  propertyType: application.properties?.property_type || "Property",
  address: application.properties?.address || "",
  district: application.properties?.district || "",
  mukim: application.properties?.mukim || "",
  expectedMarketValue: toNumber(
    application.properties?.expected_market_value,
  ),
  indicativeMarketValue: toNumber(
    application.properties?.indicative_market_value,
  ),
});

const mapOffer = (offer) => ({
  id: offer.id,
  applicationId: offer.application_id,
  providerId: offer.provider_id,
  offerAmount: toNumber(offer.offer_amount),
  interestRate:
    offer.interest_rate !== null && offer.interest_rate !== undefined
      ? Number(offer.interest_rate)
      : null,
  loanTermMonths: offer.loan_term_months,
  notes: offer.notes || "",
  status: offer.status,
  submittedAt: offer.submitted_at,
  decidedAt: offer.decided_at,
  providerName: offer.providers?.company_name || null,
});

const LoanOffer = {
  /**
   * Applications currently open for bidding (status = 'auctioning').
   * @returns {Promise<Object>} Anonymized property/financial summary only
   */
  async getAuctioningApplications() {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          approved_amount,
          auction_opened_at,
          properties(property_type, address, district, mukim, expected_market_value, indicative_market_value)
        `,
        )
        .eq("status", "auctioning")
        .order("auction_opened_at", { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: (data || []).map(mapAuctioningApplication),
      };
    } catch (error) {
      console.error("Error fetching applications open for auction:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submit or resubmit an offer. Upserts on (application_id, provider_id) -
   * only the current offer per provider is kept, no bid-history ledger.
   * @param {string} providerId
   * @param {string} applicationId
   * @param {Object} offer - { offerAmount, interestRate, loanTermMonths, notes }
   */
  async submitOffer(
    providerId,
    applicationId,
    { offerAmount, interestRate, loanTermMonths, notes } = {},
  ) {
    try {
      const amount = toNumber(offerAmount);
      if (amount <= 0) {
        return {
          success: false,
          error: "Offer amount must be greater than zero",
        };
      }

      const { data, error } = await supabase
        .from("loan_offers")
        .upsert(
          {
            application_id: applicationId,
            provider_id: providerId,
            offer_amount: amount,
            interest_rate:
              interestRate !== undefined && interestRate !== null && interestRate !== ""
                ? toNumber(interestRate)
                : null,
            loan_term_months: loanTermMonths ? Number(loanTermMonths) : 240,
            notes: notes || null,
            status: "submitted",
            submitted_at: new Date().toISOString(),
            decided_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "application_id,provider_id" },
        )
        .select("*")
        .single();

      if (error) throw error;
      return { success: true, data: mapOffer(data) };
    } catch (error) {
      console.error("Error submitting loan offer:", error);
      return { success: false, error: error.message };
    }
  },

  async withdrawOffer(offerId, providerId) {
    try {
      const { data, error } = await supabase
        .from("loan_offers")
        .update({ status: "withdrawn", updated_at: new Date().toISOString() })
        .eq("id", offerId)
        .eq("provider_id", providerId)
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (!data) return { success: false, error: "Offer not found" };

      return { success: true, data: mapOffer(data) };
    } catch (error) {
      console.error("Error withdrawing loan offer:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * A provider's own offer history across all applications.
   */
  async getProviderOffers(providerId) {
    try {
      const { data, error } = await supabase
        .from("loan_offers")
        .select("*")
        .eq("provider_id", providerId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: (data || []).map(mapOffer) };
    } catch (error) {
      console.error("Error fetching provider offers:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submitted offers for the applicant to compare and accept.
   */
  async getOffersForApplication(applicationId) {
    try {
      const { data, error } = await supabase
        .from("loan_offers")
        .select(
          `
          *,
          providers(company_name)
        `,
        )
        .eq("application_id", applicationId)
        .eq("status", "submitted")
        .order("offer_amount", { ascending: false });

      if (error) throw error;
      return { success: true, data: (data || []).map(mapOffer) };
    } catch (error) {
      console.error("Error fetching offers for application:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Applicant accepts one offer. Delegates to the accept_loan_offer() RPC,
   * which atomically rewrites the application's terms from the winning
   * offer and rejects every other submitted offer - never a raw client
   * UPDATE, since it must touch both applications and loan_offers.
   */
  async acceptOffer(offerId) {
    try {
      const { data, error } = await supabase.rpc("accept_loan_offer", {
        p_offer_id: offerId,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error accepting loan offer:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Subscribe to real-time offer changes (new/withdrawn/decided) on an
   * application, so the applicant sees competing offers without reloading.
   * @param {string} applicationId
   * @param {Function} callback - Invoked (with no args) on any change; the
   *   caller is expected to refetch via getOffersForApplication.
   * @returns {Object} Subscription object with unsubscribe method
   */
  subscribeToApplicationOffers(applicationId, callback) {
    try {
      const subscription = supabase
        .channel(`application_offers:${applicationId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "loan_offers",
            filter: `application_id=eq.${applicationId}`,
          },
          () => callback(),
        )
        .subscribe();

      return subscription;
    } catch (error) {
      console.error("Error subscribing to application offers:", error);
      return null;
    }
  },

  unsubscribeFromApplicationOffers(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  /**
   * Subscribe to real-time changes relevant to a provider's dashboard:
   * applications entering/leaving auction, and this provider's own offers
   * being accepted/rejected by an applicant.
   * @param {string} providerId
   * @param {Function} callback - Invoked (with no args) on any change; the
   *   caller is expected to reload the auctioning list and own offers.
   * @returns {Object} Subscription object with unsubscribe method
   */
  subscribeToProviderDashboard(providerId, callback) {
    try {
      const subscription = supabase
        .channel(`provider_dashboard:${providerId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "applications" },
          () => callback(),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "loan_offers",
            filter: `provider_id=eq.${providerId}`,
          },
          () => callback(),
        )
        .subscribe();

      return subscription;
    } catch (error) {
      console.error("Error subscribing to provider dashboard:", error);
      return null;
    }
  },

  unsubscribeFromProviderDashboard(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  /**
   * Full offer visibility for admin oversight, including provider contact.
   */
  async getOffersForAdmin(applicationId) {
    try {
      const { data, error } = await supabase
        .from("loan_offers")
        .select(
          `
          *,
          providers(company_name, contact_person, email, phone)
        `,
        )
        .eq("application_id", applicationId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: (data || []).map((offer) => ({
          ...mapOffer(offer),
          providerCompanyName: offer.providers?.company_name || "Unknown",
          providerContactPerson: offer.providers?.contact_person || "",
          providerEmail: offer.providers?.email || "",
          providerPhone: offer.providers?.phone || "",
        })),
      };
    } catch (error) {
      console.error("Error fetching offers for admin:", error);
      return { success: false, error: error.message };
    }
  },
};

export default LoanOffer;
