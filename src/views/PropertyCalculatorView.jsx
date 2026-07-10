import calculatorImage from "../assets/images/property_estimation/property_estimation.jpg";
import "../client_controller/propertyCalculator/propertyCalculator.css";

const PropertyCalculatorView = ({
  formData = {},
  errors = {},
  onInputChange = () => {},
  onCalculate = () => {},
  onReset = () => {},
  isLoading = false,
  calculationResults = null,
}) => {
  const strataPropertyTypes = new Set([
    "Condominium/Apartment",
    "Flat",
    "Low-Cost Flat",
  ]);

  const propertyTypeOptions = [
    "1 - 1 1/2 Storey Semi-Detached",
    "1 - 1 1/2 Storey Terraced",
    "2 - 2 1/2 Storey Semi-Detached",
    "2 - 2 1/2 Storey Terraced",
    "Cluster House",
    "Condominium/Apartment",
    "Detached",
    "Flat",
    "Low-Cost Flat",
    "Low-Cost House",
    "Terraced",
    "Town House",
    "Others",
  ];

  const tenureOptions = ["Freehold", "Leasehold"];
  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const yearOptions = Array.from({ length: 9 }, (_, index) => {
    const year = 2018 + index;
    return String(year);
  });

  const isStrataProperty = strataPropertyTypes.has(formData.propertyType);

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="property-calculator-wrapper">
      <section className="property-calculator-hero">
        <div className="property-calculator-hero-container">
          <div className="property-calculator-hero-left">
            <h1 className="property-calculator-hero-title">
              Property Value Estimator
            </h1>
            <p className="property-calculator-hero-subtitle">
              Estimate indicative property value using the trained machine
              learning model. For monthly payout estimates, please continue with
              your reverse mortgage provider's website.
            </p>

            <div className="property-calculator-disclaimer-box">
              <h3 className="property-calculator-disclaimer-title">
                Reference only
              </h3>
              <p className="property-calculator-disclaimer-text">
                The estimate shown here is a guidance figure only and should not
                be treated as a formal valuation or financing offer.
              </p>
            </div>
          </div>

          <div className="property-calculator-hero-right">
            <img
              src={calculatorImage}
              alt="Property value estimation illustration"
              className="property-calculator-hero-image"
            />
          </div>
        </div>
      </section>

      <section className="property-calculator-form-section">
        <div className="property-calculator-form-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onCalculate();
            }}
            className="property-calculator-form"
          >
            {errors.submit && (
              <div className="property-calculator-submit-error" role="alert">
                {errors.submit}
              </div>
            )}

            <div className="property-calculator-form-group">
              <label className="property-calculator-label">Property Type</label>
              <div className="property-calculator-input-wrapper">
                <select
                  name="propertyType"
                  value={formData.propertyType || ""}
                  onChange={onInputChange}
                  className="property-calculator-select"
                >
                  <option value="">Select property type</option>
                  {propertyTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.propertyType && (
                  <div className="property-calculator-error-message">
                    {errors.propertyType}
                    <div className="property-calculator-error-arrow"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="property-calculator-form-row">
              <div className="property-calculator-form-group">
                <label className="property-calculator-label">Scheme Name</label>
                <div className="property-calculator-input-wrapper">
                  <input
                    type="text"
                    name="schemeName"
                    value={formData.schemeName || ""}
                    onChange={onInputChange}
                    placeholder="e.g. Taman Pandan Indah"
                    className="property-calculator-text-input"
                  />
                  <small className="property-calculator-helper-text">
                    Enter the scheme or development name as recorded in the
                    transaction data.
                  </small>
                  {errors.schemeName && (
                    <div className="property-calculator-error-message">
                      {errors.schemeName}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="property-calculator-form-group">
                <label className="property-calculator-label">District</label>
                <div className="property-calculator-input-wrapper">
                  <input
                    type="text"
                    name="district"
                    value={formData.district || ""}
                    onChange={onInputChange}
                    placeholder="e.g. Hulu Langat"
                    className="property-calculator-text-input"
                  />
                  {errors.district && (
                    <div className="property-calculator-error-message">
                      {errors.district}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="property-calculator-form-row">
              <div className="property-calculator-form-group">
                <label className="property-calculator-label">Mukim</label>
                <div className="property-calculator-input-wrapper">
                  <input
                    type="text"
                    name="mukim"
                    value={formData.mukim || ""}
                    onChange={onInputChange}
                    placeholder="e.g. Ampang"
                    className="property-calculator-text-input"
                  />
                  {errors.mukim && (
                    <div className="property-calculator-error-message">
                      {errors.mukim}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="property-calculator-form-row">
              <div className="property-calculator-form-group">
                <label className="property-calculator-label">
                  Floor Area (sqm)
                </label>
                <div className="property-calculator-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    name="floorAreaSqm"
                    value={formData.floorAreaSqm || ""}
                    onChange={onInputChange}
                    placeholder="0.0"
                    className="property-calculator-text-input"
                  />
                  {errors.floorAreaSqm && (
                    <div className="property-calculator-error-message">
                      {errors.floorAreaSqm}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="property-calculator-form-group">
                <label className="property-calculator-label">
                  {isStrataProperty
                    ? "Parcel / Land Share Area (sqm)"
                    : "Land Area (sqm)"}
                </label>
                <div className="property-calculator-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    name="landAreaSqm"
                    value={formData.landAreaSqm || ""}
                    onChange={onInputChange}
                    placeholder={isStrataProperty ? "Optional" : "0.0"}
                    className="property-calculator-text-input"
                  />
                  <small className="property-calculator-helper-text">
                    {isStrataProperty
                      ? "For condominium, apartment, and flat properties, enter the parcel or share land area if you have it. Leave it blank if unavailable; the estimator will fall back to 0, which is less precise."
                      : "Enter the land area recorded for the property."}
                  </small>
                  {errors.landAreaSqm && (
                    <div className="property-calculator-error-message">
                      {errors.landAreaSqm}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="property-calculator-form-row">
              <div className="property-calculator-form-group">
                <label className="property-calculator-label">Tenure</label>
                <div className="property-calculator-input-wrapper">
                  <select
                    name="tenure"
                    value={formData.tenure || ""}
                    onChange={onInputChange}
                    className="property-calculator-select"
                  >
                    <option value="">Select tenure</option>
                    {tenureOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.tenure && (
                    <div className="property-calculator-error-message">
                      {errors.tenure}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="property-calculator-form-group">
                <label className="property-calculator-label">
                  Transaction Year
                </label>
                <div className="property-calculator-input-wrapper">
                  <select
                    name="txnYear"
                    value={formData.txnYear || ""}
                    onChange={onInputChange}
                    className="property-calculator-select"
                  >
                    <option value="">Select year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.txnYear && (
                    <div className="property-calculator-error-message">
                      {errors.txnYear}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="property-calculator-form-row">
              <div className="property-calculator-form-group">
                <label className="property-calculator-label">
                  Transaction Month
                </label>
                <div className="property-calculator-input-wrapper">
                  <select
                    name="txnMonth"
                    value={formData.txnMonth || ""}
                    onChange={onInputChange}
                    className="property-calculator-select"
                  >
                    <option value="">Select month</option>
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  {errors.txnMonth && (
                    <div className="property-calculator-error-message">
                      {errors.txnMonth}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="property-calculator-button-group">
              <button
                type="submit"
                disabled={isLoading}
                className="property-calculator-btn-calculate"
              >
                {isLoading ? "Estimating..." : "Estimate Property Value"}
              </button>

              <button
                type="button"
                onClick={onReset}
                className="property-calculator-btn-reset"
              >
                <svg
                  className="property-calculator-reset-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
                <span>Reset</span>
              </button>
            </div>
          </form>

          {calculationResults && (
            <div className="property-calculator-results">
              <h2 className="property-calculator-results-title">
                Estimated Value
              </h2>

              <div className="property-calculator-results-layout">
                <div className="property-calculator-results-left">
                  <div className="property-calculator-value-card">
                    <div className="property-calculator-value-label">
                      Estimated property value
                    </div>
                    <div className="property-calculator-value-amount">
                      {formatCurrency(calculationResults.estimated_price_rm)}
                    </div>
                    <div className="property-calculator-value-note">
                      Indicative market value generated by the trained model.
                    </div>
                  </div>

                  <div className="property-calculator-range-grid">
                    <div className="property-calculator-range-card">
                      <div className="property-calculator-range-label">
                        Lower bound
                      </div>
                      <div className="property-calculator-range-value">
                        {formatCurrency(calculationResults.lower_bound_rm)}
                      </div>
                    </div>

                    <div className="property-calculator-range-card">
                      <div className="property-calculator-range-label">
                        Upper bound
                      </div>
                      <div className="property-calculator-range-value">
                        {formatCurrency(calculationResults.upper_bound_rm)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="property-calculator-results-right">
                  <div className="property-calculator-summary-card">
                    <div className="property-calculator-summary-title">
                      Model details
                    </div>
                    <dl className="property-calculator-summary-list">
                      <div>
                        <dt>Model used</dt>
                        <dd>{calculationResults.model_version}</dd>
                      </div>
                      <div>
                        <dt>Currency</dt>
                        <dd>{calculationResults.currency}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="property-calculator-disclaimer-card">
                    <div className="property-calculator-disclaimer-card-title">
                      Disclaimer
                    </div>
                    <p className="property-calculator-disclaimer-card-text">
                      {calculationResults.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PropertyCalculatorView;
