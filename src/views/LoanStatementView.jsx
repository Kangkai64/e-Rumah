import '../client_controller/user/UserProfileView.css'

function UserProfileView({
  loading,
  error,
  loanOverview,
  disbursementPercentage,
  disbursements,
  disbursementFilter,
  onDisbursementFilterChange,
  propertyValue,
  onReEstimateProperty,
  onViewPropertyHistory,
  payoutDetails,
  payoutType,
  onPayoutTypeToggle,
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
  onViewFullSchedule
}) {
  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="loading-container">
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="user-dashboard">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>

        <div className="dashboard-content">
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
                      r="90"
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="36"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="90"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="36"
                      strokeDasharray={`${disbursementPercentage * 5.65} 565`}
                      strokeDashoffset="141.25"
                      transform="rotate(-90 128 128)"
                    />
                    {/* Center white circle */}
                    <circle cx="128" cy="128" r="76" fill="white" />
                  </svg>
                  
                  <div className="chart-center-details">
                    <p className="chart-label">Total Eligible Amount</p>
                    <p className="chart-amount">
                      {formatCurrency(loanOverview?.totalEligibleAmount || 0)}
                    </p>
                    <p className="chart-date">
                      Updated as at {loanOverview?.approvedAt ? formatDate(loanOverview.approvedAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Status Badge */}
              <div className="loan-status-container">
                <span className={`loan-status-badge ${getStatusBadgeClass(loanOverview?.status)}`}>
                  {loanOverview?.status || 'No Active Loan'}
                </span>
              </div>

              {/* Disbursed and Remaining */}
              <div className="loan-summary">
                <div className="loan-summary-item">
                  <p className="summary-label">Disbursed to-date</p>
                  <p className="summary-amount">{formatCurrency(loanOverview?.disbursedToDate || 0)}</p>
                </div>
                <div className="loan-summary-item">
                  <p className="summary-label">Remaining balance</p>
                  <p className="summary-amount">{formatCurrency(loanOverview?.remainingBalance || 0)}</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="loan-footer">
                <button className="link-button" onClick={onViewFullSchedule}>
                  View full schedule
                </button>
                <p className="property-details">
                  Property: {loanOverview?.propertyDetails?.propertyType || 'N/A'}, {loanOverview?.propertyDetails?.address || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Monitoring Section */}
          <div className="financial-monitoring-section">
            {/* Loan Disbursement Monitoring */}
            <div className="disbursement-card">
              <div className="card-header">
                <div className="card-title-section">
                  <h3>Loan Disbursement Monitoring</h3>
                  <p className="card-subtitle">Track how and when your payouts are released.</p>
                </div>
                <div className="filter-controls">
                  <span className="filter-label">Filter</span>
                  <button 
                    className={`filter-button ${disbursementFilter === 'last6months' ? 'active' : ''}`}
                    onClick={() => onDisbursementFilterChange('last6months')}
                  >
                    Last 6 months
                  </button>
                  <button 
                    className={`filter-button ${disbursementFilter === 'all' ? 'active' : ''}`}
                    onClick={() => onDisbursementFilterChange('all')}
                  >
                    View all
                  </button>
                </div>
              </div>

              <div className="disbursement-table">
                <div className="table-header">
                  <span>Date</span>
                  <span>Amount Received</span>
                  <span>Remaining</span>
                  <span>Status</span>
                </div>
                
                {disbursements && disbursements.length > 0 ? (
                  disbursements.map((record, index) => (
                    <div key={index} className="table-row">
                      <span className="row-date">{formatDate(record.date)}</span>
                      <span className="row-amount">{formatCurrency(record.amountReceived)}</span>
                      <span className="row-remaining">{formatCurrency(record.remaining)}</span>
                      <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="table-row">
                    <span className="no-data" style={{gridColumn: '1 / -1', textAlign: 'center'}}>
                      No disbursement records found
                    </span>
                  </div>
                )}
                
                {/* Upcoming disbursement (mock data) */}
                {loanOverview?.hasLoan && (
                  <div className="table-row">
                    <span className="row-date">Upcoming</span>
                    <span className="row-amount">RM 2,500</span>
                    <span className="row-remaining">{formatCurrency(loanOverview?.remainingBalance - 2500 || 0)}</span>
                    <span className={`status-badge ${getStatusBadgeClass('scheduled')}`}>
                      Scheduled
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Value Estimation */}
            <div className="property-value-card">
              <div className="property-header">
                <h3>Property Value Estimation</h3>
                <p className="last-checked">
                  Last checked: {propertyValue?.lastChecked ? formatDate(propertyValue.lastChecked) : 'N/A'}
                </p>
              </div>

              <div className="property-content">
                <div className="property-value-section">
                  <p className="value-label">Current estimated value</p>
                  <p className="value-amount">
                    {formatCurrency(propertyValue?.currentEstimatedValue || 0)}
                  </p>
                </div>

                <div className="property-actions">
                  <button className="secondary-button" onClick={onViewPropertyHistory}>
                    View history
                  </button>
                  <button className="primary-button" onClick={onReEstimateProperty}>
                    Re-estimate Property
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Details Section */}
          <div className="payout-details-section">
            <div className="payout-card">
              <div className="payout-header">
                <h3>Payout Details</h3>
                <div className="payout-toggle">
                  <button 
                    className={`toggle-button ${payoutType === 'monthly' ? 'active' : ''}`}
                    onClick={() => onPayoutTypeToggle('monthly')}
                  >
                    Monthly
                  </button>
                  <button 
                    className={`toggle-button ${payoutType === 'lump-sum' ? 'active' : ''}`}
                    onClick={() => onPayoutTypeToggle('lump-sum')}
                  >
                    Lump-sum
                  </button>
                </div>
              </div>

              <div className="payout-content">
                {payoutType === 'monthly' ? (
                  <>
                    <div className="payout-info-section">
                      <div className="payout-info-left">
                        <p className="info-label">Estimated monthly payout</p>
                        <p className="info-amount">
                          {formatCurrency(payoutDetails?.monthlyAmount || 0)}
                        </p>
                        <p className="info-period">
                          From {payoutDetails?.startDate ? formatDate(payoutDetails.startDate) : 'Jan 2026'} to{' '}
                          {payoutDetails?.endDate ? formatDate(payoutDetails.endDate) : 'Dec 2030'} ({payoutDetails?.totalMonths || 0} months)
                        </p>
                        
                        <ul className="info-notes">
                          <li>Payouts are subject to property value review every 2 years.</li>
                          <li>Early termination may affect total amount disbursed.</li>
                          <li>You may switch to lump-sum once every 12 months.</li>
                        </ul>
                      </div>

                      <div className="payout-info-right">
                        <p className="info-label">Next payout date</p>
                        <p className="info-next-date">
                          {payoutDetails?.nextPayoutDate ? formatDate(payoutDetails.nextPayoutDate) : '02 Jan 2026'}
                        </p>
                        <p className="info-bank">
                          Deposited into {payoutDetails?.bankAccount || 'Maybank **** 1234'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="payout-info-section">
                    <div className="payout-info-left">
                      <p className="info-label">Lump-sum payout option</p>
                      <p className="info-description">
                        Contact customer support to arrange a lump-sum payout.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfileView
