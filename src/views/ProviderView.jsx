import "../client_controller/provider/ProviderView.css";

const STATUS_LABELS = {
  submitted: "Offer submitted",
  withdrawn: "Withdrawn",
  accepted: "Accepted",
  rejected: "Not selected",
};

function ProviderView({
  loading,
  error,
  applications,
  myOffers,
  offersByApplicationId,
  submittingId,
  getOfferFormState,
  onOfferFieldChange,
  onSubmitOffer,
  onWithdrawOffer,
  formatCurrency,
  formatDate,
}) {
  if (loading) {
    return (
      <div className="provider-page">
        <div className="provider-loading">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="provider-page">
      <div className="provider-shell">
        <div className="provider-hero">
          <p className="provider-kicker">Reverse mortgage provider portal</p>
          <h1>Applications Open for Bidding</h1>
          <p className="provider-intro">
            Review anonymized applications currently open for auction and
            submit a competing offer. The applicant sees your company name
            and offer terms only - never the other way around.
          </p>
        </div>

        {error && <div className="provider-error">{error}</div>}

        <section className="provider-card">
          <div className="card-heading">
            <h2>Open Applications</h2>
            <p>{applications.length} application(s) currently accepting offers.</p>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state inline">
              No applications are currently open for bidding.
            </div>
          ) : (
            <div className="provider-application-list">
              {applications.map((application) => {
                const myOffer = offersByApplicationId[application.id];
                const form = getOfferFormState(application.id);
                const isSubmitting = submittingId === application.id;

                return (
                  <div key={application.id} className="provider-application-row">
                    <div className="application-summary">
                      <strong>{application.propertyType}</strong>
                      <span>
                        {application.district || application.mukim || application.address}
                      </span>
                      <span className="summary-label">
                        Indicative ceiling:{" "}
                        {formatCurrency(application.approvedAmount)}
                      </span>
                      <span className="summary-label">
                        Opened: {formatDate(application.auctionOpenedAt)}
                      </span>
                    </div>

                    {myOffer ? (
                      <div className="offer-status-block">
                        <span className={`offer-status-badge status-${myOffer.status}`}>
                          {STATUS_LABELS[myOffer.status] || myOffer.status}
                        </span>
                        <span className="summary-label">
                          Your offer: {formatCurrency(myOffer.offerAmount)}
                        </span>
                        {myOffer.status === "submitted" && (
                          <button
                            className="provider-withdraw-btn"
                            onClick={() => onWithdrawOffer(myOffer.id)}
                            disabled={isSubmitting}
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="offer-form">
                        <div className="offer-form-row">
                          <label>
                            Offer amount (RM)
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.offerAmount}
                              onChange={(e) =>
                                onOfferFieldChange(
                                  application.id,
                                  "offerAmount",
                                  e.target.value,
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </label>
                          <label>
                            Interest rate (% p.a., optional)
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.interestRate}
                              onChange={(e) =>
                                onOfferFieldChange(
                                  application.id,
                                  "interestRate",
                                  e.target.value,
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </label>
                          <label>
                            Loan term (months)
                            <input
                              type="number"
                              min="1"
                              value={form.loanTermMonths}
                              onChange={(e) =>
                                onOfferFieldChange(
                                  application.id,
                                  "loanTermMonths",
                                  e.target.value,
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </label>
                        </div>
                        <label className="offer-notes-label">
                          Notes (optional)
                          <textarea
                            rows={2}
                            value={form.notes}
                            onChange={(e) =>
                              onOfferFieldChange(
                                application.id,
                                "notes",
                                e.target.value,
                              )
                            }
                            disabled={isSubmitting}
                          />
                        </label>
                        <button
                          className="provider-submit-btn"
                          onClick={() => onSubmitOffer(application.id)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Offer"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="provider-card">
          <div className="card-heading">
            <h2>Your Offer History</h2>
            <p>All offers you have submitted across every application.</p>
          </div>

          {myOffers.length === 0 ? (
            <div className="empty-state inline">
              You haven't submitted any offers yet.
            </div>
          ) : (
            <div className="provider-history-list">
              {myOffers.map((offer) => (
                <div key={offer.id} className="provider-history-row">
                  <span className={`offer-status-badge status-${offer.status}`}>
                    {STATUS_LABELS[offer.status] || offer.status}
                  </span>
                  <span>{formatCurrency(offer.offerAmount)}</span>
                  <span className="summary-label">
                    Submitted {formatDate(offer.submittedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ProviderView;
