import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'
import WizardNavigation from './WizardNavigation'
import Step1PersonalInfo from './steps/Step1PersonalInfo'
import Step2JointApplicant from './steps/Step2JointApplicant'
import Step3PropertyDetails from './steps/Step3PropertyDetails'
import Step4Nominees from './steps/Step4Nominees'
import Step5InfoDisplay from './steps/Step5InfoDisplay'
import Step6Acknowledgement from './steps/Step6Acknowledgement'
import Step7Review from './steps/Step7Review'
import { validateStep } from '../services/validation'
import './applicationForm.css'

function ApplicationForm() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 7
  const [errors, setErrors] = useState({})

  // Load form data from localStorage on mount
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('ssbFormData')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  const [formData, setFormData] = useState(loadFromStorage() || {
    // How do you know about SSB
    howDidYouKnow: '',
    
    // Joint Applicant checkbox
    isJointApplicant: false,
    
    // Which one you prefer
    preferredScheme: '',
    
    // Applicant Information
    salutation: '',
    nameAsPerNRIC: '',
    nricNo: '',
    address: '',
    postcode: '',
    email: '',
    residencePhone: '',
    telephone: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    race: '',
    malaysian: false,
    sex: '',
    maritalStatus: '',
    numOfDependents: '0',
    dependentAge1: '',
    dependentAge2: '',
    dependentAge3: '',
    dependentAge4: '',
    dependentAge5: '',
    presentHouse: '',
    occupation: '',
    employerName: '',
    employerAddress: '',
    employerPostcode: '',
    purposeOfApplication: '',
    payoutOption: '',
    lumpSumUsage: '',
    paymentOption: '',
    
    // Joint Applicant Information
    jSalutation: '',
    jName: '',
    jIc: '',
    jAddress: '',
    jPostcode: '',
    jEmail: '',
    jResidencePhone: '',
    jTelephone: '',
    jDobDay: '',
    jDobMonth: '',
    jDobYear: '',
    jMarital: '',
    jRace: '',
    jMalaysian: false,
    jSex: '',
    jRelationship: '',
    jOccupation: '',
    jEmployerName: '',
    jEmployerAddress: '',
    jEmployerPostcode: '',
    
    // Banking Information
    bankName: '',
    accountType: '',
    accountPreference: '',
    accountNumber: '',
    
    // Financial Information
    monthlyIncome: '',
    jMonthlyIncome: '',
    sumOfMonthlyIncome: '',
    otherIncome: '',
    
    // Property Information
    propertyType: '',
    propertyAddress: '',
    propertyPostcode: '',
    indicativeMarketValue: '',
    valuationDay: '',
    valuationMonth: '',
    valuationYear: '',
    expectedMarketValue: '',
    purchasePrice: '',
    purchaseDay: '',
    purchaseMonth: '',
    purchaseYear: '',
    tenureTitle: '',
    expiryDay: '',
    expiryMonth: '',
    expiryYear: '',
    buildUpArea: '',
    landArea: '',
    propertyEncumbered: '',
    propertyBankName: '',
    estOutstandingBalance: '',
    fireInsurance: '',
    insuranceCompany: '',
    periodValidity: '',
    fireInsuranceNotAvailable: '',
    renewalFireInsurance: '',
    
    // Nominee 1
    nominee1Salutation: '',
    nominee1Name: '',
    nominee1Ic: '',
    nominee1Address: '',
    nominee1Postcode: '',
    nominee1Email: '',
    nominee1ResidencePhone: '',
    nominee1Telephone: '',
    nominee1DobDay: '',
    nominee1DobMonth: '',
    nominee1DobYear: '',
    nominee1Sex: '',
    nominee1Race: '',
    nominee1Malaysian: false,
    nominee1Marital: '',
    nominee1Relationship: '',
    
    // Second Nominee Checkbox
    hasSecondNominee: false,
    
    // Nominee 2
    nominee2Salutation: '',
    nominee2Name: '',
    nominee2Ic: '',
    nominee2Address: '',
    nominee2Postcode: '',
    nominee2Email: '',
    nominee2ResidencePhone: '',
    nominee2Telephone: '',
    nominee2DobDay: '',
    nominee2DobMonth: '',
    nominee2DobYear: '',
    nominee2Sex: '',
    nominee2Race: '',
    nominee2Malaysian: false,
    nominee2Marital: '',
    nominee2Relationship: '',
    
    // Acknowledgement Form
    ack_nomineeName: '',
    ack_nomineeNRIC: '',
    ack_nomineeAddress: '',
    ack_applicantName: '',
    ack_applicantNRIC: '',
    ack_jointApplicantName: '',
    ack_jointApplicantNRIC: '',
    ack_applicantAddress: '',
    ack_applicationDay: '',
    ack_applicationMonth: '',
    ack_applicationYear: '',
    
    // Signature fields
    applicant_signature: '',
    applicant_signature_name: '',
    applicant_signature_date: '',
    jApplicant_signature: '',
    jApplicant_signature_name: '',
    jApplicant_signature_date: '',
    ackNominee_signature: '',
    
    // Privacy & Consent
    privacyConsent: false,
    optOutMarketing: false,
    
    // Supporting Documents
    supportingDocs: {
      nric: false,
      birthCert: false,
      marriageCert: false,
      payslip: false,
      bankStatement: false,
      epfStatement: false,
      grantTitle: false,
      saleDeed: false,
      valuationReport: false,
      fireInsurancePolicy: false,
      propertyLoanStatement: false,
      other: false,
      otherDetails: ''
    },
    
    // Declaration
    acknowledgeDeclaration: false,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }
      
      // Clear dependent ages when number of dependents decreases
      if (name === 'numOfDependents') {
        const numDependents = parseInt(value)
        if (numDependents < 5) newData.dependentAge5 = ''
        if (numDependents < 4) newData.dependentAge4 = ''
        if (numDependents < 3) newData.dependentAge3 = ''
        if (numDependents < 2) newData.dependentAge2 = ''
        if (numDependents < 1) newData.dependentAge1 = ''
      }
      
      return newData
    })
  }

  const fillPDF = async () => {
    try {
      // Clean up unnecessary fields based on selections before generating PDF
      const cleanedData = { ...formData }
      
      // Clear insurance fields based on selection
      if (cleanedData.fireInsurance === 'notAvailable') {
        cleanedData.insuranceCompany = ''
        cleanedData.periodValidity = ''
      }
      if (cleanedData.fireInsurance === 'inForce') {
        cleanedData.fireInsuranceNotAvailable = ''
      }
      
      // Clear lump sum usage if not selected
      if (cleanedData.payoutOption === 'monthlyPayout') {
        cleanedData.lumpSumUsage = ''
      }
      
      // Clear expiry date if freehold
      if (cleanedData.tenureTitle === 'freehold') {
        cleanedData.expiryDay = ''
        cleanedData.expiryMonth = ''
        cleanedData.expiryYear = ''
      }
      
      // Clear property bank fields if not encumbered
      if (cleanedData.propertyEncumbered === 'no') {
        cleanedData.propertyBankName = ''
        cleanedData.estOutstandingBalance = ''
      }
      
      // Load the existing PDF
      const existingPdfBytes = await fetch('/Application_Form.pdf').then(res => res.arrayBuffer())
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      
      // Check if PDF has form fields
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      
      console.log(`PDF has ${fields.length} form fields`)
      
      if (fields.length === 0) {
        console.log('⚠️ This PDF has no fillable form fields.')
        alert('This PDF has no form fields. Please use a PDF with fillable fields.')
        return
      } else {
        // PDF has form fields, use the original approach
        console.log('PDF has form fields, attempting to fill them...')
        
        // Fill text fields
        const textFieldMapping = {
          // Applicant
          'applicant_salutation': cleanedData.salutation.startsWith('Other:') ? cleanedData.salutation.substring(6) : cleanedData.salutation,
          'application_name': cleanedData.nameAsPerNRIC,
          'applicant_ic': cleanedData.nricNo,
          'applicant_address': cleanedData.address,
          'applicant_address_postcode': cleanedData.postcode,
          'applicant_email': cleanedData.email,
          'applicant_residencePhone': cleanedData.residencePhone,
          'applicant_telephone': cleanedData.telephone,
          'applicant_dob_dd': cleanedData.dobDay,
          'applicant_dob_mm': cleanedData.dobMonth,
          'applicant_dob_yyyy': cleanedData.dobYear,
          'applicant_race': cleanedData.race.startsWith('Other:') ? cleanedData.race.substring(6) : cleanedData.race,
          'applicant_maritalStatus': cleanedData.maritalStatus.startsWith('Other:') ? cleanedData.maritalStatus.substring(6) : cleanedData.maritalStatus,
          'applicant_numOfDepend': cleanedData.numOfDependents,
          'applicant_numOfDepend_1': cleanedData.dependentAge1,
          'applicant_numOfDepend_2': cleanedData.dependentAge2,
          'applicant_numOfDepend_3': cleanedData.dependentAge3,
          'applicant_numOfDepend_4': cleanedData.dependentAge4,
          'applicant_numOfDepend_5': cleanedData.dependentAge5,
          'applicant_occupation': cleanedData.occupation,
          'applicant_employerName': cleanedData.employerName,
          'applicant_employerAddress': cleanedData.employerAddress,
          'applicant_employerAddress_postcode': cleanedData.employerPostcode,
          'applicant_purpose': cleanedData.purposeOfApplication,
          
          // Joint Applicant
          'jApplicant_salutation': cleanedData.jSalutation.startsWith('Other:') ? cleanedData.jSalutation.substring(6) : cleanedData.jSalutation,
          'jApplicant_name': cleanedData.jName,
          'jApplicant_ic': cleanedData.jIc,
          'jApplicant_address': cleanedData.jAddress,
          'jApplicant_address_postcode': cleanedData.jPostcode,
          'jApplicant_email': cleanedData.jEmail,
          'jApplicant_residencePhone': cleanedData.jResidencePhone,
          'jApplicant_telephone': cleanedData.jTelephone,
          'jApplicant_dob_dd': cleanedData.jDobDay,
          'jApplicant_dob_mm': cleanedData.jDobMonth,
          'jApplicant_dob_yyyy': cleanedData.jDobYear,
          'jApplicant_marital': cleanedData.jMarital.startsWith('Other:') ? cleanedData.jMarital.substring(6) : cleanedData.jMarital,
          'jApplicant_race': cleanedData.jRace.startsWith('Other:') ? cleanedData.jRace.substring(6) : cleanedData.jRace,
          'jApplicant_occupation': cleanedData.jOccupation,
          'jApplicant_employerName': cleanedData.jEmployerName,
          'jApplicant_employerAddress': cleanedData.jEmployerAddress,
          'jApplicant_employerAddress_postcode': cleanedData.jEmployerPostcode,
          
          // Banking
          'applicant_bankName': cleanedData.bankName,
          'applicant_accNumber': cleanedData.accountNumber,
          
          // Property
          'property_address': cleanedData.propertyAddress,
          'property_address_postcode': cleanedData.propertyPostcode,
          'property_indicativeMarketValue': cleanedData.indicativeMarketValue,
          'property_valDate_dd': cleanedData.valuationDay,
          'property_valDate_mm': cleanedData.valuationMonth,
          'property_valDate_yyyy': cleanedData.valuationYear,
          'property_expectedMarketValue': cleanedData.expectedMarketValue,
          'property_purchasePrice': cleanedData.purchasePrice,
          'property_purchDate_dd': cleanedData.purchaseDay,
          'property_purchDate_mm': cleanedData.purchaseMonth,
          'property_purchDate_yyyy': cleanedData.purchaseYear,
          'property_expiryDoL_dd': cleanedData.expiryDay,
          'property_expiryDoL_mm': cleanedData.expiryMonth,
          'property_expiryDoL_yyyy': cleanedData.expiryYear,
          'property_buildUpArea': cleanedData.buildUpArea,
          'property_landArea': cleanedData.landArea,
          'property_bankName': cleanedData.propertyBankName,
          'property_estOutstandingBalance': cleanedData.estOutstandingBalance,
          'property_fireInsurance_inForce_insurCompany': cleanedData.insuranceCompany,
          'property_fireInsurance_inForce_periodValidity': cleanedData.periodValidity,
          
          // Nominee 1
          'nominee1_salutation': cleanedData.nominee1Salutation.startsWith('Other:') ? cleanedData.nominee1Salutation.substring(6) : cleanedData.nominee1Salutation,
          'nominee1_name': cleanedData.nominee1Name,
          'nominee1_ic': cleanedData.nominee1Ic,
          'nominee1_address': cleanedData.nominee1Address,
          'nominee1_address_postcode': cleanedData.nominee1Postcode,
          'nominee1_email': cleanedData.nominee1Email,
          'nominee1_residencePhone': cleanedData.nominee1ResidencePhone,
          'nominee1_telephone': cleanedData.nominee1Telephone,
          'nominee1_dob_dd': cleanedData.nominee1DobDay,
          'nominee1_dob_mm': cleanedData.nominee1DobMonth,
          'nominee1_dob_yyyy': cleanedData.nominee1DobYear,
          'nominee1_race': cleanedData.nominee1Race.startsWith('Other:') ? cleanedData.nominee1Race.substring(6) : cleanedData.nominee1Race,
          'nominee1_marital': cleanedData.nominee1Marital.startsWith('Other:') ? cleanedData.nominee1Marital.substring(6) : cleanedData.nominee1Marital,
          'nominee1_relationship': cleanedData.nominee1Relationship,
          
          // Nominee 2
          'nominee2_salutation': cleanedData.nominee2Salutation.startsWith('Other:') ? cleanedData.nominee2Salutation.substring(6) : cleanedData.nominee2Salutation,
          'nominee2_name': cleanedData.nominee2Name,
          'nominee2_ic': cleanedData.nominee2Ic,
          'nominee2_address': cleanedData.nominee2Address,
          'nominee2_address_postcode': cleanedData.nominee2Postcode,
          'nominee2_email': cleanedData.nominee2Email,
          'nominee2_residencePhone': cleanedData.nominee2ResidencePhone,
          'nominee2_telephone': cleanedData.nominee2Telephone,
          'nominee2_dob_dd': cleanedData.nominee2DobDay,
          'nominee2_dob_mm': cleanedData.nominee2DobMonth,
          'nominee2_dob_yyyy': cleanedData.nominee2DobYear,
          'nominee2_race': cleanedData.nominee2Race.startsWith('Other:') ? cleanedData.nominee2Race.substring(6) : cleanedData.nominee2Race,
          'nominee2_marital': cleanedData.nominee2Marital.startsWith('Other:') ? cleanedData.nominee2Marital.substring(6) : cleanedData.nominee2Marital,
          'nominee2_relationship': cleanedData.nominee2Relationship,
          
          // Acknowledgement Form
          'ackNominee_name': cleanedData.ack_nomineeName,
          'ackNominee_ic': cleanedData.ack_nomineeNRIC,
          'ackNominee_address': cleanedData.ack_nomineeAddress,
          'ackNominee_applicantName': cleanedData.ack_applicantName,
          'ackNominee_applicantIc': cleanedData.ack_applicantNRIC,
          'ackNominee_jApplicantName': cleanedData.ack_jointApplicantName,
          'ackNominee_applicantAddress': cleanedData.ack_applicantAddress,
          'ackNominee_applicationDate': cleanedData.ack_applicationDay && cleanedData.ack_applicationMonth && cleanedData.ack_applicationYear 
            ? `${cleanedData.ack_applicationDay}/${cleanedData.ack_applicationMonth}/${cleanedData.ack_applicationYear}` 
            : '',
          'ackNominee_date_dd': cleanedData.ack_applicationDay,
          'ackNominee_date_mm': cleanedData.ack_applicationMonth,
          'ackNominee_date_yyyy': cleanedData.ack_applicationYear,
          'ackNominee_sign_name': cleanedData.ack_nomineeName,
          'ackNominee_sign_ic': cleanedData.ack_nomineeNRIC,
          
          // Signature text fields
          'applicant_signature_name': cleanedData.applicant_signature_name,
          'applicant_signature_date': cleanedData.applicant_signature_date,
          'jApplicant_signature_name': cleanedData.jApplicant_signature_name,
          'jApplicant_signature_date': cleanedData.jApplicant_signature_date,
        }

        let filledCount = 0
        
        Object.entries(textFieldMapping).forEach(([fieldName, value]) => {
          if (!value) return
          
          try {
            const field = form.getTextField(fieldName)
            field.setText(value)
            filledCount++
          } catch (e) {
            // Field doesn't exist or wrong type
          }
        })
        
        // Fill checkboxes
        try {
          const checkbox = form.getCheckBox('joint?')
          cleanedData.isJointApplicant ? checkbox.check() : checkbox.uncheck()
          filledCount++
        } catch (e) {}
        
        try {
          const checkbox = form.getCheckBox('applicant_malaysian')
          cleanedData.malaysian ? checkbox.check() : checkbox.uncheck()
          filledCount++
        } catch (e) {}
        
        try {
          const checkbox = form.getCheckBox('jApplicant_malaysian')
          cleanedData.jMalaysian ? checkbox.check() : checkbox.uncheck()
          filledCount++
        } catch (e) {}
        
        try {
          const checkbox = form.getCheckBox('nominee1_malaysian')
          cleanedData.nominee1Malaysian ? checkbox.check() : checkbox.uncheck()
          filledCount++
        } catch (e) {}
        
        try {
          const checkbox = form.getCheckBox('nominee2_malaysian')
          cleanedData.nominee2Malaysian ? checkbox.check() : checkbox.uncheck()
          filledCount++
        } catch (e) {}
        
        // Fill radio buttons
        if (cleanedData.howDidYouKnow) {
          try {
            form.getRadioGroup('fromWhere').select(cleanedData.howDidYouKnow)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.preferredScheme) {
          try {
            form.getRadioGroup('ssb_prefererence').select(cleanedData.preferredScheme)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.sex) {
          try {
            form.getRadioGroup('applicant_sex').select(cleanedData.sex)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.presentHouse) {
          try {
            form.getRadioGroup('applicant_presentHouse').select(cleanedData.presentHouse)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.payoutOption) {
          try {
            form.getRadioGroup('applicant_payout').select(cleanedData.payoutOption)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.lumpSumUsage) {
          try {
            form.getRadioGroup('applicant_lumpSumUsage').select(cleanedData.lumpSumUsage)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.paymentOption) {
          try {
            form.getRadioGroup('applicant_payment').select(cleanedData.paymentOption)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.jSex) {
          try {
            form.getRadioGroup('jApplicant_sex').select(cleanedData.jSex)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.jRelationship) {
          try {
            form.getRadioGroup('jApplicant_relationship').select(cleanedData.jRelationship)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.accountType) {
          try {
            form.getRadioGroup('applicant_bankAccType').select(cleanedData.accountType)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.accountPreference) {
          try {
            form.getRadioGroup('applicant_prefer').select(cleanedData.accountPreference)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.propertyType) {
          try {
            form.getRadioGroup('property_type').select(cleanedData.propertyType)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.tenureTitle) {
          try {
            form.getRadioGroup('property_tenureTitle').select(cleanedData.tenureTitle)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.propertyEncumbered) {
          try {
            form.getRadioGroup('property_encumbered').select(cleanedData.propertyEncumbered)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.fireInsurance) {
          try {
            form.getRadioGroup('property_fireInsurance').select(cleanedData.fireInsurance)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.fireInsuranceNotAvailable) {
          try {
            form.getRadioGroup('property_fireInsurance_notAvailable').select(cleanedData.fireInsuranceNotAvailable)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.renewalFireInsurance) {
          try {
            form.getRadioGroup('property_renewalFireInsurance').select(cleanedData.renewalFireInsurance)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.nominee1Sex) {
          try {
            form.getRadioGroup('nominee_sex').select(cleanedData.nominee1Sex)
            filledCount++
          } catch (e) {}
        }
        
        if (cleanedData.nominee2Sex) {
          try {
            form.getRadioGroup('nominee2_sex').select(cleanedData.nominee2Sex)
            filledCount++
          } catch (e) {}
        }
        
        console.log(`\n✓ Successfully filled ${filledCount} fields`)
        
        // Embed signature images by finding widget positions
        if (cleanedData.applicant_signature || cleanedData.jApplicant_signature || cleanedData.ackNominee_signature) {
          console.log('\n📝 Embedding signature images...')
          
          // First, remove signature fields to prevent overlay
          const signatureFieldsToRemove = []
          if (cleanedData.applicant_signature) signatureFieldsToRemove.push('applicant_signature')
          if (cleanedData.jApplicant_signature && cleanedData.isJointApplicant) signatureFieldsToRemove.push('jApplicant_signature')
          if (cleanedData.ackNominee_signature) signatureFieldsToRemove.push('ackNominee_signature')
          
          // Collect field info before removing
          const fieldPositions = []
          for (const fieldName of signatureFieldsToRemove) {
            try {
              const field = form.getField(fieldName)
              const widgets = field.acroField.getWidgets()
              if (widgets.length > 0) {
                const widget = widgets[0]
                const rect = widget.getRectangle()
                
                // Hardcode page numbers based on PDF structure
                let pageIndex = -1
                if (fieldName === 'applicant_signature' || fieldName === 'jApplicant_signature') {
                  pageIndex = 3 // Page 4 (0-indexed)
                } else if (fieldName === 'ackNominee_signature') {
                  pageIndex = 5 // Page 6 (0-indexed)
                }
                
                const page = pageIndex >= 0 ? pdfDoc.getPages()[pageIndex] : null
                
                fieldPositions.push({ fieldName, rect, pageIndex, page })
              }
            } catch (e) {
              console.error(`Error getting ${fieldName} position:`, e.message)
            }
          }
          
          // Now draw signature images (before removing fields)
          for (const { fieldName, rect, pageIndex, page } of fieldPositions) {
            try {
              let signatureData = null
              if (fieldName === 'applicant_signature') signatureData = cleanedData.applicant_signature
              else if (fieldName === 'jApplicant_signature') signatureData = cleanedData.jApplicant_signature
              else if (fieldName === 'ackNominee_signature') signatureData = cleanedData.ackNominee_signature
              
              if (signatureData && (pageIndex >= 0 || page)) {
                const pngImageBytes = signatureData.split(',')[1]
                const pngImage = await pdfDoc.embedPng('data:image/png;base64,' + pngImageBytes)
                
                const targetPage = page || pdfDoc.getPages()[pageIndex]
                
                // Add small padding
                const padding = 2
                targetPage.drawImage(pngImage, {
                  x: rect.x + padding,
                  y: rect.y + padding,
                  width: rect.width - (padding * 2),
                  height: rect.height - (padding * 2),
                })
                console.log(`✓ Embedded ${fieldName} signature`)
              }
            } catch (e) {
              console.error(`Failed to draw ${fieldName}:`, e.message)
            }
          }
          
          // Remove the signature fields after drawing (try to hide them)
          for (const fieldName of signatureFieldsToRemove) {
            try {
              const field = form.getField(fieldName)
              // For signature fields, we'll try to hide them by making them non-visible
              const widgets = field.acroField.getWidgets()
              for (const widget of widgets) {
                // Try to set appearance to null or remove visibility flags
                try {
                  widget.setFlagTo(1, false) // Invisible flag
                  widget.setFlagTo(2, true) // Hidden flag
                } catch (e) {
                  // If flags don't work, just continue
                }
              }
            } catch (e) {
            }
          }
        }
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save()
      
      // Download the filled PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'Application_Form.pdf'
      link.click()
      URL.revokeObjectURL(url)
      
      alert('PDF generated successfully! Check the downloaded file.')
      // Redirect to home page
      navigate('/')
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert('Error filling PDF. Check console for details.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await fillPDF()
  }

  // Save to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem('ssbFormData', JSON.stringify(formData))
  }, [formData])

  // Load saved step on mount
  useEffect(() => {
    const savedStep = localStorage.getItem('ssbCurrentStep')
    if (savedStep) {
      setCurrentStep(parseInt(savedStep))
    }
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  // Save current step
  useEffect(() => {
    localStorage.setItem('ssbCurrentStep', currentStep.toString())
  }, [currentStep])

  const handleNext = () => {
    // Validate current step before proceeding
    const stepErrors = validateStep(currentStep, formData)
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      // Scroll to top to see errors
      window.scrollTo(0, 0)
      return
    }
    
    // Clear errors and proceed to next step
    setErrors({})
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PersonalInfo formData={formData} handleChange={handleChange} errors={errors} />
      case 2:
        return <Step2JointApplicant formData={formData} handleChange={handleChange} errors={errors} />
      case 3:
        return <Step3PropertyDetails formData={formData} handleChange={handleChange} errors={errors} />
      case 4:
        return <Step4Nominees formData={formData} handleChange={handleChange} errors={errors} />
      case 5:
        return <Step5InfoDisplay formData={formData} handleChange={handleChange} />
      case 6:
        return <Step6Acknowledgement formData={formData} handleChange={handleChange} errors={errors} />
      case 7:
        return <Step7Review formData={formData} />
      default:
        return <Step1PersonalInfo formData={formData} handleChange={handleChange} errors={errors} />
    }
  }

  return (
    <div className="application-form">
      <div className="app-container">
        <h1>SKIM SARAAN BERCAGAR (SSB) Application Form</h1>
        <div className="wizard-container">
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isLastStep={currentStep === totalSteps}
          />
          {renderStep()}
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isLastStep={currentStep === totalSteps}
          />
        </div>
      </div>
    </div>
  )
}

export default ApplicationForm