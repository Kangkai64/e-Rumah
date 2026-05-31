import "../client_controller/admin/LoanDisbursementView.css";

function LoanDisbursementView({
  loading,
  error,
  approvedApplications,
  selectedApplicationId,
  selectedSummary,
  disbursementRecords,
  formState,
  submitting,
  onSelectApplication,
  onFormChange,
  onCreateDisbursement,
  onBackToDashboard,
  formatCurrency,
  formatDate,
}) {
  if (loading) {
    return (
      <div className="loan-disbursement-page">
        <div className="loan-disbursement-loading">
          Loading disbursement records...
        </div>
      </div>
    );
  }

  return (
    <div className="loan-disbursement-page">
      <div className="loan-disbursement-shell">
        <div className="loan-disbursement-hero">
          <div>
            <p className="loan-disbursement-kicker">
              Approved application ledger
            </p>
            <h1>Loan Disbursement Management</h1>
            <p className="loan-disbursement-intro">
              Record payouts only for approved applications and track the
              remaining balance in one place.
            </p>
          </div>
          <button
            className="loan-disbursement-back-btn"
            onClick={onBackToDashboard}
          >
            Back to dashboard
          </button>
        </div>

        {error && <div className="loan-disbursement-error">{error}</div>}

        <div className="loan-disbursement-summary-grid">
          <div className="summary-card accent">
            <span className="summary-label">Approved applications</span>
            <strong>{approvedApplications.length}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Disbursed to-date</span>
            <strong>
              {formatCurrency(selectedSummary?.totalDisbursed || 0)}
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Remaining balance</span>
            <strong>
              {formatCurrency(selectedSummary?.remainingBalance || 0)}
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Next payout target</span>
            <strong>
              {selectedSummary?.nextSuggestedDate
                ? formatDate(selectedSummary.nextSuggestedDate)
                : "N/A"}
            </strong>
          </div>
        </div>

        <div className="loan-disbursement-layout">
          <section className="application-list-card">
            <div className="card-heading">
              <h2>Approved Applications</h2>
              <p>Choose the loan you want to disburse against.</p>
            </div>

            {approvedApplications.length === 0 ? (
              <div className="empty-state">No approved applications found.</div>
            ) : (
              <div className="application-list">
                {approvedApplications.map((application) => (
                  <button
                    key={application.applicationId}
                    className={`application-item ${selectedApplicationId === application.applicationId ? "active" : ""}`}
                    onClick={() =>
                      onSelectApplication(application.applicationId)
                    }
                  >
                    <div>
                      <strong>{application.applicantName}</strong>
                      <span>{application.propertyType}</span>
                    </div>
                    <div className="application-meta">
                      <span>
                        {formatCurrency(application.remainingBalance || 0)}{" "}
                        remaining
                      </span>
                      <small>{application.propertyAddress}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="selected-application-card">
            <div className="card-heading">
              <h2>Selected Application</h2>
              <p>Record a payout and review the live balance.</p>
            </div>

            {selectedSummary ? (
              <>
                <div className="selected-summary-grid">
                  <div>
                    <span className="summary-label">Applicant</span>
                    <strong>{selectedSummary.applicantName}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Approved on</span>
                    <strong>{formatDate(selectedSummary.approvedAt)}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Approved amount</span>
                    <strong>
                      {formatCurrency(selectedSummary.approvedAmount || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="summary-label">Monthly amount</span>
                    <strong>
                      {formatCurrency(selectedSummary.monthlyAmount || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="summary-label">Total disbursed</span>
                    <strong>
                      {formatCurrency(selectedSummary.totalDisbursed || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="summary-label">Remaining</span>
                    <strong>
                      {formatCurrency(selectedSummary.remainingBalance || 0)}
                    </strong>
                  </div>
                </div>

                <div className="disbursement-form-card">
                  <div className="card-heading compact">
                    <h3>Record Disbursement</h3>
                    <p>
                      Create a payout transaction for the selected approved
                      application.
                    </p>
                  </div>

                  <div className="form-grid">
                    <label>
                      Amount (RM)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.amount}
                        onChange={(e) => onFormChange("amount", e.target.value)}
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      Transaction date
                      <input
                        type="date"
                        value={formState.transactionDate}
                        onChange={(e) =>
                          onFormChange("transactionDate", e.target.value)
                        }
                      />
                    </label>
                    <label className="full-width">
                      Reference number
                      <input
                        type="text"
                        value={formState.referenceNumber}
                        onChange={(e) =>
                          onFormChange("referenceNumber", e.target.value)
                        }
                        placeholder="Optional manual reference"
                      />
                    </label>
                    <label className="full-width">
                      Description
                      <textarea
                        rows="3"
                        value={formState.description}
                        onChange={(e) =>
                          onFormChange("description", e.target.value)
                        }
                        placeholder="Loan disbursement payout"
                      />
                    </label>
                  </div>

                  <button
                    className="create-disbursement-btn"
                    onClick={onCreateDisbursement}
                    disabled={submitting || !selectedSummary.canDisburse}
                  >
                    {submitting
                      ? "Recording..."
                      : selectedSummary.canDisburse
                        ? "Record Disbursement"
                        : "Fully Disbursed"}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                Select an approved application to continue.
              </div>
            )}
          </section>
        </div>

        <section className="history-card">
          <div className="card-heading">
            <h2>Disbursement History</h2>
            <p>Latest payout transactions for the selected application.</p>
          </div>

          <div className="history-table">
            <div className="history-table-head">
              <span>Date</span>
              <span>Reference</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            {disbursementRecords.length > 0 ? (
              disbursementRecords.map((record) => (
                <div key={record.id} className="history-table-row">
                  <span>{formatDate(record.transactionDate)}</span>
                  <span>{record.referenceNumber || "N/A"}</span>
                  <span>
                    {record.description || "Loan disbursement payout"}
                  </span>
                  <span>{formatCurrency(record.amount)}</span>
                  <span className="status-pill">{record.status}</span>
                </div>
              ))
            ) : (
              <div className="empty-state inline">
                No disbursement transactions recorded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoanDisbursementView;
