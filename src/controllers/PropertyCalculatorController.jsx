import { useState } from 'react';
import Property from '../models/Property';
import PropertyCalculatorView from '../views/PropertyCalculatorView';

const PropertyCalculatorController = () => {
  const [formData, setFormData] = useState({
    borrowerType: '',
    age: '',
    landTenure: '',
    state: '',
    area: '',
    propertyType: '',
    marketValue: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [calculationResults, setCalculationResults] = useState(null);
  const [selectedLumpSum, setSelectedLumpSum] = useState(0);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Clear area when state changes
      if (name === 'state') {
        newData.area = '';
      }
      
      return newData;
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear area error when state changes
    if (name === 'state' && errors.area) {
      setErrors(prev => ({
        ...prev,
        area: ''
      }));
    }
  };

  /**
   * Handle form submission and validation
   */
  const handleCalculate = async () => {
    // Create property instance with form data
    const property = new Property(formData);
    
    // Validate
    const validation = property.validate();
    
    if (!validation.isValid) {
      // Build errors object from validation errors array
      const newErrors = {};
      validation.errors.forEach(error => {
        // Map error messages to field names
        if (error.includes('Borrower')) newErrors.borrowerType = error;
        else if (error.includes('Age')) newErrors.age = error;
        else if (error.includes('Land Tenure')) newErrors.landTenure = error;
        else if (error.includes('State')) newErrors.state = error;
        else if (error.includes('Area')) newErrors.area = error;
        else if (error.includes('Property Type')) newErrors.propertyType = error;
        else if (error.includes('Market Value')) newErrors.marketValue = error;
      });
      
      setErrors(newErrors);
      return;
    }

    // Clear errors
    setErrors({});
    setIsLoading(true);

    try {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calculate results
      const results = property.getCalculationResults(0);
      setCalculationResults(results);
      setSelectedLumpSum(0);
      
      console.log('Calculation results:', results);
    } catch (error) {
      console.error('Error calculating property:', error);
      setErrors({ submit: 'Failed to calculate. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle lump sum slider change
   */
  const handleLumpSumChange = (value) => {
    setSelectedLumpSum(value);
    
    if (calculationResults) {
      const property = new Property(formData);
      const updatedResults = property.getCalculationResults(value);
      setCalculationResults(updatedResults);
    }
  };

  /**
   * Handle form reset
   */
  const handleReset = () => {
    setFormData({
      borrowerType: '',
      age: '',
      landTenure: '',
      state: '',
      area: '',
      propertyType: '',
      marketValue: ''
    });
    setErrors({});
    setCalculationResults(null);
    setSelectedLumpSum(0);
  };

  return (
    <PropertyCalculatorView
      formData={formData}
      errors={errors}
      onInputChange={handleInputChange}
      onCalculate={handleCalculate}
      onReset={handleReset}
      isLoading={isLoading}
      calculationResults={calculationResults}
      selectedLumpSum={selectedLumpSum}
      onLumpSumChange={handleLumpSumChange}
    />
  );
};

export default PropertyCalculatorController;
