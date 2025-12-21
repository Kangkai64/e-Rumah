// Validation utility functions

// IC Number validation: xxxxxx-xx-xxxx with valid date
export const validateIC = (ic) => {
  if (!ic) return 'IC Number is required'
  const icPattern = /^\d{6}-\d{2}-\d{4}$/
  if (!icPattern.test(ic)) return 'IC must be in format: xxxxxx-xx-xxxx'
  
  // Extract date components (YYMMDD)
  const cleanIC = ic.replace(/[-\s]/g, '')
  const year = cleanIC.substring(0, 2)
  const month = cleanIC.substring(2, 4)
  const day = cleanIC.substring(4, 6)
  
  const monthInt = parseInt(month)
  const dayInt = parseInt(day)
  const yearInt = parseInt(year)
  
  // Validate month (01-12)
  if (monthInt < 1 || monthInt > 12) {
    return 'IC contains invalid month (must be 01-12)'
  }
  
  // Validate day (01-31)
  if (dayInt < 1 || dayInt > 31) {
    return 'IC contains invalid day (must be 01-31)'
  }
  
  // Determine full year
  let fullYear
  if (yearInt <= 25) {
    fullYear = 2000 + yearInt
  } else {
    fullYear = 1900 + yearInt
  }
  
  // Validate day based on month
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (dayInt > daysInMonth[monthInt - 1]) {
    return 'IC contains invalid day for the specified month'
  }
  
  // Final validation: Check if the date is actually valid using JavaScript Date
  const testDate = new Date(fullYear, monthInt - 1, dayInt)
  if (testDate.getMonth() !== monthInt - 1 || testDate.getDate() !== dayInt) {
    return 'IC contains an invalid date'
  }
  
  return null
}

// Phone number validation: xxx-xxxxxxx format (10-11 digits with dash after first 3)
export const validatePhone = (phone) => {
  if (!phone) return null // Individual phone fields are optional
  const phonePattern = /^\d{3}-\d{7,8}$/
  if (!phonePattern.test(phone)) return 'Phone must be in format xxx-xxxxxxx (10-11 digits)'
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

// Address validation: maximum 60 characters
export const validateAddress = (address) => {
  if (!address) return null
  if (address.length > 60) return 'Address must not exceed 60 characters'
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
  if (formData.address && !errors.address) {
    errors.address = validateAddress(formData.address)
  }
  errors.postcode = validatePostcode(formData.postcode)
  errors.email = validateEmail(formData.email)
  errors.occupation = validateRequired(formData.occupation, 'Occupation')
  errors.employerName = validateRequired(formData.employerName, 'Employer Name')
  errors.employerAddress = validateRequired(formData.employerAddress, 'Employer Address')
  if (formData.employerAddress && !errors.employerAddress) {
    errors.employerAddress = validateAddress(formData.employerAddress)
  }
  errors.employerPostcode = validatePostcode(formData.employerPostcode)
  errors.purposeOfApplication = validateRequired(formData.purposeOfApplication, 'Purpose of Loan')
  
  // Phone validation (both required)
  errors.residencePhone = validateRequired(formData.residencePhone, 'Residence Phone')
  if (formData.residencePhone && !errors.residencePhone) {
    errors.residencePhone = validatePhone(formData.residencePhone)
  }
  
  errors.telephone = validateRequired(formData.telephone, 'H/P Number')
  if (formData.telephone && !errors.telephone) {
    errors.telephone = validatePhone(formData.telephone)
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
  
  // Malaysian citizenship required
  if (!formData.malaysian) {
    errors.malaysian = 'Malaysian citizenship is required'
  }
  
  // If monthly payout with lump sum, validate lump sum usage
  if (formData.payoutOption === 'monthlyPayout_lumpSum') {
    errors.lumpSumUsage = validateRequired(formData.lumpSumUsage, 'Lump Sum Usage')
  }
  
  // Document validations
  if (!formData.documents?.applicantNRIC?.url) {
    errors.applicantNRIC = 'Applicant NRIC document is required'
  }
  if (!formData.documents?.birthCertificate?.url) {
    errors.birthCertificate = 'Birth Certificate is required'
  }
  // Marriage certificate is optional (only shown when married AND joint applicant)
  
  // Payslips (3 required)
  for (let i = 0; i < 3; i++) {
    if (!formData.documents?.payslips?.[i]?.url) {
      errors[`payslip${i + 1}`] = `Payslip ${i + 1} is required`
    }
  }
  
  // Bank statements (6 required)
  for (let i = 0; i < 6; i++) {
    if (!formData.documents?.bankStatements?.[i]?.url) {
      errors[`bankStatement${i + 1}`] = `Bank Statement ${i + 1} is required`
    }
  }
  
  if (!formData.documents?.epfStatement?.url) {
    errors.epfStatement = 'EPF Statement is required'
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
    if (formData.jAddress && !errors.jAddress) {
      errors.jAddress = validateAddress(formData.jAddress)
    }
    errors.jPostcode = validatePostcode(formData.jPostcode)
    errors.jEmail = validateEmail(formData.jEmail)
    errors.jOccupation = validateRequired(formData.jOccupation, 'Joint Applicant Occupation')
    errors.jEmployerName = validateRequired(formData.jEmployerName, 'Joint Applicant Employer Name')
    errors.jEmployerAddress = validateRequired(formData.jEmployerAddress, 'Joint Applicant Employer Address')
    if (formData.jEmployerAddress && !errors.jEmployerAddress) {
      errors.jEmployerAddress = validateAddress(formData.jEmployerAddress)
    }
    errors.jEmployerPostcode = validatePostcode(formData.jEmployerPostcode)
    
    // Phone validation (both required)
    errors.jResidencePhone = validateRequired(formData.jResidencePhone, 'Joint Applicant Residence Phone')
    if (formData.jResidencePhone && !errors.jResidencePhone) {
      errors.jResidencePhone = validatePhone(formData.jResidencePhone)
    }
    
    errors.jTelephone = validateRequired(formData.jTelephone, 'Joint Applicant H/P Number')
    if (formData.jTelephone && !errors.jTelephone) {
      errors.jTelephone = validatePhone(formData.jTelephone)
    }
    
    // Date of birth and age validation
    errors.jDob = validateAge(formData.jDobDay, formData.jDobMonth, formData.jDobYear, 'Joint Applicant')
    
    // Radio selections
    errors.jSex = validateRequired(formData.jSex, 'Joint Applicant Sex')
    errors.jMarital = validateRequired(formData.jMarital, 'Joint Applicant Marital Status')
    errors.jRelationship = validateRequired(formData.jRelationship, 'Relationship to Applicant')
    
    // Malaysian citizenship required for joint applicant
    if (!formData.jMalaysian) {
      errors.jMalaysian = 'Joint Applicant Malaysian citizenship is required'
    }
    
    // Joint applicant NRIC document required
    if (!formData.documents?.jointApplicantNRIC?.url) {
      errors.jointApplicantNRIC = 'Joint Applicant NRIC document is required'
    }
  }
  
  // Banking details (always required)
  errors.bankName = validateRequired(formData.bankName, 'Bank Name')
  errors.accountType = validateRequired(formData.accountType, 'Account Type')
  errors.accountNumber = validateRequired(formData.accountNumber, 'Account Number')
  
  // If joint applicant, account type must be joint account
  if (formData.isJointApplicant) {
    if (formData.accountType && formData.accountType !== 'joinAccountSaving' && formData.accountType !== 'jointAccountCurrent') {
      errors.accountType = 'Account type must be Joint Account Saving or Joint Account Current when applying with a joint applicant'
    }
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Step 3 validation
export const validateStep3 = (formData) => {
  const errors = {}
  
  // Required fields
  errors.propertyType = validateRequired(formData.propertyType, 'Property Type')
  errors.propertyAddress = validateRequired(formData.propertyAddress, 'Property Address')
  if (formData.propertyAddress && !errors.propertyAddress) {
    errors.propertyAddress = validateAddress(formData.propertyAddress)
  }
  errors.propertyPostcode = validatePostcode(formData.propertyPostcode)
  
  // SSB Requirement 1: Property must be located in Malaysia (Kuala Lumpur only for SSB)
  // Valid postcodes for Kuala Lumpur
  const validKLPostcodes = ['41100', '42100', '42000', '45800', '45600', '42500', '42600', '45000', '42700', '43950', '42200', '41300', '41050']
  if (formData.propertyPostcode && !validKLPostcodes.includes(formData.propertyPostcode)) {
    errors.propertyPostcode = 'Property must be located in Kuala Lumpur (valid postcodes: 41100, 42100, 42000, 45800, 45600, 42500, 42600, 45000, 42700, 43950, 42200, 41300, 41050)'
  }
  
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
  
  // SSB Requirement 4: For leasehold properties, remaining lease tenure must be at least 90 years
  if (formData.tenureTitle === 'leasehold') {
    if (!formData.expiryDay || !formData.expiryMonth || !formData.expiryYear) {
      errors.expiryDate = 'Lease Expiry Date is required for leasehold property'
    } else {
      // Calculate remaining lease tenure
      const expiryDate = new Date(formData.expiryYear, formData.expiryMonth - 1, formData.expiryDay)
      const today = new Date()
      const yearsRemaining = (expiryDate - today) / (365.25 * 24 * 60 * 60 * 1000)
      
      if (yearsRemaining < 90) {
        errors.expiryDate = `Leasehold property must have at least 90 years remaining on the lease. Current remaining: ${Math.floor(yearsRemaining)} years. The lease tenure must be renewed to at least 90 years before submission.`
      }
    }
  }
  
  // SSB Requirement: Property must be free from encumbrances (BLOCKING)
  errors.propertyEncumbered = validateRequired(formData.propertyEncumbered, 'Property Encumbered')
  if (formData.propertyEncumbered === 'yes') {
    errors.propertyEncumbered = 'Property must be free from encumbrances such as mortgages and other financial liabilities. This is a requirement for SSB eligibility.'
  }
  
  // Fire insurance
  errors.fireInsurance = validateRequired(formData.fireInsurance, 'Fire Insurance')
  if (formData.fireInsurance === 'inForce') {
    errors.insuranceCompany = validateRequired(formData.insuranceCompany, 'Insurance Company')
    errors.periodValidity = validateRequired(formData.periodValidity, 'Period Validity')
  }
  // If insurance not available, it will automatically be purchased by Cagamas (no validation needed)
  
  // Renewal
  errors.renewalFireInsurance = validateRequired(formData.renewalFireInsurance, 'Fire Insurance Renewal')
  
  // Property documents
  if (!formData.documents?.grantTitle?.url) {
    errors.grantTitle = 'Grant / Title Deed is required'
  }
  if (!formData.documents?.saleAgreement?.url) {
    errors.saleAgreement = 'Sale & Purchase Agreement is required'
  }
  if (!formData.documents?.valuationReport?.url) {
    errors.valuationReport = 'Valuation Report is required'
  }
  if (!formData.documents?.fireInsurance?.url) {
    errors.fireInsuranceDoc = 'Fire Insurance Policy document is required'
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Step 4 validation (Nominees)
export const validateStep4 = (formData) => {
  const errors = {}
  
  // Nominee 1 (always required)
  errors.nominee1Name = validateRequired(formData.nominee1Name, 'Nominee 1 Name')
  errors.nominee1Ic = validateIC(formData.nominee1Ic)
  errors.nominee1Address = validateRequired(formData.nominee1Address, 'Nominee 1 Address')
  if (formData.nominee1Address && !errors.nominee1Address) {
    errors.nominee1Address = validateAddress(formData.nominee1Address)
  }
  errors.nominee1Postcode = validatePostcode(formData.nominee1Postcode)
  errors.nominee1Email = validateEmail(formData.nominee1Email)
  errors.nominee1Relationship = validateRequired(formData.nominee1Relationship, 'Nominee 1 Relationship')
  errors.nominee1Marital = validateRequired(formData.nominee1Marital, 'Nominee 1 Marital Status')
  errors.nominee1Sex = validateRequired(formData.nominee1Sex, 'Nominee 1 Sex')
  
  // Phone validation (both required)
  errors.nominee1ResidencePhone = validateRequired(formData.nominee1ResidencePhone, 'Nominee 1 Residence Phone')
  if (formData.nominee1ResidencePhone && !errors.nominee1ResidencePhone) {
    errors.nominee1ResidencePhone = validatePhone(formData.nominee1ResidencePhone)
  }
  
  errors.nominee1Telephone = validateRequired(formData.nominee1Telephone, 'Nominee 1 H/P Number')
  if (formData.nominee1Telephone && !errors.nominee1Telephone) {
    errors.nominee1Telephone = validatePhone(formData.nominee1Telephone)
  }
  
  // DOB required
  if (!formData.nominee1DobDay || !formData.nominee1DobMonth || !formData.nominee1DobYear) {
    errors.nominee1Dob = 'Nominee 1 Date of Birth is required'
  }
  
  // Malaysian citizenship required for nominee 1
  if (!formData.nominee1Malaysian) {
    errors.nominee1Malaysian = 'Nominee 1 Malaysian citizenship is required'
  }
  
  // Nominee 2 (if checkbox is checked)
  if (formData.hasSecondNominee) {
    errors.nominee2Name = validateRequired(formData.nominee2Name, 'Nominee 2 Name')
    errors.nominee2Ic = validateIC(formData.nominee2Ic)
    errors.nominee2Address = validateRequired(formData.nominee2Address, 'Nominee 2 Address')
    if (formData.nominee2Address && !errors.nominee2Address) {
      errors.nominee2Address = validateAddress(formData.nominee2Address)
    }
    errors.nominee2Postcode = validatePostcode(formData.nominee2Postcode)
    errors.nominee2Email = validateEmail(formData.nominee2Email)
    errors.nominee2Relationship = validateRequired(formData.nominee2Relationship, 'Nominee 2 Relationship')
    errors.nominee2Marital = validateRequired(formData.nominee2Marital, 'Nominee 2 Marital Status')
    errors.nominee2Sex = validateRequired(formData.nominee2Sex, 'Nominee 2 Sex')
    
    // Phone validation (both required)
    errors.nominee2ResidencePhone = validateRequired(formData.nominee2ResidencePhone, 'Nominee 2 Residence Phone')
    if (formData.nominee2ResidencePhone && !errors.nominee2ResidencePhone) {
      errors.nominee2ResidencePhone = validatePhone(formData.nominee2ResidencePhone)
    }
    
    errors.nominee2Telephone = validateRequired(formData.nominee2Telephone, 'Nominee 2 H/P Number')
    if (formData.nominee2Telephone && !errors.nominee2Telephone) {
      errors.nominee2Telephone = validatePhone(formData.nominee2Telephone)
    }
    
    // DOB required
    if (!formData.nominee2DobDay || !formData.nominee2DobMonth || !formData.nominee2DobYear) {
      errors.nominee2Dob = 'Nominee 2 Date of Birth is required'
    }
    
    // Malaysian citizenship required for nominee 2
    if (!formData.nominee2Malaysian) {
      errors.nominee2Malaysian = 'Nominee 2 Malaysian citizenship is required'
    }
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Step 5 validation (Privacy & Declaration - Signatures)
export const validateStep5Signatures = (formData) => {
  const errors = {}
  
  // Applicant signature required
  errors.applicant_signature = validateRequired(formData.applicant_signature, 'Applicant Signature')
  errors.applicant_signature_name = validateRequired(formData.applicant_signature_name, 'Applicant Signature Name')
  errors.applicant_signature_date = validateRequired(formData.applicant_signature_date, 'Applicant Signature Date')
  
  // Joint applicant signature required if joint applicant exists
  if (formData.isJointApplicant) {
    errors.jApplicant_signature = validateRequired(formData.jApplicant_signature, 'Joint Applicant Signature')
    errors.jApplicant_signature_name = validateRequired(formData.jApplicant_signature_name, 'Joint Applicant Signature Name')
    errors.jApplicant_signature_date = validateRequired(formData.jApplicant_signature_date, 'Joint Applicant Signature Date')
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Step 6 validation (Acknowledgement Form)
export const validateStep6 = (formData) => {
  const errors = {}
  
  errors.ack_nomineeName = validateRequired(formData.ack_nomineeName, 'Nominee Name')
  errors.ack_nomineeNRIC = validateIC(formData.ack_nomineeNRIC)
  errors.ack_nomineeAddress = validateRequired(formData.ack_nomineeAddress, 'Nominee Address')
  errors.ack_applicantName = validateRequired(formData.ack_applicantName, 'Applicant Name')
  errors.ack_applicantNRIC = validateIC(formData.ack_applicantNRIC, 'Applicant IC Number')
  errors.ack_applicantAddress = validateRequired(formData.ack_applicantAddress, 'Applicant Address')
  
  // Joint applicant fields required if joint applicant exists
  if (formData.isJointApplicant) {
    errors.ack_jointApplicantName = validateRequired(formData.ack_jointApplicantName, 'Joint Applicant Name')
    errors.ack_jointApplicantNRIC = validateIC(formData.ack_jointApplicantNRIC, 'Joint Applicant IC Number')
  }
  
  // Date validation
  if (!formData.ack_applicationDay || !formData.ack_applicationMonth || !formData.ack_applicationYear) {
    errors.ack_applicationDate = 'Application Date is required'
  }

  // Acknowledgement checkbox must be confirmed
  if (!formData.ack_nomineeConsent) {
    errors.ack_nomineeConsent = 'You must confirm that you have read and agree to the acknowledgement'
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
    case 5: return validateStep5Signatures(formData) // Privacy & Declaration with signatures
    case 6: return validateStep6(formData) // Acknowledgement
    case 7: return {} // Review, no validation
    default: return {}
  }
}
