import { useState, useEffect } from "react";
import { useAuth } from "../client_controller/sessionController/AuthContext";
import User from "../models/User";
import LoanDisbursement from "../models/LoanDisbursement";
import LoanOffer from "../models/LoanOffer";
import Provider from "../models/Provider";
import LoanStatementView from "../views/LoanStatementView";
import { sendOfferAcceptedEmail } from "../services/emailService";

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

  // Bank details modal states
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [bankDetailsSubmitting, setBankDetailsSubmitting] = useState(false);
  const [bankDetailsError, setBankDetailsError] = useState(null);

  // Provider auction states - offers awaiting the applicant's decision
  const [auctionOffers, setAuctionOffers] = useState([]);
  const [acceptingOfferId, setAcceptingOfferId] = useState(null);
  const [auctionError, setAuctionError] = useState(null);

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

  // Subscribe to real-time offer changes while the application is auctioning,
  // so competing provider offers appear without a page reload
  useEffect(() => {
    const applicationId = dashboardData.loanOverview?.applicationId;
    if (!dashboardData.loanOverview?.isAuctioning || !applicationId) return;

    const subscription = LoanOffer.subscribeToApplicationOffers(
      applicationId,
      async () => {
        const offersResult =
          await LoanOffer.getOffersForApplication(applicationId);
        setAuctionOffers(offersResult.success ? offersResult.data : []);
      },
    );

    return () => {
      LoanOffer.unsubscribeFromApplicationOffers(subscription);
    };
  }, [
    dashboardData.loanOverview?.isAuctioning,
    dashboardData.loanOverview?.applicationId,
  ]);

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

      // Prompt for bank details when approved but none on file
      if (data.loanOverview?.hasLoan && !data.payoutDetails?.bankDetails) {
        setShowBankDetailsModal(true);
      }

      // Load competing provider offers when the application is open for auction
      if (data.loanOverview?.isAuctioning && data.loanOverview?.applicationId) {
        const offersResult = await LoanOffer.getOffersForApplication(
          data.loanOverview.applicationId,
        );
        setAuctionOffers(offersResult.success ? offersResult.data : []);
      } else {
        setAuctionOffers([]);
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
   * Save bank details submitted from the modal
   */
  const handleSaveBankDetails = async (formData) => {
    if (!user?.id) return;

    setBankDetailsSubmitting(true);
    setBankDetailsError(null);

    try {
      const result = await LoanDisbursement.saveBankDetails(user.id, formData);
      if (!result.success) throw new Error(result.error);

      // Refresh payout details to reflect the new bank account
      const payoutDetails = await User.getPayoutDetails(user.id);
      setDashboardData((prev) => ({ ...prev, payoutDetails }));
      setShowBankDetailsModal(false);
    } catch (err) {
      setBankDetailsError(
        err.message || "Failed to save bank details. Please try again.",
      );
    } finally {
      setBankDetailsSubmitting(false);
    }
  };

  /**
   * Accept a competing provider offer - irreversible, rejects every other
   * submitted offer and returns the application to 'approved' with the
   * accepted offer's terms.
   */
  const handleAcceptOffer = async (offerId) => {
    if (!user?.id) return;

    if (
      !window.confirm(
        "Accept this offer? This cannot be undone and every other offer will be declined.",
      )
    ) {
      return;
    }

    const acceptedOffer = auctionOffers.find((offer) => offer.id === offerId);

    setAcceptingOfferId(offerId);
    setAuctionError(null);

    try {
      const result = await LoanOffer.acceptOffer(offerId);
      if (!result.success) throw new Error(result.error);

      notifyWinningProvider(acceptedOffer);
      await loadDashboardData();
    } catch (err) {
      console.error("Failed to accept offer:", err);
      setAuctionError(err.message || "Failed to accept offer. Please try again.");
    } finally {
      setAcceptingOfferId(null);
    }
  };

  /**
   * Fire-and-forget: email the winning provider once their offer is
   * accepted. Never blocks or fails the acceptance action.
   */
  const notifyWinningProvider = async (offer) => {
    if (!offer?.providerId) return;

    try {
      const providerResult = await Provider.getProfile(offer.providerId);
      if (!providerResult.success || !providerResult.data) return;

      await sendOfferAcceptedEmail({
        recipientEmail: providerResult.data.email,
        recipientName: providerResult.data.company_name,
        offerAmount: offer.offerAmount,
      });
    } catch (err) {
      console.warn("Failed to notify winning provider:", err);
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
      case "offers awaiting your decision":
        return "status-auctioning";
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

    // Provider auction - offers awaiting the applicant's decision
    auctionOffers,
    onAcceptOffer: handleAcceptOffer,
    acceptingOfferId,
    auctionError,

    // Utility functions
    formatCurrency,
    formatDate,
    getStatusBadgeClass,

    // Actions
    onViewFullSchedule: handleViewFullSchedule,

    // Bank details modal
    showBankDetailsModal,
    onSaveBankDetails: handleSaveBankDetails,
    onDismissBankDetailsModal: () => setShowBankDetailsModal(false),
    bankDetailsSubmitting,
    bankDetailsError,
  };

  return <LoanStatementView {...viewProps} />;
}

export default UserDashboardController;
