// Property Model
// Handles property data structure, validation, and calculations
// Based on Cagamas Reverse Mortgage Framework with risk adjustments

// State-specific property growth rates (annual) based on Malaysia House Price Index
const STATE_GROWTH_RATES = {
  'WP Kuala Lumpur': 0.021,  // 2.1%
  'Selangor': 0.031,         // 3.1%
  'Putrajaya': 0.025,        // 2.5%
  'Johor': 0.053,            // 5.3%
  'Pulau Pinang': 0.031,     // 3.1%
  'Perak': 0.025,            // 2.5%
  'Negeri Sembilan': 0.022,  // 2.2%
  'Melaka': 0.018            // 1.8%
};

// Location risk factors (based on market liquidity)
const LOCATION_FACTORS = {
  'WP Kuala Lumpur': 1.00,   // High liquidity
  'Selangor': 1.00,          // High liquidity
  'Putrajaya': 0.95,         // Moderate liquidity
  'Johor': 0.95,             // Moderate liquidity
  'Pulau Pinang': 1.00,      // High liquidity
  'Perak': 0.90,             // Lower liquidity
  'Negeri Sembilan': 0.90,   // Lower liquidity
  'Melaka': 0.85             // Lower liquidity
};

// Land tenure risk factors
const LAND_TENURE_FACTORS = {
  'Freehold': 1.00,
  'Leasehold': 0.95  // Conservative for general leasehold
};

// Property type risk factors
const PROPERTY_TYPE_FACTORS = {
  'Terrance': 1.00,
  'High-Rise': 0.90,
  'Semi-Detach': 0.95,
  'Detach': 0.85,
  'Others': 0.85
};

// Borrower type factors (affects actuarial duration and risk)
const BORROWER_TYPE_FACTORS = {
  'Single': 1.00,
  'Joint': 0.92  // Joint borrowers = longer expected duration, lower payout
};

// Age-specific Base LTV (before risk adjustments)
const BASE_LTV_BY_AGE = {
  55: 0.38, 56: 0.39, 57: 0.40, 58: 0.40, 59: 0.41,
  60: 0.42, 61: 0.43, 62: 0.44, 63: 0.44, 64: 0.45,
  65: 0.45, 66: 0.46, 67: 0.47, 68: 0.48, 69: 0.49,
  70: 0.50, 71: 0.51, 72: 0.52, 73: 0.53, 74: 0.54,
  75: 0.55, 76: 0.56, 77: 0.57, 78: 0.58, 79: 0.59, 80: 0.60
};

// Age-specific Risk Factors (prudential adjustments)
const AGE_RISK_FACTOR_BY_AGE = {
  55: 0.70, 56: 0.71, 57: 0.72, 58: 0.73, 59: 0.74,
  60: 0.85, 61: 0.86, 62: 0.87, 63: 0.88, 64: 0.90,
  65: 0.95, 66: 0.96, 67: 0.97, 68: 0.98, 69: 0.99,
  70: 1.00, 71: 1.01, 72: 1.02, 73: 1.03, 74: 1.05,
  75: 1.05, 76: 1.06, 77: 1.07, 78: 1.08, 79: 1.09, 80: 1.10
};

// Age-specific Lump Sum Caps
const LUMP_SUM_CAP_BY_AGE = {
  55: 0.15, 56: 0.16, 57: 0.17, 58: 0.18, 59: 0.19,
  60: 0.20, 61: 0.21, 62: 0.22, 63: 0.23, 64: 0.24,
  65: 0.25, 66: 0.26, 67: 0.27, 68: 0.28, 69: 0.29,
  70: 0.30, 71: 0.31, 72: 0.32, 73: 0.33, 74: 0.34,
  75: 0.35, 76: 0.37, 77: 0.39, 78: 0.41, 79: 0.43, 80: 0.45
};

// Age-specific Tenure (years)
const TENURE_BY_AGE = {
  55: 28, 56: 27, 57: 26, 58: 26, 59: 25,
  60: 25, 61: 24, 62: 23, 63: 23, 64: 22,
  65: 22, 66: 21, 67: 20, 68: 19, 69: 19,
  70: 18, 71: 17, 72: 16, 73: 15, 74: 15,
  75: 14, 76: 13, 77: 12, 78: 11, 79: 11, 80: 10
};

class Property {
  constructor(data = {}) {
    this.borrowerType = data.borrowerType || null;
    this.age = data.age || null;
    this.landTenure = data.landTenure || null;
    this.state = data.state || null;
    this.area = data.area || null;
    this.propertyType = data.propertyType || null;
    this.marketValue = data.marketValue || null;
    this.annualInterestRate = 0.05; // 5% default
    this.propertyGrowthRate = STATE_GROWTH_RATES[this.state] || 0.025; // Default 2.5%
    this.marketRiskBuffer = 0.95; // General market risk buffer
  }

  /**
   * Get pricing age (under 60 priced as 60)
   * @returns {number} Age to use for calculations
   */
  getPricingAge() {
    const age = parseInt(this.age);
    return age < 60 ? 60 : age;
  }

  /**
   * Get age-specific base LTV
   * @returns {number} Base LTV for the age
   */
  getBaseLTV() {
    const pricingAge = this.getPricingAge();
    // Use lookup table or default for ages > 80
    return BASE_LTV_BY_AGE[pricingAge] || 0.60;
  }

  /**
   * Get age-specific risk factor
   * @returns {number} Age risk factor
   */
  getAgeRiskFactor() {
    const age = parseInt(this.age);
    // Use lookup table or default for ages > 80
    return AGE_RISK_FACTOR_BY_AGE[age] || 1.10;
  }

  /**
   * Get age-specific lump sum cap
   * @returns {number} Lump sum cap percentage
   */
  getLumpSumCap() {
    const age = parseInt(this.age);
    // Use lookup table or default for ages > 80
    return LUMP_SUM_CAP_BY_AGE[age] || 0.45;
  }

  /**
   * Get age-specific tenure
   * @returns {number} Base tenure in years
   */
  getBaseTenure() {
    const age = parseInt(this.age);
    // Use lookup table or default for ages > 80
    return TENURE_BY_AGE[age] || 10;
  }

  /**
   * Validate all required fields
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validate() {
    const errors = [];

    if (!this.borrowerType) {
      errors.push('Borrower/Customer Type is required');
    }

    if (!this.age) {
      errors.push('Age is required');
    }

    if (!this.landTenure) {
      errors.push('Land Tenure is required');
    }

    if (!this.state) {
      errors.push('State is required');
    }

    if (!this.area) {
      errors.push('Area is required');
    }

    if (!this.propertyType) {
      errors.push('Property Type is required');
    }

    if (!this.marketValue || this.marketValue <= 0) {
      errors.push('Current Market Value must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset all property data
   */
  reset() {
    this.borrowerType = null;
    this.age = null;
    this.landTenure = null;
    this.state = null;
    this.area = null;
    this.propertyType = null;
    this.marketValue = null;
  }

  /**
   * Convert market value from string to number
   * @returns {number} Market value as number
   */
  getMarketValueAsNumber() {
    if (typeof this.marketValue === 'string') {
      return parseFloat(this.marketValue.replace(/,/g, '')) || 0;
    }
    return this.marketValue || 0;
  }

  /**
   * Format market value with thousand separators
   * @param {number} value
   * @returns {string} Formatted value
   */
  static formatCurrency(value) {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Parse formatted currency string to number
   * @param {string} value
   * @returns {number} Numeric value
   */
  static parseCurrency(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/,/g, '')) || 0;
  }

  /**
   * Calculate Adjusted Property Value (APV)
   * APV = MarketValue × LandTenureFactor × LocationFactor × PropertyTypeFactor
   * @returns {number} Adjusted property value in RM
   */
  calculateAdjustedPropertyValue() {
    const marketValue = this.getMarketValueAsNumber();
    const landTenureFactor = LAND_TENURE_FACTORS[this.landTenure] || 0.95;
    const locationFactor = LOCATION_FACTORS[this.state] || 0.90;
    const propertyTypeFactor = PROPERTY_TYPE_FACTORS[this.propertyType] || 0.85;
    
    return marketValue * landTenureFactor * locationFactor * propertyTypeFactor;
  }

  /**
   * Calculate loan duration based on age-specific tenure
   * @returns {number} Loan duration in years
   */
  calculateLoanDuration() {
    let tenure = this.getBaseTenure();
    
    // Joint borrowers: add 10% to duration for actuarial adjustment
    if (this.borrowerType === 'Joint') {
      tenure = tenure * 1.10;
    }
    
    return tenure;
  }

  /**
   * Calculate Effective Loan-to-Value ratio
   * Uses age-specific base LTV and risk factors
   * EffectiveLTV = BaseLTV(age) × AgeRiskFactor(age) × BorrowerFactor × MarketRiskBuffer
   * @returns {number} Effective LTV ratio
   */
  calculateLTV() {
    const baseLTV = this.getBaseLTV();
    const ageRiskFactor = this.getAgeRiskFactor();
    const borrowerFactor = BORROWER_TYPE_FACTORS[this.borrowerType] || 1.00;
    
    return baseLTV * ageRiskFactor * borrowerFactor * this.marketRiskBuffer;
  }

  /**
   * Calculate future property value using state-specific growth rate
   * @param {number} years - Number of years to project
   * @returns {number} Future property value in RM
   */
  calculateFuturePropertyValue(years) {
    const currentValue = this.getMarketValueAsNumber();
    return currentValue * Math.pow(1 + this.propertyGrowthRate, years);
  }

  /**
   * Calculate maximum loan base
   * LoanBase = AdjustedPropertyValue × EffectiveLTV
   * @returns {number} Maximum loan in RM
   */
  calculateMaxLoan() {
    const apv = this.calculateAdjustedPropertyValue();
    const ltv = this.calculateLTV();
    return apv * ltv;
  }

  /**
   * Calculate maximum allowable lump sum
   * Uses age-specific lump sum cap from lookup table
   * @returns {number} Maximum lump sum in RM
   */
  calculateMaxLumpSum() {
    const loanBase = this.calculateMaxLoan();
    const lumpSumCap = this.getLumpSumCap();
    
    // Apply borrower type discount (joint borrowers = lower lump sum)
    const borrowerFactor = this.borrowerType === 'Joint' ? 0.90 : 1.00;
    
    return loanBase * lumpSumCap * borrowerFactor;
  }

  /**
   * Calculate monthly payout based on lump sum amount
   * @param {number} lumpSumAmount - Amount taken as lump sum
   * @returns {number} Monthly payout in RM
   */
  calculateMonthlyPayout(lumpSumAmount = 0) {
    const maxLoan = this.calculateMaxLoan();
    const remainingLoan = maxLoan - lumpSumAmount;
    const duration = this.calculateLoanDuration();
    const n = 12 * duration; // Total months
    const r = this.annualInterestRate;
    const monthlyRate = r / 12;

    if (remainingLoan <= 0) return 0;

    // Monthly payout formula: RemainingLoan × (r/12) ÷ [1 − (1 + r/12)^(−n)]
    const monthlyPayout = 
      (remainingLoan * monthlyRate) / 
      (1 - Math.pow(1 + monthlyRate, -n));

    return monthlyPayout;
  }

  /**
   * Get complete calculation results
   * @param {number} lumpSumAmount - Selected lump sum amount
   * @returns {Object} Calculation results with age-specific parameters
   */
  getCalculationResults(lumpSumAmount = 0) {
    const age = parseInt(this.age);
    const apv = this.calculateAdjustedPropertyValue();
    const maxLoan = this.calculateMaxLoan();
    const maxLumpSum = this.calculateMaxLumpSum();
    const duration = this.calculateLoanDuration();
    const ltv = this.calculateLTV();
    const monthlyPayout = this.calculateMonthlyPayout(lumpSumAmount);
    const futureValue = this.calculateFuturePropertyValue(duration);

    return {
      propertyValue: this.getMarketValueAsNumber(),
      adjustedPropertyValue: apv,
      ltv: ltv,
      maxLoan: maxLoan,
      maxLumpSum: maxLumpSum,
      lumpSumAmount: lumpSumAmount,
      monthlyPayout: monthlyPayout,
      duration: duration,
      totalMonths: Math.round(12 * duration),
      propertyGrowthRate: this.propertyGrowthRate,
      futurePropertyValue: futureValue,
      state: this.state,
      borrowerType: this.borrowerType,
      // Age-specific parameters
      ageParameters: {
        actualAge: age,
        pricingAge: this.getPricingAge(),
        baseLTV: this.getBaseLTV(),
        ageRiskFactor: this.getAgeRiskFactor(),
        lumpSumCap: this.getLumpSumCap(),
        baseTenure: this.getBaseTenure()
      },
      // Risk factors for transparency
      riskFactors: {
        landTenure: LAND_TENURE_FACTORS[this.landTenure] || 0.95,
        location: LOCATION_FACTORS[this.state] || 0.90,
        propertyType: PROPERTY_TYPE_FACTORS[this.propertyType] || 0.85,
        borrowerType: BORROWER_TYPE_FACTORS[this.borrowerType] || 1.00,
        marketRiskBuffer: this.marketRiskBuffer
      }
    };
  }
}

export default Property;
