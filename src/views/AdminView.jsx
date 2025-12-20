// Admin View
// Presentational component for admin dashboard
// Receives ALL data and handlers via props from AdminController
// NO business logic, NO state management (except local UI state), NO model imports

import '../components/admin/AdminView.css'
import Header from '../layouts/Header'
import Footer from '../layouts/Footer'
import { useAuth } from '../components/context/AuthContext'

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
  onSearchChange,
  onFilterFieldChange,
  onFilterValueChange,
  onSortChange,
  onApplicationClick,
  onApproveApplication,
  onUpdateStatus,
  onReviewApplication,
  onGenerateReport,
  onViewReport,
  onShareReport,
  onArchiveReport,
  onRecordTabChange,
  onDetailTabChange,
  onReportFilterChange,
  formatDate,
  getStatusBadgeClass,
  getStatusDisplayText
}) {
  const { user, userRole, loading: authLoading } = useAuth()

  // Debug information
  console.log('🔍 AdminView render - Auth state:', { 
    user: user?.email, 
    userRole, 
    authLoading,
    loading 
  })

  if (authLoading) {
    return (
      <div className="admin-view">
        <div className="admin-loading">Checking authentication...</div>
      </div>
    )
  }

  if (!user || userRole !== 'admin') {
    return (
      <div className="admin-view">
        <div className="admin-error">
          <h2>Access Denied</h2>
          <p>You must be an administrator to access this page.</p>
          <p>Current user: {user?.email || 'Not logged in'}</p>
          <p>Current role: {userRole || 'Not determined'}</p>
        </div>
      </div>
    )
  }
  if (loading) {
    return (
      <div className="admin-view">
        <div className="admin-loading">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-view">
        <div className="admin-error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="admin-view">
      <div className="admin-body">
        <div className="admin-container">
          {/* Page Title */}
          <div className="admin-heading">
            <h1>Application Dashboard</h1>
          </div>

          {/* Statistics Cards */}
          <div className="admin-statistics-cards">
            <div className="admin-stat-card">
              <div className="admin-stat-label">Pending Applications</div>
              <div className="admin-stat-value">{statistics.pending}</div>
              <div className="admin-stat-subtitle">Awaiting review</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Approved</div>
              <div className="admin-stat-value">{statistics.approved}</div>
              <div className="admin-stat-subtitle">Active loan agreements</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Rejected</div>
              <div className="admin-stat-value">{statistics.rejected}</div>
              <div className="admin-stat-subtitle">Last 30 days</div>
            </div>

            <div className="admin-stat-card admin-stat-card-small">
              <div className="admin-stat-label">Reports Generated</div>
              <div className="admin-stat-value">{statistics.reportsGenerated}</div>
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
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search applicants, properties, IDs"
                    value={filters.search}
                    onChange={onSearchChange}
                  />
                </div>

                <div className="admin-filter-group">
                  <span className="admin-filter-label">Filter field:</span>
                  <button className="admin-filter-btn">Status</button>
                </div>

                <div className="admin-filter-group">
                  <span className="admin-filter-label">Value:</span>
                  <button 
                    className="admin-filter-btn"
                    onClick={() => onFilterValueChange('pending')}
                  >
                    {getStatusDisplayText(filters.status)}
                  </button>
                </div>

                <div className="admin-filter-group">
                  <span className="admin-filter-label">Sort:</span>
                  <button className="admin-filter-btn">Newest</button>
                </div>
              </div>

              {/* Record Type Tabs */}
              <div className="admin-record-tabs">
                <button
                  className={`admin-tab ${activeRecordTab === 'applications' ? 'admin-tab-active' : ''}`}
                  onClick={() => onRecordTabChange('applications')}
                >
                  Applications
                </button>
                <button
                  className={`admin-tab ${activeRecordTab === 'nominees' ? 'admin-tab-active' : ''}`}
                  onClick={() => onRecordTabChange('nominees')}
                >
                  Nominees
                </button>
                <div className="admin-tab-hint">
                  Use filters to refine by status, dates, property type and more.
                </div>
              </div>

              {/* Table Headers */}
              <div className="admin-table-headers">
                <div className="admin-table-col">Applicant</div>
                <div className="admin-table-col">Property</div>
                <div className="admin-table-col">Submitted</div>
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
                        selectedApplication?.id === app.id ? 'admin-table-row-selected' : ''
                      }`}
                      onClick={() => onApplicationClick(app)}
                    >
                      <div className="admin-table-col admin-table-name">
                        {app.user?.full_name || 'N/A'}
                      </div>
                      <div className="admin-table-col">
                        {app.property?.property_type || 'N/A'}, {app.property?.address?.split(',')[0] || 'N/A'}
                      </div>
                      <div className="admin-table-col">
                        {formatDate(app.submitted_at)}
                      </div>
                      <div className="admin-table-col">
                        <span className={`admin-status-badge admin-status-${getStatusBadgeClass(app.status)}`}>
                          {getStatusDisplayText(app.status)}
                        </span>
                      </div>
                      <div className="admin-table-col admin-table-actions">
                        <button 
                          className="admin-action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onReviewApplication(app)
                          }}
                        >
                          Review
                        </button>
                        <button 
                          className="admin-action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateStatus('underReviewed')
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
                  className={`admin-tab ${activeDetailTab === 'overview' ? 'admin-tab-active' : ''}`}
                  onClick={() => onDetailTabChange('overview')}
                >
                  Overview
                </button>
                <button
                  className={`admin-tab ${activeDetailTab === 'documents' ? 'admin-tab-active' : ''}`}
                  onClick={() => onDetailTabChange('documents')}
                >
                  Documents
                </button>
                <button
                  className={`admin-tab ${activeDetailTab === 'nominees' ? 'admin-tab-active' : ''}`}
                  onClick={() => onDetailTabChange('nominees')}
                >
                  Nominees
                </button>
              </div>

              {selectedApplication ? (
                <>
                  {/* Applicant and Property Info */}
                  <div className="admin-details-info">
                    <div className="admin-info-left">
                      <div className="admin-info-label">Applicant</div>
                      <div className="admin-info-value">{selectedApplication.user?.full_name || 'N/A'}</div>
                      <div className="admin-info-subtitle">
                        IC: {selectedApplication.user?.ic_number || 'N/A'}
                      </div>
                    </div>
                    <div className="admin-info-right">
                      <div className="admin-info-label">Property</div>
                      <div className="admin-info-value">
                        {selectedApplication.property?.property_type || 'N/A'}, {selectedApplication.property?.address?.split(',')[0] || 'N/A'}
                      </div>
                      <div className="admin-info-subtitle">
                        Estimated value: RM {selectedApplication.property?.indicative_market_value?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Requested Amount */}
                  <div className="admin-requested-amount">
                    <div className="admin-info-label">Requested amount</div>
                    <div className="admin-amount-value">RM 300,000</div>
                    <div className="admin-info-subtitle">Suggested: RM 250,000 based on eligibility</div>
                  </div>

                  {/* Eligibility Points */}
                  <div className="admin-eligibility-list">
                    <div className="admin-eligibility-item">
                      • Eligibility: Meets minimum age and income criteria.
                    </div>
                    <div className="admin-eligibility-item">
                      • Documentation: Proof of ownership and identity verified.
                    </div>
                    <div className="admin-eligibility-item">
                      • Risk flags: None detected.
                    </div>
                  </div>

                  {/* Approve Button */}
                  <button 
                    className="admin-approve-btn"
                    onClick={onApproveApplication}
                  >
                    Approve Application
                  </button>

                  {/* Nominees Section */}
                  <div className="admin-nominees-section">
                    <div className="admin-nominees-info">
                      <div className="admin-info-value">Nominees</div>
                      <div className="admin-info-subtitle">
                        {selectedApplication.nominees?.length || 0} nominees added<br />
                        Shares balanced
                      </div>
                    </div>
                    <div className="admin-nominees-actions">
                      <button className="admin-view-nominees-btn">View nominees</button>
                      <button className="admin-approve-nominees-btn">Approve nominee</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-no-selection">Select an application to view details</div>
              )}
            </div>
          </div>

          {/* Reports Section */}
          <div className="admin-reports-section">
            <div className="admin-reports-header">
              <h2>Reports</h2>
              <div className="admin-filter-group">
                <span className="admin-filter-label">Filter</span>
                <button 
                  className="admin-filter-btn"
                  onClick={() => onReportFilterChange('this_month')}
                >
                  This month
                </button>
              </div>
            </div>

            {/* Reports Table Headers */}
            <div className="admin-reports-table">
              <div className="admin-reports-headers">
                <div className="admin-reports-col">Report name</div>
                <div className="admin-reports-col">Generated on</div>
                <div className="admin-reports-col"></div>
                <div className="admin-reports-col">Actions</div>
              </div>

              {/* Reports Rows */}
              {reports.map((report) => (
                <div key={report.id} className="admin-reports-row">
                  <div className="admin-reports-col admin-report-name">{report.name}</div>
                  <div className="admin-reports-col">{formatDate(report.generatedOn)}</div>
                  <div className="admin-reports-col"></div>
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
                    <button 
                      className="admin-report-action-btn"
                      onClick={() => onArchiveReport(report.id)}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reports Footer */}
            <div className="admin-reports-footer">
              <div className="admin-reports-hint">
                Store and access reports securely for audit and Compliance.
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
    </div>
  )
}

export default AdminView
