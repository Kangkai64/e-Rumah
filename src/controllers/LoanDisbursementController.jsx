import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../client_controller/sessionController/AuthContext";
import LoanDisbursement from "../models/LoanDisbursement";
import LoanDisbursementView from "../views/LoanDisbursementView";

const todayIso = new Date().toISOString().slice(0, 10);

function LoanDisbursementController() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [disbursementRecords, setDisbursementRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingSchedules, setPendingSchedules] = useState([]);
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  const [formState, setFormState] = useState({
    amount: "",
    transactionDate: todayIso,
    description: "Loan disbursement payout",
    referenceNumber: "",
  });

  useEffect(() => {
    if (user && userRole === "admin") {
      loadApprovedApplications();
      loadPendingSchedules();
    } else if (user && userRole && userRole !== "admin") {
      setError("Access denied. Administrator role required.");
      setLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (selectedApplicationId) {
      loadSelectedApplication(selectedApplicationId);
    }
  }, [selectedApplicationId]);

  const loadApprovedApplications = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await LoanDisbursement.getApprovedApplications();

      if (!result.success) {
        throw new Error(result.error);
      }

      const applications = result.data || [];
      setApprovedApplications(applications);

      if (applications.length > 0) {
        setSelectedApplicationId(
          (currentId) => currentId || applications[0].applicationId,
        );
      } else {
        setSelectedApplicationId("");
        setSelectedSummary(null);
        setDisbursementRecords([]);
      }
    } catch (err) {
      console.error("Failed to load approved applications:", err);
      setError("Failed to load approved applications.");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedApplication = async (applicationId, options = {}) => {
    const { forceSuggestion = false } = options;
    try {
      const result =
        await LoanDisbursement.getApplicationDisbursementSummary(applicationId);

      if (!result.success) {
        throw new Error(result.error);
      }

      const { summary, records } = result.data;
      setSelectedSummary(summary);
      setDisbursementRecords(records || []);

      // Skip the client-computed suggestion when a "Review" click on the
      // auto-scheduled queue already pre-filled the form from the persisted
      // schedule row - that's the source of truth being confirmed. After a
      // submit resolves (forceSuggestion), always refresh to the next suggestion.
      if (forceSuggestion || !activeScheduleId) {
        const catchUpDesc =
          summary.missedMonths > 0
            ? `Catch-up disbursement (${summary.missedMonths} missed + current month)`
            : "Loan disbursement payout";
        setFormState({
          amount: summary.canDisburse ? summary.suggestedAmount.toFixed(2) : "",
          transactionDate: summary.nextSuggestedDate || todayIso,
          description: catchUpDesc,
          referenceNumber: "",
        });
      }
    } catch (err) {
      console.error("Failed to load selected application:", err);
      setError("Failed to load the selected application.");
    }
  };

  const handleSelectApplication = (applicationId) => {
    setActiveScheduleId(null);
    setSelectedApplicationId(applicationId);
  };

  const handleFormChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const loadPendingSchedules = async () => {
    try {
      const result = await LoanDisbursement.getPendingSchedules();
      if (!result.success) {
        throw new Error(result.error);
      }
      setPendingSchedules(result.data || []);
    } catch (err) {
      console.error("Failed to load pending disbursement schedules:", err);
    }
  };

  const handleReviewSchedule = (schedule) => {
    setActiveScheduleId(schedule.id);
    setSelectedApplicationId(schedule.applicationId);
    setFormState({
      amount: schedule.amount.toFixed(2),
      transactionDate: schedule.scheduledDate,
      description: `Auto-scheduled disbursement #${schedule.disbursementNumber}`,
      referenceNumber: "",
    });

    setTimeout(() => {
      const el = document.getElementById("disbursement-form-section");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const handleSkipSchedule = async (scheduleId) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await LoanDisbursement.skipScheduledDisbursement(
        scheduleId,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      if (activeScheduleId === scheduleId) {
        setActiveScheduleId(null);
      }
      await loadPendingSchedules();
    } catch (err) {
      console.error("Failed to skip scheduled disbursement:", err);
      setError(err.message || "Failed to skip the scheduled disbursement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDisbursement = async () => {
    if (!selectedApplicationId) return;

    const amount = Number(formState.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid disbursement amount.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        amount,
        transactionDate: formState.transactionDate,
        description: formState.description,
        referenceNumber: formState.referenceNumber,
      };

      const result = activeScheduleId
        ? await LoanDisbursement.confirmScheduledDisbursement(
            activeScheduleId,
            user.id,
            payload,
          )
        : await LoanDisbursement.createDisbursement(
            selectedApplicationId,
            payload,
          );

      if (!result.success) {
        throw new Error(result.error);
      }

      setActiveScheduleId(null);
      await loadApprovedApplications();
      await loadSelectedApplication(selectedApplicationId, {
        forceSuggestion: true,
      });
      await loadPendingSchedules();
    } catch (err) {
      console.error("Failed to create disbursement:", err);
      setError(err.message || "Failed to record disbursement.");
      // A failed confirm (e.g. "already resolved" from a race with another
      // admin/tab) means the schedule's status changed underneath us - refresh
      // the pending list so the stale row doesn't linger in the UI.
      if (activeScheduleId) {
        await loadPendingSchedules();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/admin/dashboard");
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

  return (
    <LoanDisbursementView
      loading={loading || authLoading}
      error={error}
      approvedApplications={approvedApplications}
      selectedApplicationId={selectedApplicationId}
      selectedSummary={selectedSummary}
      disbursementRecords={disbursementRecords}
      formState={formState}
      submitting={submitting}
      pendingSchedules={pendingSchedules}
      activeScheduleId={activeScheduleId}
      onSelectApplication={handleSelectApplication}
      onFormChange={handleFormChange}
      onCreateDisbursement={handleCreateDisbursement}
      onReviewSchedule={handleReviewSchedule}
      onSkipSchedule={handleSkipSchedule}
      onBackToDashboard={handleBackToDashboard}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );
}

export default LoanDisbursementController;
