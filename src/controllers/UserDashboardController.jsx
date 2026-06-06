import { useState, useEffect } from "react";
import { useAuth } from "../client_controller/sessionController/AuthContext";
import User from "../models/User";
import LoanStatementView from "../views/LoanStatementView";

const buildDisbursementSchedule = (payoutDetails, disbursements) => {
  const totalMonths = Number(payoutDetails?.totalMonths || 0);
  const startDate = payoutDetails?.startDate;

  if (!startDate || totalMonths <= 0) return [];

  const parsedStartDate = new Date(startDate);
  if (Number.isNaN(parsedStartDate.getTime())) return [];

  const disbursementByMonth = new Map();
  (disbursements || []).forEach((record) => {
    if (!record?.date) return;

    const monthKey = new Date(record.date).toISOString().slice(0, 7);
    disbursementByMonth.set(monthKey, record);
  });

  const currentDate = new Date();

  return Array.from({ length: totalMonths }, (_, index) => {
    const monthDate = new Date(parsedStartDate);
    monthDate.setMonth(parsedStartDate.getMonth() + index);

    const monthKey = monthDate.toISOString().slice(0, 7);
    const record = disbursementByMonth.get(monthKey) || null;
    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1,
    );
    const nextMonthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      1,
    );
    const isPast = nextMonthStart <= currentDate;
    const isCurrent = monthStart <= currentDate && currentDate < nextMonthStart;

    return {
      monthKey,
      monthLabel: monthDate.toLocaleDateString("en-GB", {
        month: "short",
      }),
      year: monthDate.getFullYear(),
      status: record
        ? "disbursed"
        : isPast
          ? "missed"
          : isCurrent
            ? "current"
            : "upcoming",
      amount: record?.amountReceived || 0,
      date: monthDate.toISOString().slice(0, 10),
      referenceNumber: record?.referenceNumber || null,
      description: record?.description || null,
    };
  });
};

function UserDashboardController() {
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    loanOverview: null,
    disbursements: [],
    propertyValue: null,
    payoutDetails: null,
  });

  // Filter states
  const [disbursementFilter, setDisbursementFilter] = useState("last6months");
  const [payoutType, setPayoutType] = useState("monthly");
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [isReestimatingProperty, setIsReestimatingProperty] = useState(false);
  const [propertyEstimateMessage, setPropertyEstimateMessage] = useState("");
  const [propertyEstimateMessageType, setPropertyEstimateMessageType] =
    useState("");

  // Load dashboard data on mount
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  // Reload disbursements when filter changes
  useEffect(() => {
    if (user?.id && !loading) {
      loadDisbursements();
    }
  }, [disbursementFilter]);

  /**
   * Load all dashboard data
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await User.getDashboardData(user.id);
      setDashboardData(data);

      // Set payout type from data if available
      if (data.payoutDetails?.payoutType) {
        setPayoutType(data.payoutDetails.payoutType);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load disbursements with current filter
   */
  const loadDisbursements = async () => {
    try {
      const limit = disbursementFilter === "last6months" ? 6 : 100;
      const disbursements = await User.getDisbursements(user.id, { limit });
      setDashboardData((prev) => ({
        ...prev,
        disbursements,
      }));
    } catch (err) {
      console.error("Failed to load disbursements:", err);
    }
  };

  /**
   * Handle disbursement filter change
   */
  const handleDisbursementFilterChange = (filter) => {
    setDisbursementFilter(filter);
  };

  /**
   * Handle payout type toggle
   */
  const handlePayoutTypeToggle = (type) => {
    setPayoutType(type);
  };

  /**
   * Handle re-estimate property value
   */
  const handleReEstimateProperty = async () => {
    if (!user?.id) return;

    try {
      setIsReestimatingProperty(true);
      setPropertyEstimateMessage("");
      setPropertyEstimateMessageType("");

      const result = await User.reestimatePropertyValue(user.id);
      if (!result.success) {
        throw new Error(result.error);
      }

      setDashboardData((prev) => ({
        ...prev,
        propertyValue: {
          ...prev.propertyValue,
          ...result.data,
        },
      }));
      setPropertyEstimateMessage(
        "Property value refreshed from the latest estimate.",
      );
      setPropertyEstimateMessageType("success");
    } catch (error) {
      console.error("Failed to re-estimate property value:", error);
      setPropertyEstimateMessage(
        error.message ||
          "Failed to re-estimate property value. Please try again.",
      );
      setPropertyEstimateMessageType("error");
    } finally {
      setIsReestimatingProperty(false);
    }
  };

  /**
   * Handle view full schedule
   */
  const handleViewFullSchedule = () => {
    setDisbursementFilter("all");
    setShowFullSchedule((previous) => !previous);
  };

  /**
   * Handle view property history
   */
  const handleViewPropertyHistory = () => {
    // TODO: Navigate to property valuation history page
    console.log("View property history clicked");
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "RM 0";
    return `RM ${parseFloat(amount).toLocaleString("en-MY", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  /**
   * Format date
   */
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Calculate disbursement percentage for chart
   */
  const calculateDisbursementPercentage = () => {
    if (!dashboardData.loanOverview?.totalEligibleAmount) return 0;
    return (
      (dashboardData.loanOverview.disbursedToDate /
        dashboardData.loanOverview.totalEligibleAmount) *
      100
    );
  };

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "status-completed";
      case "scheduled":
      case "upcoming":
        return "status-scheduled";
      case "active & on track":
        return "status-active";
      default:
        return "status-default";
    }
  };

  // Props to pass to view
  const viewProps = {
    loading,
    error,

    // Loan Overview
    loanOverview: dashboardData.loanOverview,
    disbursementPercentage: calculateDisbursementPercentage(),

    // Disbursements
    disbursements: dashboardData.disbursements,
    disbursementFilter,
    onDisbursementFilterChange: handleDisbursementFilterChange,

    // Property Value
    propertyValue: dashboardData.propertyValue,
    onReEstimateProperty: handleReEstimateProperty,
    onViewPropertyHistory: handleViewPropertyHistory,
    isReestimatingProperty,
    propertyEstimateMessage,
    propertyEstimateMessageType,
    showFullSchedule,
    disbursementSchedule: buildDisbursementSchedule(
      dashboardData.payoutDetails,
      dashboardData.disbursements,
    ),

    // Payout Details
    payoutDetails: dashboardData.payoutDetails,
    payoutType,
    onPayoutTypeToggle: handlePayoutTypeToggle,

    // Utility functions
    formatCurrency,
    formatDate,
    getStatusBadgeClass,

    // Actions
    onViewFullSchedule: handleViewFullSchedule,
  };

  return <LoanStatementView {...viewProps} />;
}

export default UserDashboardController;
