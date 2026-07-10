import { supabase } from "../config/supabase";

const DEFAULT_LOAN_MONTHS = 240;
const DISBURSEMENT_TYPE = "payout";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatIsoDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const addMonths = (dateValue, monthCount) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  date.setMonth(date.getMonth() + monthCount);
  return date.toISOString().slice(0, 10);
};

const resolvePropertyValue = (application) => {
  const property = application?.properties;
  const expectedValue = toNumber(property?.expected_market_value);
  const indicativeValue = toNumber(property?.indicative_market_value);
  return expectedValue || indicativeValue || 0;
};

const resolveApprovedAmount = (application) => {
  const approvedAmount = toNumber(application?.approved_amount);
  if (approvedAmount > 0) return approvedAmount;

  return resolvePropertyValue(application) * 0.7;
};

// Applications that went through the provider auction carry the accepted
// offer's loan_term_months; legacy/no-auction applications leave this null
// and fall back to the original 240-month default.
const resolveLoanTermMonths = (application) => {
  const termMonths = Number(application?.loan_term_months);
  return Number.isFinite(termMonths) && termMonths > 0
    ? termMonths
    : DEFAULT_LOAN_MONTHS;
};

const resolveMonthlyAmount = (application) => {
  const approvedAmount = resolveApprovedAmount(application);
  const termMonths = resolveLoanTermMonths(application);
  return approvedAmount > 0 ? approvedAmount / termMonths : 0;
};

// Applications approved through the provider auction have interest_rate set
// directly by accept_loan_offer() and accepted_offer_id pointing at the
// winning loan_offers row (joined here only to name the provider); legacy/
// no-auction applications have neither.
const resolveProviderInfo = (application) => {
  const interestRate = Number(application?.interest_rate);

  return {
    providerName: application?.loan_offers?.providers?.company_name || null,
    interestRate: Number.isFinite(interestRate) && interestRate > 0 ? interestRate : null,
  };
};

const mapTransaction = (transaction) => ({
  id: transaction.id,
  applicationId: transaction.application_id,
  userId: transaction.user_id,
  amount: toNumber(transaction.amount),
  transactionDate: transaction.transaction_date,
  description: transaction.description || "",
  referenceNumber: transaction.reference_number || "",
  createdAt: transaction.created_at,
  type: transaction.transaction_type,
  status: "Completed",
});

const formatBankAccountNumber = (accountNumber) => {
  const digits = String(accountNumber || "").replace(/\D/g, "");
  if (!digits) return "";

  return `**** ${digits.slice(-4)}`;
};

const formatBankAccountLabel = (bankDetails) => {
  if (!bankDetails) return null;

  const bankName = bankDetails.bank_name || "Bank";
  const maskedAccount = formatBankAccountNumber(
    bankDetails.bank_account_number,
  );

  return [bankName, maskedAccount].filter(Boolean).join(" ").trim();
};

const calcMissedMonths = (approvedAt, disbursementCount) => {
  const approved = new Date(approvedAt);
  if (Number.isNaN(approved.getTime())) return 0;
  const today = new Date();
  const monthsElapsed =
    (today.getFullYear() - approved.getFullYear()) * 12 +
    (today.getMonth() - approved.getMonth());
  return Math.max(monthsElapsed - disbursementCount, 0);
};

// Reverse mortgage is non-recourse: nominees split whatever remains after
// the sale proceeds settle the amount actually disbursed, never a shortfall.
const calculateApportionedProceeds = (application, totalDisbursed) => {
  const propertyValue = resolvePropertyValue(application);
  const outstandingLoanAmount = toNumber(totalDisbursed);
  const netProceeds = Math.max(propertyValue - outstandingLoanAmount, 0);
  const shortfall = Math.max(outstandingLoanAmount - propertyValue, 0);

  const nominees = application?.nominees || [];
  const flaggedCode = application?.flagged_code;
  const isEligible = (nominee) => {
    if (flaggedCode === "both_nominees_inactive") return false;
    if (flaggedCode === "nominee1_inactive" && nominee.type === "nominee1")
      return false;
    if (flaggedCode === "nominee2_inactive" && nominee.type === "nominee2")
      return false;
    return true;
  };

  const eligibleNominees = nominees.filter(isEligible);
  const shareCount = eligibleNominees.length;
  const sharePerNominee = shareCount > 0 ? netProceeds / shareCount : 0;

  return {
    propertyValue,
    outstandingLoanAmount,
    netProceeds,
    shortfall,
    isNonRecourseShortfall: shortfall > 0,
    nominees: nominees.map((nominee) => {
      const eligible = isEligible(nominee);
      return {
        id: nominee.id,
        type: nominee.type,
        name: nominee.name,
        eligible,
        sharePercentage:
          eligible && shareCount > 0 ? 100 / shareCount : 0,
        apportionedAmount: eligible ? sharePerNominee : 0,
      };
    }),
    unallocatedAmount: shareCount === 0 ? netProceeds : 0,
  };
};

const buildSummary = (application, transactions = []) => {
  const totalEligibleAmount = resolveApprovedAmount(application);
  const monthlyAmount = resolveMonthlyAmount(application);
  const { providerName, interestRate } = resolveProviderInfo(application);
  const totalDisbursed = transactions.reduce(
    (sum, transaction) => sum + toNumber(transaction.amount),
    0,
  );
  const remainingBalance = Math.max(totalEligibleAmount - totalDisbursed, 0);
  const latestTransaction = transactions[0] || null;

  const approvedAt = application?.approved_at || new Date().toISOString();
  const disbursementCount = transactions.length;
  // Anchor to the approval schedule so the date never drifts with late payments
  const nextSuggestedDate = addMonths(approvedAt, disbursementCount + 1);
  const missedMonths = calcMissedMonths(approvedAt, disbursementCount);
  // Catch-up: cover all missed months plus the current one, capped at remaining balance
  const suggestedAmount = Math.min(
    (missedMonths + 1) * monthlyAmount,
    remainingBalance,
  );

  return {
    applicationId: application.id,
    userId: application.user_id,
    applicantName: application.users?.full_name || "N/A",
    applicantEmail: application.users?.email || "",
    icNumber: application.users?.ic_number || "",
    propertyType: application.properties?.property_type || "Property",
    propertyAddress: application.properties?.address || "N/A",
    approvedAt: application.approved_at,
    approvedAmount: resolveApprovedAmount(application),
    monthlyAmount,
    loanTermMonths: resolveLoanTermMonths(application),
    interestRate,
    providerName,
    totalEligibleAmount,
    totalDisbursed,
    remainingBalance,
    latestDisbursementDate:
      latestTransaction?.transactionDate ||
      latestTransaction?.transaction_date ||
      null,
    nextSuggestedDate,
    missedMonths,
    suggestedAmount,
    canDisburse: application.status === "approved" && remainingBalance > 0,
  };
};

const LoanDisbursement = {
  async getApprovedApplications() {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          user_id,
          status,
          approved_at,
          approved_amount,
          loan_term_months,
          interest_rate,
          accepted_offer_id,
          loan_offers!applications_accepted_offer_id_fkey(
            providers(company_name)
          ),
          users!applications_user_id_fkey(
            full_name,
            ic_number,
            email
          ),
          properties(
            property_type,
            address,
            expected_market_value,
            indicative_market_value
          )
        `,
        )
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      if (error) throw error;

      const applicationIds = (data || []).map((application) => application.id);
      let totalsByApplication = {};

      if (applicationIds.length > 0) {
        const { data: transactions, error: transactionError } = await supabase
          .from("transactions")
          .select("application_id, amount")
          .eq("transaction_type", DISBURSEMENT_TYPE)
          .in("application_id", applicationIds);

        if (transactionError) throw transactionError;

        totalsByApplication = (transactions || []).reduce(
          (accumulator, transaction) => {
            const applicationId = transaction.application_id;
            accumulator[applicationId] =
              (accumulator[applicationId] || 0) + toNumber(transaction.amount);
            return accumulator;
          },
          {},
        );
      }

      const applications = (data || []).map((application) => {
        const summary = buildSummary(application, []);

        return {
          id: application.id,
          applicationId: application.id,
          applicantName: application.users?.full_name || "N/A",
          applicantEmail: application.users?.email || "",
          icNumber: application.users?.ic_number || "",
          propertyType: application.properties?.property_type || "Property",
          propertyAddress: application.properties?.address || "N/A",
          approvedAt: application.approved_at,
          approvedAmount: summary.approvedAmount,
          monthlyAmount: summary.monthlyAmount,
          loanTermMonths: summary.loanTermMonths,
          interestRate: summary.interestRate,
          providerName: summary.providerName,
          totalEligibleAmount: summary.totalEligibleAmount,
          totalDisbursed: totalsByApplication[application.id] || 0,
          remainingBalance: Math.max(
            summary.totalEligibleAmount -
              (totalsByApplication[application.id] || 0),
            0,
          ),
          canDisburse:
            application.status === "approved" &&
            summary.totalEligibleAmount -
              (totalsByApplication[application.id] || 0) >
              0,
        };
      });

      return { success: true, data: applications };
    } catch (error) {
      console.error("Error fetching approved applications:", error);
      return { success: false, error: error.message };
    }
  },

  async getApplicationDisbursementSummary(applicationId) {
    try {
      const { data: application, error: applicationError } = await supabase
        .from("applications")
        .select(
          `
          id,
          user_id,
          status,
          approved_at,
          approved_amount,
          loan_term_months,
          interest_rate,
          accepted_offer_id,
          loan_offers!applications_accepted_offer_id_fkey(
            providers(company_name)
          ),
          users!applications_user_id_fkey(
            full_name,
            ic_number,
            email
          ),
          properties(
            property_type,
            address,
            expected_market_value,
            indicative_market_value
          )
        `,
        )
        .eq("id", applicationId)
        .maybeSingle();

      if (applicationError) throw applicationError;
      if (!application) {
        return { success: false, error: "Application not found" };
      }

      const { data: transactions, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("application_id", applicationId)
        .eq("transaction_type", DISBURSEMENT_TYPE)
        .order("transaction_date", { ascending: false });

      if (transactionError) throw transactionError;

      const records = (transactions || []).map(mapTransaction);
      const summary = buildSummary(application, records);

      return {
        success: true,
        data: {
          application,
          summary,
          records,
        },
      };
    } catch (error) {
      console.error("Error fetching application disbursement summary:", error);
      return { success: false, error: error.message };
    }
  },

  async getDisbursementRecords(applicationId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("application_id", applicationId)
        .eq("transaction_type", DISBURSEMENT_TYPE)
        .order("transaction_date", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: (data || []).map(mapTransaction) };
    } catch (error) {
      console.error("Error fetching disbursement records:", error);
      return { success: false, error: error.message };
    }
  },

  async createDisbursement(applicationId, payload = {}) {
    try {
      const amount = toNumber(payload.amount);
      if (amount <= 0) {
        return {
          success: false,
          error: "Disbursement amount must be greater than zero",
        };
      }

      const summaryResult =
        await this.getApplicationDisbursementSummary(applicationId);
      if (!summaryResult.success) {
        return summaryResult;
      }

      const { summary, application } = summaryResult.data;
      if (application.status !== "approved") {
        return {
          success: false,
          error: "Only approved applications can receive disbursements",
        };
      }

      if (amount > summary.remainingBalance) {
        return {
          success: false,
          error: "Disbursement amount exceeds remaining balance",
        };
      }

      const transactionDate = formatIsoDate(payload.transactionDate);
      const referenceNumber =
        (payload.referenceNumber || "").trim() || `DIS-${Date.now()}`;
      const description =
        (payload.description || "").trim() || "Loan disbursement payout";

      const { data: inserted, error } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: summary.userId,
            application_id: applicationId,
            transaction_type: DISBURSEMENT_TYPE,
            amount,
            transaction_date: transactionDate,
            description,
            reference_number: referenceNumber,
          },
        ])
        .select("*")
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          record: mapTransaction(inserted),
          summary: {
            ...summary,
            totalDisbursed: summary.totalDisbursed + amount,
            remainingBalance: Math.max(summary.remainingBalance - amount, 0),
          },
        },
      };
    } catch (error) {
      console.error("Error creating disbursement:", error);
      return { success: false, error: error.message };
    }
  },

  async getPendingSchedules() {
    try {
      const { data, error } = await supabase
        .from("loan_disbursement_schedules")
        .select(
          `
          id,
          application_id,
          user_id,
          disbursement_number,
          scheduled_date,
          amount,
          status,
          applications(
            users!applications_user_id_fkey(full_name),
            properties(property_type, address)
          )
        `,
        )
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      const schedules = (data || []).map((row) => ({
        id: row.id,
        applicationId: row.application_id,
        userId: row.user_id,
        disbursementNumber: row.disbursement_number,
        scheduledDate: row.scheduled_date,
        amount: toNumber(row.amount),
        applicantName: row.applications?.users?.full_name || "N/A",
        propertyType: row.applications?.properties?.property_type || "Property",
        propertyAddress: row.applications?.properties?.address || "N/A",
      }));

      return { success: true, data: schedules };
    } catch (error) {
      console.error("Error fetching pending disbursement schedules:", error);
      return { success: false, error: error.message };
    }
  },

  async confirmScheduledDisbursement(scheduleId, adminId, overrides = {}) {
    try {
      // Atomically claim the schedule row first (status transition guarded by
      // .eq("status", "pending")) so two concurrent confirms - double-click,
      // two admin tabs, or a reload mid-flow - can't both pass the pending
      // check and both create a real transactions row for the same slot.
      const { data: claimed, error: claimError } = await supabase
        .from("loan_disbursement_schedules")
        .update({
          status: "confirmed",
          confirmed_by: adminId,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", scheduleId)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();

      if (claimError) throw claimError;
      if (!claimed) {
        return {
          success: false,
          error: "This disbursement schedule has already been resolved",
        };
      }

      const createResult = await this.createDisbursement(
        claimed.application_id,
        {
          amount: overrides.amount ?? claimed.amount,
          transactionDate: overrides.transactionDate ?? claimed.scheduled_date,
          description:
            overrides.description ||
            `Auto-scheduled disbursement #${claimed.disbursement_number}`,
          referenceNumber: overrides.referenceNumber,
        },
      );

      if (!createResult.success) {
        // Release the claim so the schedule can be retried instead of being
        // stuck "confirmed" with no transaction behind it.
        await supabase
          .from("loan_disbursement_schedules")
          .update({ status: "pending", confirmed_by: null, confirmed_at: null })
          .eq("id", scheduleId);
        return createResult;
      }

      const { error: updateError } = await supabase
        .from("loan_disbursement_schedules")
        .update({ transaction_id: createResult.data.record.id })
        .eq("id", scheduleId);

      if (updateError) throw updateError;

      return createResult;
    } catch (error) {
      console.error("Error confirming scheduled disbursement:", error);
      return { success: false, error: error.message };
    }
  },

  async skipScheduledDisbursement(scheduleId, reason = "") {
    try {
      const { error } = await supabase
        .from("loan_disbursement_schedules")
        .update({
          status: "skipped",
          notes: reason || null,
        })
        .eq("id", scheduleId)
        .eq("status", "pending");

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error skipping scheduled disbursement:", error);
      return { success: false, error: error.message };
    }
  },

  // No approved application found - check whether one is currently open for
  // auction instead, so the dashboard can show "offers awaiting your
  // decision" rather than a bare "No Active Loan".
  async _buildNoLoanOverview(userId) {
    const { data: auctioningApplication, error } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "auctioning")
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;

    return {
      hasLoan: false,
      isAuctioning: Boolean(auctioningApplication),
      applicationId: auctioningApplication?.id || null,
      totalEligibleAmount: 0,
      disbursedToDate: 0,
      remainingBalance: 0,
      status: auctioningApplication
        ? "Offers Awaiting Your Decision"
        : "No Active Loan",
      propertyDetails: null,
    };
  },

  async getUserLoanOverview(userId) {
    try {
      const { data: application, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          user_id,
          status,
          approved_at,
          approved_amount,
          loan_term_months,
          users!applications_user_id_fkey(
            full_name,
            ic_number,
            email
          ),
          properties(
            indicative_market_value,
            expected_market_value,
            address,
            property_type,
            valuation_date
          )
        `,
        )
        .eq("user_id", userId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") {
          return { success: true, data: await this._buildNoLoanOverview(userId) };
        }

        throw error;
      }

      if (!application) {
        return { success: true, data: await this._buildNoLoanOverview(userId) };
      }

      const { data: transactions, error: transactionError } = await supabase
        .from("transactions")
        .select("amount, transaction_date")
        .eq("application_id", application.id)
        .eq("transaction_type", DISBURSEMENT_TYPE)
        .order("transaction_date", { ascending: false });

      if (transactionError) throw transactionError;

      const disbursedToDate = (transactions || []).reduce(
        (sum, transaction) => sum + toNumber(transaction.amount),
        0,
      );
      const totalEligibleAmount = resolveApprovedAmount(application);
      const remainingBalance = Math.max(
        totalEligibleAmount - disbursedToDate,
        0,
      );

      return {
        success: true,
        data: {
          hasLoan: true,
          totalEligibleAmount,
          disbursedToDate,
          remainingBalance,
          status:
            remainingBalance > 0 ? "Active & On Track" : "Fully Disbursed",
          propertyDetails: application.properties
            ? {
                address: application.properties.address,
                propertyType: application.properties.property_type,
                valuationDate: application.properties.valuation_date,
              }
            : null,
          approvedAt: application.approved_at,
          applicationId: application.id,
          monthlyAmount: resolveMonthlyAmount(application),
        },
      };
    } catch (error) {
      console.error("Error fetching loan overview:", error);
      return { success: false, error: error.message };
    }
  },

  async getUserDisbursements(userId, filters = {}) {
    try {
      const { limit = 6 } = filters;

      const { data: application, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          approved_amount,
          properties(
            expected_market_value,
            indicative_market_value
          )
        `,
        )
        .eq("user_id", userId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") return [];
        throw error;
      }

      if (!application) return [];

      const { data: transactions, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("application_id", application.id)
        .eq("transaction_type", DISBURSEMENT_TYPE)
        .order("transaction_date", { ascending: true });

      if (transactionError) throw transactionError;

      const totalEligibleAmount = resolveApprovedAmount(application);
      let cumulativeDisbursed = 0;

      const recordsAscending = (transactions || []).map((transaction) => {
        cumulativeDisbursed += toNumber(transaction.amount);
        return {
          ...mapTransaction(transaction),
          remaining: Math.max(totalEligibleAmount - cumulativeDisbursed, 0),
        };
      });

      return recordsAscending
        .slice(-limit)
        .reverse()
        .map((record) => ({
          date: record.transactionDate,
          amountReceived: record.amount,
          remaining: record.remaining,
          status: record.status,
          description: record.description,
          referenceNumber: record.referenceNumber,
        }));
    } catch (error) {
      console.error("Error fetching disbursements:", error);
      throw error;
    }
  },

  /**
   * Calculate the apportioned proceeds for a terminated (deceased-applicant) application.
   * Property sale proceeds settle the outstanding disbursed amount first (non-recourse:
   * any shortfall is absorbed, never owed by the estate); the remainder is split evenly
   * across nominees still active on the application.
   * @param {string} applicationId - Application ID
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  async getTerminationProceedsSummary(applicationId) {
    try {
      const { data: application, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          flagged_code,
          main_applicant_deceased,
          properties(expected_market_value, indicative_market_value),
          nominees(id, type, name)
        `,
        )
        .eq("id", applicationId)
        .maybeSingle();

      if (error) throw error;
      if (!application) {
        return { success: false, error: "Application not found" };
      }

      const { data: transactions, error: transactionError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("application_id", applicationId)
        .eq("transaction_type", DISBURSEMENT_TYPE);

      if (transactionError) throw transactionError;

      const totalDisbursed = (transactions || []).reduce(
        (sum, transaction) => sum + toNumber(transaction.amount),
        0,
      );

      return {
        success: true,
        data: calculateApportionedProceeds(application, totalDisbursed),
      };
    } catch (error) {
      console.error("Error calculating termination proceeds:", error);
      return { success: false, error: error.message };
    }
  },

  async saveBankDetails(userId, bankData) {
    try {
      const { data, error } = await supabase
        .from("user_bank_details")
        .insert([
          {
            user_id: userId,
            account_holder_name: bankData.accountHolderName,
            bank_name: bankData.bankName,
            bank_account_number: bankData.bankAccountNumber,
            account_type: bankData.accountType || null,
            is_primary: true,
          },
        ])
        .select("*")
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error saving bank details:", error);
      return { success: false, error: error.message };
    }
  },

  async getUserPayoutDetails(userId) {
    try {
      const { data: application, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          approved_at,
          approved_amount,
          loan_term_months,
          interest_rate,
          accepted_offer_id,
          loan_offers!applications_accepted_offer_id_fkey(
            providers(company_name)
          ),
          properties(
            expected_market_value,
            indicative_market_value
          )
        `,
        )
        .eq("user_id", userId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            success: true,
            data: {
              payoutType: "monthly",
              monthlyAmount: 0,
              startDate: null,
              endDate: null,
              totalMonths: 0,
              nextPayoutDate: null,
              interestRate: null,
              providerName: null,
              bankAccount: null,
            },
          };
        }

        throw error;
      }

      if (!application) {
        return {
          success: true,
          data: {
            payoutType: "monthly",
            monthlyAmount: 0,
            startDate: null,
            endDate: null,
            totalMonths: 0,
            nextPayoutDate: null,
            interestRate: null,
            providerName: null,
            bankDetails: null,
            bankAccount: null,
          },
        };
      }

      const monthlyAmount = resolveMonthlyAmount(application);
      const totalMonths = resolveLoanTermMonths(application);
      const { providerName, interestRate } = resolveProviderInfo(application);
      const startDate = formatIsoDate(application.approved_at);
      const endDate = addMonths(startDate, totalMonths - 1);

      const { data: latestTransactions, error: latestTransactionError } =
        await supabase
          .from("transactions")
          .select("transaction_date")
          .eq("application_id", application.id)
          .eq("transaction_type", DISBURSEMENT_TYPE)
          .order("transaction_date", { ascending: false })
          .limit(1);

      if (latestTransactionError) throw latestTransactionError;

      let bankDetails = null;
      try {
        const { data: bankRows, error: bankError } = await supabase
          .from("user_bank_details")
          .select(
            "account_holder_name, bank_name, bank_account_number, account_type, is_primary, is_verified, verified_at, notes",
          )
          .eq("user_id", userId)
          .order("is_primary", { ascending: false })
          // Latest saved details win; saveBankDetails inserts a new row each time
          .order("created_at", { ascending: false })
          .limit(1);

        if (bankError) throw bankError;

        bankDetails = bankRows?.[0] || null;
      } catch (bankError) {
        console.warn("Error fetching user bank details:", bankError);
      }

      const nextPayoutDate = latestTransactions?.[0]?.transaction_date
        ? addMonths(latestTransactions[0].transaction_date, 1)
        : addMonths(startDate, 1);

      return {
        success: true,
        data: {
          payoutType: "monthly",
          monthlyAmount,
          startDate,
          endDate,
          totalMonths,
          nextPayoutDate,
          interestRate,
          providerName,
          bankDetails,
          bankAccount: formatBankAccountLabel(bankDetails),
        },
      };
    } catch (error) {
      console.error("Error fetching payout details:", error);
      return { success: false, error: error.message };
    }
  },
};

export default LoanDisbursement;
