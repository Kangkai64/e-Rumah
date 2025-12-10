import './PropertyCalculatorView.css';

const PropertyCalculatorView = ({
  formData = {},
  errors = {},
  onInputChange = () => {},
  onCalculate = () => {},
  onReset = () => {},
  isLoading = false
}) => {
  const borrowerTypes = ['Individual', 'Joint', 'Company', 'Trust'];
  const ageRanges = ['Below 25', '25-35', '35-45', '45-55', '55+'];
  const landTenures = ['Freehold', 'Leasehold 99 years', 'Leasehold 60 years'];
  const states = ['Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'];
  const areas = ['Urban', 'Semi-Urban', 'Rural'];
  const propertyTypes = ['Terraced House', 'Semi-Detached House', 'Detached House', 'Condominium', 'Shop', 'Office', 'Warehouse', 'Land', 'Other'];

  return (
    <div className="property-calculator-container">
      <div className="form-wrapper">
        <form onSubmit={(e) => { e.preventDefault(); onCalculate(); }} className="property-calculator-form">
          {/* Borrower Type */}
          <div className="form-group">
            <label className="form-label">Borrower/Customer Type</label>
            <select
              name="borrowerType"
              value={formData.borrowerType || ''}
              onChange={onInputChange}
              className="form-select"
            >
              <option value="">Select</option>
              {borrowerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.borrowerType && <span className="error-message">{errors.borrowerType}</span>}
          </div>

          {/* Age */}
          <div className="form-group">
            <label className="form-label">Age</label>
            <select
              name="age"
              value={formData.age || ''}
              onChange={onInputChange}
              className="form-select"
            >
              <option value="">Select</option>
              {ageRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            {errors.age && <span className="error-message">{errors.age}</span>}
          </div>

          {/* Land Tenure */}
          <div className="form-group">
            <label className="form-label">Land Tenure</label>
            <select
              name="landTenure"
              value={formData.landTenure || ''}
              onChange={onInputChange}
              className="form-select"
            >
              <option value="">Select</option>
              {landTenures.map(tenure => (
                <option key={tenure} value={tenure}>{tenure}</option>
              ))}
            </select>
            {errors.landTenure && <span className="error-message">{errors.landTenure}</span>}
          </div>

          {/* Property Location */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Property Location</label>
              <select
                name="state"
                value={formData.state || ''}
                onChange={onInputChange}
                className="form-select"
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>

            <div className="form-group">
              <label className="form-label"></label>
              <select
                name="area"
                value={formData.area || ''}
                onChange={onInputChange}
                className="form-select"
              >
                <option value="">Select Area</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              {errors.area && <span className="error-message">{errors.area}</span>}
            </div>
          </div>

          {/* Property Type */}
          <div className="form-group">
            <label className="form-label">Property Type</label>
            <select
              name="propertyType"
              value={formData.propertyType || ''}
              onChange={onInputChange}
              className="form-select"
            >
              <option value="">Select</option>
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.propertyType && <span className="error-message">{errors.propertyType}</span>}
          </div>

          {/* Current Market Value */}
          <div className="form-group">
            <label className="form-label">Current Market Value</label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">RM</span>
              <input
                type="text"
                name="marketValue"
                value={formData.marketValue || ''}
                onChange={onInputChange}
                placeholder="0.00"
                className="currency-input"
              />
            </div>
            {errors.marketValue && <span className="error-message">{errors.marketValue}</span>}
          </div>

          {/* Calculate Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-calculate"
          >
            {isLoading ? 'Calculating...' : 'Calculate'}
          </button>

          {/* Reset Link */}
          <button
            type="button"
            onClick={onReset}
            className="btn-reset"
          >
            <svg className="reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <span>Reset</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default PropertyCalculatorView;
