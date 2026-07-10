import { useEffect, useState } from "react";
import { useAuth } from "../client_controller/sessionController/AuthContext";
import LoanOffer from "../models/LoanOffer";
import ProviderView from "../views/ProviderView";

const emptyOfferForm = () => ({
  offerAmount: "",
  interestRate: "",
  loanTermMonths: "240",
  notes: "",
});

function ProviderController() {
  const { user, userRole, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [offerForms, setOfferForms] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    if (user && userRole === "provider") {
      loadDashboardData();
    } else if (user && userRole && userRole !== "provider") {
      setError("Access denied. Provider role required.");
      setLoading(false);
    }
  }, [user, userRole]);

  // Subscribe to real-time changes so new auctions and offer decisions
  // (accepted/rejected by an applicant) show up without a page reload
  useEffect(() => {
    if (!(user && userRole === "provider")) return;

    const subscription = LoanOffer.subscribeToProviderDashboard(
      user.id,
      () => loadDashboardData({ silent: true }),
    );

    return () => {
      LoanOffer.unsubscribeFromProviderDashboard(subscription);
    };
  }, [user, userRole]);

  const loadDashboardData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const [applicationsResult, offersResult] = await Promise.all([
        LoanOffer.getAuctioningApplications(),
        LoanOffer.getProviderOffers(user.id),
      ]);

      if (!applicationsResult.success) throw new Error(applicationsResult.error);
      if (!offersResult.success) throw new Error(offersResult.error);

      setApplications(applicationsResult.data || []);
      setMyOffers(offersResult.data || []);
    } catch (err) {
      console.error("Failed to load provider dashboard:", err);
      setError(err.message || "Failed to load applications open for auction.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getOfferFormState = (applicationId) =>
    offerForms[applicationId] || emptyOfferForm();

  const handleOfferFieldChange = (applicationId, field, value) => {
    setOfferForms((current) => ({
      ...current,
      [applicationId]: {
        ...emptyOfferForm(),
        ...current[applicationId],
        [field]: value,
      },
    }));
  };

  const handleSubmitOffer = async (applicationId) => {
    const application = applications.find((app) => app.id === applicationId);
    const form = getOfferFormState(applicationId);
    const amount = Number(form.offerAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid offer amount.");
      return;
    }

    if (application && amount < application.approvedAmount) {
      setError(
        "Your offer must be at least the applicant's approved ceiling amount.",
      );
      return;
    }

    setSubmittingId(applicationId);
    setError(null);

    try {
      const result = await LoanOffer.submitOffer(user.id, applicationId, {
        offerAmount: amount,
        interestRate: form.interestRate,
        loanTermMonths: form.loanTermMonths,
        notes: form.notes,
      });

      if (!result.success) throw new Error(result.error);

      await loadDashboardData();
    } catch (err) {
      console.error("Failed to submit offer:", err);
      setError(err.message || "Failed to submit offer.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleWithdrawOffer = async (offerId) => {
    setSubmittingId(offerId);
    setError(null);

    try {
      const result = await LoanOffer.withdrawOffer(offerId, user.id);
      if (!result.success) throw new Error(result.error);

      await loadDashboardData();
    } catch (err) {
      console.error("Failed to withdraw offer:", err);
      setError(err.message || "Failed to withdraw offer.");
    } finally {
      setSubmittingId(null);
    }
  };

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    return `RM ${value.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const offersByApplicationId = myOffers.reduce((map, offer) => {
    if (offer.status !== "withdrawn") {
      map[offer.applicationId] = offer;
    }
    return map;
  }, {});

  return (
    <ProviderView
      loading={loading || authLoading}
      error={error}
      applications={applications}
      myOffers={myOffers}
      offersByApplicationId={offersByApplicationId}
      offerForms={offerForms}
      submittingId={submittingId}
      getOfferFormState={getOfferFormState}
      onOfferFieldChange={handleOfferFieldChange}
      onSubmitOffer={handleSubmitOffer}
      onWithdrawOffer={handleWithdrawOffer}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );
}

export default ProviderController;
