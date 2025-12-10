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

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
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
      // TODO: Send data to backend for calculation
      // const response = await applicationService.calculateProperty(formData);
      // Handle response...
      
      console.log('Property data validated and ready for calculation:', property);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error calculating property:', error);
      setErrors({ submit: 'Failed to calculate. Please try again.' });
    } finally {
      setIsLoading(false);
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
  };

  return (
    <PropertyCalculatorView
      formData={formData}
      errors={errors}
      onInputChange={handleInputChange}
      onCalculate={handleCalculate}
      onReset={handleReset}
      isLoading={isLoading}
    />
  );
};

export default PropertyCalculatorController;
