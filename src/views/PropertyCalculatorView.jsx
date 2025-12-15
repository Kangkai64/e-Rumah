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

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      padding: '40px 0'
    },
    wrapper: {
      backgroundColor: '#ffffff',
      borderRadius: '4px',
      boxShadow: '0px 3px 26px 0px rgba(4, 55, 123, 0.09)',
      width: '100%',
      maxWidth: '960px',
      padding: '50px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '30px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '30px'
    },
    label: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: '18px',
      fontWeight: '700',
      color: '#3a3a3a',
      textAlign: 'right',
      display: 'block'
    },
    select: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: '18px',
      fontWeight: '400',
      color: '#495057',
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '0',
      padding: '12px 30px 12px 12px',
      height: '43px',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpolygon points='7,7 0,0 14,0' fill='%230f82fa'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 8px center',
      transition: 'border-color 0.3s ease'
    },
    currencyWrapper: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '0',
      height: '47px'
    },
    currencyPrefix: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: '18px',
      fontWeight: '400',
      color: '#3a3a3a',
      paddingLeft: '15px',
      paddingRight: '10px',
      borderRight: '1px solid #e0e0e0'
    },
    currencyInput: {
      flex: 1,
      fontFamily: "'Roboto', sans-serif",
      fontSize: '18px',
      fontWeight: '400',
      color: '#3a3a3a',
      border: 'none',
      backgroundColor: '#ffffff',
      padding: '12px 15px',
      outline: 'none'
    },
    errorMessage: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: '14px',
      color: '#d32f2f',
      marginTop: '4px',
      display: 'block'
    },
    btnCalculate: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: '18px',
      fontWeight: '700',
      color: '#ffffff',
      backgroundColor: isLoading ? '#cccccc' : '#a8202d',
      border: 'none',
      borderRadius: '0',
      padding: '12px 24px',
      height: '43px',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.3s ease',
      marginTop: '10px',
      alignSelf: 'center',
      width: '200px'
    },
    btnReset: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: '18px',
      fontWeight: '400',
      color: '#818181',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginTop: '12px',
      padding: '8px 15px',
      transition: 'color 0.3s ease',
      alignSelf: 'center',
      height: '43px'
    },
    resetIcon: {
      width: '13px',
      height: '16px',
      display: 'flex',
      objectFit: 'contain'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <form onSubmit={(e) => { e.preventDefault(); onCalculate(); }} style={styles.form}>
          {/* Borrower Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Borrower/Customer Type</label>
            <select
              name="borrowerType"
              value={formData.borrowerType || ''}
              onChange={onInputChange}
              style={styles.select}
            >
              <option value="">Select</option>
              {borrowerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.borrowerType && <span style={styles.errorMessage}>{errors.borrowerType}</span>}
          </div>

          {/* Age */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Age</label>
            <select
              name="age"
              value={formData.age || ''}
              onChange={onInputChange}
              style={styles.select}
            >
              <option value="">Select</option>
              {ageRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            {errors.age && <span style={styles.errorMessage}>{errors.age}</span>}
          </div>

          {/* Land Tenure */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Land Tenure</label>
            <select
              name="landTenure"
              value={formData.landTenure || ''}
              onChange={onInputChange}
              style={styles.select}
            >
              <option value="">Select</option>
              {landTenures.map(tenure => (
                <option key={tenure} value={tenure}>{tenure}</option>
              ))}
            </select>
            {errors.landTenure && <span style={styles.errorMessage}>{errors.landTenure}</span>}
          </div>

          {/* Property Location */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Property Location</label>
              <select
                name="state"
                value={formData.state || ''}
                onChange={onInputChange}
                style={styles.select}
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && <span style={styles.errorMessage}>{errors.state}</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}></label>
              <select
                name="area"
                value={formData.area || ''}
                onChange={onInputChange}
                style={styles.select}
              >
                <option value="">Select Area</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              {errors.area && <span style={styles.errorMessage}>{errors.area}</span>}
            </div>
          </div>

          {/* Property Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Property Type</label>
            <select
              name="propertyType"
              value={formData.propertyType || ''}
              onChange={onInputChange}
              style={styles.select}
            >
              <option value="">Select</option>
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.propertyType && <span style={styles.errorMessage}>{errors.propertyType}</span>}
          </div>

          {/* Current Market Value */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Current Market Value</label>
            <div style={styles.currencyWrapper}>
              <span style={styles.currencyPrefix}>RM</span>
              <input
                type="text"
                name="marketValue"
                value={formData.marketValue || ''}
                onChange={onInputChange}
                placeholder="0.00"
                style={styles.currencyInput}
              />
            </div>
            {errors.marketValue && <span style={styles.errorMessage}>{errors.marketValue}</span>}
          </div>

          {/* Calculate Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={styles.btnCalculate}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#861a24';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#a8202d';
              }
            }}
          >
            {isLoading ? 'Calculating...' : 'Calculate'}
          </button>

          {/* Reset Link */}
          <button
            type="button"
            onClick={onReset}
            style={styles.btnReset}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#515151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#818181';
            }}
          >
            <svg style={styles.resetIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
