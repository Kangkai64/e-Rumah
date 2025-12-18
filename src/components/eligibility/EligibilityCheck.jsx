import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './EligibilityCheck.css'
import Header from '../../layouts/Header'
import eligibilityBg from '../../assets/images/eligibity_check/eligibityCheckBg.png'

const EligibilityCheck = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    isMalaysian: '',
    postalCode: '',
    dateOfBirth: '',
    isPrimaryResidence: '',
    propertyType: '',
    leaseTenure: '',
    isSoleOwner: '',
    ownedByTwo: '',
    isFamilyMember: '',
    isOtherOwner55Plus: '',
    hasLegalProceedings: '',
    isMortgageFree: '',
    loanLowerThanMax: '',
    willSettleOutstanding: '',
    isFreeFromEncumbrances: ''
  })

  const [currentField, setCurrentField] = useState(1)
  const [errors, setErrors] = useState({})
  
  // Valid postal codes list for Kuala Lumpur
  const validPostalCodes = [
    '41100', '42100', '42000', '45800', '45600', '42500', '42600', '45000', '42700', '43950', '42200', '41300', '41050'
  ]

  // Handle dropdown/radio changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
    
    const isValid = validateField(field, value)
    
    // Clear subsequent fields if not valid
    if (!isValid) {
      clearSubsequentFields(field)
      // Reset currentField to lock subsequent fields (grey them out)
      const fieldNumbers = {
        'isMalaysian': 1,
        'postalCode': 2,
        'dateOfBirth': 3,
        'isPrimaryResidence': 4,
        'propertyType': 5,
        'leaseTenure': 5.5,
        'isSoleOwner': 6,
        'ownedByTwo': 6.1,
        'isFamilyMember': 6.2,
        'isOtherOwner55Plus': 6.3,
        'hasLegalProceedings': 7,
        'isMortgageFree': 8,
        'loanLowerThanMax': 8.1,
        'willSettleOutstanding': 8.2,
        'isFreeFromEncumbrances': 9
      }
      setCurrentField(fieldNumbers[field])
    }
    
    // Advance to next field
    setTimeout(() => {
      advanceToNextField(field, value, isValid)
    }, 100)
  }

  // Handle text input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  // Handle field blur for text inputs
  const handleFieldBlur = (field, value) => {
    const isValid = validateField(field, value)
    
    if (!isValid) {
      clearSubsequentFields(field)
    } else {
      setTimeout(() => {
        advanceToNextField(field, value, isValid)
      }, 100)
    }
  }

  // Clear subsequent fields when answer is ineligible
  const clearSubsequentFields = (fromField) => {
    const fieldsToClear = {
      'isMalaysian': ['postalCode', 'dateOfBirth', 'isPrimaryResidence', 'propertyType', 'leaseTenure', 'isSoleOwner', 'ownedByTwo', 'isFamilyMember', 'isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'postalCode': ['dateOfBirth', 'isPrimaryResidence', 'propertyType', 'leaseTenure', 'isSoleOwner', 'ownedByTwo', 'isFamilyMember', 'isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'dateOfBirth': ['isPrimaryResidence', 'propertyType', 'leaseTenure', 'isSoleOwner', 'ownedByTwo', 'isFamilyMember', 'isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'isPrimaryResidence': ['propertyType', 'leaseTenure', 'isSoleOwner', 'ownedByTwo', 'isFamilyMember', 'isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'propertyType': ['leaseTenure', 'isSoleOwner', 'ownedByTwo', 'isFamilyMember', 'isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'leaseTenure': ['isSoleOwner', 'ownedByTwo', 'isFamilyMember', 'isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'isSoleOwner': ['ownedByTwo', 'isFamilyMember', 'isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'ownedByTwo': ['isFamilyMember', 'isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'isFamilyMember': ['isOtherOwner55Plus', 'hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'isOtherOwner55Plus': ['hasLegalProceedings', 'isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'hasLegalProceedings': ['isMortgageFree', 'loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'isMortgageFree': ['loanLowerThanMax', 'willSettleOutstanding', 'isFreeFromEncumbrances'],
      'loanLowerThanMax': ['willSettleOutstanding', 'isFreeFromEncumbrances'],
      'willSettleOutstanding': ['isFreeFromEncumbrances']
    }

    if (fieldsToClear[fromField]) {
      setFormData(prev => {
        const newData = { ...prev }
        fieldsToClear[fromField].forEach(field => {
          newData[field] = ''
        })
        return newData
      })
    }
  }

  // Advance to next field based on current field and values
  const advanceToNextField = (currentFieldName, newValue, isValid) => {
    if (!isValid) {
      // Don't advance if invalid - stay at current field
      return
    }

    if (currentFieldName === 'isMalaysian' && newValue === 'yes') {
      setCurrentField(2)
    } else if (currentFieldName === 'postalCode') {
      setCurrentField(3)
    } else if (currentFieldName === 'dateOfBirth') {
      setCurrentField(4)
    } else if (currentFieldName === 'isPrimaryResidence' && newValue === 'yes') {
      setCurrentField(5)
    } else if (currentFieldName === 'propertyType') {
      if (newValue === 'freehold') {
        setCurrentField(6)
      } else if (newValue === 'leasehold') {
        setCurrentField(5.5)
      }
    } else if (currentFieldName === 'leaseTenure' && newValue === 'yes') {
      setCurrentField(6)
    } else if (currentFieldName === 'isSoleOwner') {
      if (newValue === 'yes') {
        setCurrentField(7)
      } else {
        setCurrentField(6.1)
      }
    } else if (currentFieldName === 'ownedByTwo' && newValue === 'yes') {
      setCurrentField(6.2)
    } else if (currentFieldName === 'isFamilyMember' && newValue === 'yes') {
      setCurrentField(6.3)
    } else if (currentFieldName === 'isOtherOwner55Plus' && newValue === 'yes') {
      setCurrentField(7)
    } else if (currentFieldName === 'hasLegalProceedings' && newValue === 'no') {
      setCurrentField(8)
    } else if (currentFieldName === 'isMortgageFree') {
      if (newValue === 'yes') {
        setCurrentField(9)
      } else {
        setCurrentField(8.1)
      }
    } else if (currentFieldName === 'loanLowerThanMax') {
      if (newValue === 'yes') {
        setCurrentField(9)
      } else {
        setCurrentField(8.2)
      }
    } else if (currentFieldName === 'willSettleOutstanding' && newValue === 'yes') {
      setCurrentField(9)
    } else if (currentFieldName === 'isFreeFromEncumbrances' && newValue === 'yes') {
      setCurrentField(10)
    }
  }

  // Validate individual field
  const validateField = (field, value) => {
    switch (field) {
      case 'isMalaysian':
        if (value !== 'yes') {
          setErrors(prev => ({ ...prev, [field]: 'Only Malaysian citizens are eligible' }))
          return false
        }
        return true
      
      case 'postalCode':
        if (!validPostalCodes.includes(value)) {
          setErrors(prev => ({ ...prev, [field]: 'This postal code is not within the eligible areas (Kuala Lumpur only)' }))
          return false
        }
        return true
      
      case 'dateOfBirth':
        if (!value) {
          setErrors(prev => ({ ...prev, [field]: 'Please enter your date of birth' }))
          return false
        }
        const birthDate = new Date(value)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        
        if (age < 55) {
          setErrors(prev => ({ ...prev, [field]: 'You must be at least 55 years old' }))
          return false
        }
        return true
      
      case 'isPrimaryResidence':
        if (value !== 'yes') {
          setErrors(prev => ({ ...prev, [field]: 'Property must be your primary place of residence' }))
          return false
        }
        return true
      
      case 'propertyType':
        return value === 'freehold' || value === 'leasehold'
      
      case 'leaseTenure':
        if (value !== 'yes') {
          setErrors(prev => ({ ...prev, [field]: 'Lease tenure must be renewed to at least 90 years before submission' }))
          return false
        }
        return true
      
      case 'isSoleOwner':
        return value === 'yes' || value === 'no'
      
      case 'ownedByTwo':
        if (value === 'no') {
          setErrors(prev => ({ ...prev, [field]: 'Property must be owned by maximum 2 people to be eligible' }))
          return false
        }
        return true
      
      case 'isFamilyMember':
        if (value === 'no') {
          setErrors(prev => ({ ...prev, [field]: 'The other owner must be a family member' }))
          return false
        }
        return true
      
      case 'isOtherOwner55Plus':
        if (value === 'no') {
          setErrors(prev => ({ ...prev, [field]: 'The other owner must be 55 years old or above' }))
          return false
        }
        return true
      
      case 'hasLegalProceedings':
        if (value === 'yes') {
          setErrors(prev => ({ ...prev, [field]: 'You cannot have any legal or bankruptcy proceedings to be eligible' }))
          return false
        }
        return true
      
      case 'isMortgageFree':
        return value === 'yes' || value === 'no'
      
      case 'loanLowerThanMax':
        return value === 'yes' || value === 'no'
      
      case 'willSettleOutstanding':
        if (value === 'no') {
          setErrors(prev => ({ ...prev, [field]: 'You must settle the outstanding loan/financing amount to be eligible' }))
          return false
        }
        return true
      
      case 'isFreeFromEncumbrances':
        if (value !== 'yes') {
          setErrors(prev => ({ ...prev, [field]: 'Property must be free from encumbrances' }))
          return false
        }
        return true
      
      default:
        return true
    }
  }

  // Check if field should be enabled
  const isFieldEnabled = (fieldNumber) => {
    return currentField >= fieldNumber
  }

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Congratulations! You are eligible for e-Rumah. Please create an account to continue.')
    navigate('/register')
  }

  return (
    <div className="eligibility-page">
      {/* Header */}
      <Header role="guest" />

      {/* Hero Section */}
      <div className="eligibility-hero">
        <img src={eligibilityBg} alt="Elderly couple" className="eligibility-bg-image" />
        <div className="eligibility-hero-overlay">
          <div className="eligibility-hero-content">
            <h1 className="hero-title">Eligibility Criteria</h1>
            <p className="hero-subtitle">
              If you have already done eligibility criteria check, please proceed to Login.
            </p>
            <Link to="/login" className="hero-login-btn">LOGIN</Link>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="eligibility-form-section">
        <form onSubmit={handleSubmit} className="eligibility-form">
          <div className="questions-grid">
            {/* Left Column - Questions 1-6 */}
            <div className="questions-column">
            {/* Question 1: Are you Malaysian? */}
            <div className={`eligibility-question ${isFieldEnabled(1) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">1</div>
              <div className="question-content">
                <label className="question-label">Are you Malaysian?</label>
                <div className="eligibility-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isMalaysian"
                      checked={formData.isMalaysian === 'yes'}
                      onChange={() => handleChange('isMalaysian', 'yes')}
                      disabled={!isFieldEnabled(1)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isMalaysian"
                      checked={formData.isMalaysian === 'no'}
                      onChange={() => handleChange('isMalaysian', 'no')}
                      disabled={!isFieldEnabled(1)}
                    />
                    <span>No</span>
                  </label>
                </div>
                {errors.isMalaysian && <p className="error-message">{errors.isMalaysian}</p>}
              </div>
            </div>

            {/* Question 2: Postal Code */}
            <div className={`eligibility-question ${isFieldEnabled(2) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">2</div>
              <div className="question-content">
                <label className="question-label">Please provide postal code of your residential property</label>
                <select
                  className="dropdown-input"
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  disabled={!isFieldEnabled(2)}
                >
                  <option value="">Select postal code...</option>
                  {validPostalCodes.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                {errors.postalCode && <p className="error-message">{errors.postalCode}</p>}
              </div>
            </div>

            {/* Question 3: Date of Birth */}
            <div className={`eligibility-question ${isFieldEnabled(3) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">3</div>
              <div className="question-content">
                <label className="question-label">Date of Birth</label>
                <input
                  type="date"
                  className="date-input"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  onBlur={(e) => handleFieldBlur('dateOfBirth', e.target.value)}
                  disabled={!isFieldEnabled(3)}
                />
                {errors.dateOfBirth && <p className="error-message">{errors.dateOfBirth}</p>}
              </div>
            </div>

            {/* Question 4: Primary Residence */}
            <div className={`eligibility-question ${isFieldEnabled(4) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">4</div>
              <div className="question-content">
                <label className="question-label">Is the property your primary place of residence?</label>
                <div className="eligibility-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isPrimaryResidence"
                      checked={formData.isPrimaryResidence === 'yes'}
                      onChange={() => handleChange('isPrimaryResidence', 'yes')}
                      disabled={!isFieldEnabled(4)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isPrimaryResidence"
                      checked={formData.isPrimaryResidence === 'no'}
                      onChange={() => handleChange('isPrimaryResidence', 'no')}
                      disabled={!isFieldEnabled(4)}
                    />
                    <span>No</span>
                  </label>
                </div>
                {errors.isPrimaryResidence && <p className="error-message">{errors.isPrimaryResidence}</p>}
              </div>
            </div>

            {/* Question 5: Property Type */}
            <div className={`eligibility-question ${isFieldEnabled(5) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">5</div>
              <div className="question-content">
                <label className="question-label">Freehold or Leasehold?</label>
                <div className="eligibility-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="propertyType"
                      checked={formData.propertyType === 'freehold'}
                      onChange={() => handleChange('propertyType', 'freehold')}
                      disabled={!isFieldEnabled(5)}
                    />
                    <span>Freehold</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="propertyType"
                      checked={formData.propertyType === 'leasehold'}
                      onChange={() => handleChange('propertyType', 'leasehold')}
                      disabled={!isFieldEnabled(5)}
                    />
                    <span>Leasehold</span>
                  </label>
                </div>
                {errors.propertyType && <p className="error-message">{errors.propertyType}</p>}

                {/* Inline sub-question 5.1 */}
                {formData.propertyType === 'leasehold' && (
                  <div className="inline-sub-question">
                    <label className="question-label">
                      If leasehold, is the lease tenure renewed to at least 90 years before submission of application to Cagamas?
                    </label>
                    <div className="eligibility-radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="leaseTenure"
                          checked={formData.leaseTenure === 'yes'}
                          onChange={() => handleChange('leaseTenure', 'yes')}
                          disabled={!isFieldEnabled(5.5)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="leaseTenure"
                          checked={formData.leaseTenure === 'no'}
                          onChange={() => handleChange('leaseTenure', 'no')}
                          disabled={!isFieldEnabled(5.5)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {errors.leaseTenure && <p className="error-message">{errors.leaseTenure}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Question 6: Sole Owner */}
            <div className={`eligibility-question ${isFieldEnabled(6) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">6</div>
              <div className="question-content">
                <label className="question-label">Are you the sole owner of the property?</label>
                <div className="eligibility-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isSoleOwner"
                      checked={formData.isSoleOwner === 'yes'}
                      onChange={() => handleChange('isSoleOwner', 'yes')}
                      disabled={!isFieldEnabled(6)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isSoleOwner"
                      checked={formData.isSoleOwner === 'no'}
                      onChange={() => handleChange('isSoleOwner', 'no')}
                      disabled={!isFieldEnabled(6)}
                    />
                    <span>No</span>
                  </label>
                </div>
                {errors.isSoleOwner && <p className="error-message">{errors.isSoleOwner}</p>}

                {/* Inline sub-question 6.1 */}
                {formData.isSoleOwner === 'no' && (
                  <div className="inline-sub-question">
                    <label className="question-label">If no, is the property owned by 2 people?</label>
                    <div className="eligibility-radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="ownedByTwo"
                          checked={formData.ownedByTwo === 'yes'}
                          onChange={() => handleChange('ownedByTwo', 'yes')}
                          disabled={!isFieldEnabled(6.1)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="ownedByTwo"
                          checked={formData.ownedByTwo === 'no'}
                          onChange={() => handleChange('ownedByTwo', 'no')}
                          disabled={!isFieldEnabled(6.1)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {errors.ownedByTwo && <p className="error-message">{errors.ownedByTwo}</p>}
                  </div>
                )}

                {/* Inline sub-question 6.2 */}
                {formData.isSoleOwner === 'no' && formData.ownedByTwo === 'yes' && (
                  <div className="inline-sub-question">
                    <label className="question-label">Is the other owner your family member?</label>
                    <div className="eligibility-radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="isFamilyMember"
                          checked={formData.isFamilyMember === 'yes'}
                          onChange={() => handleChange('isFamilyMember', 'yes')}
                          disabled={!isFieldEnabled(6.2)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="isFamilyMember"
                          checked={formData.isFamilyMember === 'no'}
                          onChange={() => handleChange('isFamilyMember', 'no')}
                          disabled={!isFieldEnabled(6.2)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {errors.isFamilyMember && <p className="error-message">{errors.isFamilyMember}</p>}
                  </div>
                )}

                {/* Inline sub-question 6.3 */}
                {formData.isSoleOwner === 'no' && formData.ownedByTwo === 'yes' && formData.isFamilyMember === 'yes' && (
                  <div className="inline-sub-question">
                    <label className="question-label">Is the other owner 55 years old or above?</label>
                    <div className="eligibility-radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="isOtherOwner55Plus"
                          checked={formData.isOtherOwner55Plus === 'yes'}
                          onChange={() => handleChange('isOtherOwner55Plus', 'yes')}
                          disabled={!isFieldEnabled(6.3)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="isOtherOwner55Plus"
                          checked={formData.isOtherOwner55Plus === 'no'}
                          onChange={() => handleChange('isOtherOwner55Plus', 'no')}
                          disabled={!isFieldEnabled(6.3)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {errors.isOtherOwner55Plus && <p className="error-message">{errors.isOtherOwner55Plus}</p>}
                  </div>
                )}
              </div>
            </div>
              </div> {/* End questions-column (left) */}

              {/* Right Column - Questions 7-9 */}
              <div className="questions-column">
            {/* Question 7: Legal Proceedings */}
            <div className={`eligibility-question ${isFieldEnabled(7) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">7</div>
              <div className="question-content">
                <label className="question-label">
                  Do you or/and the joint owner
                </label>
                <p className="question-description">
                  (i) have any legal proceedings, suit or action (whether criminal or civil) is instituted against 
                  you or/and the joint owner? or<br/><br/>
                  (ii) have any bankruptcy proceedings or petition is being commenced against you or/and the 
                  joint owner?
                </p>
                <div className="eligibility-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="hasLegalProceedings"
                      checked={formData.hasLegalProceedings === 'yes'}
                      onChange={() => handleChange('hasLegalProceedings', 'yes')}
                      disabled={!isFieldEnabled(7)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="hasLegalProceedings"
                      checked={formData.hasLegalProceedings === 'no'}
                      onChange={() => handleChange('hasLegalProceedings', 'no')}
                      disabled={!isFieldEnabled(7)}
                    />
                    <span>No</span>
                  </label>
                </div>
                {errors.hasLegalProceedings && <p className="error-message">{errors.hasLegalProceedings}</p>}
              </div>
            </div>

            {/* Question 8: Mortgage Free */}
            <div className={`eligibility-question ${isFieldEnabled(8) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">8</div>
              <div className="question-content">
                <label className="question-label">
                  Is your property mortgage free i.e., no home loans/financing remaining outstanding?
                </label>
                <div className="eligibility-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isMortgageFree"
                      checked={formData.isMortgageFree === 'yes'}
                      onChange={() => handleChange('isMortgageFree', 'yes')}
                      disabled={!isFieldEnabled(8)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isMortgageFree"
                      checked={formData.isMortgageFree === 'no'}
                      onChange={() => handleChange('isMortgageFree', 'no')}
                      disabled={!isFieldEnabled(8)}
                    />
                    <span>No</span>
                  </label>
                </div>
                {errors.isMortgageFree && <p className="error-message">{errors.isMortgageFree}</p>}

                {/* Inline sub-question 8.1 */}
                {formData.isMortgageFree === 'no' && (
                  <div className="inline-sub-question">
                    <label className="question-label">
                      If no, does the current outstanding loan/financing amount lower than the Maximum Lumpsum Amount 
                      (Click the Reverse Mortgage Calculator below)?
                    </label>
                    <div className="eligibility-radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="loanLowerThanMax"
                          checked={formData.loanLowerThanMax === 'yes'}
                          onChange={() => handleChange('loanLowerThanMax', 'yes')}
                          disabled={!isFieldEnabled(8.1)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="loanLowerThanMax"
                          checked={formData.loanLowerThanMax === 'no'}
                          onChange={() => handleChange('loanLowerThanMax', 'no')}
                          disabled={!isFieldEnabled(7.1)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {errors.loanLowerThanMax && <p className="error-message">{errors.loanLowerThanMax}</p>}
                  </div>
                )}

                {/* Inline sub-question 8.2 */}
                {formData.isMortgageFree === 'no' && formData.loanLowerThanMax === 'no' && (
                  <div className="inline-sub-question">
                    <label className="question-label">
                      Do you intend to settle all remaining outstanding loan/financing amount by yourself 
                      to redeem your property from bank/current financer?
                    </label>
                    <div className="eligibility-radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="willSettleOutstanding"
                          checked={formData.willSettleOutstanding === 'yes'}
                          onChange={() => handleChange('willSettleOutstanding', 'yes')}
                          disabled={!isFieldEnabled(8.2)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="willSettleOutstanding"
                          checked={formData.willSettleOutstanding === 'no'}
                          onChange={() => handleChange('willSettleOutstanding', 'no')}
                          disabled={!isFieldEnabled(7.2)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {errors.willSettleOutstanding && <p className="error-message">{errors.willSettleOutstanding}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Question 9: Free from Encumbrances */}
            <div className={`eligibility-question ${isFieldEnabled(9) ? 'enabled' : 'disabled'}`}>
              <div className="question-number">9</div>
              <div className="question-content">
                <label className="question-label">Is your property free from encumbrances?</label>
                <p className="question-description">
                  Of concern: If you or your family have other financial obligations, such as an 
                  outstanding home equity loan or charges against title etc (including the amount 
                  loaned by government to pay monthly rent) (Monthly financial obligations), 
                  you are probably in some charge/lien with the property.
                </p>
                <div className="eligibility-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isFreeFromEncumbrances"
                      checked={formData.isFreeFromEncumbrances === 'yes'}
                      onChange={() => handleChange('isFreeFromEncumbrances', 'yes')}
                      disabled={!isFieldEnabled(9)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isFreeFromEncumbrances"
                      checked={formData.isFreeFromEncumbrances === 'no'}
                      onChange={() => handleChange('isFreeFromEncumbrances', 'no')}
                      disabled={!isFieldEnabled(9)}
                    />
                    <span>No</span>
                  </label>
                </div>
                {errors.isFreeFromEncumbrances && <p className="error-message">{errors.isFreeFromEncumbrances}</p>}
              </div>
            </div>
              </div> {/* End questions-column (right) */}
            </div> {/* End questions-grid */}

            {/* Success Message */}
            {currentField === 10 && (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <h3>You are eligible!</h3>
                <p>You meet all the criteria for the e-Rumah program.</p>
              </div>
            )}

            {/* Create Account Button */}
            <button 
              type="submit" 
              className="submit-btn"
              disabled={currentField < 10}
            >
              Create Account
            </button>
          </form>
        </div>
    </div>
  )
}

export default EligibilityCheck
