// Application Controller - Smart React Component
// Entry point for users - manages all state and business logic
// Renders ApplicationFormView (pure presentational component)
// NO imports from other controllers allowed!

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'
import Application from '../models/Application'
import { validateStep } from '../utils/applicationValidation'
import ApplicationFormView from '../views/ApplicationFormView'
import { parseICNumber, getCurrentDate } from '../utils/icParser'
import { getCurrentUser } from '../services/authService'
import { 
  loadApplicationData, 
  saveApplicationData, 
  saveToLocalStorage,
  loadFromLocalStorage 
} from '../services/applicationService'
import { uploadDocument, deleteDocument } from '../services/fileUploadService'
import { supabase } from '../config/supabase'

function ApplicationController() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 7
  const [errors, setErrors] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [applicationId, setApplicationId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const saveTimeoutRef = useRef(null)
  const isInitialized = useRef(false)
  const hasRedirected = useRef(false)
  
  // Initialize form data - will be loaded from Supabase
  const [formData, setFormData] = useState({
    // How do you know about SSB
    howDidYouKnow: '',
    isJointApplicant: false,
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
      
      // Joint Applicant
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
      
      // Banking
      bankName: '',
      accountType: '',
      accountPreference: '',
      accountNumber: '',
      
      // Property
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
      
      // Nominees
      hasSecondNominee: false,
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
      nominee1Occupation: '',
      nominee1EmployerName: '',
      
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
      nominee2Occupation: '',
      nominee2EmployerName: '',
      
      // Acknowledgement
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
      ack_dateDay: '',
      ack_dateMonth: '',
      ack_dateYear: '',
      ack_signName: '',
      ack_signIC: '',
      ackNominee_signature: '',
      
      // Signatures
      applicant_signature: '',
      applicant_signature_name: '',
      applicant_signature_date: '',
      jApplicant_signature: '',
      jApplicant_signature_name: '',
      jApplicant_signature_date: '',
      
      // Privacy & Documents
      privacyConsent: false,
      acknowledgeDeclaration: false,
      
      // Supporting Documents (URLs stored after upload)
      documents: {
        applicantNRIC: { url: '', fileName: '', uploadedAt: '' },
        jointApplicantNRIC: { url: '', fileName: '', uploadedAt: '' },
        birthCertificate: { url: '', fileName: '', uploadedAt: '' },
        marriageCertificate: { url: '', fileName: '', uploadedAt: '' },
        payslips: [
          { url: '', fileName: '', uploadedAt: '' },
          { url: '', fileName: '', uploadedAt: '' },
          { url: '', fileName: '', uploadedAt: '' }
        ],
        bankStatements: [
          { url: '', fileName: '', uploadedAt: '' },
          { url: '', fileName: '', uploadedAt: '' },
          { url: '', fileName: '', uploadedAt: '' },
          { url: '', fileName: '', uploadedAt: '' },
          { url: '', fileName: '', uploadedAt: '' },
          { url: '', fileName: '', uploadedAt: '' }
        ],
        epfStatement: { url: '', fileName: '', uploadedAt: '' },
        grantTitle: { url: '', fileName: '', uploadedAt: '' },
        saleAgreement: { url: '', fileName: '', uploadedAt: '' },
        valuationReport: { url: '', fileName: '', uploadedAt: '' },
        fireInsurance: { url: '', fileName: '', uploadedAt: '' },
        propertyLoanStatement: { url: '', fileName: '', uploadedAt: '' }
      }
  })

  // ==========================================
  // INITIAL LOAD: Get user and load application data
  // ==========================================
  useEffect(() => {
    const initializeApplication = async () => {
      // Prevent double-initialization in React Strict Mode
      if (isInitialized.current) {
        return
      }
      isInitialized.current = true

      try {
        setIsLoading(true)

        // Get current authenticated user
        const { user, error: userError } = await getCurrentUser()
        
        if (userError || !user) {
          // No user logged in - redirect to login
          console.warn('No user authenticated, redirecting to login')
          // For now, use localStorage as fallback (until auth pages are ready)
          const localData = loadFromLocalStorage('guest')
          setFormData(prev => ({ ...prev, ...localData.formData }))
          setCurrentStep(localData.currentStep)
          setIsLoading(false)
          return
        }

        setCurrentUser(user)
        console.log('👤 User authenticated:', user.id)

        // Get or create application (includes draft applications)
        const { getOrCreateApplication } = await import('../services/applicationService')
        const { application, applicationData, error } = await getOrCreateApplication(user.id)

        if (error) {
          console.error('❌ Error loading from Supabase:', error)
          // Fallback to localStorage
          const localData = loadFromLocalStorage(user.id)
          setFormData(prev => ({ ...prev, ...localData.formData }))
          setCurrentStep(localData.currentStep)
          console.log('📂 Using localStorage fallback')
        } else {
          // Successfully loaded or created application
          setApplicationId(application?.id)
          
          if (applicationData?.form_data && Object.keys(applicationData.form_data).length > 0) {
            // Has existing data - load it
            setFormData(prev => ({ ...prev, ...applicationData.form_data }))
            setCurrentStep(applicationData.current_step || 1)
            console.log('✅ Loaded from Supabase - App ID:', application?.id, 'Step:', applicationData.current_step, 'Fields:', Object.keys(applicationData.form_data).length)
          } else {
            // New application - keep default formData
            console.log('✅ Created new application - App ID:', application?.id)
          }
        }

        window.scrollTo(0, 0)
      } catch (error) {
        console.error('Error initializing application:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApplication()
  }, [])

  // ==========================================
  // AUTO-SAVE: Debounced save to Supabase
  // ==========================================
  const debouncedSave = useCallback(async (data, step) => {
    if (!currentUser) {
      // No user yet - save to localStorage only
      console.log('⚠️ No user, saving to localStorage only')
      saveToLocalStorage('guest', data, step)
      return
    }

    try {
      setIsSaving(true)
      
      // If no applicationId, try to get or create one
      let appId = applicationId
      if (!appId) {
        console.log('🔄 No applicationId, fetching/creating application...')
        const { application, error: appError } = await loadApplicationData(currentUser.id)
        if (!appError && application?.id) {
          appId = application.id
          setApplicationId(application.id)
          console.log('✅ Application ID set:', application.id)
        } else {
          console.error('❌ Failed to get application ID:', appError)
          saveToLocalStorage(currentUser.id, data, step)
          setIsSaving(false)
          return
        }
      }
      
      // Save to Supabase
      console.log('💾 Saving to Supabase:', {
        appId,
        step,
        fieldCount: Object.keys(data).length,
        fields: Object.keys(data).slice(0, 5) // First 5 field names
      })
      
      const { error } = await saveApplicationData(appId, data, step)
      
      if (error) {
        console.error('❌ Error saving to Supabase:', error)
        saveToLocalStorage(currentUser.id, data, step)
      } else {
        console.log('✅ Auto-saved to Supabase (App ID:', appId, ')')
        // Also save to localStorage as backup
        saveToLocalStorage(currentUser.id, data, step)
      }
    } catch (error) {
      console.error('❌ Save error:', error)
      saveToLocalStorage(currentUser.id, data, step)
    } finally {
      setIsSaving(false)
    }
  }, [currentUser, applicationId])

  // Trigger auto-save when formData or currentStep changes
  useEffect(() => {
    if (isLoading) return // Don't save during initial load

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(() => {
      debouncedSave(formData, currentStep)
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData, currentStep, debouncedSave, isLoading])

  // Old localStorage-only code (kept for reference, now handled above)
  // useEffect(() => {
  //   const savedStep = localStorage.getItem('ssbCurrentStep')
  //   if (savedStep) {
  //     setCurrentStep(parseInt(savedStep))
  //   }
  //   window.scrollTo(0, 0)
  // }, [])

  // Old: Save draft whenever formData changes (now handled by auto-save above)
  // useEffect(() => {
  //   Application.saveDraft(formData)
  // }, [formData])

  // Old: Save current step (now handled by auto-save above)
  // useEffect(() => {
  //   localStorage.setItem('ssbCurrentStep', currentStep.toString())
  // }, [currentStep])

  /**
   * Handle form field changes with auto-fill logic
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    // Clear error for this field when it changes
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
    
    setFormData(prev => {
      let updates = {
        [name]: type === 'checkbox' ? checked : value
      }

      // Auto-fill: Sync accountPreference with preferredScheme
      if (name === 'accountPreference') {
        updates.preferredScheme = value
      }

      // Auto-fill: Parse IC number and fill birthdate + sex for main applicant
      if (name === 'nricNo' && value) {
        const parsed = parseICNumber(value)
        if (parsed.isValid && parsed.birthDate) {
          updates.dobDay = parsed.birthDate.day
          updates.dobMonth = parsed.birthDate.month
          updates.dobYear = parsed.birthDate.year
          updates.sex = parsed.sex
        }
      }

      // Auto-fill: Parse IC number and fill birthdate + sex for joint applicant
      if (name === 'jIc' && value) {
        const parsed = parseICNumber(value)
        if (parsed.isValid && parsed.birthDate) {
          updates.jDobDay = parsed.birthDate.day
          updates.jDobMonth = parsed.birthDate.month
          updates.jDobYear = parsed.birthDate.year
          updates.jSex = parsed.sex
        }
      }

      // Auto-fill: Parse IC number and fill birthdate + sex for nominee 1
      if (name === 'nominee1Ic' && value) {
        const parsed = parseICNumber(value)
        if (parsed.isValid && parsed.birthDate) {
          updates.nominee1DobDay = parsed.birthDate.day
          updates.nominee1DobMonth = parsed.birthDate.month
          updates.nominee1DobYear = parsed.birthDate.year
          updates.nominee1Sex = parsed.sex
        }
      }

      // Auto-fill: Parse IC number and fill birthdate + sex for nominee 2
      if (name === 'nominee2Ic' && value) {
        const parsed = parseICNumber(value)
        if (parsed.isValid && parsed.birthDate) {
          updates.nominee2DobDay = parsed.birthDate.day
          updates.nominee2DobMonth = parsed.birthDate.month
          updates.nominee2DobYear = parsed.birthDate.year
          updates.nominee2Sex = parsed.sex
        }
      }

      // Auto-fill: Signature names and dates for applicant
      if (name === 'nameAsPerNRIC' && value) {
        updates.applicant_signature_name = value
        const currentDate = getCurrentDate()
        updates.applicant_signature_date = `${currentDate.day}/${currentDate.month}/${currentDate.year}`
      }

      // Auto-fill: Signature names and dates for joint applicant
      if (name === 'jName' && value) {
        updates.jApplicant_signature_name = value
        const currentDate = getCurrentDate()
        updates.jApplicant_signature_date = `${currentDate.day}/${currentDate.month}/${currentDate.year}`
      }

      // Auto-fill: Acknowledgement form fields from previously entered data
      // Sync nominee information
      if (name === 'nominee1Name' && value) {
        updates.ack_nomineeName = value
      }
      if (name === 'nominee1Ic' && value) {
        updates.ack_nomineeNRIC = value
      }
      if (name === 'nominee1Address' && value) {
        updates.ack_nomineeAddress = value
      }

      // Sync applicant information
      if (name === 'nameAsPerNRIC' && value) {
        updates.ack_applicantName = value
        updates.ack_signName = value
      }
      if (name === 'nricNo' && value) {
        updates.ack_applicantNRIC = value
        updates.ack_signIC = value
      }
      if (name === 'address' && value) {
        updates.ack_applicantAddress = value
      }

      // Sync joint applicant information
      if (name === 'jName' && value) {
        updates.ack_jointApplicantName = value
      }
      if (name === 'jIc' && value) {
        updates.ack_jointApplicantNRIC = value
      }

      // Auto-fill current date for acknowledgement
      const currentDate = getCurrentDate()
      updates.ack_dateDay = currentDate.day
      updates.ack_dateMonth = currentDate.month
      updates.ack_dateYear = currentDate.year
      updates.ack_applicationDay = currentDate.day
      updates.ack_applicationMonth = currentDate.month
      updates.ack_applicationYear = currentDate.year

      return {
        ...prev,
        ...updates
      }
    })
  }

  /**
   * Handle file upload
   */
  const handleFileUpload = async (e, documentType, arrayIndex = null) => {
    const file = e.target.files[0]
    if (!file) return

    if (!currentUser) {
      alert('Please log in to upload files')
      return
    }

    try {
      const uploadKey = arrayIndex !== null ? `${documentType}_${arrayIndex}` : documentType
      
      // Show uploading indicator
      setUploadProgress(prev => ({
        ...prev,
        [uploadKey]: { uploading: true }
      }))

      // Upload file with numbered suffix for array items
      const uploadDocType = arrayIndex !== null 
        ? `${documentType}_${arrayIndex + 1}` 
        : documentType
      
      const { url, fileName, uploadedAt, error } = await uploadDocument(
        file,
        currentUser.id,
        uploadDocType
      )

      if (error) {
        alert('Upload failed: ' + error.message)
        setUploadProgress(prev => ({
          ...prev,
          [uploadKey]: { uploading: false }
        }))
        return
      }

      // Update form data with file URL
      setFormData(prev => {
        const newData = { ...prev }
        
        if (arrayIndex !== null) {
          // Handle array documents (payslips, bank statements)
          const fieldName = documentType.includes('payslip') ? 'payslips' : 'bankStatements'
          const newArray = [...newData.documents[fieldName]]
          newArray[arrayIndex] = { url, fileName, uploadedAt }
          newData.documents[fieldName] = newArray
        } else {
          // Handle single documents
          newData.documents[documentType] = { url, fileName, uploadedAt }
        }
        
        return newData
      })

      // Clear upload progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadKey]: { uploading: false }
      }))

      // Clear error for this field if it exists
      if (arrayIndex !== null) {
        // For array documents (payslips/bankStatements)
        const errorKey = documentType.includes('payslip') 
          ? `payslip${arrayIndex + 1}` 
          : `bankStatement${arrayIndex + 1}`
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[errorKey]
          return newErrors
        })
      } else {
        // For single documents
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[documentType]
          return newErrors
        })
      }

      console.log('✅ File uploaded:', fileName)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
      const uploadKey = arrayIndex !== null ? `${documentType}_${arrayIndex}` : documentType
      setUploadProgress(prev => ({
        ...prev,
        [uploadKey]: { uploading: false }
      }))
    }
  }

  /**
   * Handle file deletion
   */
  const handleFileDelete = async (documentType, arrayIndex = null) => {
    if (!currentUser) {
      alert('Please log in to delete files')
      return
    }

    if (!window.confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      let fileUrl = ''
      const uploadKey = arrayIndex !== null ? `${documentType}_${arrayIndex}` : documentType
      
      if (arrayIndex !== null) {
        const fieldName = documentType.includes('payslip') ? 'payslips' : 'bankStatements'
        fileUrl = formData.documents[fieldName][arrayIndex].url
      } else {
        fileUrl = formData.documents[documentType].url
      }

      if (!fileUrl) return

      // Delete from storage
      const { success, error } = await deleteDocument(fileUrl, currentUser.id)

      if (error) {
        alert('Delete failed: ' + error.message)
        return
      }

      // Update form data
      setFormData(prev => {
        const newData = { ...prev }
        
        if (arrayIndex !== null) {
          const fieldName = documentType.includes('payslip') ? 'payslips' : 'bankStatements'
          const newArray = [...newData.documents[fieldName]]
          newArray[arrayIndex] = { url: '', fileName: '', uploadedAt: '' }
          newData.documents[fieldName] = newArray
        } else {
          newData.documents[documentType] = { url: '', fileName: '', uploadedAt: '' }
        }
        
        return newData
      })

      // Clear upload progress to prevent "Uploading" stuck state
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[uploadKey]
        return newProgress
      })

      console.log('✅ File deleted')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file. Please try again.')
    }
  }

  /**
   * Validate and move to next step
   */
  const handleNext = () => {
    const stepErrors = validateStep(currentStep, formData)
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      window.scrollTo(0, 0)
      return
    }
    
    setErrors({})
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  /**
   * Move to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  /**
   * Generate and download PDF
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      console.log('📋 Starting application submission...')
      
      // 1. Submit to database (create nominees and property records)
      if (currentUser && applicationId) {
        const { submitApplicationComplete } = await import('../services/applicationService')
        const { success, error } = await submitApplicationComplete(applicationId, formData)
        
        if (error) {
          console.error('❌ Database submission failed:', error)
          alert('Failed to submit application to database: ' + error.message)
          return
        }
        
        console.log('✅ Application submitted to database')
      }
      
      // 2. Generate PDF
      console.log('📄 Generating PDF...')
      const pdfBlob = await generatePDF(formData)
      
      // 3. Upload PDF to Supabase Storage
      console.log('☁️ Uploading PDF to storage...')
      const fileName = `SSB_Application_${formData.nricNo?.replace(/[^0-9]/g, '')}.pdf`
      const filePath = `${currentUser.id}/${fileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('application-forms')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true
        })
      
      if (uploadError) {
        console.error('❌ PDF upload failed:', uploadError)
        alert('Warning: PDF was generated but failed to upload to storage. Downloading locally...')
        downloadPDF(pdfBlob)
      } else {
        console.log('✅ PDF uploaded to storage')
        
        // Download PDF for user
        downloadPDF(pdfBlob)
      }
      
      alert('Application submitted successfully! Redirecting to your dashboard...')
      
      // 4. Navigate to user dashboard
      // Reload the page to refresh auth context and application status
      window.location.href = '/user/dashboard'
    } catch (error) {
      console.error('Error during submission:', error)
      alert('Error submitting application. Please try again.')
    }
  }

  /**
   * Helper to fill text fields safely
   */
  const fillTextField = (form, fieldName, value) => {
    try {
      if (value) {
        const field = form.getTextField(fieldName)
        field.setText(String(value))
      }
    } catch (e) {
      // Field doesn't exist, skip
    }
  }

  /**
   * Helper to fill checkboxes safely
   */
  const fillCheckBox = (form, fieldName, checked) => {
    try {
      const field = form.getCheckBox(fieldName)
      if (checked) field.check()
      else field.uncheck()
    } catch (e) {
      // Field doesn't exist, skip
    }
  }

  /**
   * Download PDF blob
   */
  const downloadPDF = (blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'SSB_Application.pdf'
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Generate PDF from form data
   */
  const generatePDF = async (data) => {
    const existingPdfBytes = await fetch('/Application_Form.pdf').then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    const form = pdfDoc.getForm()
    
    // Helper to fill radio groups safely
    const fillRadio = (form, fieldName, value) => {
      try {
        if (value) {
          const field = form.getRadioGroup(fieldName)
          field.select(value)
        }
      } catch (e) {
        // Field doesn't exist or value invalid, skip
      }
    }
    
    // Helper to clean "Other:" prefix
    const cleanOther = (value) => {
      if (!value) return value
      return value.startsWith('Other:') ? value.substring(6).trim() : value
    }
    
    // Step 1: Personal Information
    fillTextField(form, 'applicant_salutation', cleanOther(data.salutation))
    fillTextField(form, 'application_name', data.nameAsPerNRIC)
    fillTextField(form, 'applicant_ic', data.nricNo)
    fillTextField(form, 'applicant_address', data.address)
    fillTextField(form, 'applicant_address_postcode', data.postcode)
    fillTextField(form, 'applicant_email', data.email)
    fillTextField(form, 'applicant_residencePhone', data.residencePhone)
    fillTextField(form, 'applicant_telephone', data.telephone)
    fillTextField(form, 'applicant_dob_dd', data.dobDay)
    fillTextField(form, 'applicant_dob_mm', data.dobMonth)
    fillTextField(form, 'applicant_dob_yyyy', data.dobYear)
    fillTextField(form, 'applicant_race', cleanOther(data.race))
    if (data.malaysian) fillCheckBox(form, 'applicant_malaysian', true)
    fillRadio(form, 'applicant_sex', data.sex)
    fillTextField(form, 'applicant_maritalStatus', cleanOther(data.maritalStatus))
    fillTextField(form, 'applicant_numOfDepend', data.numOfDependents)
    fillTextField(form, 'applicant_numOfDepend_1', data.dependentAge1)
    fillTextField(form, 'applicant_numOfDepend_2', data.dependentAge2)
    fillTextField(form, 'applicant_numOfDepend_3', data.dependentAge3)
    fillTextField(form, 'applicant_numOfDepend_4', data.dependentAge4)
    fillTextField(form, 'applicant_numOfDepend_5', data.dependentAge5)
    fillRadio(form, 'applicant_presentHouse', data.presentHouse)
    fillTextField(form, 'applicant_occupation', data.occupation)
    fillTextField(form, 'applicant_employerName', data.employerName)
    fillTextField(form, 'applicant_employerAddress', data.employerAddress)
    fillTextField(form, 'applicant_employerAddress_postcode', data.employerPostcode)
    fillTextField(form, 'applicant_purpose', data.purposeOfApplication)
    fillRadio(form, 'applicant_payout', data.payoutOption)
    fillRadio(form, 'applicant_lumpSumUsage', data.lumpSumUsage)
    fillRadio(form, 'applicant_payment', data.paymentOption)
    fillRadio(form, 'fromWhere', data.howDidYouKnow)
    fillRadio(form, 'ssb_prefererence', data.preferredScheme)
    
    // Step 2: Joint Applicant
    if (data.isJointApplicant) {
      fillCheckBox(form, 'joint?', true)
      fillTextField(form, 'jApplicant_salutation', cleanOther(data.jSalutation))
      fillTextField(form, 'jApplicant_name', data.jName)
      fillTextField(form, 'jApplicant_ic', data.jIc)
      fillTextField(form, 'jApplicant_address', data.jAddress)
      fillTextField(form, 'jApplicant_address_postcode', data.jPostcode)
      fillTextField(form, 'jApplicant_email', data.jEmail)
      fillTextField(form, 'jApplicant_residencePhone', data.jResidencePhone)
      fillTextField(form, 'jApplicant_telephone', data.jTelephone)
      fillTextField(form, 'jApplicant_dob_dd', data.jDobDay)
      fillTextField(form, 'jApplicant_dob_mm', data.jDobMonth)
      fillTextField(form, 'jApplicant_dob_yyyy', data.jDobYear)
      fillRadio(form, 'jApplicant_sex', data.jSex)
      fillTextField(form, 'jApplicant_race', cleanOther(data.jRace))
      if (data.jMalaysian) fillCheckBox(form, 'jApplicant_malaysian', true)
      fillTextField(form, 'jApplicant_marital', cleanOther(data.jMarital))
      fillTextField(form, 'jApplicant_occupation', data.jOccupation)
      fillTextField(form, 'jApplicant_employerName', data.jEmployerName)
      fillTextField(form, 'jApplicant_employerAddress', data.jEmployerAddress)
      fillTextField(form, 'jApplicant_employerAddress_postcode', data.jEmployerPostcode)
      fillRadio(form, 'jApplicant_relationship', data.jRelationship)
    }
    
    // Banking Information
    fillTextField(form, 'applicant_bankName', data.bankName)
    fillTextField(form, 'applicant_accNumber', data.accountNumber)
    fillRadio(form, 'applicant_bankAccType', data.accountType)
    fillRadio(form, 'applicant_prefer', data.accountPreference)
    
    // Step 3: Property Information
    console.log('Property Type value:', data.propertyType)
    // Map hyphenated values to camelCase for PDF
    const propertyTypeValue = data.propertyType === 'semi-detach' ? 'semiDetach' : data.propertyType
    fillRadio(form, 'property_type', propertyTypeValue)
    fillTextField(form, 'property_address', data.propertyAddress)
    fillTextField(form, 'property_address_postcode', data.propertyPostcode)
    fillTextField(form, 'property_indicativeMarketValue', data.indicativeMarketValue)
    fillTextField(form, 'property_valDate_dd', data.valuationDay)
    fillTextField(form, 'property_valDate_mm', data.valuationMonth)
    fillTextField(form, 'property_valDate_yyyy', data.valuationYear)
    fillTextField(form, 'property_expectedMarketValue', data.expectedMarketValue)
    fillTextField(form, 'property_purchasePrice', data.purchasePrice)
    fillTextField(form, 'property_purchDate_dd', data.purchaseDay)
    fillTextField(form, 'property_purchDate_mm', data.purchaseMonth)
    fillTextField(form, 'property_purchDate_yyyy', data.purchaseYear)
    fillRadio(form, 'property_tenureTitle', data.tenureTitle)
    fillTextField(form, 'property_expiryDoL_dd', data.expiryDay)
    fillTextField(form, 'property_expiryDoL_mm', data.expiryMonth)
    fillTextField(form, 'property_expiryDoL_yyyy', data.expiryYear)
    fillTextField(form, 'property_buildUpArea', data.buildUpArea)
    fillTextField(form, 'property_landArea', data.landArea)
    fillRadio(form, 'property_encumbered', data.propertyEncumbered)
    fillTextField(form, 'property_bankName', data.propertyBankName)
    fillTextField(form, 'property_estOutstandingBalance', data.estOutstandingBalance)
    fillRadio(form, 'property_fireInsurance', data.fireInsurance)
    fillTextField(form, 'property_fireInsurance_inForce_insurCompany', data.insuranceCompany)
    fillTextField(form, 'property_fireInsurance_inForce_periodValidity', data.periodValidity)
    fillRadio(form, 'property_fireInsurance_notAvailable', data.fireInsuranceNotAvailable)
    fillRadio(form, 'property_renewalFireInsurance', data.renewalFireInsurance)
    
    // Step 4: Nominee 1
    fillTextField(form, 'nominee1_salutation', cleanOther(data.nominee1Salutation))
    fillTextField(form, 'nominee1_name', data.nominee1Name)
    fillTextField(form, 'nominee1_ic', data.nominee1Ic)
    fillTextField(form, 'nominee1_address', data.nominee1Address)
    fillTextField(form, 'nominee1_address_postcode', data.nominee1Postcode)
    fillTextField(form, 'nominee1_email', data.nominee1Email)
    fillTextField(form, 'nominee1_residencePhone', data.nominee1ResidencePhone)
    fillTextField(form, 'nominee1_telephone', data.nominee1Telephone)
    fillTextField(form, 'nominee1_dob_dd', data.nominee1DobDay)
    fillTextField(form, 'nominee1_dob_mm', data.nominee1DobMonth)
    fillTextField(form, 'nominee1_dob_yyyy', data.nominee1DobYear)
    fillRadio(form, 'nominee_sex', data.nominee1Sex)
    fillTextField(form, 'nominee1_race', cleanOther(data.nominee1Race))
    if (data.nominee1Malaysian) fillCheckBox(form, 'nominee1_malaysian', true)
    fillTextField(form, 'nominee1_marital', cleanOther(data.nominee1Marital))
    fillTextField(form, 'nominee1_relationship', data.nominee1Relationship)
    
    // Nominee 2
    if (data.hasSecondNominee) {
      fillTextField(form, 'nominee2_salutation', cleanOther(data.nominee2Salutation))
      fillTextField(form, 'nominee2_name', data.nominee2Name)
      fillTextField(form, 'nominee2_ic', data.nominee2Ic)
      fillTextField(form, 'nominee2_address', data.nominee2Address)
      fillTextField(form, 'nominee2_address_postcode', data.nominee2Postcode)
      fillTextField(form, 'nominee2_email', data.nominee2Email)
      fillTextField(form, 'nominee2_residencePhone', data.nominee2ResidencePhone)
      fillTextField(form, 'nominee2_telephone', data.nominee2Telephone)
      fillTextField(form, 'nominee2_dob_dd', data.nominee2DobDay)
      fillTextField(form, 'nominee2_dob_mm', data.nominee2DobMonth)
      fillTextField(form, 'nominee2_dob_yyyy', data.nominee2DobYear)
      fillRadio(form, 'nominee2_sex', data.nominee2Sex)
      fillTextField(form, 'nominee2_race', cleanOther(data.nominee2Race))
      if (data.nominee2Malaysian) fillCheckBox(form, 'nominee2_malaysian', true)
      fillTextField(form, 'nominee2_marital', cleanOther(data.nominee2Marital))
      fillTextField(form, 'nominee2_relationship', data.nominee2Relationship)
    }
    
    // Step 5: Signatures
    fillTextField(form, 'applicant_signature_name', data.applicant_signature_name)
    fillTextField(form, 'applicant_signature_date', data.applicant_signature_date)
    
    if (data.isJointApplicant) {
      fillTextField(form, 'jApplicant_signature_name', data.jApplicant_signature_name)
      fillTextField(form, 'jApplicant_signature_date', data.jApplicant_signature_date)
    }
    
    // Step 6: Acknowledgement
    fillTextField(form, 'ackNominee_name', data.ack_nomineeName)
    fillTextField(form, 'ackNominee_ic', data.ack_nomineeNRIC)
    fillTextField(form, 'ackNominee_address', data.ack_nomineeAddress)
    fillTextField(form, 'ackNominee_applicantName', data.ack_applicantName)
    fillTextField(form, 'ackNominee_applicantIc', data.ack_applicantNRIC)
    if (data.isJointApplicant) {
      fillTextField(form, 'ackNominee_jApplicantName', data.ack_jointApplicantName)
    }
    fillTextField(form, 'ackNominee_applicantAddress', data.ack_applicantAddress)
    
    // Application date as combined string
    if (data.ack_applicationDay && data.ack_applicationMonth && data.ack_applicationYear) {
      fillTextField(form, 'ackNominee_applicationDate', `${data.ack_applicationDay}/${data.ack_applicationMonth}/${data.ack_applicationYear}`)
    }
    fillTextField(form, 'ackNominee_date_dd', data.ack_applicationDay)
    fillTextField(form, 'ackNominee_date_mm', data.ack_applicationMonth)
    fillTextField(form, 'ackNominee_date_yyyy', data.ack_applicationYear)
    
    // Signature fields for acknowledgement
    fillTextField(form, 'ackNominee_sign_name', data.ack_nomineeName)
    fillTextField(form, 'ackNominee_sign_ic', data.ack_nomineeNRIC)
    
    // Embed signature images using widget positions (ORIGINAL WORKING LOGIC)
    console.log('Signature data check:', {
      applicant: !!data.applicant_signature,
      jApplicant: !!data.jApplicant_signature,
      ack: !!data.ackNominee_signature
    })
    
    if (data.applicant_signature || data.jApplicant_signature || data.ackNominee_signature) {
      console.log('📝 Embedding signature images...')
      
      // Collect signature fields to process
      const signatureFieldsToProcess = []
      if (data.applicant_signature) signatureFieldsToProcess.push('applicant_signature')
      if (data.jApplicant_signature && data.isJointApplicant) signatureFieldsToProcess.push('jApplicant_signature')
      if (data.ackNominee_signature) signatureFieldsToProcess.push('ackNominee_signature')
      
      // Collect field positions
      const fieldPositions = []
      for (const fieldName of signatureFieldsToProcess) {
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
      
      // Draw signature images at widget positions
      for (const { fieldName, rect, pageIndex, page } of fieldPositions) {
        try {
          let signatureData = null
          if (fieldName === 'applicant_signature') signatureData = data.applicant_signature
          else if (fieldName === 'jApplicant_signature') signatureData = data.jApplicant_signature
          else if (fieldName === 'ackNominee_signature') signatureData = data.ackNominee_signature
          
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
      
      // Hide the signature fields after drawing
      for (const fieldName of signatureFieldsToProcess) {
        try {
          const field = form.getField(fieldName)
          const widgets = field.acroField.getWidgets()
          for (const widget of widgets) {
            try {
              widget.setFlagTo(1, false) // Invisible flag
              widget.setFlagTo(2, true) // Hidden flag
            } catch (e) {
              // If flags don't work, just continue
            }
          }
        } catch (e) {
          // Field doesn't exist, skip
        }
      }
    }
    
    // Don't flatten - it causes issues with some PDFs
    // form.flatten()
    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  }

  // Render the View component with all props
  return (
    <ApplicationFormView
      currentStep={currentStep}
      totalSteps={totalSteps}
      formData={formData}
      errors={errors}
      handleChange={handleChange}
      handleNext={handleNext}
      handleBack={handleBack}
      handleSubmit={handleSubmit}
      handleFileUpload={handleFileUpload}
      handleFileDelete={handleFileDelete}
      uploadProgress={uploadProgress}
      isLoading={isLoading}
      isSaving={isSaving}
    />
  )
}

export default ApplicationController
