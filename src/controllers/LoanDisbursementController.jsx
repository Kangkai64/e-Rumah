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
  const [formState, setFormState] = useState({
    amount: "",
    transactionDate: todayIso,
    description: "Loan disbursement payout",
    referenceNumber: "",
  });

  useEffect(() => {
    if (user && userRole === "admin") {
      loadApprovedApplications();
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

  const loadSelectedApplication = async (applicationId) => {
    try {
      const result =
        await LoanDisbursement.getApplicationDisbursementSummary(applicationId);

      if (!result.success) {
        throw new Error(result.error);
      }

      const { summary, records } = result.data;
      setSelectedSummary(summary);
      setDisbursementRecords(records || []);
      setFormState({
        amount: summary.canDisburse ? summary.monthlyAmount.toFixed(2) : "",
        transactionDate: todayIso,
        description: "Loan disbursement payout",
        referenceNumber: "",
      });
    } catch (err) {
      console.error("Failed to load selected application:", err);
      setError("Failed to load the selected application.");
    }
  };

  const handleSelectApplication = (applicationId) => {
    setSelectedApplicationId(applicationId);
  };

  const handleFormChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
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
      const result = await LoanDisbursement.createDisbursement(
        selectedApplicationId,
        {
          amount,
          transactionDate: formState.transactionDate,
          description: formState.description,
          referenceNumber: formState.referenceNumber,
        },
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      await loadApprovedApplications();
      await loadSelectedApplication(selectedApplicationId);
    } catch (err) {
      console.error("Failed to create disbursement:", err);
      setError(err.message || "Failed to record disbursement.");
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
      onSelectApplication={handleSelectApplication}
      onFormChange={handleFormChange}
      onCreateDisbursement={handleCreateDisbursement}
      onBackToDashboard={handleBackToDashboard}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );
}

export default LoanDisbursementController;
