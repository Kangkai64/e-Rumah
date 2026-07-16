/// Admin View
// Presentational component for admin dashboard
// Receives ALL data and handlers via props from AdminController
// NO business logic, NO state management (except local UI state), NO model imports

import "../client_controller/admin/AdminView.css";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import { useAuth } from "../client_controller/sessionController/AuthContext";

function AdminView({
  statistics,
  applications,
  selectedApplication,
  reports,
  loading,
  error,
  filters,
  activeRecordTab,
  activeDetailTab,
  reportFilter,
  showStatusModal,
  statusUpdateApp,
  newStatus,
  statusRemarks,
  updatingStatus,
  mainApplicantDeceased,
  onMainApplicantDeceasedChange,
  terminationProceeds,
  loadingProceeds,
  applicationOffers,
  loadingOffers,
  openingAuction,
  onOpenForAuction,
  approvedAmount,
  onApprovedAmountChange,
  showTerminationModal,
  terminationAction,
  onApproveTermination,
  onRejectTermination,
  onCancelTermination,
  onSearchChange,
  onSearch,
  onFilterFieldChange,
  onFilterValueChange,
  onPendingQuickFilter,
  onValuationPendingQuickFilter,
  onSortChange,
  onApplicationClick,
  onApproveApplication,
  onUpdateStatus,
  onReviewApplication,
  onGenerateReport,
  showReportModal,
  reportGenerationType,
  reportGenerating,
  onReportTypeChange,
  onCloseReportModal,
  onConfirmReportGenerate,
  onViewReport,
  onShareReport,
  onArchiveReport,
  onRecordTabChange,
  onDetailTabChange,
  onReportFilterChange,
  onStatusChange,
  onStatusRemarksChange,
  onConfirmStatusUpdate,
  onCancelStatusUpdate,
  formatDate,
  getStatusBadgeClass,
  getStatusDisplayText,
  getDaysWaiting,
}) {
  const { user, userRole, loading: authLoading } = useAuth();

  // Debug information
  console.log("🔍 AdminView render - Auth state:", {
    user: user?.email,
    userRole,
    authLoading,
    loading,
  });

  if (authLoading) {
    return (
      <div className="admin-view">
        <div className="admin-loading">Checking authentication...</div>
      </div>
    );
  }

  if (!user || userRole !== "admin") {
    return (
      <div className="admin-view">
        <div className="admin-error">
          <h2>Access Denied</h2>
          <p>You must be an administrator to access this page.</p>
          <p>Current user: {user?.email || "Not logged in"}</p>
          <p>Current role: {userRole || "Not determined"}</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="admin-view">
        <div className="admin-loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-view">
        <div className="admin-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-view">
      <div className="admin-body">
        <div className="admin-container">
          {/* Page Title */}
          <div className="admin-heading">
            <div>
              <h1>Application Dashboard</h1>
              <p className="admin-heading-subtitle">
                Review applications, manage approvals, and record loan payouts.
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="admin-statistics-cards">
            <div
              className="admin-stat-card admin-stat-card-clickable"
              role="button"
              tabIndex={0}
              onClick={onPendingQuickFilter}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPendingQuickFilter();
                }
              }}
              title="Show pending applications only"
            >
              <div className="admin-stat-label">Pending Applications</div>
              <div className="admin-stat-value">{statistics.pending || 0}</div>
              <div className="admin-stat-subtitle">Awaiting review &mdash; click to filter</div>
            </div>

            <div
              className="admin-stat-card admin-stat-card-clickable"
              role="button"
              tabIndex={0}
              onClick={onValuationPendingQuickFilter}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onValuationPendingQuickFilter();
                }
              }}
              title="Show applications awaiting a valuation only"
            >
              <div className="admin-stat-label">Valuation Pending</div>
              <div className="admin-stat-value">
                {statistics.pendingValuation || 0}
              </div>
              <div className="admin-stat-subtitle">
                Needs scheduling &mdash; click to filter
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Approved</div>
              <div className="admin-stat-value">{statistics.approved || 0}</div>
              <div className="admin-stat-subtitle">Active loan agreements</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">In Auction</div>
              <div className="admin-stat-value">{statistics.auctioning || 0}</div>
              <div className="admin-stat-subtitle">Open to provider bidding</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Rejected</div>
              <div className="admin-stat-value">{statistics.rejected || 0}</div>
              <div className="admin-stat-subtitle">Last 30 days</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Reports Generated</div>
              <div className="admin-stat-value">
                {statistics.reportsGenerated || 0}
              </div>
              <div className="admin-stat-subtitle">This month</div>
            </div>
          </div>

          {/* Records Management Section */}
          <div className="admin-records-section">
            {/* Records Table */}
            <div className="admin-records-table">
              <div className="admin-records-header">
                <h2>Records</h2>
              </div>

              {/* Search and Filters */}
              <div className="admin-search-filters">
                <div className="admin-search-input-wrapper">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search applicants"
                    value={filters.search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSearch();
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  className={`admin-quick-filter-btn ${filters.status === "pending" ? "admin-quick-filter-btn-active" : ""}`}
                  onClick={onPendingQuickFilter}
                >
                  ⏳ Pending Only
                </button>

                <button
                  type="button"
                  className={`admin-quick-filter-btn ${filters.status === "valuationPending" ? "admin-quick-filter-btn-active" : ""}`}
                  onClick={onValuationPendingQuickFilter}
                >
                  🏚️ Valuation Pending
                </button>

                <div className="admin-filter-group">
                  <span className="admin-filter-label">Value:</span>
                  <select
                    className="admin-filter-select"
                    value={filters.status}
                    onChange={(e) => onFilterValueChange(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "white",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending (Submitted + Under Review)</option>
                    <option value="valuationPending">Valuation Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="underReviewed">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="auctioning">In Auction</option>
                    <option value="rejected">Rejected</option>
                    <option value="terminated">Terminated</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="admin-filter-group">
                  <span className="admin-filter-label">Sort:</span>
                  <button
                    className="admin-filter-btn"
                    onClick={() => {
                      const newOrder =
                        filters.sortOrder === "desc" ? "asc" : "desc";
                      onSortChange("submitted_at", newOrder);
                    }}
                  >
                    {filters.sortOrder === "desc" ? "Newest" : "Oldest"}
                  </button>
                </div>
              </div>

              {/* Record Type Tabs */}
              <div className="admin-record-tabs">
                <button
                  className={`admin-tab admin-tab-active`}
                  onClick={() => onRecordTabChange("applications")}
                >
                  Applications
                </button>
              </div>

              {/* Table Headers */}
              <div className="admin-table-headers">
                <div className="admin-table-col">Applicant</div>
                <div className="admin-table-col">Property</div>
                <div className="admin-table-col">Submitted</div>
                <div className="admin-table-col">Days Waiting</div>
                <div className="admin-table-col">Status</div>
                <div className="admin-table-col">Actions</div>
              </div>

              {/* Table Rows */}
              <div className="admin-table-rows">
                {applications.length === 0 ? (
                  <div className="admin-no-records">No applications found</div>
                ) : (
                  applications.map((app) => (
                    <div
                      key={app.id}
                      className={`admin-table-row ${
                        selectedApplication?.id === app.id
                          ? "admin-table-row-selected"
                          : ""
                      }`}
                      onClick={() => onApplicationClick(app)}
                    >
                      <div className="admin-table-col admin-table-name">
                        {app.users?.full_name || "N/A"}
                      </div>
                      <div className="admin-table-col">
                        {(() => {
                          const propertyType = app.properties?.property_type;
                          const address =
                            app.properties?.address?.split(",")[0];
                          if (!propertyType && !address) return "";
                          if (!propertyType) return address;
                          if (!address) return propertyType;
                          return `${propertyType}, ${address}`;
                        })()}
                      </div>
                      <div className="admin-table-col">
                        {formatDate(app.submitted_at)}
                      </div>
                      <div className="admin-table-col">
                        {(() => {
                          const daysWaiting = getDaysWaiting(app);
                          if (daysWaiting === null) return "—";
                          const isOverdue = daysWaiting > 7;
                          return (
                            <span
                              className={`admin-days-badge ${isOverdue ? "admin-days-badge-overdue" : ""}`}
                            >
                              {daysWaiting} {daysWaiting === 1 ? "day" : "days"}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="admin-table-col">
                        {app.status === "terminated" ? (
                          <span
                            className={`admin-status-badge admin-status-${getStatusBadgeClass("terminated")}`}
                          >
                            Terminated
                          </span>
                        ) : app.termination_submitted_at ? (
                          <span className="admin-status-badge status-badge-termination">
                            Termination
                          </span>
                        ) : (
                          <span
                            className={`admin-status-badge admin-status-${getStatusBadgeClass(app.status)}`}
                          >
                            {getStatusDisplayText(app.status)}
                          </span>
                        )}
                        {app.needsValuationSchedule && (
                          <span className="status-badge-valuation-pending">
                            Needs Valuation
                          </span>
                        )}
                      </div>
                      <div className="admin-table-col admin-table-actions">
                        <button
                          className="admin-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReviewApplication(app);
                          }}
                        >
                          Review
                        </button>
                        <button
                          className="admin-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(app);
                          }}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Application Details Card */}
            <div className="admin-details-card">
              <div className="admin-details-header">
                <h2>Application Details</h2>
              </div>

              {/* Detail Tabs */}
              <div className="admin-detail-tabs">
                <button
                  className={`admin-tab ${activeDetailTab === "overview" ? "admin-tab-active" : ""}`}
                  onClick={() => onDetailTabChange("overview")}
                >
                  Overview
                </button>
                <button
                  className={`admin-tab ${activeDetailTab === "nominees" ? "admin-tab-active" : ""}`}
                  onClick={() => onDetailTabChange("nominees")}
                >
                  Nominees
                </button>
              </div>

              {selectedApplication ? (
                <>
                  {activeDetailTab === "overview" ? (
                    <>
                      {/* Applicant and Property Info */}
                      <div className="admin-details-info">
                        <div className="admin-info-left">
                          <div className="admin-info-label">Applicant</div>
                          <div className="admin-info-value">
                            {selectedApplication.user?.full_name}
                          </div>
                          <div className="admin-info-subtitle">
                            IC {selectedApplication.user?.ic_number}
                          </div>
                        </div>
                        <div className="admin-info-right">
                          <div className="admin-info-label">Property</div>
                          <div className="admin-info-value">
                            {(() => {
                              const propertyType =
                                selectedApplication.property?.property_type;
                              const address =
                                selectedApplication.property?.address?.split(
                                  ",",
                                )[0];
                              if (!propertyType && !address) return "";
                              if (!propertyType) return address;
                              if (!address) return propertyType;
                              return `${propertyType}, ${address}`;
                            })()}
                          </div>
                          <div className="admin-info-subtitle">
                            Purchase price: RM{" "}
                            {selectedApplication.property?.purchase_price?.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Requested Amount */}
                      <div className="admin-requested-amount">
                        <div className="admin-info-label">Expected Market Value</div>
                        <div className="admin-amount-value">
                          RM{" "}
                          {selectedApplication.property?.expected_market_value?.toLocaleString() ||
                            selectedApplication.property?.indicative_market_value?.toLocaleString()}
                        </div>
                        <div className="admin-info-subtitle">
                          Purchased:{" "}
                          {selectedApplication.property?.purchase_date
                            ? formatDate(
                                selectedApplication.property.purchase_date,
                              )
                            : ""}
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="admin-eligibility-list">
                        {selectedApplication.property?.build_up_area && (
                          <div className="admin-eligibility-item">
                            • Build-up Area:{" "}
                            {selectedApplication.property.build_up_area} sqm
                          </div>
                        )}
                        {selectedApplication.property?.land_area && (
                          <div className="admin-eligibility-item">
                            • Land Area:{" "}
                            {selectedApplication.property.land_area} sqm
                          </div>
                        )}
                        {selectedApplication.property?.tenure_title && (
                          <div className="admin-eligibility-item">
                            • Tenure:{" "}
                            {selectedApplication.property.tenure_title}
                            {selectedApplication.property.expiry_date &&
                              selectedApplication.property.tenure_title ===
                                "leasehold" &&
                              ` (Expires: ${formatDate(selectedApplication.property.expiry_date)})`}
                          </div>
                        )}
                        {selectedApplication.property?.is_encumbered !== null &&
                          selectedApplication.property?.is_encumbered !==
                            undefined && (
                            <div className="admin-eligibility-item">
                              • Encumbered:{" "}
                              {selectedApplication.property.is_encumbered
                                ? "Yes"
                                : "No"}
                              {selectedApplication.property.is_encumbered &&
                                selectedApplication.property
                                  .est_outstanding_balance &&
                                ` (Outstanding: RM ${selectedApplication.property.est_outstanding_balance.toLocaleString()})`}
                            </div>
                          )}
                      </div>

                      {/* Approved Amount Input - For Under Review Status (but NOT when termination is pending) */}
                      {selectedApplication?.status === "underReviewed" &&
                        !selectedApplication?.termination_submitted_at && (
                          <div className="admin-approved-amount-section">
                            <label className="admin-info-label">
                              Set Approved Amount (RM)
                            </label>
                            <div className="admin-approved-amount-input-wrapper">
                              <input
                                type="number"
                                placeholder="Enter approved amount"
                                value={approvedAmount}
                                onChange={(e) =>
                                  onApprovedAmountChange(e.target.value)
                                }
                                step="0.01"
                                min="0"
                                className="admin-approved-amount-input"
                              />
                            </div>
                          </div>
                        )}

                      {/* Termination Request Section - When termination is submitted but not yet terminated */}
                      {selectedApplication?.termination_submitted_at &&
                        selectedApplication?.status !== "terminated" && (
                          <div className="admin-termination-section">
                            <div className="admin-termination-banner">
                              <h3>Termination Request Pending</h3>
                              <p>
                                <strong>Reason:</strong>{" "}
                                {selectedApplication?.termination_reason ||
                                  "N/A"}
                              </p>
                              <p className="admin-termination-date">
                                Submitted:{" "}
                                {formatDate(
                                  selectedApplication.termination_submitted_at,
                                )}
                              </p>
                            </div>
                            <div className="admin-termination-actions">
                              <button
                                className="admin-reject-termination-btn"
                                onClick={() =>
                                  onRejectTermination(selectedApplication.id)
                                }
                              >
                                Reject Termination
                              </button>
                              <button
                                className="admin-approve-termination-btn"
                                onClick={() =>
                                  onApproveTermination(selectedApplication.id)
                                }
                              >
                                Approve Termination
                              </button>
                            </div>
                          </div>
                        )}

                      {/* Application Terminated Section - When status is terminated */}
                      {selectedApplication?.status === "terminated" && (
                        <div className="admin-terminated-section">
                          <div className="admin-terminated-banner">
                            <h3>Application Terminated</h3>
                            <p>
                              This application has been terminated and cannot be
                              modified.
                            </p>
                          </div>

                          {selectedApplication?.main_applicant_deceased && (
                            <div className="admin-proceeds-section">
                              <h3>Estimated Apportioned Proceeds</h3>
                              {loadingProceeds ? (
                                <p>Calculating proceeds...</p>
                              ) : terminationProceeds ? (
                                <>
                                  <p className="admin-proceeds-disclaimer">
                                    ⚠️ These figures are an estimate based on the
                                    property's last recorded market value, not the
                                    final sale price. The actual property sale and
                                    redemption is completed off-system by the
                                    appointed estate representative; treat these
                                    numbers as indicative only until the real sale
                                    proceeds are confirmed.
                                  </p>
                                  <div className="admin-proceeds-summary">
                                    <p>
                                      <strong>Estimated Property Value:</strong> RM{" "}
                                      {terminationProceeds.propertyValue.toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>Outstanding Loan Settled:</strong>{" "}
                                      RM{" "}
                                      {terminationProceeds.outstandingLoanAmount.toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>Estimated Net Proceeds for Distribution:</strong>{" "}
                                      RM {terminationProceeds.netProceeds.toLocaleString()}
                                    </p>
                                    {terminationProceeds.isNonRecourseShortfall && (
                                      <p className="admin-proceeds-shortfall">
                                        ⚠️ Sale proceeds do not cover the
                                        outstanding loan (shortfall RM{" "}
                                        {terminationProceeds.shortfall.toLocaleString()}
                                        ). Under the non-recourse terms, the
                                        estate owes nothing further and
                                        nominees receive RM 0.
                                      </p>
                                    )}
                                  </div>

                                  <table className="admin-proceeds-table">
                                    <thead>
                                      <tr>
                                        <th>Nominee</th>
                                        <th>Type</th>
                                        <th>Share</th>
                                        <th>Estimated Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {terminationProceeds.nominees.map((nominee) => (
                                        <tr key={nominee.id}>
                                          <td>{nominee.name}</td>
                                          <td>
                                            {nominee.type === "nominee1"
                                              ? "Nominee 1"
                                              : "Nominee 2"}
                                          </td>
                                          <td>
                                            {nominee.eligible
                                              ? `${nominee.sharePercentage.toFixed(1)}%`
                                              : "Excluded"}
                                          </td>
                                          <td>
                                            RM{" "}
                                            {nominee.apportionedAmount.toLocaleString(
                                              undefined,
                                              { minimumFractionDigits: 2 },
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>

                                  {terminationProceeds.unallocatedAmount > 0 && (
                                    <p className="admin-proceeds-unallocated">
                                      No eligible nominees on file — RM{" "}
                                      {terminationProceeds.unallocatedAmount.toLocaleString()}{" "}
                                      remains unallocated pending next-of-kin
                                      verification.
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p>Unable to calculate proceeds.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Provider Auction Section - visible once opened for bidding or an offer has been accepted */}
                      {(selectedApplication?.status === "auctioning" ||
                        selectedApplication?.accepted_offer_id) && (
                        <div className="admin-auction-section">
                          <h3>Submitted Provider Offers</h3>
                          {loadingOffers ? (
                            <p>Loading offers...</p>
                          ) : applicationOffers.length === 0 ? (
                            <p>No providers have submitted an offer yet.</p>
                          ) : (
                            <table className="admin-offers-table">
                              <thead>
                                <tr>
                                  <th>Provider</th>
                                  <th>Amount</th>
                                  <th>Rate</th>
                                  <th>Term</th>
                                  <th>Status</th>
                                  <th>Contact</th>
                                </tr>
                              </thead>
                              <tbody>
                                {applicationOffers.map((offer) => (
                                  <tr key={offer.id}>
                                    <td>{offer.providerCompanyName}</td>
                                    <td>
                                      RM{" "}
                                      {offer.offerAmount.toLocaleString(
                                        undefined,
                                        { minimumFractionDigits: 2 },
                                      )}
                                    </td>
                                    <td>
                                      {offer.interestRate !== null
                                        ? `${offer.interestRate}%`
                                        : "N/A"}
                                    </td>
                                    <td>{offer.loanTermMonths} mo</td>
                                    <td>{offer.status}</td>
                                    <td>
                                      {offer.providerContactPerson}
                                      {offer.providerEmail
                                        ? ` (${offer.providerEmail})`
                                        : ""}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}

                      {/* Open for Auction Button - only for approved applications not yet opened, and not while a termination request is under review */}
                      {selectedApplication?.status === "approved" &&
                        !selectedApplication?.termination_submitted_at && (
                        <button
                          className="admin-open-auction-btn"
                          onClick={() =>
                            onOpenForAuction(selectedApplication.id)
                          }
                          disabled={openingAuction}
                        >
                          {openingAuction
                            ? "Opening..."
                            : "Open for Provider Auction"}
                        </button>
                      )}

                      {/* Approve Button - Hide when termination is pending or terminated */}
                      {!selectedApplication?.termination_submitted_at &&
                        selectedApplication?.status !== "terminated" && (
                          <>
                            <button
                              className="admin-approve-btn"
                              onClick={onApproveApplication}
                              disabled={
                                selectedApplication?.status === "approved" ||
                                selectedApplication?.status === "auctioning" ||
                                (selectedApplication?.status === "underReviewed" &&
                                  !(parseFloat(selectedApplication?.property?.indicative_market_value) > 0))
                              }
                              title={
                                selectedApplication?.status === "underReviewed" &&
                                !(parseFloat(selectedApplication?.property?.indicative_market_value) > 0)
                                  ? "A completed valuation report with an estimated market value is required before approval"
                                  : undefined
                              }
                            >
                              {selectedApplication?.status === "approved"
                                ? "Already Approved"
                                : selectedApplication?.status === "auctioning"
                                  ? "Auction In Progress"
                                  : "Approve Application"}
                            </button>
                            {selectedApplication?.status === "underReviewed" &&
                              !(parseFloat(selectedApplication?.property?.indicative_market_value) > 0) && (
                                <p className="admin-approve-blocked-hint">
                                  Approval is blocked until a completed valuation report and estimated market value are on file.
                                </p>
                              )}
                          </>
                        )}
                    </>
                  ) : (
                    /* Nominees Tab */
                    <div className="admin-nominees-content">
                      {selectedApplication.nominees &&
                      selectedApplication.nominees.length > 0 ? (
                        <div className="admin-nominees-list">
                          {selectedApplication.nominees.map(
                            (nominee, index) => (
                              <div
                                key={nominee.id || index}
                                className="admin-nominee-card"
                              >
                                <h3
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#A8202D",
                                    marginBottom: "12px",
                                  }}
                                >
                                  Nominee {index + 1}{" "}
                                  {index === 0 ? "(Primary)" : "(Secondary)"}
                                </h3>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                    fontSize: "12px",
                                  }}
                                >
                                  <div>
                                    <div className="admin-info-label">Name</div>
                                    <div className="admin-info-value">
                                      {nominee.name || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="admin-info-label">
                                      IC Number
                                    </div>
                                    <div className="admin-info-value">
                                      {nominee.ic_number || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="admin-info-label">
                                      Email
                                    </div>
                                    <div className="admin-info-value">
                                      {nominee.email || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="admin-info-label">
                                      Phone
                                    </div>
                                    <div className="admin-info-value">
                                      {nominee.telephone || "N/A"}
                                    </div>
                                  </div>
                                  <div style={{ gridColumn: "1 / -1" }}>
                                    <div className="admin-info-label">
                                      Address
                                    </div>
                                    <div className="admin-info-value">
                                      {nominee.address || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <div
                          className="admin-no-nominees"
                          style={{
                            textAlign: "center",
                            color: "#9CA3AF",
                            padding: "40px 0",
                            fontSize: "13px",
                          }}
                        >
                          No nominees added to this application
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="admin-no-selection">
                  No application selected. Click on an application record to
                  view details.
                </div>
              )}
            </div>
          </div>

          {/* Reports Section */}
          <div className="admin-reports-section">
            <div className="admin-reports-header">
              <h2>Reports</h2>
            </div>

            {/* Reports Table Headers */}
            <div className="admin-reports-table">
              <div className="admin-reports-headers">
                <div className="admin-reports-col">Report name</div>
                <div className="admin-reports-col">Generated on</div>
                <div className="admin-reports-col">Type</div>
                <div className="admin-reports-col">Actions</div>
              </div>

              {/* Reports Rows */}
              {reports.length === 0 ? (
                <div className="admin-no-records">
                  No reports generated yet.
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="admin-reports-row">
                    <div className="admin-reports-col admin-report-name">
                      {report.name}
                    </div>
                    <div className="admin-reports-col">
                      {formatDate(report.generatedOn)}
                    </div>
                    <div className="admin-reports-col">
                      <span
                        className={`report-type-badge ${report.type === "yearly" ? "yearly" : "monthly"}`}
                      >
                        {report.type === "yearly" ? "Yearly" : "Monthly"}
                      </span>
                    </div>
                    <div className="admin-reports-col admin-reports-actions">
                      <button
                        className="admin-report-action-btn"
                        onClick={() => onViewReport(report.id)}
                      >
                        View
                      </button>
                      <button
                        className="admin-report-action-btn"
                        onClick={() => onShareReport(report.id)}
                      >
                        Share
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reports Footer */}
            <div className="admin-reports-footer">
              <div className="admin-reports-hint">
                Store and access reports securely for audit and compliance.
              </div>
              <button
                className="admin-generate-report-btn"
                onClick={onGenerateReport}
              >
                Generate Application Analysis Report (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="modal-overlay" onClick={onCloseReportModal}>
          <div
            className="modal report-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Select report type</h3>
              <button
                className="close-button"
                onClick={onCloseReportModal}
                disabled={reportGenerating}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="report-type-options">
                <label className="report-type-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="monthly"
                    checked={reportGenerationType === "monthly"}
                    onChange={() => onReportTypeChange("monthly")}
                    disabled={reportGenerating}
                  />
                  <span>Monthly report (current month)</span>
                </label>
                <label className="report-type-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="yearly"
                    checked={reportGenerationType === "yearly"}
                    onChange={() => onReportTypeChange("yearly")}
                    disabled={reportGenerating}
                  />
                  <span>Yearly report (current year)</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={onCloseReportModal}
                disabled={reportGenerating}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={onConfirmReportGenerate}
                disabled={reportGenerating}
              >
                {reportGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && statusUpdateApp && (
        <div className="modal-overlay" onClick={onCancelStatusUpdate}>
          <div
            className="modal status-update-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Update Application Status</h3>
              <button
                className="close-button"
                onClick={onCancelStatusUpdate}
                disabled={updatingStatus}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="status-update-info">
                <p>
                  <strong>Applicant:</strong>{" "}
                  {statusUpdateApp.users?.full_name || "N/A"}
                </p>
                <p>
                  <strong>Current Status:</strong>{" "}
                  <span
                    className={`admin-status-badge admin-status-${getStatusBadgeClass(statusUpdateApp.status)}`}
                  >
                    {getStatusDisplayText(statusUpdateApp.status)}
                  </span>
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="newStatus">New Status *</label>
                <select
                  id="newStatus"
                  className="status-select"
                  value={newStatus}
                  onChange={(e) => onStatusChange(e.target.value)}
                  disabled={updatingStatus}
                >
                  <option value="underReviewed">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="statusRemarks">Remarks (Optional)</label>
                <textarea
                  id="statusRemarks"
                  className="status-remarks-input"
                  placeholder="Add any notes about this status change..."
                  value={statusRemarks}
                  onChange={(e) => onStatusRemarksChange(e.target.value)}
                  rows={4}
                  disabled={updatingStatus}
                />
              </div>

              {newStatus === "rejected" && (
                <div className="status-warning">
                  ⚠️ Rejecting this application will permanently change its
                  status. Make sure to provide a reason in the remarks.
                </div>
              )}

              {newStatus === "terminated" && (
                <div className="status-warning">
                  ⚠️ Terminating this application will end the loan agreement.
                  This action should only be done for approved applications.
                </div>
              )}

              {newStatus === "terminated" && (
                <div className="form-group admin-deceased-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={mainApplicantDeceased}
                      onChange={(e) =>
                        onMainApplicantDeceasedChange(e.target.checked)
                      }
                      disabled={updatingStatus}
                    />{" "}
                    Main applicant is deceased
                  </label>
                  <p className="admin-deceased-hint">
                    The property will be sold and the sale proceeds
                    apportioned to the nominees on file, after settling the
                    outstanding loan amount. Leave unchecked for a standard
                    (borrower repays) termination.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={onCancelStatusUpdate}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={onConfirmStatusUpdate}
                disabled={
                  updatingStatus ||
                  !newStatus ||
                  newStatus === statusUpdateApp.status
                }
              >
                {updatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminView;
