// Admin Model
// Handles all admin-related database operations
// NO imports from other models allowed!

import { supabase } from "../config/supabase";
import { corsProxyUpdate } from "../services/corsProxyService";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Upsert helper that uses CORS proxy for updates (avoids direct upsert CORS issues)
const upsertReportRecord = async (payload) => {
  const { report_type, year, month } = payload;

  // Check if record exists for period
  const { data: existing, error: selectError } = await supabase
    .from("reports")
    .select("id")
    .eq("report_type", report_type)
    .eq("year", year)
    .eq("month", month ?? -1)
    .maybeSingle();

  if (selectError) throw selectError;

  // Update via proxy when record exists
  if (existing?.id) {
    const updateResult = await corsProxyUpdate("reports", existing.id, {
      name: payload.name,
      report_type,
      year,
      month: month ?? -1,
      generated_at: payload.generated_at || new Date().toISOString(),
      total: payload.total ?? 0,
      approved: payload.approved ?? 0,
      rejected: payload.rejected ?? 0,
      pending: payload.pending ?? 0,
    });

    if (!updateResult.success) throw new Error(updateResult.error);
    return { success: true, data: { id: existing.id } };
  }

  // Insert new record (requires normal Supabase insert; proxy only supports updates)
  const { data: inserted, error: insertError } = await supabase
    .from("reports")
    .insert([{ ...payload, month: month ?? -1 }])
    .select("id")
    .single();

  if (insertError) throw insertError;
  return { success: true, data: inserted };
};

const Admin = {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics (pending, approved, rejected counts)
   */
  async getDashboardStats() {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setMilliseconds(-1);

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const [applicationsResult, reportsResult] = await Promise.all([
        supabase.from("applications").select("status, rejected_at"),
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          // created_at is set once on insert and never touched again, unlike
          // generated_at (which viewMonthlyReport() also bumps on every view
          // of an existing report) - see migration 020.
          .gte("created_at", startOfMonth.toISOString())
          .lte("created_at", endOfMonth.toISOString()),
      ]);

      if (applicationsResult.error) throw applicationsResult.error;
      if (reportsResult.error) throw reportsResult.error;

      const applications = applicationsResult.data || [];
      const reportsGenerated = reportsResult.count || 0;

      const stats = {
        pending: applications.filter(
          (app) => app.status === "submitted" || app.status === "underReviewed",
        ).length,
        approved: applications.filter((app) => app.status === "approved")
          .length,
        auctioning: applications.filter((app) => app.status === "auctioning")
          .length,
        rejected: applications.filter(
          (app) =>
            app.status === "rejected" &&
            app.rejected_at &&
            new Date(app.rejected_at) >= last30Days,
        ).length,
        total: applications.filter((app) => app.status !== "draft").length,
        reportsGenerated,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all applications with user and property details
   * @param {Object} filters - Filters for status, search query, sort
   * @returns {Promise<Array>} Array of applications with related data
   */
  async getAllApplications(filters = {}) {
    try {
      let query = supabase
        .from("applications")
        .select(
          `
          *,
          users!applications_user_id_fkey(full_name, ic_number, email),
          properties(property_type, address, indicative_market_value)
        `,
        )
        .neq("status", "draft"); // Exclude draft applications

      // Apply status filter
      if (filters.status && filters.status !== "all") {
        if (filters.status === "pending") {
          // Pending includes both 'submitted' and 'underReviewed'
          query = query.in("status", ["submitted", "underReviewed"]);
        } else {
          // For specific status: submitted, approved, rejected, terminated, underReviewed
          query = query.eq("status", filters.status);
        }
      }

      // Apply sorting
      const sortField = filters.sortBy || "submitted_at";
      const sortOrder = filters.sortOrder || "desc";
      query = query.order(sortField, { ascending: sortOrder === "asc" });

      const { data, error } = await query;

      if (error) throw error;

      // Client-side search filter (case-insensitive)
      let filteredData = data || [];
      if (filters.search && filters.search.trim()) {
        const searchLower = filters.search.toLowerCase().trim();
        filteredData = data.filter((app) => {
          const fullName = (app.users?.full_name || "").toLowerCase();
          const icNumber = (app.users?.ic_number || "").toLowerCase();
          const email = (app.users?.email || "").toLowerCase();
          const address = (app.properties?.address || "").toLowerCase();

          return (
            fullName.includes(searchLower) ||
            icNumber.includes(searchLower) ||
            email.includes(searchLower) ||
            address.includes(searchLower)
          );
        });
      }

      return { success: true, data: filteredData };
    } catch (error) {
      console.error("Error fetching applications:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get single application with full details
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Application with all related data
   */
  async getApplicationDetails(applicationId) {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          user:users!applications_user_id_fkey(full_name, ic_number, email, phone),
          property:properties(*),
          nominees(*)
        `,
        )
        .eq("id", applicationId)
        .single();

      if (error) throw error;

      const { data: applicationData, error: applicationDataError } =
        await supabase
          .from("application_data")
          .select("*")
          .eq("application_id", applicationId)
          .maybeSingle();

      if (applicationDataError && applicationDataError.code !== "PGRST116") {
        throw applicationDataError;
      }

      // Extract application_data (comes as array)
      const processedData = {
        ...data,
        application_data: applicationData || null,
      };

      return { success: true, data: processedData };
    } catch (error) {
      console.error("Error fetching application details:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Approve an application
   * @param {string} applicationId - Application ID
   * @param {Object} approvalData - Approval details
   * @returns {Promise<Object>} Updated application
   */
  async approveApplication(applicationId, approvalData = {}) {
    try {
      const updateData = {
        status: "approved",
        approved_at: new Date().toISOString(),
        remarks: approvalData.remarks || null,
        updated_at: new Date().toISOString(),
      };

      // Include approved_amount if provided and not empty
      if (
        approvalData.approved_amount &&
        !isNaN(parseFloat(approvalData.approved_amount))
      ) {
        updateData.approved_amount = parseFloat(approvalData.approved_amount);
      }

      console.log("Approving application with data:", updateData);
      const result = await corsProxyUpdate(
        "applications",
        applicationId,
        updateData,
      );

      if (!result.success) throw new Error(result.error);
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error approving application:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reject an application
   * @param {string} applicationId - Application ID
   * @param {string} remarks - Rejection reason
   * @returns {Promise<Object>} Updated application
   */
  async rejectApplication(applicationId, remarks) {
    try {
      const result = await corsProxyUpdate("applications", applicationId, {
        status: "rejected",
        remarks: remarks,
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (!result.success) throw new Error(result.error);
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error rejecting application:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {string} status - New status
   * @param {string} remarks - Optional remarks
   * @returns {Promise<Object>} Updated application
   */
  async updateApplicationStatus(
    applicationId,
    status,
    remarks = null,
    { mainApplicantDeceased = false } = {},
  ) {
    try {
      const updates = {
        status: status,
        remarks: remarks,
        updated_at: new Date().toISOString(),
      };

      // Add reviewed_at timestamp when moving to underReviewed status
      if (status === "underReviewed") {
        updates.reviewed_at = new Date().toISOString();
      }

      // Add rejected_at timestamp when moving to rejected status
      if (status === "rejected") {
        updates.rejected_at = new Date().toISOString();
      }

      // Clear termination fields when terminating application
      if (status === "terminated") {
        updates.termination_update_at = new Date().toISOString();
        updates.termination_submitted_at = null;
        // Deceased-applicant terminations trigger the apportioned-proceeds
        // flow (property sold, nominees split what's left after settling
        // the outstanding loan) instead of the standard payback flow.
        updates.main_applicant_deceased = mainApplicantDeceased;
      }

      const result = await corsProxyUpdate(
        "applications",
        applicationId,
        updates,
      );

      if (!result.success) throw new Error(result.error);
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error updating application status:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reject termination request
   * @param {string} applicationId - Application ID
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise<Object>} Updated application
   */
  async rejectTermination(applicationId, rejectionReason) {
    try {
      // Clear termination fields, set status back to approved, and save rejection reason
      const result = await corsProxyUpdate("applications", applicationId, {
        status: "approved",
        termination_reason: null,
        termination_submitted_at: null,
        reject_termination_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      });

      if (!result.success) throw new Error(result.error);
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error rejecting termination:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Open an approved application for provider bidding
   * @param {string} applicationId - Application ID
   * @param {string} adminId - Admin who opened the auction
   * @returns {Promise<Object>} Updated application
   */
  async openApplicationForAuction(applicationId, adminId) {
    try {
      const result = await corsProxyUpdate("applications", applicationId, {
        status: "auctioning",
        auction_opened_at: new Date().toISOString(),
        auction_opened_by: adminId,
        updated_at: new Date().toISOString(),
      });

      if (!result.success) throw new Error(result.error);
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error opening application for auction:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get submitted provider offers for an application (full visibility,
   * including provider contact info, for admin oversight)
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Offers with provider details
   */
  async getApplicationOffers(applicationId) {
    const LoanOffer = (await import("./LoanOffer")).default;
    return LoanOffer.getOffersForAdmin(applicationId);
  },

  /**
   * Get application documents from form data
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Application documents
   */
  async getApplicationDocuments(applicationId) {
    try {
      const { data, error } = await supabase
        .from("application_data")
        .select("form_data")
        .eq("application_id", applicationId)
        .single();

      if (error) throw error;

      // Extract document URLs from form_data JSON
      const formData = data?.form_data || {};
      const documents = {
        applicantNRIC: formData.documents?.applicantNRIC || null,
        jointApplicantNRIC: formData.documents?.jointApplicantNRIC || null,
        birthCertificate: formData.documents?.birthCertificate || null,
        payslips: formData.documents?.payslips || [],
        bankStatements: formData.documents?.bankStatements || [],
        epfStatement: formData.documents?.epfStatement || null,
        grantTitle: formData.documents?.grantTitle || null,
        saleAgreement: formData.documents?.saleAgreement || null,
        valuationReport: formData.documents?.valuationReport || null,
        fireInsurance: formData.documents?.fireInsurance || null,
        propertyLoanStatement:
          formData.documents?.propertyLoanStatement || null,
        additionalDocuments: formData.documents?.additionalDocuments || [],
      };

      return { success: true, data: documents };
    } catch (error) {
      console.error("Error fetching application documents:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get application PDF from storage
   * @param {string} applicationId - Application ID
   * @param {string} userId - User ID who owns the application
   * @returns {Promise<Object>} PDF URL and metadata
   */
  async getApplicationPDF(applicationId, userId) {
    try {
      // First get the application to verify userId
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;

      // Use the application's user_id if not provided
      const targetUserId = userId || application.user_id;

      if (!targetUserId) {
        throw new Error("User ID not found for this application");
      }

      // Get PDF from application-forms bucket using Application model
      const Application = (await import("./Application")).default;
      const result = await Application.downloadApplicationPDF(
        applicationId,
        targetUserId,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        url: result.url,
        fileName: result.fileName,
        size: result.size,
      };
    } catch (error) {
      console.error("Error getting application PDF:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Download application PDF directly (opens in new tab)
   * @param {string} applicationId - Application ID
   * @param {string} userId - User ID who owns the application
   * @returns {Promise<Object>} Success/error result
   */
  async downloadApplicationPDFDirect(applicationId, userId) {
    try {
      const result = await this.getApplicationPDF(applicationId, userId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Open in new tab
      window.open(result.url, "_blank");

      return { success: true };
    } catch (error) {
      console.error("Error downloading PDF:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get reports (monthly and yearly)
   * @returns {Promise<Array>} Array of generated reports
   */
  async getReports(filters = {}) {
    try {
      let query = supabase
        .from("reports")
        .select("*")
        .order("generated_at", { ascending: false });

      if (filters.type) {
        query = query.eq("report_type", filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped = (data || []).map((report) => {
        const isYearly = report.report_type === "yearly";
        const monthIndex = report.month ?? -1;
        const monthName =
          isYearly || monthIndex < 0
            ? null
            : MONTH_NAMES[monthIndex] || "Unknown";

        return {
          id: report.id,
          name:
            report.name ||
            (isYearly
              ? `Annual Application Analysis Report - ${report.year}`
              : `Monthly Application Report - ${monthName} ${report.year}`),
          generatedOn: report.generated_at,
          type: report.report_type,
          year: report.year,
          month: monthIndex >= 0 ? monthIndex : null,
        };
      });

      return { success: true, data: mapped };
    } catch (error) {
      console.error("Error fetching reports:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get a single report by ID (for direct/shared report links).
   * Accepts a reports-table UUID, the synthetic "monthly-YYYY-M" ID used
   * right after generation, or "yearly" for the latest yearly report.
   * @param {string} reportId - Report identifier
   * @returns {Promise<Object>} { report, reportData } for AdminReportView
   */
  async getReportById(reportId) {
    try {
      let query = supabase.from("reports").select("*");

      const monthlyMatch = /^monthly-(\d{4})-(\d{1,2})$/.exec(reportId || "");
      if (reportId === "yearly") {
        query = query
          .eq("report_type", "yearly")
          .order("generated_at", { ascending: false })
          .limit(1);
      } else if (monthlyMatch) {
        query = query
          .eq("report_type", "monthly")
          .eq("year", parseInt(monthlyMatch[1]))
          .eq("month", parseInt(monthlyMatch[2]))
          .limit(1);
      } else {
        query = query.eq("id", reportId).limit(1);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Report not found");

      const isYearly = data.report_type === "yearly";
      const monthIndex = data.month ?? -1;
      const monthName =
        isYearly || monthIndex < 0 ? null : MONTH_NAMES[monthIndex] || "Unknown";

      return {
        success: true,
        data: {
          report: {
            id: data.id,
            name:
              data.name ||
              (isYearly
                ? `Annual Application Analysis Report - ${data.year}`
                : `Monthly Application Report - ${monthName} ${data.year}`),
            generatedOn: data.generated_at,
            type: data.report_type,
          },
          reportData: {
            total: data.total ?? 0,
            approved: data.approved ?? 0,
            rejected: data.rejected ?? 0,
            pending: data.pending ?? 0,
            year: data.year,
            month: isYearly || monthIndex < 0 ? null : monthIndex,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching report by ID:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Generate yearly report
   * @returns {Promise<Object>} Generated report data
   */
  async generateYearlyReport() {
    try {
      // In production, this would:
      // 1. Fetch all applications for the year
      // 2. Generate statistics
      // 3. Create PDF report
      // 4. Store in reports table
      // 5. Return report metadata

      const currentYear = new Date().getFullYear();

      // Fetch applications for the year
      const { data: applications, error } = await supabase
        .from("applications")
        .select("*")
        .gte("created_at", `${currentYear}-01-01`)
        .lte("created_at", `${currentYear}-12-31`);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        total: applications.filter((app) => app.status !== "draft").length,
        approved: applications.filter((app) => app.status === "approved")
          .length,
        rejected: applications.filter((app) => app.status === "rejected")
          .length,
        pending: applications.filter(
          (app) => app.status === "submitted" || app.status === "underReviewed",
        ).length,
        year: currentYear,
      };

      await upsertReportRecord({
        name: `Annual Application Analysis Report - ${currentYear}`,
        report_type: "yearly",
        year: currentYear,
        month: -1,
        generated_at: new Date().toISOString(),
        total: stats.total,
        approved: stats.approved,
        rejected: stats.rejected,
        pending: stats.pending,
      });

      return {
        success: true,
        message: "Yearly report generated successfully",
        data: stats,
      };
    } catch (error) {
      console.error("Error generating yearly report:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * View monthly report
   * @param {string} reportName - Report Name (format: "monthly-YYYY-MM")
   * @returns {Promise<Object>} Report data
   */
  async viewMonthlyReport(reportName) {
    try {
      // Extract year and month from reportName
      // Format: "Monthly Application Report - Jan 2024"
      const parts = reportName.split(" - ");
      if (parts.length < 2) {
        throw new Error("Invalid report name format");
      }

      const datePart = parts[1]; // "Jan 2024"
      const dateParts = datePart.split(" ");
      const monthName = dateParts[0];
      const year = dateParts[1];

      // Get month index from month name
      const parsedMonth = MONTH_NAMES.indexOf(monthName);
      const parsedYear = parseInt(year);

      if (parsedMonth === -1 || isNaN(parsedYear)) {
        throw new Error("Invalid year or month in report name");
      }

      const startDate = new Date(parsedYear, parsedMonth, 1);
      const endDate = new Date(parsedYear, parsedMonth + 1, 0);

      // Validate dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error(
          "Invalid time value: Could not create valid dates from year and month",
        );
      }

      const { data: applications, error } = await supabase
        .from("applications")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      const stats = {
        total: applications.filter((app) => app.status !== "draft").length,
        approved: applications.filter((app) => app.status === "approved")
          .length,
        rejected: applications.filter((app) => app.status === "rejected")
          .length,
        pending: applications.filter(
          (app) => app.status === "submitted" || app.status === "underReviewed",
        ).length,
        month: parsedMonth,
        year: parsedYear,
      };

      await upsertReportRecord({
        name: `Monthly Application Report - ${MONTH_NAMES[parsedMonth] || "Unknown"} ${parsedYear}`,
        report_type: "monthly",
        year: parsedYear,
        month: parsedMonth,
        generated_at: new Date().toISOString(),
        total: stats.total,
        approved: stats.approved,
        rejected: stats.rejected,
        pending: stats.pending,
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error viewing monthly report:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Generate monthly report for the current month
   * @returns {Promise<Object>} Generated report stats
   */
  async generateMonthlyReport() {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);

      const { data: applications, error } = await supabase
        .from("applications")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      const stats = {
        total: applications.filter((app) => app.status !== "draft").length,
        approved: applications.filter((app) => app.status === "approved")
          .length,
        rejected: applications.filter((app) => app.status === "rejected")
          .length,
        pending: applications.filter(
          (app) => app.status === "submitted" || app.status === "underReviewed",
        ).length,
        month: currentMonth,
        year: currentYear,
      };

      await upsertReportRecord({
        name: `Monthly Application Report - ${MONTH_NAMES[currentMonth] || "Unknown"} ${currentYear}`,
        report_type: "monthly",
        year: currentYear,
        month: currentMonth,
        generated_at: new Date().toISOString(),
        total: stats.total,
        approved: stats.approved,
        rejected: stats.rejected,
        pending: stats.pending,
      });

      return {
        success: true,
        data: { ...stats, reportId: `monthly-${currentYear}-${currentMonth}` },
      };
    } catch (error) {
      console.error("Error generating monthly report:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Generate and download analysis report as PDF
   * @param {Object} reportData - Report statistics data
   * @param {Object} report - Report metadata
   * @returns {Promise<Object>} Download result
   */
  async downloadAnalysisReportPDF(reportData, report) {
    try {
      // Dynamically import jsPDF and html2canvas
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to add text with wrapping
      const addWrappedText = (text, x, y, maxWidth, options = {}) => {
        const {
          fontSize = 10,
          fontStyle = "normal",
          color = [0, 0, 0],
        } = options;
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        if (fontStyle !== "normal") pdf.setFont(undefined, fontStyle);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        if (fontStyle !== "normal") pdf.setFont(undefined, "normal");
        return y + lines.length * 5;
      };

      // Title
      yPosition = addWrappedText(
        "APPLICATION ANALYSIS REPORT",
        margin,
        yPosition,
        pageWidth - 2 * margin,
        { fontSize: 18, fontStyle: "bold", color: [41, 128, 185] },
      );
      yPosition += 5;

      // Report type and date
      const reportType = report?.type === "yearly" ? "Annual" : "Monthly";
      const reportTitle = report?.name || "Report";
      yPosition = addWrappedText(
        reportTitle,
        margin,
        yPosition,
        pageWidth - 2 * margin,
        { fontSize: 12, fontStyle: "bold", color: [52, 73, 94] },
      );
      yPosition += 3;

      // Generated date
      const generatedDate = report?.generatedOn
        ? new Date(report.generatedOn).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
      yPosition = addWrappedText(
        `Generated: ${generatedDate}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
        { fontSize: 9, color: [127, 140, 141] },
      );
      yPosition += 8;

      // Summary Section
      yPosition = addWrappedText(
        "SUMMARY",
        margin,
        yPosition,
        pageWidth - 2 * margin,
        { fontSize: 12, fontStyle: "bold", color: [41, 128, 185] },
      );
      yPosition += 2;

      // Draw horizontal line
      pdf.setDrawColor(41, 128, 185);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;

      // Statistics table data
      const stats = [
        { label: "Total Applications", value: reportData?.total || 0 },
        { label: "Approved", value: reportData?.approved || 0 },
        { label: "Rejected", value: reportData?.rejected || 0 },
        { label: "Pending", value: reportData?.pending || 0 },
      ];

      // Draw statistics
      const colWidth = (pageWidth - 2 * margin) / 2;
      let statsYPosition = yPosition;

      stats.forEach((stat, index) => {
        const isLeft = index % 2 === 0;
        const xPos = isLeft ? margin : margin + colWidth;

        // Label
        pdf.setFontSize(10);
        pdf.setTextColor(52, 73, 94);
        pdf.text(stat.label, xPos + 5, statsYPosition);

        // Value
        pdf.setFontSize(14);
        pdf.setTextColor(41, 128, 185);
        pdf.setFont(undefined, "bold");
        pdf.text(stat.value.toString(), xPos + 5, statsYPosition + 6);
        pdf.setFont(undefined, "normal");

        if (!isLeft) {
          statsYPosition += 15;
        }
      });

      yPosition = statsYPosition + 5;

      // Approval Rate Section (if we have data)
      if (reportData?.total > 0) {
        yPosition += 5;

        yPosition = addWrappedText(
          "APPROVAL METRICS",
          margin,
          yPosition,
          pageWidth - 2 * margin,
          { fontSize: 12, fontStyle: "bold", color: [41, 128, 185] },
        );
        yPosition += 2;

        // Draw horizontal line
        pdf.setDrawColor(41, 128, 185);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 4;

        const approvalRate = (
          (reportData.approved / reportData.total) *
          100
        ).toFixed(2);
        const rejectionRate = (
          (reportData.rejected / reportData.total) *
          100
        ).toFixed(2);
        const pendingRate = (
          (reportData.pending / reportData.total) *
          100
        ).toFixed(2);

        const metrics = [
          { label: "Approval Rate", value: `${approvalRate}%` },
          { label: "Rejection Rate", value: `${rejectionRate}%` },
          { label: "Pending Rate", value: `${pendingRate}%` },
        ];

        metrics.forEach((metric) => {
          yPosition = addWrappedText(
            `${metric.label}: ${metric.value}`,
            margin + 5,
            yPosition,
            pageWidth - 2 * margin - 10,
            { fontSize: 10, color: [52, 73, 94] },
          );
          yPosition += 3;
        });
      }

      yPosition += 5;

      // Footer
      const pageCount = pdf.getNumberOfPages();
      pdf.setFontSize(8);
      pdf.setTextColor(149, 165, 166);
      pdf.text(
        `Generated on ${new Date().toLocaleString("en-GB")} | Page 1 of ${pageCount}`,
        margin,
        pageHeight - 10,
      );

      // Generate filename
      const fileName = report?.name
        ? `${report.name}.pdf`
        : `Analysis_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

      // Download PDF
      pdf.save(fileName);

      return { success: true, message: "Report downloaded successfully" };
    } catch (error) {
      console.error("Error generating PDF:", error);
      return { success: false, error: error.message };
    }
  },
};

export default Admin;
