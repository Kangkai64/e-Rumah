// Admin Controller
// Manages state and orchestration for admin dashboard
// Coordinates between Admin model and AdminView

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../client_controller/sessionController/AuthContext";
import Admin from "../models/Admin";
import LoanDisbursement from "../models/LoanDisbursement";
import AdminView from "../views/AdminView";
import { useToast } from "../client_controller/common/ToastContext";

function AdminController() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  // State management
  const [statistics, setStatistics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    reportsGenerated: 0,
  });
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and search state
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    sortBy: "submitted_at",
    sortOrder: "desc",
  });

  // Report generation modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportGenerationType, setReportGenerationType] = useState("monthly");
  const [reportGenerating, setReportGenerating] = useState(false);

  // Tab states
  const [activeRecordTab, setActiveRecordTab] = useState("applications");
  const [activeDetailTab, setActiveDetailTab] = useState("overview");
  const [reportFilter, setReportFilter] = useState("this_month");

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateApp, setStatusUpdateApp] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mainApplicantDeceased, setMainApplicantDeceased] = useState(false);

  // Apportioned proceeds (deceased-applicant termination) state
  const [terminationProceeds, setTerminationProceeds] = useState(null);
  const [loadingProceeds, setLoadingProceeds] = useState(false);

  // Approved amount state
  const [approvedAmount, setApprovedAmount] = useState("");

  // Termination modal state
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationAction, setTerminationAction] = useState(null); // 'approve' or 'reject'
  const [terminationAppId, setTerminationAppId] = useState(null);
  const [processingTermination, setProcessingTermination] = useState(false);

  const navigate = useNavigate();

  // Load dashboard data on mount and when auth changes
  useEffect(() => {
    console.log("🔍 AdminController mounting - Auth state:", {
      user: user?.email,
      userRole,
      authLoading,
    });

    // Only load data if user is authenticated and confirmed as admin
    if (user && userRole === "admin") {
      loadDashboardData();
    } else if (user && userRole && userRole !== "admin") {
      console.warn(
        "⚠️ Non-admin user trying to access admin dashboard:",
        userRole,
      );
    }
  }, [user, userRole, authLoading]); // Removed filters from dependencies

  // Load dashboard data when filters change (except search - search only triggers on Enter)
  useEffect(() => {
    // Only fetch if user is admin and we're not already loading
    if (user && userRole === "admin") {
      loadDashboardData();
    }
  }, [filters.status, filters.sortBy, filters.sortOrder, user, userRole]);

  /**
   * Load all dashboard data
   */
  const loadDashboardData = async () => {
    console.log("📊 Loading admin dashboard data...");
    setLoading(true);
    setError(null);

    try {
      // Load statistics
      const statsResult = await Admin.getDashboardStats();
      if (statsResult.success) {
        setStatistics({
          ...statsResult.data,
        });
      }

      // Load applications
      const appsResult = await Admin.getAllApplications(filters);
      if (appsResult.success) {
        setApplications(appsResult.data);
      }

      // Load reports
      const reportsResult = await Admin.getReports({ filter: reportFilter });
      if (reportsResult.success) {
        setReports(reportsResult.data);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search input change (just updates state, doesn't trigger search)
   */
  const handleSearchChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
    }));
  };

  /**
   * Handle search trigger (Enter key or button click)
   */
  const handleSearch = () => {
    console.log("🔍 Searching for:", filters.search);
    loadDashboardData();
  };

  /**
   * Handle filter field change
   */
  const handleFilterFieldChange = (field) => {
    setFilters({
      ...filters,
      filterField: field,
    });
  };

  /**
   * Handle filter value change
   */
  const handleFilterValueChange = (value) => {
    console.log("Filter status changed to:", value);
    setFilters({
      ...filters,
      status: value,
    });
  };

  /**
   * Handle sort change - toggles between newest and oldest
   */
  const handleSortChange = (sortBy, sortOrder) => {
    console.log("Sort changed to:", sortOrder === "desc" ? "Newest" : "Oldest");
    setFilters({
      ...filters,
      sortBy: sortBy,
      sortOrder: sortOrder,
    });
  };

  /**
   * Handle application row click
   */
  const handleApplicationClick = async (application) => {
    // Load full application details
    const result = await Admin.getApplicationDetails(application.id);
    if (result.success) {
      setSelectedApplication(result.data);

      if (result.data.status === "terminated" && result.data.main_applicant_deceased) {
        setLoadingProceeds(true);
        const proceedsResult = await LoanDisbursement.getTerminationProceedsSummary(
          application.id,
        );
        setTerminationProceeds(proceedsResult.success ? proceedsResult.data : null);
        setLoadingProceeds(false);
      } else {
        setTerminationProceeds(null);
      }
    }
  };

  /**
   * Handle approve application
   */
  const handleApproveApplication = async () => {
    if (!selectedApplication) return;

    if (selectedApplication.status === "underReviewed" && !approvedAmount) {
      showToast("Please enter the approved amount", "warning");
      return;
    }

    const result = await Admin.approveApplication(selectedApplication.id, {
      approved_amount: approvedAmount ? parseFloat(approvedAmount) : null,
    });
    if (result.success) {
      showToast("Application approved successfully!", "success");
      setApprovedAmount(""); // Reset the field
      loadDashboardData(); // Refresh data
    } else {
      showToast("Error approving application: " + result.error, "error");
    }
  };

  /**
   * Handle approved amount change
   */
  const handleApprovedAmountChange = (value) => {
    setApprovedAmount(value);
  };

  /**
   * Handle approve termination
   */
  const handleApproveTermination = async (applicationId) => {
    if (!applicationId) return;

    if (
      !window.confirm(
        "Are you sure you want to approve the termination request for this application?",
      )
    ) {
      return;
    }

    setProcessingTermination(true);
    try {
      const result = await Admin.updateApplicationStatus(
        applicationId,
        "terminated",
      );
      if (result.success) {
        showToast("Termination approved successfully!", "success");
        loadDashboardData();
      } else {
        showToast("Error approving termination: " + result.error, "error");
      }
    } catch (err) {
      console.error("Error approving termination:", err);
      showToast("Error approving termination: " + err.message, "error");
    } finally {
      setProcessingTermination(false);
    }
  };

  /**
   * Handle reject termination
   */
  const handleRejectTermination = async (applicationId) => {
    if (!applicationId) return;

    const reason = window.prompt(
      "Please provide a reason for rejecting the termination request:",
    );
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      showToast("A reason is required to reject a termination request.", "warning");
      return;
    }

    setProcessingTermination(true);
    try {
      // Update to clear termination fields, set remarks, and set status back to approved
      const result = await Admin.rejectTermination(applicationId, reason);
      if (result.success) {
        showToast(
          "Termination rejected successfully! Application status restored to Approved.",
          "success",
        );
        loadDashboardData();
      } else {
        showToast("Error rejecting termination: " + result.error, "error");
      }
    } catch (err) {
      console.error("Error rejecting termination:", err);
      showToast("Error rejecting termination: " + err.message, "error");
    } finally {
      setProcessingTermination(false);
    }
  };

  /**
   * Handle update application status - show modal
   */
  const handleUpdateStatus = async (application) => {
    setStatusUpdateApp(application);
    setNewStatus(application.status);
    setStatusRemarks("");
    setMainApplicantDeceased(false);
    setShowStatusModal(true);
  };

  /**
   * Confirm status update
   */
  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdateApp || !newStatus) return;

    // Validate status change
    if (newStatus === statusUpdateApp.status) {
      showToast("Please select a different status", "warning");
      return;
    }

    setUpdatingStatus(true);

    try {
      const result = await Admin.updateApplicationStatus(
        statusUpdateApp.id,
        newStatus,
        statusRemarks.trim() || null,
        { mainApplicantDeceased: newStatus === "terminated" && mainApplicantDeceased },
      );

      if (result.success) {
        showToast("Application status updated successfully!", "success");
        setShowStatusModal(false);
        setStatusUpdateApp(null);
        setNewStatus("");
        setStatusRemarks("");
        setMainApplicantDeceased(false);
        loadDashboardData(); // Refresh data
      } else {
        showToast("Error updating status: " + result.error, "error");
      }
    } catch (err) {
      showToast("Error updating status: " + err.message, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  /**
   * Cancel status update
   */
  const handleCancelStatusUpdate = () => {
    setShowStatusModal(false);
    setStatusUpdateApp(null);
    setNewStatus("");
    setStatusRemarks("");
  };

  // Add escape key handler for status modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && showStatusModal && !updatingStatus) {
        handleCancelStatusUpdate();
      }
    };

    if (showStatusModal) {
      document.addEventListener("keydown", handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [showStatusModal, updatingStatus]);

  /**
   * Handle view application details (navigate to review page)
   */
  const handleReviewApplication = async (application) => {
    // If application status is 'submitted', automatically change to 'underReviewed'
    if (application.status === "submitted") {
      try {
        console.log("📝 Auto-updating status from submitted to underReviewed");
        const result = await Admin.updateApplicationStatus(
          application.id,
          "underReviewed",
          "Application moved to review by admin",
        );

        if (!result.success) {
          console.error("Failed to update status:", result.error);
          // Still navigate even if status update fails
        } else {
          console.log("✅ Status updated successfully");
        }
      } catch (err) {
        console.error("Error updating application status:", err);
        // Still navigate even if error occurs
      }
    }

    // Navigate to review page
    navigate(`/admin/review/${application.id}`);
  };

  /**
   * Handle report actions
   */
  const handleViewReport = async (reportId) => {
    try {
      const report = reports.find((r) => r.id === reportId);
      if (!report) {
        showToast("Report not found", "error");
        return;
      }

      // For monthly reports, fetch and view data
      if (report.type === "monthly") {
        const result = await Admin.viewMonthlyReport(report.name);
        if (result.success) {
          // Navigate to report view with data
          navigate(`/admin/report/${reportId}`, {
            state: { reportData: result.data, report },
          });
        } else {
          showToast("Error loading report: " + result.error, "error");
        }
      } else if (report.type === "yearly") {
        const result = await Admin.generateYearlyReport();
        if (result.success) {
          navigate("/admin/report/yearly", {
            state: { reportData: result.data, report },
          });
          await loadDashboardData();
        } else {
          showToast("Error loading report: " + result.error, "error");
        }
      }
    } catch (err) {
      console.error("Error viewing report:", err);
      showToast("Error viewing report: " + err.message, "error");
    }
  };

  const handleShareReport = (reportId) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) {
      showToast("Report not found", "error");
      return;
    }

    // Create shareable link
    const shareUrl = `${window.location.origin}/admin/report/${reportId}`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        showToast("Report link copied to clipboard!", "success");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        showToast("Failed to copy link. Please try again.", "error");
      });
  };

  const handleOpenReportGenerator = () => {
    setShowReportModal(true);
    setReportGenerationType("monthly");
  };

const handleCloseReportGenerator = () => {
    setShowReportModal(false);
    setReportGenerationType("monthly");
  };

  const handleConfirmReportGenerate = async () => {
    try {
      setReportGenerating(true);

      if (reportGenerationType === "yearly") {
        const result = await Admin.generateYearlyReport();
        if (result.success) {
          navigate("/admin/report/yearly", {
            state: { reportData: result.data },
          });
          await loadDashboardData();
        } else {
          showToast("Error generating report: " + result.error, "error");
        }
      } else {
        const result = await Admin.generateMonthlyReport();
        if (result.success) {
          const { year, month, reportId } = result.data;
          const reportName = `Monthly Application Report - ${new Date(year, month, 1).toLocaleString("en-US", { month: "short", year: "numeric" })}`;
          navigate(`/admin/report/${reportId}`, {
            state: {
              reportData: result.data,
              report: {
                id: reportId,
                name: reportName,
                type: "monthly",
                generatedOn: new Date().toISOString(),
              },
            },
          });
          await loadDashboardData();
        } else {
          showToast("Error generating report: " + result.error, "error");
        }
      }
    } catch (err) {
      console.error("Error generating report:", err);
      showToast("Error generating report: " + err.message, "error");
    } finally {
      setReportGenerating(false);
      handleCloseReportGenerator();
    }
  };

  /**
   * Format date helper
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "submitted":
      case "underReviewed":
        return "pending";
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      default:
        return "";
    }
  };

  /**
   * Get status display text
   */
  const getStatusDisplayText = (status) => {
    switch (status) {
      case "submitted":
        return "Submitted";
      case "underReviewed":
        return "Under Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "terminated":
        return "Terminated";
      default:
        return status;
    }
  };

  // Pass all data and handlers to View
  return (
    <AdminView
      statistics={statistics}
      applications={applications}
      selectedApplication={selectedApplication}
      reports={reports}
      loading={loading}
      error={error}
      filters={filters}
      activeRecordTab={activeRecordTab}
      activeDetailTab={activeDetailTab}
      reportFilter={reportFilter}
      showStatusModal={showStatusModal}
      statusUpdateApp={statusUpdateApp}
      newStatus={newStatus}
      statusRemarks={statusRemarks}
      updatingStatus={updatingStatus}
      mainApplicantDeceased={mainApplicantDeceased}
      onMainApplicantDeceasedChange={setMainApplicantDeceased}
      terminationProceeds={terminationProceeds}
      loadingProceeds={loadingProceeds}
      approvedAmount={approvedAmount}
      onApprovedAmountChange={handleApprovedAmountChange}
      showTerminationModal={showTerminationModal}
      terminationAction={terminationAction}
      onApproveTermination={handleApproveTermination}
      onRejectTermination={handleRejectTermination}
      onCancelTermination={() => setShowTerminationModal(false)}
      onSearchChange={handleSearchChange}
      onSearch={handleSearch}
      onFilterFieldChange={handleFilterFieldChange}
      onFilterValueChange={handleFilterValueChange}
      onSortChange={handleSortChange}
      onApplicationClick={handleApplicationClick}
      onApproveApplication={handleApproveApplication}
      onUpdateStatus={handleUpdateStatus}
      onReviewApplication={handleReviewApplication}
      onGenerateReport={handleOpenReportGenerator}
      onViewReport={handleViewReport}
      onShareReport={handleShareReport}
      showReportModal={showReportModal}
      reportGenerationType={reportGenerationType}
      reportGenerating={reportGenerating}
      onReportTypeChange={setReportGenerationType}
      onCloseReportModal={handleCloseReportGenerator}
      onConfirmReportGenerate={handleConfirmReportGenerate}
      onRecordTabChange={setActiveRecordTab}
      onDetailTabChange={setActiveDetailTab}
      onReportFilterChange={setReportFilter}
      onStatusChange={setNewStatus}
      onStatusRemarksChange={setStatusRemarks}
      onConfirmStatusUpdate={handleConfirmStatusUpdate}
      onCancelStatusUpdate={handleCancelStatusUpdate}
      formatDate={formatDate}
      getStatusBadgeClass={getStatusBadgeClass}
      getStatusDisplayText={getStatusDisplayText}
    />
  );
}

export default AdminController;
