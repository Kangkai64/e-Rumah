import calculatorImage from '../assets/images/property_estimation/property_estimation.jpg';
import '../components/propertyCalculator/propertyCalculator.css';

const PropertyCalculatorView = ({
  formData = {},
  errors = {},
  onInputChange = () => {},
  onCalculate = () => {},
  onReset = () => {},
  isLoading = false,
  calculationResults = null,
  selectedLumpSum = 0,
  onLumpSumChange = () => {}
}) => {
  const borrowerTypes = ['Single', 'Joint'];
  const ageRanges = Array.from({ length: 45 }, (_, i) => (55 + i).toString());
  const landTenures = ['Freehold', 'Leasehold'];
  const states = ['WP Kuala Lumpur', 'Selangor', 'Putrajaya', 'Johor', 'Pulau Pinang', 'Perak', 'Negeri Sembilan', 'Melaka'];
  const propertyTypes = ['Terrance', 'High-Rise', 'Semi-Detach', 'Detach', 'Others'];

  // State-specific areas mapping
  const stateAreasMap = {
    'WP Kuala Lumpur': ['All Areas'],
    'Selangor': ['Petaling, Klang, Hulu Langat', 'Others'],
    'Putrajaya': ['Putrajaya'],
    'Johor': ['Johor Bahru'],
    'Pulau Pinang': ['Penang Island'],
    'Perak': ['Ipoh'],
    'Negeri Sembilan': ['Seremban'],
    'Melaka': ['Bandaraya Melaka']
  };

  // Get areas based on selected state
  const getAvailableAreas = () => {
    if (!formData.state) return [];
    return stateAreasMap[formData.state] || [];
  };

  const availableAreas = getAvailableAreas();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="property-calculator-wrapper">
      {/* Hero Section */}
      <section className="property-calculator-hero">
        <div className="property-calculator-hero-container">
          <div className="property-calculator-hero-left">
            <h1 className="property-calculator-hero-title">Property Estimation Calculator</h1>
            <p className="property-calculator-hero-subtitle">
              Use the reverse mortgage calculator below to know your indicative monthly payout amount.
            </p>
            
            <div className="property-calculator-disclaimer-box">
              <h3 className="property-calculator-disclaimer-title">Disclaimer</h3>
              <p className="property-calculator-disclaimer-text">
                Please note that this is only a general estimate and Borrower/Customer should not rely on this when making a loan/financing decision.
              </p>
            </div>
          </div>
          
          <div className="property-calculator-hero-right">
            <img 
              src={calculatorImage} 
              alt="Property Calculator Illustration" 
              className="property-calculator-hero-image"
            />
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="property-calculator-form-section">
        <div className="property-calculator-form-container">
          <form onSubmit={(e) => { e.preventDefault(); onCalculate(); }} className="property-calculator-form">
            {/* Borrower Type & Age - Same Line */}
            <div className="property-calculator-form-row">
              <div className="property-calculator-form-group">
                <label className="property-calculator-label">Borrower/Customer Type</label>
                <div className="property-calculator-input-wrapper">
                  <select
                    name="borrowerType"
                    value={formData.borrowerType || ''}
                    onChange={onInputChange}
                    className="property-calculator-select"
                  >
                    <option value="">Select</option>
                    {borrowerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.borrowerType && (
                    <div className="property-calculator-error-message">
                      {errors.borrowerType}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="property-calculator-form-group">
                <label className="property-calculator-label">Age</label>
                <div className="property-calculator-input-wrapper">
                  <select
                    name="age"
                    value={formData.age || ''}
                    onChange={onInputChange}
                    className="property-calculator-select"
                  >
                    <option value="">Select</option>
                    {ageRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                  {errors.age && (
                    <div className="property-calculator-error-message">
                      {errors.age}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Land Tenure - Single Line */}
            <div className="property-calculator-form-group">
              <label className="property-calculator-label">Land Tenure</label>
              <div className="property-calculator-input-wrapper">
                <select
                  name="landTenure"
                  value={formData.landTenure || ''}
                  onChange={onInputChange}
                  className="property-calculator-select"
                >
                  <option value="">Select</option>
                  {landTenures.map(tenure => (
                    <option key={tenure} value={tenure}>{tenure}</option>
                  ))}
                </select>
                {errors.landTenure && (
                  <div className="property-calculator-error-message">
                    {errors.landTenure}
                    <div className="property-calculator-error-arrow"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Property Location & Area - Same Line */}
            <div className="property-calculator-form-row">
              <div className="property-calculator-form-group">
                <label className="property-calculator-label">Property Location</label>
                <div className="property-calculator-input-wrapper">
                  <select
                    name="state"
                    value={formData.state || ''}
                    onChange={onInputChange}
                    className="property-calculator-select"
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <div className="property-calculator-error-message">
                      {errors.state}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="property-calculator-form-group">
                <label className="property-calculator-label">Area</label>
                <div className="property-calculator-input-wrapper">
                  <select
                    name="area"
                    value={formData.area || ''}
                    onChange={onInputChange}
                    className="property-calculator-select"
                    disabled={!formData.state}
                  >
                    <option value="">{!formData.state ? 'Select State First' : 'Select Area'}</option>
                    {availableAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  {errors.area && (
                    <div className="property-calculator-error-message">
                      {errors.area}
                      <div className="property-calculator-error-arrow"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Property Type - Single Line */}
            <div className="property-calculator-form-group">
              <label className="property-calculator-label">Property Type</label>
              <div className="property-calculator-input-wrapper">
                <select
                  name="propertyType"
                  value={formData.propertyType || ''}
                  onChange={onInputChange}
                  className="property-calculator-select"
                >
                  <option value="">Select</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
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

            {/* Current Market Value - Single Line */}
            <div className="property-calculator-form-group">
              <label className="property-calculator-label">Current Market Value</label>
              <div className="property-calculator-input-wrapper">
                <div className="property-calculator-currency-wrapper">
                  <span className="property-calculator-currency-prefix">RM</span>
                  <input
                    type="text"
                    name="marketValue"
                    value={formData.marketValue || ''}
                    onChange={onInputChange}
                    placeholder="0.00"
                    className="property-calculator-currency-input"
                  />
                </div>
                {errors.marketValue && (
                  <div className="property-calculator-error-message">
                    {errors.marketValue}
                    <div className="property-calculator-error-arrow"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="property-calculator-button-group">
              <button
                type="submit"
                disabled={isLoading}
                className="property-calculator-btn-calculate"
              >
                {isLoading ? 'Calculating...' : 'Calculate'}
              </button>

              <button
                type="button"
                onClick={onReset}
                className="property-calculator-btn-reset"
              >
                <svg className="property-calculator-reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
                <span>Reset</span>
              </button>
            </div>
          </form>

          {/* Results Section */}
          {calculationResults && (
            <div className="property-calculator-results">
              {/* Two Column Layout */}
              <div className="property-calculator-results-layout">
                {/* Left Column - Lump Sum Details & Slider */}
                <div className="property-calculator-results-left">
                  <h2 className="property-calculator-results-title">Results</h2>
                  {/* Maximum Lumpsum */}
                  <div className="property-calculator-lumpsum-display">
                    <div className="property-calculator-lumpsum-label">Maximum Lumpsum</div>
                    <div className="property-calculator-lumpsum-amount">{formatCurrency(calculationResults.maxLumpSum)}</div>
                  </div>

                  {/* Drawback Input */}
                  <div className="property-calculator-drawback-display">
                    <div className="property-calculator-drawback-label">Drawback</div>
                    <div className="property-calculator-currency-wrapper">
                      <span className="property-calculator-currency-prefix">RM</span>
                      <input
                        type="text"
                        value={selectedLumpSum.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          const numValue = parseFloat(value) || 0;
                          // Cap at max lump sum
                          const cappedValue = Math.min(numValue, calculationResults.maxLumpSum);
                          onLumpSumChange(cappedValue);
                        }}
                        placeholder="0.00"
                        className="property-calculator-currency-input"
                      />
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="property-calculator-slider-section">
                    <input
                      type="range"
                      min="0"
                      max={calculationResults.maxLumpSum}
                      step="1"
                      value={selectedLumpSum}
                      onChange={(e) => onLumpSumChange(parseFloat(e.target.value))}
                      className="property-calculator-lumpsum-slider"
                      style={{
                        background: `linear-gradient(to right, #A8202D 0%, #A8202D ${(selectedLumpSum / calculationResults.maxLumpSum) * 100}%, #e5e7eb ${(selectedLumpSum / calculationResults.maxLumpSum) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Right Column - Monthly Payout */}
                <div className="property-calculator-results-right">
                  <div className="property-calculator-payout-card">
                    <div className="property-calculator-payout-header">Monthly Payout</div>
                    <div className="property-calculator-payout-amount">{formatCurrency(calculationResults.monthlyPayout)}</div>
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
