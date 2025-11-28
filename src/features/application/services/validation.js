// Validation utility functions

// IC Number validation: xxxxxx-xx-xxxx
export const validateIC = (ic) => {
  if (!ic) return 'IC Number is required'
  const icPattern = /^\d{6}-\d{2}-\d{4}$/
  if (!icPattern.test(ic)) return 'IC must be in format: xxxxxx-xx-xxxx'
  return null
}

// Phone number validation: 10-11 digits
export const validatePhone = (phone) => {
  if (!phone) return null // Individual phone fields are optional
  const phonePattern = /^\d{10,11}$/
  if (!phonePattern.test(phone.replace(/[\s-]/g, ''))) return 'Phone must be 10-11 digits'
  return null
}

// At least one phone required
export const validateAtLeastOnePhone = (residencePhone, telephone) => {
  if (!residencePhone && !telephone) {
    return 'At least one phone number is required'
  }
  return null
}

// Postcode validation: 5 digits
export const validatePostcode = (postcode) => {
  if (!postcode) return 'Postcode is required'
  const postcodePattern = /^\d{5}$/
  if (!postcodePattern.test(postcode)) return 'Postcode must be 5 digits'
  return null
}

// Email validation
export const validateEmail = (email) => {
  if (!email) return 'Email is required'
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) return 'Invalid email format'
  return null
}

// Age validation: must be at least 55 years old
export const validateAge = (day, month, year, label = 'Applicant') => {
  if (!day || !month || !year) return `${label} date of birth is required`
  
  const dob = new Date(year, month - 1, day)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  
  if (age < 55) return `${label} must be at least 55 years old`
  if (age > 120) return `${label} age cannot exceed 120 years`
  return null
}

// Date cannot be in future
export const validateDateNotFuture = (day, month, year, label) => {
  if (!day || !month || !year) return `${label} is required`
  
  const date = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (date > today) return `${label} cannot be in the future`
  return null
}

// Numeric/decimal validation
export const validateNumeric = (value, label, required = true) => {
  if (!value) return required ? `${label} is required` : null
  if (!/^\d+(\.\d+)?$/.test(value)) return `${label} must be a valid number`
  return null
}

// Required field validation
export const validateRequired = (value, label) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${label} is required`
  }
  return null
}

// Step 1 validation
export const validateStep1 = (formData) => {
  const errors = {}
  
  // Basic required fields
  errors.nameAsPerNRIC = validateRequired(formData.nameAsPerNRIC, 'Name')
  errors.nricNo = validateIC(formData.nricNo)
  errors.address = validateRequired(formData.address, 'Address')
  errors.postcode = validatePostcode(formData.postcode)
  errors.email = validateEmail(formData.email)
  errors.occupation = validateRequired(formData.occupation, 'Occupation')
  errors.purposeOfApplication = validateRequired(formData.purposeOfApplication, 'Purpose of Loan')
  
  // Phone validation (at least one required)
  const phoneError = validateAtLeastOnePhone(formData.residencePhone, formData.telephone)
  if (phoneError) {
    errors.phone = phoneError
  } else {
    // Validate individual phone formats if provided
    if (formData.residencePhone) {
      errors.residencePhone = validatePhone(formData.residencePhone)
    }
    if (formData.telephone) {
      errors.telephone = validatePhone(formData.telephone)
    }
  }
  
  // Date of birth and age validation
  errors.dob = validateAge(formData.dobDay, formData.dobMonth, formData.dobYear, 'Applicant')
  
  // Number of dependents required
  errors.numOfDependents = validateRequired(formData.numOfDependents, 'Total number of dependents')
  
  // Radio selections
  errors.sex = validateRequired(formData.sex, 'Sex')
  errors.maritalStatus = validateRequired(formData.maritalStatus, 'Marital Status')
  errors.presentHouse = validateRequired(formData.presentHouse, 'Present House')
  errors.payoutOption = validateRequired(formData.payoutOption, 'Payout Option')
  errors.paymentOption = validateRequired(formData.paymentOption, 'Payment Option')
  
  // If monthly payout with lump sum, validate lump sum usage
  if (formData.payoutOption === 'monthlyPayout_lumpSum') {
    errors.lumpSumUsage = validateRequired(formData.lumpSumUsage, 'Lump Sum Usage')
  }
  
  // Filter out null errors
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Step 2 validation
export const validateStep2 = (formData) => {
  const errors = {}
  
  // If joint application, validate all joint applicant fields
  if (formData.isJointApplicant) {
    errors.jName = validateRequired(formData.jName, 'Joint Applicant Name')
    errors.jIc = validateIC(formData.jIc)
    errors.jAddress = validateRequired(formData.jAddress, 'Joint Applicant Address')
    errors.jPostcode = validatePostcode(formData.jPostcode)
    errors.jEmail = validateEmail(formData.jEmail)
    errors.jOccupation = validateRequired(formData.jOccupation, 'Joint Applicant Occupation')
    errors.jEmployerName = validateRequired(formData.jEmployerName, 'Joint Applicant Employer Name')
    
    // Phone validation (at least one required)
    const jPhoneError = validateAtLeastOnePhone(formData.jResidencePhone, formData.jTelephone)
    if (jPhoneError) {
      errors.jPhone = jPhoneError
    } else {
      if (formData.jResidencePhone) {
        errors.jResidencePhone = validatePhone(formData.jResidencePhone)
      }
      if (formData.jTelephone) {
        errors.jTelephone = validatePhone(formData.jTelephone)
      }
    }
    
    // Date of birth and age validation
    errors.jDob = validateAge(formData.jDobDay, formData.jDobMonth, formData.jDobYear, 'Joint Applicant')
    
    // Radio selections
    errors.jSex = validateRequired(formData.jSex, 'Joint Applicant Sex')
    errors.jMarital = validateRequired(formData.jMarital, 'Joint Applicant Marital Status')
    errors.jRelationship = validateRequired(formData.jRelationship, 'Relationship to Applicant')
  }
  
  // Banking details (always required)
  errors.bankName = validateRequired(formData.bankName, 'Bank Name')
  errors.accountType = validateRequired(formData.accountType, 'Account Type')
  errors.accountNumber = validateRequired(formData.accountNumber, 'Account Number')
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Step 3 validation
export const validateStep3 = (formData) => {
  const errors = {}
  
  // Required fields
  errors.propertyType = validateRequired(formData.propertyType, 'Property Type')
  errors.propertyAddress = validateRequired(formData.propertyAddress, 'Property Address')
  errors.propertyPostcode = validatePostcode(formData.propertyPostcode)
  errors.indicativeMarketValue = validateNumeric(formData.indicativeMarketValue, 'Indicative Market Value')
  errors.expectedMarketValue = validateNumeric(formData.expectedMarketValue, 'Expected Market Value')
  errors.purchasePrice = validateNumeric(formData.purchasePrice, 'Purchase Price')
  errors.buildUpArea = validateNumeric(formData.buildUpArea, 'Build Up Area')
  errors.landArea = validateNumeric(formData.landArea, 'Land Area')
  
  // Dates
  errors.valuationDate = validateDateNotFuture(formData.valuationDay, formData.valuationMonth, formData.valuationYear, 'Valuation Date')
  errors.purchaseDate = validateDateNotFuture(formData.purchaseDay, formData.purchaseMonth, formData.purchaseYear, 'Purchase Date')
  
  // Tenure
  errors.tenureTitle = validateRequired(formData.tenureTitle, 'Tenure Title')
  if (formData.tenureTitle === 'leasehold') {
    if (!formData.expiryDay || !formData.expiryMonth || !formData.expiryYear) {
      errors.expiryDate = 'Lease Expiry Date is required for leasehold property'
    }
  }
  
  // Property encumbered
  errors.propertyEncumbered = validateRequired(formData.propertyEncumbered, 'Property Encumbered')
  if (formData.propertyEncumbered === 'yes') {
    errors.propertyBankName = validateRequired(formData.propertyBankName, 'Bank Name')
    errors.estOutstandingBalance = validateNumeric(formData.estOutstandingBalance, 'Outstanding Balance')
  }
  
  // Fire insurance
  errors.fireInsurance = validateRequired(formData.fireInsurance, 'Fire Insurance')
  if (formData.fireInsurance === 'inForce') {
    errors.insuranceCompany = validateRequired(formData.insuranceCompany, 'Insurance Company')
    errors.periodValidity = validateRequired(formData.periodValidity, 'Period Validity')
  }
  if (formData.fireInsurance === 'notAvailable') {
    errors.fireInsuranceNotAvailable = validateRequired(formData.fireInsuranceNotAvailable, 'Insurance Purchase Option')
  }
  
  // Renewal
  errors.renewalFireInsurance = validateRequired(formData.renewalFireInsurance, 'Fire Insurance Renewal')
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Step 4 validation (Nominees)
export const validateStep4 = (formData) => {
  const errors = {}
  
  // Nominee 1 (always required)
  errors.nominee1Name = validateRequired(formData.nominee1Name, 'Nominee 1 Name')
  errors.nominee1Ic = validateIC(formData.nominee1Ic)
  errors.nominee1Address = validateRequired(formData.nominee1Address, 'Nominee 1 Address')
  errors.nominee1Postcode = validatePostcode(formData.nominee1Postcode)
  errors.nominee1Email = validateEmail(formData.nominee1Email)
  errors.nominee1Relationship = validateRequired(formData.nominee1Relationship, 'Nominee 1 Relationship')
  errors.nominee1Marital = validateRequired(formData.nominee1Marital, 'Nominee 1 Marital Status')
  errors.nominee1Sex = validateRequired(formData.nominee1Sex, 'Nominee 1 Sex')
  
  // At least one phone required
  const nom1PhoneError = validateAtLeastOnePhone(formData.nominee1ResidencePhone, formData.nominee1Telephone)
  if (nom1PhoneError) {
    errors.nominee1Phone = nom1PhoneError
  } else {
    if (formData.nominee1ResidencePhone) {
      errors.nominee1ResidencePhone = validatePhone(formData.nominee1ResidencePhone)
    }
    if (formData.nominee1Telephone) {
      errors.nominee1Telephone = validatePhone(formData.nominee1Telephone)
    }
  }
  
  // DOB required
  if (!formData.nominee1DobDay || !formData.nominee1DobMonth || !formData.nominee1DobYear) {
    errors.nominee1Dob = 'Nominee 1 Date of Birth is required'
  }
  
  // Nominee 2 (if checkbox is checked)
  if (formData.hasSecondNominee) {
    errors.nominee2Name = validateRequired(formData.nominee2Name, 'Nominee 2 Name')
    errors.nominee2Ic = validateIC(formData.nominee2Ic)
    errors.nominee2Address = validateRequired(formData.nominee2Address, 'Nominee 2 Address')
    errors.nominee2Postcode = validatePostcode(formData.nominee2Postcode)
    errors.nominee2Email = validateEmail(formData.nominee2Email)
    errors.nominee2Relationship = validateRequired(formData.nominee2Relationship, 'Nominee 2 Relationship')
    errors.nominee2Marital = validateRequired(formData.nominee2Marital, 'Nominee 2 Marital Status')
    errors.nominee2Sex = validateRequired(formData.nominee2Sex, 'Nominee 2 Sex')
    
    // At least one phone required
    const nom2PhoneError = validateAtLeastOnePhone(formData.nominee2ResidencePhone, formData.nominee2Telephone)
    if (nom2PhoneError) {
      errors.nominee2Phone = nom2PhoneError
    } else {
      if (formData.nominee2ResidencePhone) {
        errors.nominee2ResidencePhone = validatePhone(formData.nominee2ResidencePhone)
      }
      if (formData.nominee2Telephone) {
        errors.nominee2Telephone = validatePhone(formData.nominee2Telephone)
      }
    }
    
    // DOB required
    if (!formData.nominee2DobDay || !formData.nominee2DobMonth || !formData.nominee2DobYear) {
      errors.nominee2Dob = 'Nominee 2 Date of Birth is required'
    }
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Step 5 validation (Acknowledgement Form)
export const validateStep5 = (formData) => {
  const errors = {}
  
  errors.ack_nomineeName = validateRequired(formData.ack_nomineeName, 'Nominee Name')
  errors.ack_nomineeNRIC = validateIC(formData.ack_nomineeNRIC)
  errors.ack_nomineeAddress = validateRequired(formData.ack_nomineeAddress, 'Nominee Address')
  errors.ack_applicantName = validateRequired(formData.ack_applicantName, 'Applicant Name')
  errors.ack_applicantNRIC = validateIC(formData.ack_applicantNRIC)
  errors.ack_applicantAddress = validateRequired(formData.ack_applicantAddress, 'Applicant Address')
  
  // Date validation
  if (!formData.ack_applicationDay || !formData.ack_applicationMonth || !formData.ack_applicationYear) {
    errors.ack_applicationDate = 'Application Date is required'
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Acknowledgement validation (old - for reference)
export const validateAcknowledgement = (formData) => {
  const errors = {}
  
  errors.ackNomineeName = validateRequired(formData.ackNomineeName, 'Nominee Name')
  errors.ackNomineeIc = validateIC(formData.ackNomineeIc)
  errors.ackNomineeAddress = validateRequired(formData.ackNomineeAddress, 'Nominee Address')
  errors.ackApplicantName = validateRequired(formData.ackApplicantName, 'Applicant Name')
  errors.ackApplicantIc = validateIC(formData.ackApplicantIc)
  errors.ackJApplicantName = validateRequired(formData.ackJApplicantName, 'Joint Applicant Name')
  errors.ackApplicantAddress = validateRequired(formData.ackApplicantAddress, 'Applicant Address')
  errors.ackApplicationDate = validateRequired(formData.ackApplicationDate, 'Application Date')
  
  // Date validation
  if (!formData.ackDateDay || !formData.ackDateMonth || !formData.ackDateYear) {
    errors.ackDate = 'Acknowledgement Date is required'
  }
  
  errors.ackSignName = validateRequired(formData.ackSignName, 'Signature Name')
  errors.ackSignIc = validateIC(formData.ackSignIc)
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Master validation function
export const validateStep = (step, formData) => {
  switch(step) {
    case 1: return validateStep1(formData)
    case 2: return validateStep2(formData)
    case 3: return validateStep3(formData)
    case 4: return validateStep4(formData)
    case 5: return {} // Privacy & Declaration, no validation
    case 6: return validateStep5(formData) // Acknowledgement
    case 7: return {} // Review, no validation
    default: return {}
  }
}
