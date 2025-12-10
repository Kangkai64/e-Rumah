// Property Model
// Handles property data structure, validation, and calculations

class Property {
  constructor(data = {}) {
    this.borrowerType = data.borrowerType || null;
    this.age = data.age || null;
    this.landTenure = data.landTenure || null;
    this.state = data.state || null;
    this.area = data.area || null;
    this.propertyType = data.propertyType || null;
    this.marketValue = data.marketValue || null;
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
}

export default Property;
