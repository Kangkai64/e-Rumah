import { useState } from "react";
import "../client_controller/user/UserProfileView.css";

const MALAYSIAN_BANKS = [
  "Maybank",
  "CIMB Bank",
  "Public Bank",
  "RHB Bank",
  "Hong Leong Bank",
  "AmBank",
  "Bank Islam",
  "Bank Rakyat",
  "Affin Bank",
  "Alliance Bank",
  "OCBC Bank",
  "Standard Chartered",
  "HSBC Bank",
  "Other",
];

const NAME_REGEX = /^[a-zA-Z\s/'-]+$/;
const DIGITS_ONLY = /^\d+$/;

const BANK_ACCOUNT_RULES = {
  "Maybank":           { min: 12, max: 12 },
  "CIMB Bank":         { min: 14, max: 14 },
  "Public Bank":       { min: 10, max: 10 },
  "RHB Bank":          { min: 14, max: 14 },
  "Hong Leong Bank":   { min: 10, max: 10 },
  "AmBank":            { min: 14, max: 14 },
  "Bank Islam":        { min: 16, max: 16 },
  "Bank Rakyat":       { min: 12, max: 12 },
  "Affin Bank":        { min: 12, max: 12 },
  "Alliance Bank":     { min: 12, max: 12 },
  "OCBC Bank":         { min: 10, max: 10 },
  "Standard Chartered":{ min: 10, max: 12 },
  "HSBC Bank":         { min: 12, max: 12 },
};

function validateAccountNumber(accNum, bankName) {
  if (!accNum) return "Account number is required.";
  if (!DIGITS_ONLY.test(accNum)) return "Account number must contain digits only.";

  const rule = BANK_ACCOUNT_RULES[bankName];
  if (rule) {
    if (rule.min === rule.max) {
      if (accNum.length !== rule.min)
        return `${bankName} account numbers must be exactly ${rule.min} digits.`;
    } else {
      if (accNum.length < rule.min || accNum.length > rule.max)
        return `${bankName} account numbers must be ${rule.min}–${rule.max} digits.`;
    }
  } else {
    if (accNum.length < 5 || accNum.length > 20)
      return "Account number must be between 5 and 20 digits.";
  }

  return null;
}

function validate(form) {
  const errors = {};

  const name = form.accountHolderName.trim();
  if (!name) {
    errors.accountHolderName = "Account holder name is required.";
  } else if (!NAME_REGEX.test(name)) {
    errors.accountHolderName = "Name must contain letters only.";
  } else if (name.length < 2) {
    errors.accountHolderName = "Name is too short.";
  }

  if (!form.bankName) {
    errors.bankName = "Please select a bank.";
  } else if (form.bankName === "Other" && !form.otherBankName.trim()) {
    errors.otherBankName = "Please enter your bank name.";
  }

  const accError = validateAccountNumber(
    form.bankAccountNumber.trim(),
    form.bankName === "Other" ? "Other" : form.bankName,
  );
  if (accError) errors.bankAccountNumber = accError;

  return errors;
}

function BankDetailsModal({
  onSave,
  onDismiss,
  submitting,
  error,
}) {
  const [form, setForm] = useState({
    accountHolderName: "",
    bankName: "",
    otherBankName: "",
    bankAccountNumber: "",
    accountType: "Savings",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === "bankAccountNumber") {
      const rule = BANK_ACCOUNT_RULES[form.bankName === "Other" ? "" : form.bankName];
      value = value.replace(/\D/g, "");
      if (rule) value = value.slice(0, rule.max);
    }

    const updated = { ...form, [name]: value };
    // Clear account number error when bank changes (different length rule)
    if (name === "bankName") updated.bankAccountNumber = "";
    setForm(updated);
    if (touched[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validate(updated)[name] || null,
        ...(name === "bankName" ? { bankAccountNumber: null } : {}),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validate(form)[name] || null,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({
        accountHolderName: true,
        bankName: true,
        otherBankName: true,
        bankAccountNumber: true,
      });
      return;
    }
    const payload = {
      ...form,
      bankName: form.bankName === "Other" ? form.otherBankName.trim() : form.bankName,
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Bank Details Required</h2>
          <p className="modal-subtitle">
            Your application is approved. Please provide your bank account
            details so we can process your loan disbursements.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="modal-form">
          <div className="form-group">
            <label htmlFor="accountHolderName">Account Holder Name</label>
            <input
              id="accountHolderName"
              name="accountHolderName"
              type="text"
              value={form.accountHolderName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Full name as in bank account"
              disabled={submitting}
              className={fieldErrors.accountHolderName ? "input-error" : ""}
            />
            {fieldErrors.accountHolderName && (
              <p className="field-error">{fieldErrors.accountHolderName}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="bankName">Bank</label>
            <select
              id="bankName"
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              className={fieldErrors.bankName ? "input-error" : ""}
            >
              <option value="">Select a bank</option>
              {MALAYSIAN_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
            {fieldErrors.bankName && (
              <p className="field-error">{fieldErrors.bankName}</p>
            )}
          </div>

          {form.bankName === "Other" && (
            <div className="form-group">
              <label htmlFor="otherBankName">Bank Name</label>
              <input
                id="otherBankName"
                name="otherBankName"
                type="text"
                value={form.otherBankName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your bank name"
                disabled={submitting}
                className={fieldErrors.otherBankName ? "input-error" : ""}
              />
              {fieldErrors.otherBankName && (
                <p className="field-error">{fieldErrors.otherBankName}</p>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="bankAccountNumber">Account Number</label>
            <input
              id="bankAccountNumber"
              name="bankAccountNumber"
              type="text"
              inputMode="numeric"
              value={form.bankAccountNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 1234567890"
              disabled={submitting}
              maxLength={BANK_ACCOUNT_RULES[form.bankName]?.max}
              className={fieldErrors.bankAccountNumber ? "input-error" : ""}
            />
            {fieldErrors.bankAccountNumber && (
              <p className="field-error">{fieldErrors.bankAccountNumber}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="accountType">Account Type</label>
            <select
              id="accountType"
              name="accountType"
              value={form.accountType}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
            </select>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn-secondary"
              onClick={onDismiss}
              disabled={submitting}
            >
              Maybe Later
            </button>
            <button
              type="submit"
              className="modal-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserProfileView({
  loading,
  error,
  loanOverview,
  disbursementPercentage,
  disbursements,
  disbursementFilter,
  onDisbursementFilterChange,
  payoutDetails,
  payoutType,
  onPayoutTypeToggle,
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
  onViewFullSchedule,
  showFullSchedule,
  disbursementSchedule = [],
  showBankDetailsModal,
  onSaveBankDetails,
  onDismissBankDetailsModal,
  bankDetailsSubmitting,
  bankDetailsError,
  auctionOffers = [],
  onAcceptOffer,
  acceptingOfferId,
  auctionError,
}) {
  const scheduleByYear = disbursementSchedule.reduce((accumulator, entry) => {
    if (!accumulator[entry.year]) {
      accumulator[entry.year] = [];
    }

    accumulator[entry.year].push(entry);
    return accumulator;
  }, {});

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="loading-container">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-dashboard">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>

        <div className="dashboard-content">
          {/* Provider Auction Offers - shown only while the application is open for bidding */}
          {auctionOffers.length > 0 && (
            <div className="auction-offers-section">
              <h2 className="card-title">Offers Awaiting Your Decision</h2>
              <p className="auction-offers-intro">
                {auctionOffers.length} reverse mortgage provider(s) have
                submitted a competing offer. Accepting an offer is final and
                declines every other offer.
              </p>
              {auctionError && (
                <p className="error-message">{auctionError}</p>
              )}
              <div className="auction-offers-list">
                {auctionOffers.map((offer) => (
                  <div key={offer.id} className="auction-offer-card">
                    <div className="auction-offer-details">
                      <strong>{offer.providerName || "Provider"}</strong>
                      <span>Amount: {formatCurrency(offer.offerAmount)}</span>
                      {offer.interestRate !== null && (
                        <span>Rate: {offer.interestRate}% p.a.</span>
                      )}
                      <span>Term: {offer.loanTermMonths} months</span>
                      {offer.notes && <span>Notes: {offer.notes}</span>}
                    </div>
                    <button
                      className="auction-accept-btn"
                      onClick={() => onAcceptOffer(offer.id)}
                      disabled={acceptingOfferId === offer.id}
                    >
                      {acceptingOfferId === offer.id
                        ? "Accepting..."
                        : "Accept this offer"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loan Overview Section */}
          <div className="loan-overview-section">
            <div className="loan-overview-card">
              <h2 className="card-title">Loan Overview</h2>

              {/* Pie Chart */}
              <div className="loan-chart-container">
                <div className="pie-chart">
                  <svg width="256" height="256" viewBox="0 0 256 256">
                    <circle
                      cx="128"
                      cy="128"
                      r="100"
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="36"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="100"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="36"
                      strokeDasharray={`${disbursementPercentage * 5.65} 565`}
                      strokeDashoffset="141.25"
                      transform="rotate(-90 128 128)"
                    />
                    {/* Center white circle */}
                    <circle cx="128" cy="128" r="100" fill="white" />
                  </svg>

                  <div className="chart-center-details">
                    <p className="chart-label">Total Eligible Amount</p>
                    <p className="chart-amount">
                      {formatCurrency(loanOverview?.totalEligibleAmount || 0)}
                    </p>
                    <p className="chart-date">
                      Updated as at{" "}
                      {loanOverview?.approvedAt
                        ? formatDate(loanOverview.approvedAt)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Status Badge */}
              <div className="loan-status-container">
                <span
                  className={`loan-status-badge ${getStatusBadgeClass(loanOverview?.status)}`}
                >
                  {loanOverview?.status || "No Active Loan"}
                </span>
              </div>

              {/* Disbursed and Remaining */}
              <div className="loan-summary">
                <div className="loan-summary-item">
                  <p className="summary-label">Disbursed to-date</p>
                  <p className="summary-amount">
                    {formatCurrency(loanOverview?.disbursedToDate || 0)}
                  </p>
                </div>
                <div className="loan-summary-item">
                  <p className="summary-label">Remaining balance</p>
                  <p className="summary-amount">
                    {formatCurrency(loanOverview?.remainingBalance || 0)}
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="loan-footer">
                <button className="link-button" onClick={onViewFullSchedule}>
                  {showFullSchedule
                    ? "Hide full schedule"
                    : "View full schedule"}
                </button>
                <p className="property-details">
                  <span>Property Type: </span>
                  {loanOverview?.propertyDetails?.propertyType || "N/A"}
                  <br></br>
                  <span>Address: </span>
                  {loanOverview?.propertyDetails?.address || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {showFullSchedule && (
            <div className="schedule-section">
              <div className="schedule-card">
                <div className="schedule-header">
                  <div>
                    <h3>Full Disbursement Schedule</h3>
                    <p>
                      Months marked in green have already been disbursed. Amber
                      shows the current month, and grey indicates months still
                      ahead.
                    </p>
                  </div>
                  <div className="schedule-legend">
                    <span className="legend-item">
                      <span className="legend-swatch legend-disbursed"></span>
                      Disbursed
                    </span>
                    <span className="legend-item">
                      <span className="legend-swatch legend-current"></span>
                      Current
                    </span>
                    <span className="legend-item">
                      <span className="legend-swatch legend-upcoming"></span>
                      Upcoming
                    </span>
                  </div>
                </div>

                {disbursementSchedule.length > 0 ? (
                  <div className="schedule-years">
                    {Object.entries(scheduleByYear).map(([year, months]) => (
                      <div key={year} className="schedule-year-block">
                        <div className="schedule-year-label">{year}</div>
                        <div className="schedule-month-grid">
                          {months.map((entry) => (
                            <div
                              key={entry.monthKey}
                              className={`schedule-month schedule-${entry.status}`}
                              title={
                                entry.referenceNumber
                                  ? `${entry.monthLabel} ${year} - ${entry.referenceNumber}`
                                  : `${entry.monthLabel} ${year}`
                              }
                            >
                              <span className="schedule-month-label">
                                {entry.monthLabel}
                              </span>
                              <span className="schedule-month-status">
                                {entry.status === "disbursed"
                                  ? "Disbursed"
                                  : entry.status === "current"
                                    ? "Current"
                                    : entry.status === "missed"
                                      ? "Pending"
                                      : "Upcoming"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="schedule-empty">
                    No schedule data is available yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Financial Monitoring Section */}
          <div className="financial-monitoring-section">
            {/* Loan Disbursement Monitoring */}
            <div className="disbursement-card">
              <div className="card-header">
                <div className="card-title-section">
                  <h3>Loan Disbursement Monitoring</h3>
                  <p className="card-subtitle">
                    Track the transaction records for every payout released to
                    your loan.
                  </p>
                </div>
                <div className="filter-controls">
                  <span className="filter-label">Filter</span>
                  <button
                    className={`filter-button ${disbursementFilter === "last6months" ? "active" : ""}`}
                    onClick={() => onDisbursementFilterChange("last6months")}
                  >
                    Last 6 months
                  </button>
                  <button
                    className={`filter-button ${disbursementFilter === "all" ? "active" : ""}`}
                    onClick={() => onDisbursementFilterChange("all")}
                  >
                    View all
                  </button>
                </div>
              </div>

              <div className="disbursement-table">
                <div className="table-header">
                  <span>Date</span>
                  <span>Reference</span>
                  <span>Description</span>
                  <span>Amount Received</span>
                  <span>Remaining</span>
                  <span>Status</span>
                </div>

                {disbursements && disbursements.length > 0 ? (
                  disbursements.map((record, index) => (
                    <div key={index} className="table-row">
                      <span className="row-date">
                        {formatDate(record.date)}
                      </span>
                      <span className="row-reference">
                        {record.referenceNumber || "N/A"}
                      </span>
                      <span className="row-description">
                        {record.description || "Loan disbursement payout"}
                      </span>
                      <span className="row-amount">
                        {formatCurrency(record.amountReceived)}
                      </span>
                      <span className="row-remaining">
                        {formatCurrency(record.remaining)}
                      </span>
                      <span
                        className={`status-badge ${getStatusBadgeClass(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="table-row">
                    <span
                      className="no-data"
                      style={{ gridColumn: "1 / -1", textAlign: "center" }}
                    >
                      {loanOverview?.hasLoan
                        ? "No disbursement records found"
                        : "No disbursements yet — payout records will appear here once you have an approved loan application."}
                    </span>
                  </div>
                )}

                {/* Upcoming disbursement (from payoutDetails) */}
                {loanOverview?.hasLoan &&
                  (() => {
                    const upcomingAmount = payoutDetails?.monthlyAmount || 2500;
                    const upcomingRemaining = Math.max(
                      (loanOverview?.remainingBalance || 0) - upcomingAmount,
                      0,
                    );

                    return (
                      <div className="table-row">
                        <span className="row-date">
                          {payoutDetails?.nextPayoutDate
                            ? `Upcoming — ${formatDate(payoutDetails.nextPayoutDate)}`
                            : "Upcoming"}
                        </span>
                        <span className="row-reference">N/A</span>
                        <span className="row-description">
                          Scheduled payout
                        </span>
                        <span className="row-amount">
                          {formatCurrency(upcomingAmount)}
                        </span>
                        <span className="row-remaining">
                          {formatCurrency(upcomingRemaining)}
                        </span>
                        <span
                          className={`status-badge ${getStatusBadgeClass("scheduled")}`}
                        >
                          Scheduled
                        </span>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>

          {/* Payout Details Section */}
          <div className="payout-details-section">
            <div className="payout-card">
              <div className="payout-header">
                <h3>Payout Details</h3>
              </div>

              <div className="payout-content">
                {loanOverview?.hasLoan ? (
                  <div className="payout-info-section">
                    <div className="payout-info-left">
                      <p className="info-label">Estimated monthly payout</p>
                      <p className="info-amount">
                        {formatCurrency(payoutDetails?.monthlyAmount || 0)}
                      </p>
                      <p className="info-period">
                        {payoutDetails?.startDate && payoutDetails?.endDate
                          ? `From ${formatDate(payoutDetails.startDate)} to ${formatDate(payoutDetails.endDate)} (${payoutDetails?.totalMonths || 0} months)`
                          : "Payout period not yet available."}
                      </p>
                      {payoutDetails?.providerName && (
                        <p className="info-period">
                          via {payoutDetails.providerName}
                          {payoutDetails?.interestRate
                            ? ` · ${payoutDetails.interestRate}% p.a.`
                            : ""}
                        </p>
                      )}
                    </div>

                    <div className="payout-info-right">
                      <p className="info-label">Next payout date</p>
                      <p className="info-next-date">
                        {payoutDetails?.nextPayoutDate
                          ? formatDate(payoutDetails.nextPayoutDate)
                          : "Not yet scheduled"}
                      </p>
                      <p className="info-bank">
                        Deposited into{" "}
                        {payoutDetails?.bankAccount ||
                          "No bank account details available."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">
                    No payout schedule yet — this will populate once your
                    application is approved and your loan disbursement plan is
                    set up.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBankDetailsModal && (
        <BankDetailsModal
          onSave={onSaveBankDetails}
          onDismiss={onDismissBankDetailsModal}
          submitting={bankDetailsSubmitting}
          error={bankDetailsError}
        />
      )}
    </div>
  );
}

export default UserProfileView;
