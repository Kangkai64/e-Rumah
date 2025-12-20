// Application Form View - Pure Presentational Component
// Receives all props from ApplicationController
// NO business logic - only UI rendering
// NO imports from other views allowed!

import { useRef, useEffect } from 'react'
import '../components/application/applicationForm.css'
import DocumentUpload from '../components/application/DocumentUpload'

// ============================================================================
// HELPER COMPONENTS (All inline - no separate files)
// ============================================================================

// Error Message Component
function ErrorMessage({ error }) {
  if (!error) return null
  return <span className="error-message">{error}</span>
}

// Error Summary Component
function ErrorSummary({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null
  
  return (
    <div className="error-summary">
      <h3>⚠️ Please fix the following errors:</h3>
      <ul>
        {Object.values(errors).map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  )
}

// Signature Pad Component
function SignaturePad({ value, onChange, label = 'Signature' }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas && value) {
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    }
  }, [value])

  const startDrawing = (e) => {
    isDrawing.current = true
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    ctx.beginPath()
    ctx.moveTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    )
  }

  const draw = (e) => {
    if (!isDrawing.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    ctx.lineTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    )
    ctx.strokeStyle = '#161519'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawing.current = false
    const canvas = canvasRef.current
    if (canvas) {
      onChange(canvas.toDataURL('image/png'))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div className="signature-pad-container">
      <label className="signature-label">{label}</label>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="signature-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <button type="button" onClick={clearSignature} className="signature-clear-btn">
        Clear
      </button>
    </div>
  )
}

// Wizard Navigation Component
function WizardNavigation({ currentStep, totalSteps, onNext, onBack, onSubmit, isLastStep, isSubmitting, editNomineeOnly = false, nomineeCount = 0 }) {
  const progress = (currentStep / totalSteps) * 100

  const stepTitles = [
    "Personal Information",
    "Joint Applicant & Bank",
    "Property Details",
    "Nominees",
    "Privacy, Documents & Declaration",
    "Acknowledgement Form",
    "Review & Submit"
  ]

  const handleNominateConfirm = () => {
    if (window.confirm('Are you sure you want to nominate this person as your new nominee?')) {
      onNext()
    }
  }

  return (
    <div className="wizard-navigation">
      <div className="wizard-header">
        {!editNomineeOnly && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        {!editNomineeOnly && (
          <div className="step-indicator">
            <span className="step-number">Step {currentStep} of {totalSteps}</span>
            <span className="step-title">{stepTitles[currentStep - 1]}</span>
          </div>
        )}
      </div>
      
      <div className="wizard-buttons">
        {editNomineeOnly ? (
          <button type="button" className="wizard-btn wizard-btn-danger" onClick={handleNominateConfirm}>
            Nominate New Nominee
          </button>
        ) : (
          <>
            {currentStep > 1 && (
              <button type="button" className="wizard-btn wizard-btn-back" onClick={onBack} disabled={isSubmitting}>
                ← Back
              </button>
            )}
            {!isLastStep ? (
              <button type="button" className="wizard-btn wizard-btn-next" onClick={onNext} disabled={isSubmitting}>
                Next →
              </button>
            ) : (
              <button type="button" className="wizard-btn wizard-btn-submit" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
                ) : 'Submit'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// STEP COMPONENTS (All inline - no separate files)
// ============================================================================

// Step 1: Personal Information
function Step1PersonalInfo({ formData, handleChange, errors = {}, handleFileUpload, handleFileDelete, uploadProgress }) {
  return (
    <div className="step-container">
      <h2>Personal Information</h2>
      <p className="step-description">Please provide your personal details as per your NRIC.</p>
      
      <ErrorSummary errors={errors} />

      <section className="form-section">
      <div className="form-group">
        <label>How do you know about SSB/SSB-i? *</label>
        <div className="radio-group">
          {['website', 'google', 'social_media', 'expo', 'family/friends', 'tv/radio/newspaper'].map(value => (
            <label key={value} className="radio-label">
              <input
                type="radio"
                name="howDidYouKnow"
                value={value}
                checked={formData.howDidYouKnow === value}
                onChange={handleChange}
                required
              />
              {value === 'website' ? 'Website' :
               value === 'google' ? 'Google' :
               value === 'social_media' ? 'Social Media' :
               value === 'expo' ? 'Expo / Marketing Event / Webinar' :
               value === 'family/friends' ? 'Family / Friends' :
               'TV / Radio / Newspaper'}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="isJointApplicant"
            checked={formData.isJointApplicant}
            onChange={handleChange}
          />
          <span>Do you have a Joint Applicant?</span>
        </label>
      </div>

      <div className="form-group">
        <label>Salutation *</label>
        <select name="salutation" value={formData.salutation.startsWith('Other:') ? 'Other' : formData.salutation} onChange={(e) => {
          if (e.target.value === 'Other') {
            handleChange({target: {name: 'salutation', value: 'Other:'}})
          } else {
            handleChange(e)
          }
        }} required>
          <option value="">Select</option>
          <option value="Mr">Mr</option>
          <option value="Mdm">Mdm</option>
          <option value="Ms">Ms</option>
          <option value="Tan Sri">Tan Sri</option>
          <option value="Dato'">Dato'</option>
          <option value="Other">Other</option>
        </select>
        {formData.salutation.startsWith('Other:') && (
          <input
            type="text"
            name="salutation"
            value={formData.salutation.substring(6)}
            onChange={(e) => handleChange({target: {name: 'salutation', value: 'Other:' + e.target.value}})}
            placeholder="Please specify"
            style={{marginTop: '0.5rem'}}
            required
          />
        )}
      </div>

      <div className="form-group">
        <label>Name as per NRIC *</label>
        <input 
          type="text" 
          name="nameAsPerNRIC" 
          value={formData.nameAsPerNRIC} 
          onChange={handleChange} 
          className={errors.nameAsPerNRIC ? 'error' : ''}
          required 
        />
        <ErrorMessage error={errors.nameAsPerNRIC} />
      </div>

      <div className="form-group">
        <label>NRIC No. *</label>
        <input 
          type="text" 
          name="nricNo" 
          value={formData.nricNo} 
          onChange={handleChange} 
          className={errors.nricNo ? 'error' : ''}
          placeholder="Format: xxxxxx-xx-xxxx"
          required 
        />
        <small style={{color: '#666', fontSize: '0.85rem'}}>ℹ️ Birthdate and sex will be auto-filled from IC number</small>
        <ErrorMessage error={errors.nricNo} />
      </div>

      <div className="form-group">
        <label>Date of Birth (DD/MM/YYYY) * <span style={{color: '#666', fontSize: '0.85rem'}}>(Auto-filled from IC)</span></label>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <select name="dobDay" value={formData.dobDay} onChange={handleChange} style={{width: '70px'}} className={errors.dob ? 'error' : ''} required>
            <option value="">DD</option>
            {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
          </select>
          <select name="dobMonth" value={formData.dobMonth} onChange={handleChange} style={{width: '70px'}} className={errors.dob ? 'error' : ''} required>
            <option value="">MM</option>
            {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
          </select>
          <select name="dobYear" value={formData.dobYear} onChange={handleChange} style={{width: '90px'}} className={errors.dob ? 'error' : ''} required>
            <option value="">YYYY</option>
            {Array.from({length: 100}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <ErrorMessage error={errors.dob} />
      </div>

      <div className="form-group">
        <label>Sex * <span style={{color: '#666', fontSize: '0.85rem'}}>(Auto-filled from IC)</span></label>
        <div className="radio-group">
          <label className="radio-label"><input type="radio" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleChange} required /> Male</label>
          <label className="radio-label"><input type="radio" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleChange} /> Female</label>
        </div>
      </div>

      <div className="form-group">
        <label>Race</label>
        <select name="race" value={formData.race.startsWith('Other:') ? 'Other' : formData.race} onChange={(e) => {
          if (e.target.value === 'Other') {
            handleChange({target: {name: 'race', value: 'Other:'}})
          } else {
            handleChange(e)
          }
        }}>
          <option value="">Select</option>
          <option value="Malay">Malay</option>
          <option value="Chinese">Chinese</option>
          <option value="Indian">Indian</option>
          <option value="Other">Other</option>
        </select>
        {formData.race.startsWith('Other:') && (
          <input
            type="text"
            name="race"
            value={formData.race.substring(6)}
            onChange={(e) => handleChange({target: {name: 'race', value: 'Other:' + e.target.value}})}
            placeholder="Please specify"
            style={{marginTop: '0.5rem'}}
          />
        )}
      </div>

      <div className="form-group">
        <label className={`checkbox-label ${errors.malaysian ? 'error' : ''}`}>
          <input type="checkbox" name="malaysian" checked={formData.malaysian} onChange={handleChange} required />
          <span>Malaysian *</span>
        </label>
        {errors.malaysian && <ErrorMessage error={errors.malaysian} />}
      </div>

      <div className="form-group">
        <label>Marital Status</label>
        <select name="maritalStatus" value={formData.maritalStatus.startsWith('Other:') ? 'Other' : formData.maritalStatus} onChange={(e) => {
          if (e.target.value === 'Other') {
            handleChange({target: {name: 'maritalStatus', value: 'Other:'}})
          } else {
            handleChange(e)
          }
        }}>
          <option value="">Select</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
          <option value="Other">Other</option>
        </select>
        {formData.maritalStatus.startsWith('Other:') && (
          <input
            type="text"
            name="maritalStatus"
            value={formData.maritalStatus.substring(6)}
            onChange={(e) => handleChange({target: {name: 'maritalStatus', value: 'Other:' + e.target.value}})}
            placeholder="Please specify"
            style={{marginTop: '0.5rem'}}
          />
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>No. of Dependents</label>
          <select name="numOfDependents" value={formData.numOfDependents} onChange={handleChange}>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        {parseInt(formData.numOfDependents) > 0 && (
          <div className="form-group">
            <label>Ages</label>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
              {parseInt(formData.numOfDependents) >= 1 && (
                <input type="text" name="dependentAge1" value={formData.dependentAge1} onChange={handleChange} style={{width: '60px'}} placeholder="Age 1" />
              )}
              {parseInt(formData.numOfDependents) >= 2 && (
                <input type="text" name="dependentAge2" value={formData.dependentAge2} onChange={handleChange} style={{width: '60px'}} placeholder="Age 2" />
              )}
              {parseInt(formData.numOfDependents) >= 3 && (
                <input type="text" name="dependentAge3" value={formData.dependentAge3} onChange={handleChange} style={{width: '60px'}} placeholder="Age 3" />
              )}
              {parseInt(formData.numOfDependents) >= 4 && (
                <input type="text" name="dependentAge4" value={formData.dependentAge4} onChange={handleChange} style={{width: '60px'}} placeholder="Age 4" />
              )}
              {parseInt(formData.numOfDependents) >= 5 && (
                <input type="text" name="dependentAge5" value={formData.dependentAge5} onChange={handleChange} style={{width: '60px'}} placeholder="Age 5" />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Residential Address *</label>
        <textarea 
          name="address" 
          value={formData.address} 
          onChange={handleChange} 
          rows="2" 
          className={errors.address ? 'error' : ''}
          required 
        />
        <ErrorMessage error={errors.address} />
      </div>

      <div className="form-group">
        <label>Postcode *</label>
        <input 
          type="text" 
          name="postcode" 
          value={formData.postcode} 
          onChange={handleChange} 
          className={errors.postcode ? 'error' : ''}
          placeholder="5 digits"
          required 
        />
        <ErrorMessage error={errors.postcode} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Email *</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            className={errors.email ? 'error' : ''}
            required 
          />
          <ErrorMessage error={errors.email} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Telephone No. (Residence) *</label>
          <input 
            type="tel" 
            name="residencePhone" 
            value={formData.residencePhone} 
            onChange={handleChange} 
            className={errors.residencePhone ? 'error' : ''}
            placeholder="xxx-xxxxxxx"
            required
          />
          <ErrorMessage error={errors.residencePhone} />
        </div>
        <div className="form-group">
          <label>Telephone No (H/P) *</label>
          <input 
            type="tel" 
            name="telephone" 
            value={formData.telephone} 
            onChange={handleChange} 
            className={errors.telephone ? 'error' : ''}
            placeholder="xxx-xxxxxxx"
            required
          />
          <ErrorMessage error={errors.telephone} />
        </div>
      </div>

      <div className="form-group">
        <label>Present House</label>
        <div className="radio-group">
          {['own', 'rented', 'mortgaged', 'family'].map(value => (
            <label key={value} className="radio-label">
              <input type="radio" name="presentHouse" value={value} checked={formData.presentHouse === value} onChange={handleChange} />
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Occupation *</label>
        <input 
          type="text" 
          name="occupation" 
          value={formData.occupation} 
          onChange={handleChange} 
          className={errors.occupation ? 'error' : ''}
          required 
        />
        <ErrorMessage error={errors.occupation} />
      </div>

      <div className="form-group">
        <label>Name of Employer *</label>
        <input 
          type="text" 
          name="employerName" 
          value={formData.employerName} 
          onChange={handleChange} 
          className={errors.employerName ? 'error' : ''}
          required
        />
        <ErrorMessage error={errors.employerName} />
      </div>

      <div className="form-group">
        <label>Address of Employer *</label>
        <textarea 
          name="employerAddress" 
          value={formData.employerAddress} 
          onChange={handleChange} 
          rows="2" 
          className={errors.employerAddress ? 'error' : ''}
          required
        />
        <ErrorMessage error={errors.employerAddress} />
      </div>

      <div className="form-group">
        <label>Postcode *</label>
        <input 
          type="text" 
          name="employerPostcode" 
          value={formData.employerPostcode} 
          onChange={handleChange} 
          className={errors.employerPostcode ? 'error' : ''}
          placeholder="5 digits"
          required
        />
        <ErrorMessage error={errors.employerPostcode} />
      </div>

      <div className="form-group">
        <label>Purpose of Application *</label>
        <input 
          type="text" 
          name="purposeOfApplication" 
          value={formData.purposeOfApplication} 
          onChange={handleChange} 
          className={errors.purposeOfApplication ? 'error' : ''}
          required 
        />
        <ErrorMessage error={errors.purposeOfApplication} />
      </div>

      {/* Identity Documents */}
      <div className="documents-section" style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
        <h3 style={{marginTop: 0}}>Identity Documents</h3>
        
        <DocumentUpload
          label="Applicant NRIC"
          required
          documentData={formData.documents?.applicantNRIC}
          onUpload={(e) => handleFileUpload(e, 'applicantNRIC')}
          onDelete={() => handleFileDelete('applicantNRIC')}
          uploading={uploadProgress?.applicantNRIC}
          accept=".pdf,.jpg,.jpeg,.png"
          hint="Upload a clear copy of your NRIC (Max 10MB)"
          error={errors.applicantNRIC}
        />

        {formData.isJointApplicant && (
          <DocumentUpload
            label="Joint Applicant NRIC"
            required
            documentData={formData.documents?.jointApplicantNRIC}
            onUpload={(e) => handleFileUpload(e, 'jointApplicantNRIC')}
            onDelete={() => handleFileDelete('jointApplicantNRIC')}
            uploading={uploadProgress?.jointApplicantNRIC}
            accept=".pdf,.jpg,.jpeg,.png"
            hint="Upload a clear copy of joint applicant's NRIC (Max 10MB)"
            error={errors.jointApplicantNRIC}
          />
        )}

        <DocumentUpload
          label="Birth Certificate"
          required
          documentData={formData.documents?.birthCertificate}
          onUpload={(e) => handleFileUpload(e, 'birthCertificate')}
          onDelete={() => handleFileDelete('birthCertificate')}
          uploading={uploadProgress?.birthCertificate}
          accept=".pdf,.jpg,.jpeg,.png"
          hint="Upload birth certificate (Max 10MB)"
          error={errors.birthCertificate}
        />

        {(formData.maritalStatus === 'Married' && formData.isJointApplicant) && (
          <DocumentUpload
            label="Marriage Certificate (Optional)"
            documentData={formData.documents?.marriageCertificate}
            onUpload={(e) => handleFileUpload(e, 'marriageCertificate')}
            onDelete={() => handleFileDelete('marriageCertificate')}
            uploading={uploadProgress?.marriageCertificate}
            accept=".pdf,.jpg,.jpeg,.png"
            hint="Upload marriage certificate (Max 10MB)"
            error={errors.marriageCertificate}
          />
        )}
      </div>

      {/* Financial Documents */}
      <div className="documents-section" style={{marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
        <h3 style={{marginTop: 0}}>Financial Documents</h3>
        
        <div style={{marginBottom: '1rem'}}>
          <h4 style={{marginBottom: '0.5rem'}}>Latest 3 Months Payslips *</h4>
          {[0, 1, 2].map((index) => (
            <DocumentUpload
              key={index}
              label={`Payslip ${index + 1}`}
              required
              documentData={formData.documents?.payslips?.[index]}
              onUpload={(e) => handleFileUpload(e, 'payslips', index)}
              onDelete={() => handleFileDelete('payslips', index)}
              uploading={uploadProgress?.[`payslips_${index}`]}
              accept=".pdf,.jpg,.jpeg,.png"
              hint={`Upload payslip for month ${index + 1} (Max 10MB)`}
              error={errors[`payslip${index + 1}`]}
            />
          ))}
        </div>

        <div style={{marginBottom: '1rem'}}>
          <h4 style={{marginBottom: '0.5rem'}}>Latest 6 Months Bank Statements *</h4>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <DocumentUpload
              key={index}
              label={`Bank Statement ${index + 1}`}
              required
              documentData={formData.documents?.bankStatements?.[index]}
              onUpload={(e) => handleFileUpload(e, 'bankStatements', index)}
              onDelete={() => handleFileDelete('bankStatements', index)}
              uploading={uploadProgress?.[`bankStatements_${index}`]}
              accept=".pdf,.jpg,.jpeg,.png"
              hint={`Upload bank statement for month ${index + 1} (Max 10MB)`}
              error={errors[`bankStatement${index + 1}`]}
            />
          ))}
        </div>

        <DocumentUpload
          label="Latest EPF Statement"
          required
          documentData={formData.documents?.epfStatement}
          onUpload={(e) => handleFileUpload(e, 'epfStatement')}
          onDelete={() => handleFileDelete('epfStatement')}
          uploading={uploadProgress?.epfStatement}
          accept=".pdf,.jpg,.jpeg,.png"
          hint="Upload your latest EPF statement (Max 10MB)"
          error={errors.epfStatement}
        />
      </div>

      <div className="form-group">
        <label>Payout Option</label>
        <div className="radio-group">
          <label className="radio-label"><input type="radio" name="payoutOption" value="monthlyPayout" checked={formData.payoutOption === 'monthlyPayout'} onChange={handleChange} /> Monthly Payout only</label>
          <label className="radio-label"><input type="radio" name="payoutOption" value="monthlyPayout_lumpSum" checked={formData.payoutOption === 'monthlyPayout_lumpSum'} onChange={handleChange} /> Monthly Payout and Lump Sum</label>
        </div>
      </div>

      <div className="form-group" style={{opacity: formData.payoutOption === 'monthlyPayout_lumpSum' ? 1 : 0.5}}>
        <label>Usage of Lump Sum</label>
        <div className="radio-group">
          <label className="radio-label"><input type="radio" name="lumpSumUsage" value="medicalExpenses" checked={formData.lumpSumUsage === 'medicalExpenses'} onChange={handleChange} disabled={formData.payoutOption !== 'monthlyPayout_lumpSum'} /> Payment for medical expenses</label>
          <label className="radio-label"><input type="radio" name="lumpSumUsage" value="settleOutstandingMortgage" checked={formData.lumpSumUsage === 'settleOutstandingMortgage'} onChange={handleChange} disabled={formData.payoutOption !== 'monthlyPayout_lumpSum'} /> Settle mortgage loan</label>
          <label className="radio-label"><input type="radio" name="lumpSumUsage" value="maintenance" checked={formData.lumpSumUsage === 'maintenance'} onChange={handleChange} disabled={formData.payoutOption !== 'monthlyPayout_lumpSum'} /> Refurbishment and maintenance</label>
        </div>
      </div>

      <div className="form-group">
        <label>Payment of Initial Costs & Expenses</label>
        <div className="radio-group">
          <label className="radio-label"><input type="radio" name="paymentOption" value="toBePaid" checked={formData.paymentOption === 'toBePaid'} onChange={handleChange} /> To be paid by borrower/customer</label>
          <label className="radio-label"><input type="radio" name="paymentOption" value="toBeAdvanced" checked={formData.paymentOption === 'toBeAdvanced'} onChange={handleChange} /> To be advanced by Organization</label>
        </div>
      </div>
      </section>
    </div>
  )
}

// Step 2: Joint Applicant & Banking Information
function Step2JointApplicant({ formData, handleChange, errors = {} }) {
  return (
    <div className="step-container">
      <h2>Joint Applicant & Banking Information</h2>
      <p className="step-description">Provide joint applicant details (if applicable) and banking information</p>
      <ErrorSummary errors={errors} />
      
      {formData.isJointApplicant && (
        <section className="form-section conditional-section">
          <h3>Particulars of Joint Applicant</h3>
          
          <div className="form-group">
            <label>Salutation *</label>
            <select name="jSalutation" value={formData.jSalutation?.startsWith('Other:') ? 'Other' : formData.jSalutation} onChange={(e) => {
              if (e.target.value === 'Other') {
                handleChange({target: {name: 'jSalutation', value: 'Other:'}})
              } else {
                handleChange(e)
              }
            }} required>
              <option value="">Select</option>
              <option value="Mr">Mr</option>
              <option value="Mdm">Mdm</option>
              <option value="Ms">Ms</option>
              <option value="Tan Sri">Tan Sri</option>
              <option value="Dato'">Dato'</option>
              <option value="Other">Other</option>
            </select>
            {formData.jSalutation?.startsWith('Other:') && (
              <input
                type="text"
                name="jSalutation"
                value={formData.jSalutation.substring(6)}
                onChange={(e) => handleChange({target: {name: 'jSalutation', value: 'Other:' + e.target.value}})}
                placeholder="Please specify"
                style={{marginTop: '0.5rem'}}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label>Name as per NRIC *</label>
            <input 
              type="text" 
              name="jName" 
              value={formData.jName} 
              onChange={handleChange} 
              className={errors.jName ? 'error' : ''}
              required 
            />
            <ErrorMessage error={errors.jName} />
          </div>

          <div className="form-group">
            <label>NRIC No. *</label>
            <input 
              type="text" 
              name="jIc" 
              value={formData.jIc} 
              onChange={handleChange} 
              className={errors.jIc ? 'error' : ''}
              placeholder="Format: xxxxxx-xx-xxxx"
              required 
            />
            <small style={{color: '#666', fontSize: '0.85rem'}}>ℹ️ Birthdate and sex will be auto-filled from IC number</small>
            <ErrorMessage error={errors.jIc} />
          </div>

          <div className="form-group">
            <label>Date of Birth (DD/MM/YYYY) * <span style={{color: '#666', fontSize: '0.85rem'}}>(Auto-filled from IC)</span></label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select name="jDobDay" value={formData.jDobDay} onChange={handleChange} style={{width: '70px'}} required>
                <option value="">DD</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
              </select>
              <select name="jDobMonth" value={formData.jDobMonth} onChange={handleChange} style={{width: '70px'}} required>
                <option value="">MM</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
              </select>
              <select name="jDobYear" value={formData.jDobYear} onChange={handleChange} style={{width: '90px'}} required>
                <option value="">YYYY</option>
                {Array.from({length: 100}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Sex * <span style={{color: '#666', fontSize: '0.85rem'}}>(Auto-filled from IC)</span></label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="jSex" value="Male" checked={formData.jSex === 'Male'} onChange={handleChange} required /> Male</label>
              <label className="radio-label"><input type="radio" name="jSex" value="Female" checked={formData.jSex === 'Female'} onChange={handleChange} /> Female</label>
            </div>
          </div>

          <div className="form-group">
            <label>Race</label>
            <select name="jRace" value={formData.jRace?.startsWith('Other:') ? 'Other' : formData.jRace} onChange={(e) => {
              if (e.target.value === 'Other') {
                handleChange({target: {name: 'jRace', value: 'Other:'}})
              } else {
                handleChange(e)
              }
            }}>
              <option value="">Select</option>
              <option value="Malay">Malay</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Other">Other</option>
            </select>
            {formData.jRace?.startsWith('Other:') && (
              <input
                type="text"
                name="jRace"
                value={formData.jRace.substring(6)}
                onChange={(e) => handleChange({target: {name: 'jRace', value: 'Other:' + e.target.value}})}
                placeholder="Please specify"
                style={{marginTop: '0.5rem'}}
              />
            )}
          </div>

          <div className="form-group">
            <label className={`checkbox-label ${errors.jMalaysian ? 'error' : ''}`}>
              <input type="checkbox" name="jMalaysian" checked={formData.jMalaysian} onChange={handleChange} required />
              <span>Malaysian *</span>
            </label>
            {errors.jMalaysian && <ErrorMessage error={errors.jMalaysian} />}
          </div>

          <div className="form-group">
            <label>Marital Status *</label>
            <select name="jMarital" value={formData.jMarital?.startsWith('Other:') ? 'Other' : formData.jMarital} onChange={(e) => {
              if (e.target.value === 'Other') {
                handleChange({target: {name: 'jMarital', value: 'Other:'}})
              } else {
                handleChange(e)
              }
            }} className={errors.jMarital ? 'error' : ''} required>
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Other">Other</option>
            </select>
            {formData.jMarital?.startsWith('Other:') && (
              <input
                type="text"
                name="jMarital"
                value={formData.jMarital.substring(6)}
                onChange={(e) => handleChange({target: {name: 'jMarital', value: 'Other:' + e.target.value}})}
                placeholder="Please specify"
                style={{marginTop: '0.5rem'}}
                required
              />
            )}
            <ErrorMessage error={errors.jMarital} />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea 
              name="jAddress" 
              value={formData.jAddress} 
              onChange={handleChange} 
              className={errors.jAddress ? 'error' : ''}
              rows="3" 
              required 
            />
            <ErrorMessage error={errors.jAddress} />
          </div>

          <div className="form-group">
            <label>Postcode *</label>
            <input 
              type="text" 
              name="jPostcode" 
              value={formData.jPostcode} 
              onChange={handleChange} 
              className={errors.jPostcode ? 'error' : ''}
              required 
            />
            <ErrorMessage error={errors.jPostcode} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                name="jEmail" 
                value={formData.jEmail} 
                onChange={handleChange} 
                className={errors.jEmail ? 'error' : ''}
                required 
              />
              <ErrorMessage error={errors.jEmail} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Telephone No. (Residence) *</label>
              <input 
                type="tel" 
                name="jResidencePhone" 
                value={formData.jResidencePhone} 
                onChange={handleChange} 
                className={errors.jResidencePhone ? 'error' : ''}
                placeholder="xxx-xxxxxxx"
                required
              />
              <ErrorMessage error={errors.jResidencePhone} />
            </div>
            <div className="form-group">
              <label>Telephone No (H/P) *</label>
              <input 
                type="tel" 
                name="jTelephone" 
                value={formData.jTelephone} 
                onChange={handleChange} 
                className={errors.jTelephone ? 'error' : ''}
                placeholder="xxx-xxxxxxx"
                required
              />
              <ErrorMessage error={errors.jTelephone} />
            </div>
          </div>

          <div className="form-group">
            <label>Relationship with Applicant *</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="jRelationship" value="spouse" checked={formData.jRelationship === 'spouse'} onChange={handleChange} required /> Spouse</label>
              <label className="radio-label"><input type="radio" name="jRelationship" value="children" checked={formData.jRelationship === 'children'} onChange={handleChange} /> Children</label>
              <label className="radio-label"><input type="radio" name="jRelationship" value="parent" checked={formData.jRelationship === 'parent'} onChange={handleChange} /> Parent</label>
              <label className="radio-label"><input type="radio" name="jRelationship" value="siblings" checked={formData.jRelationship === 'siblings'} onChange={handleChange} /> Siblings</label>
            </div>
          </div>

          <div className="form-group">
            <label>Occupation *</label>
            <input 
              type="text" 
              name="jOccupation" 
              value={formData.jOccupation} 
              onChange={handleChange} 
              className={errors.jOccupation ? 'error' : ''}
              required 
            />
            <ErrorMessage error={errors.jOccupation} />
          </div>

          <div className="form-group">
            <label>Name of Employer *</label>
            <input 
              type="text" 
              name="jEmployerName" 
              value={formData.jEmployerName} 
              onChange={handleChange} 
              className={errors.jEmployerName ? 'error' : ''}
              required
            />
            <ErrorMessage error={errors.jEmployerName} />
          </div>

          <div className="form-group">
            <label>Address of Employer *</label>
            <textarea 
              name="jEmployerAddress" 
              value={formData.jEmployerAddress} 
              onChange={handleChange} 
              rows="2"
              className={errors.jEmployerAddress ? 'error' : ''}
              required
            />
            <ErrorMessage error={errors.jEmployerAddress} />
          </div>

          <div className="form-group">
            <label>Postcode *</label>
            <input 
              type="text" 
              name="jEmployerPostcode" 
              value={formData.jEmployerPostcode} 
              onChange={handleChange} 
              className={errors.jEmployerPostcode ? 'error' : ''}
              placeholder="5 digits"
              required
            />
            <ErrorMessage error={errors.jEmployerPostcode} />
          </div>
        </section>
      )}
      
      <section className="form-section">
        <h3>Applicant's Banking Account Number</h3>
        
        <div className="form-group">
          <label>Name of Bank</label>
          <input 
            type="text" 
            name="bankName" 
            value={formData.bankName} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Account Type *</label>
          <div className={`radio-group ${errors.accountType ? 'error' : ''}`}>
            <label className="radio-label"><input type="radio" name="accountType" value="savings" checked={formData.accountType === 'savings'} onChange={handleChange} /> Savings</label>
            <label className="radio-label"><input type="radio" name="accountType" value="current" checked={formData.accountType === 'current'} onChange={handleChange} /> Current</label>
            <label className="radio-label"><input type="radio" name="accountType" value="joinAccountSaving" checked={formData.accountType === 'joinAccountSaving'} onChange={handleChange} /> Joint Account Saving</label>
            <label className="radio-label"><input type="radio" name="accountType" value="jointAccountCurrent" checked={formData.accountType === 'jointAccountCurrent'} onChange={handleChange} /> Joint Account Current</label>
          </div>
          {errors.accountType && <ErrorMessage error={errors.accountType} />}
          {formData.isJointApplicant && !errors.accountType && (
            <div style={{marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#e7f3ff', border: '1px solid #2196F3', borderRadius: '4px', fontSize: '0.9rem', color: '#1565c0'}}>
              ℹ️ Note: Since you have a joint applicant, you must select either <strong>Joint Account Saving</strong> or <strong>Joint Account Current</strong> as the account type.
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Account Preference</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="accountPreference" value="conventional" checked={formData.accountPreference === 'conventional'} onChange={handleChange} /> Conventional</label>
            <label className="radio-label"><input type="radio" name="accountPreference" value="islamic" checked={formData.accountPreference === 'islamic'} onChange={handleChange} /> Islamic</label>
          </div>
        </div>

        <div className="form-group">
          <label>Account Number</label>
          <input 
            type="text" 
            name="accountNumber" 
            value={formData.accountNumber} 
            onChange={handleChange} 
          />
        </div>
      </section>
    </div>
  )
}

// Step 3: Property Details
function Step3PropertyDetails({ formData, handleChange, errors = {}, handleFileUpload, handleFileDelete, uploadProgress }) {
  return (
    <div className="step-container">
      <h2>Property Information</h2>
      <p className="step-description">
        Provide details about the property
      </p>
      
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#e8f4fd',
        border: '1px solid #2196F3',
        borderRadius: '8px',
        fontSize: '0.95rem'
      }}>
        <strong style={{color: '#0d47a1', display: 'block', marginBottom: '0.5rem'}}>📋 SSB Property Requirements:</strong>
        <ul style={{margin: '0', paddingLeft: '1.5rem', color: '#1565c0'}}>
          <li>Property must be a residential property located in Kuala Lumpur, Malaysia</li>
          <li>Property must be your primary place of residence</li>
          <li>Property must be free from encumbrances (mortgages/financial liabilities) or existing encumbrances must be settled</li>
          <li>For leasehold properties: remaining lease tenure must be at least 90 years</li>
          <li>Joint ownership is required if applying with a joint applicant</li>
        </ul>
      </div>
      
      <ErrorSummary errors={errors} />
      
      {formData.isJointApplicant && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#fff9e6',
          border: '1px solid #ff9800',
          borderRadius: '8px',
          fontSize: '0.95rem',
          color: '#e65100'
        }}>
          <strong>⚠️ Joint Applicant Notice:</strong> Since you have a joint applicant, the property must be under joint ownership (both applicant and joint applicant must be listed as owners).
        </div>
      )}

      <section className="form-section">
        <div className="form-group">
          <label>Property Type</label>
          <div className="radio-group">
            {['terrace', 'high-rise', 'semi-detach', 'detach', 'bungalow', 'others'].map(value => (
              <label key={value} className="radio-label">
                <input type="radio" name="propertyType" value={value} checked={formData.propertyType === value} onChange={handleChange} />
                {value === 'high-rise' ? 'High-Rise' : 
                 value === 'semi-detach' ? 'Semi-Detach' :
                 value === 'detach' ? 'Detach (Bungalow)' :
                 value.charAt(0).toUpperCase() + value.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Property Address *</label>
          <textarea 
            name="propertyAddress" 
            value={formData.propertyAddress} 
            onChange={handleChange} 
            rows="2" 
            className={errors.propertyAddress ? 'error' : ''}
          />
          <ErrorMessage error={errors.propertyAddress} />
        </div>

        <div className="form-group">
          <label>Postcode *</label>
          <select 
            name="propertyPostcode" 
            value={formData.propertyPostcode} 
            onChange={handleChange} 
            className={errors.propertyPostcode ? 'error' : ''}
            required
          >
            <option value="">Select postcode</option>
            <option value="41100">41100</option>
            <option value="42100">42100</option>
            <option value="42000">42000</option>
            <option value="45800">45800</option>
            <option value="45600">45600</option>
            <option value="42500">42500</option>
            <option value="42600">42600</option>
            <option value="45000">45000</option>
            <option value="42700">42700</option>
            <option value="43950">43950</option>
            <option value="42200">42200</option>
            <option value="41300">41300</option>
            <option value="41050">41050</option>
          </select>
          <ErrorMessage error={errors.propertyPostcode} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Indicative Market Value (RM) *</label>
            <input 
              type="text" 
              name="indicativeMarketValue" 
              value={formData.indicativeMarketValue} 
              onChange={handleChange} 
              className={errors.indicativeMarketValue ? 'error' : ''}
            />
            <ErrorMessage error={errors.indicativeMarketValue} />
          </div>
          <div className="form-group">
            <label>Valuation Date (DD/MM/YYYY)</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select name="valuationDay" value={formData.valuationDay} onChange={handleChange} style={{width: '70px'}}>
                <option value="">DD</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
              </select>
              <select name="valuationMonth" value={formData.valuationMonth} onChange={handleChange} style={{width: '70px'}}>
                <option value="">MM</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
              </select>
              <select name="valuationYear" value={formData.valuationYear} onChange={handleChange} style={{width: '90px'}}>
                <option value="">YYYY</option>
                {Array.from({length: 50}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Applicant Expected Market Value (RM)</label>
          <input type="text" name="expectedMarketValue" value={formData.expectedMarketValue} onChange={handleChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sale & Purchase Price (RM)</label>
            <input type="text" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>S & P Date (DD/MM/YYYY)</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select name="purchaseDay" value={formData.purchaseDay} onChange={handleChange} style={{width: '70px'}}>
                <option value="">DD</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
              </select>
              <select name="purchaseMonth" value={formData.purchaseMonth} onChange={handleChange} style={{width: '70px'}}>
                <option value="">MM</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
              </select>
              <select name="purchaseYear" value={formData.purchaseYear} onChange={handleChange} style={{width: '90px'}}>
                <option value="">YYYY</option>
                {Array.from({length: 50}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Tenure of Property Title</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="tenureTitle" value="freehold" checked={formData.tenureTitle === 'freehold'} onChange={handleChange} /> Freehold</label>
            <label className="radio-label"><input type="radio" name="tenureTitle" value="leasehold" checked={formData.tenureTitle === 'leasehold'} onChange={handleChange} /> Leasehold</label>
          </div>
          {errors.tenureTitle && <ErrorMessage error={errors.tenureTitle} />}
          <div className="form-group" style={{marginTop: '0.5rem', opacity: formData.tenureTitle === 'leasehold' ? 1 : 0.5}}>
            <label>Specify Expiry Date of Lease (DD/MM/YYYY) {formData.tenureTitle === 'leasehold' && '*'}</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select name="expiryDay" value={formData.expiryDay} onChange={handleChange} style={{width: '70px'}} disabled={formData.tenureTitle !== 'leasehold'} className={errors.expiryDate ? 'error' : ''}>
                <option value="">DD</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
              </select>
              <select name="expiryMonth" value={formData.expiryMonth} onChange={handleChange} style={{width: '70px'}} disabled={formData.tenureTitle !== 'leasehold'} className={errors.expiryDate ? 'error' : ''}>
                <option value="">MM</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
              </select>
              <select name="expiryYear" value={formData.expiryYear} onChange={handleChange} style={{width: '90px'}} disabled={formData.tenureTitle !== 'leasehold'} className={errors.expiryDate ? 'error' : ''}>
                <option value="">YYYY</option>
                {Array.from({length: 100}, (_, i) => 2025 + i).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            {errors.expiryDate && <ErrorMessage error={errors.expiryDate} />}
            {formData.tenureTitle === 'leasehold' && !errors.expiryDate && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#e7f3ff',
                border: '1px solid #2196F3',
                borderRadius: '4px',
                color: '#0d47a1',
                fontSize: '0.85rem'
              }}>
                ℹ️ Note: Leasehold properties must have at least 90 years remaining on the lease to be eligible for SSB.
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Build up area (in sq)</label>
            <input type="text" name="buildUpArea" value={formData.buildUpArea} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Land area (in sq)</label>
            <input type="text" name="landArea" value={formData.landArea} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Property encumbered (mortgages or other financial liabilities) *</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="propertyEncumbered" value="yes" checked={formData.propertyEncumbered === 'yes'} onChange={handleChange} /> Yes</label>
            <label className="radio-label"><input type="radio" name="propertyEncumbered" value="no" checked={formData.propertyEncumbered === 'no'} onChange={handleChange} /> No</label>
          </div>
          {errors.propertyEncumbered && <ErrorMessage error={errors.propertyEncumbered} />}
          {errors.propertyEncumberedWarning && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              color: '#856404',
              fontSize: '0.9rem'
            }}>
              ⚠️ {errors.propertyEncumberedWarning}
            </div>
          )}
          <div style={{marginTop: '0.5rem', opacity: formData.propertyEncumbered === 'yes' ? 1 : 0.5}}>
            <div className="form-group">
              <label>Name of Bank</label>
              <input 
                type="text" 
                name="propertyBankName" 
                value={formData.propertyBankName} 
                onChange={handleChange} 
                className={errors.propertyBankName ? 'error' : ''}
                disabled={formData.propertyEncumbered !== 'yes'}
                style={{cursor: formData.propertyEncumbered === 'yes' ? 'text' : 'not-allowed'}}
              />
              {errors.propertyBankName && <ErrorMessage error={errors.propertyBankName} />}
            </div>
            <div className="form-group">
              <label>Estimated Outstanding Balance</label>
              <input 
                type="text" 
                name="estOutstandingBalance" 
                value={formData.estOutstandingBalance} 
                onChange={handleChange} 
                className={errors.estOutstandingBalance ? 'error' : ''}
                disabled={formData.propertyEncumbered !== 'yes'}
                style={{cursor: formData.propertyEncumbered === 'yes' ? 'text' : 'not-allowed'}}
              />
              {errors.estOutstandingBalance && <ErrorMessage error={errors.estOutstandingBalance} />}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Fire & Home Insurance/Takaful policy</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="fireInsurance" value="inForce" checked={formData.fireInsurance === 'inForce'} onChange={handleChange} /> In force</label>
            <label className="radio-label"><input type="radio" name="fireInsurance" value="notAvailable" checked={formData.fireInsurance === 'notAvailable'} onChange={handleChange} /> Not Available</label>
          </div>
          <div className="form-row" style={{marginTop: '0.5rem', alignItems: 'flex-start'}}>
            <div style={{flex: 1, opacity: formData.fireInsurance === 'inForce' ? 1 : 0.5}}>
              <div className="form-group">
                <label>Insurance Company/Takaful Operator</label>
                <input 
                  type="text" 
                  name="insuranceCompany" 
                  value={formData.insuranceCompany} 
                  onChange={handleChange} 
                  disabled={formData.fireInsurance !== 'inForce'}
                  style={{cursor: formData.fireInsurance === 'inForce' ? 'text' : 'not-allowed'}}
                />
              </div>
              <div className="form-group">
                <label>Period Validity</label>
                <input 
                  type="text" 
                  name="periodValidity" 
                  value={formData.periodValidity} 
                  onChange={handleChange} 
                  disabled={formData.fireInsurance !== 'inForce'}
                  style={{cursor: formData.fireInsurance === 'inForce' ? 'text' : 'not-allowed'}}
                />
              </div>
            </div>
            {formData.fireInsurance === 'notAvailable' && (
              <div className="form-group" style={{flex: 1}}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#e7f3ff',
                  border: '2px solid #2196F3',
                  borderRadius: '8px',
                  color: '#1565c0',
                  fontSize: '0.95rem'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <span style={{fontSize: '1.2rem'}}>✓</span>
                    <strong>Insurance/Takaful Policy Purchase Agreement</strong>
                  </div>
                  <p style={{margin: 0, lineHeight: '1.5'}}>
                    The Insurance/Takaful Policy will be purchased by Cagamas and added to the loan/financing amount.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Renewal of Fire & Home Insurance/Takaful policy (In Future)</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="renewalFireInsurance" value="selfRenewal" checked={formData.renewalFireInsurance === 'selfRenewal'} onChange={handleChange} /> Self-renewal</label>
            <label className="radio-label"><input type="radio" name="renewalFireInsurance" value="cagamasRenew" checked={formData.renewalFireInsurance === 'cagamasRenew'} onChange={handleChange} /> To be renewed by Organization</label>
          </div>
        </div>
      </section>

      {/* Property Documents */}
      <section className="form-section" style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
        <h3 style={{marginTop: 0}}>Property Documents</h3>
        
        <DocumentUpload
          label="Grant / Title Deed"
          required
          documentData={formData.documents?.grantTitle}
          onUpload={(e) => handleFileUpload(e, 'grantTitle')}
          onDelete={() => handleFileDelete('grantTitle')}
          uploading={uploadProgress?.grantTitle}
          accept=".pdf,.jpg,.jpeg,.png"
          hint="Upload copy of Grant or Title Deed (Max 10MB)"
          error={errors.grantTitle}
        />

        <DocumentUpload
          label="Sale & Purchase Agreement / Deed of Assignment"
          required
          documentData={formData.documents?.saleAgreement}
          onUpload={(e) => handleFileUpload(e, 'saleAgreement')}
          onDelete={() => handleFileDelete('saleAgreement')}
          uploading={uploadProgress?.saleAgreement}
          accept=".pdf,.jpg,.jpeg,.png"
          hint="Upload Sale & Purchase Agreement or Deed of Assignment (Max 10MB)"
          error={errors.saleAgreement}
        />

        <DocumentUpload
          label="Valuation Report"
          required
          documentData={formData.documents?.valuationReport}
          onUpload={(e) => handleFileUpload(e, 'valuationReport')}
          onDelete={() => handleFileDelete('valuationReport')}
          uploading={uploadProgress?.valuationReport}
          accept=".pdf,.jpg,.jpeg,.png"
          hint="Upload property valuation report (Max 10MB)"
          error={errors.valuationReport}
        />

        <DocumentUpload
          label="Fire Insurance Policy"
          required
          documentData={formData.documents?.fireInsurance}
          onUpload={(e) => handleFileUpload(e, 'fireInsurance')}
          onDelete={() => handleFileDelete('fireInsurance')}
          uploading={uploadProgress?.fireInsurance}
          accept=".pdf,.jpg,.jpeg,.png"
          hint="Upload copy of fire insurance policy (Max 10MB)"
          error={errors.fireInsuranceDoc}
        />

        {formData.propertyEncumbered === 'yes' && (
          <DocumentUpload
            label="Property Loan Statement"
            required
            documentData={formData.documents?.propertyLoanStatement}
            onUpload={(e) => handleFileUpload(e, 'propertyLoanStatement')}
            onDelete={() => handleFileDelete('propertyLoanStatement')}
            uploading={uploadProgress?.propertyLoanStatement}
            accept=".pdf,.jpg,.jpeg,.png"
            hint="Upload property loan statement (Max 10MB)"
            error={errors.propertyLoanStatement}
          />
        )}
      </section>
    </div>
  )
}

// Step 4: Nominee(s) Details
function Step4Nominees({ formData, handleChange, errors = {}, editNomineeOnly = false, nomineeCount = 0 }) {
  const getNomineeMessage = () => {
    if (!editNomineeOnly) return null
    if (nomineeCount === 0) return '⚠️ You are adding your first nominee.'
    if (nomineeCount === 1) return '⚠️ You are updating Nominee 1. You can add another nominee.'
    if (nomineeCount === 2) return '⚠️ You are updating Nominee 1.'
  }

  return (
    <div className="step-container">
      <h2>Nominee Information</h2>
      {editNomineeOnly && (
        <div className="edit-nominee-notice">
          <p className="notice-text">{getNomineeMessage()}</p>
        </div>
      )}
      <p className="step-description">Provide details of your nominee(s) who will inherit the property</p>
      <ErrorSummary errors={errors} />
      
      <section className="form-section">
        <h3>Nominee 1 (Primary) *</h3>
        
        <div className="form-group">
          <label>Salutation</label>
          <select name="nominee1Salutation" value={formData.nominee1Salutation} onChange={handleChange}>
            <option value="">Select</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
          </select>
        </div>

        <div className="form-group">
          <label>Name as per NRIC *</label>
          <input 
            type="text" 
            name="nominee1Name" 
            value={formData.nominee1Name} 
            onChange={handleChange} 
            className={errors.nominee1Name ? 'error' : ''}
            required 
          />
          <ErrorMessage error={errors.nominee1Name} />
        </div>

        <div className="form-group">
          <label>NRIC No. *</label>
          <input 
            type="text" 
            name="nominee1Ic" 
            value={formData.nominee1Ic} 
            onChange={handleChange} 
            className={errors.nominee1Ic ? 'error' : ''}
            placeholder="Format: xxxxxx-xx-xxxx"
            required 
          />
          <small style={{color: '#666', fontSize: '0.85rem'}}>ℹ️ Birthdate and sex will be auto-filled from IC number</small>
          <ErrorMessage error={errors.nominee1Ic} />
        </div>

        <div className="form-group">
          <label>Date of Birth (DD/MM/YYYY) * <span style={{color: '#666', fontSize: '0.85rem'}}>(Auto-filled from IC)</span></label>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <select name="nominee1DobDay" value={formData.nominee1DobDay} onChange={handleChange} style={{width: '70px'}} required>
              <option value="">DD</option>
              {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
            </select>
            <select name="nominee1DobMonth" value={formData.nominee1DobMonth} onChange={handleChange} style={{width: '70px'}} required>
              <option value="">MM</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
            </select>
            <select name="nominee1DobYear" value={formData.nominee1DobYear} onChange={handleChange} style={{width: '90px'}} required>
              <option value="">YYYY</option>
              {Array.from({length: 100}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Sex * <span style={{color: '#666', fontSize: '0.85rem'}}>(Auto-filled from IC)</span></label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="nominee1Sex" value="Male" checked={formData.nominee1Sex === 'Male'} onChange={handleChange} required /> Male</label>
            <label className="radio-label"><input type="radio" name="nominee1Sex" value="Female" checked={formData.nominee1Sex === 'Female'} onChange={handleChange} /> Female</label>
          </div>
        </div>

        <div className="form-group">
          <label>Race</label>
          <select name="nominee1Race" value={formData.nominee1Race?.startsWith('Other:') ? 'Other' : formData.nominee1Race} onChange={(e) => {
            if (e.target.value === 'Other') {
              handleChange({target: {name: 'nominee1Race', value: 'Other:'}})
            } else {
              handleChange(e)
            }
          }}>
            <option value="">Select</option>
            <option value="Malay">Malay</option>
            <option value="Chinese">Chinese</option>
            <option value="Indian">Indian</option>
            <option value="Other">Other</option>
          </select>
          {formData.nominee1Race?.startsWith('Other:') && (
            <input
              type="text"
              name="nominee1Race"
              value={formData.nominee1Race.substring(6)}
              onChange={(e) => handleChange({target: {name: 'nominee1Race', value: 'Other:' + e.target.value}})}
              placeholder="Please specify"
              style={{marginTop: '0.5rem'}}
            />
          )}
        </div>

        <div className="form-group">
          <label className={`checkbox-label ${errors.nominee1Malaysian ? 'error' : ''}`}>
            <input type="checkbox" name="nominee1Malaysian" checked={formData.nominee1Malaysian} onChange={handleChange} required />
            <span>Malaysian *</span>
          </label>
          {errors.nominee1Malaysian && <ErrorMessage error={errors.nominee1Malaysian} />}
        </div>

        <div className="form-group">
          <label>Marital Status *</label>
          <select name="nominee1Marital" value={formData.nominee1Marital?.startsWith('Other:') ? 'Other' : formData.nominee1Marital} onChange={(e) => {
            if (e.target.value === 'Other') {
              handleChange({target: {name: 'nominee1Marital', value: 'Other:'}})
            } else {
              handleChange(e)
            }
          }} required>
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
            <option value="Other">Other</option>
          </select>
          {formData.nominee1Marital?.startsWith('Other:') && (
            <input
              type="text"
              name="nominee1Marital"
              value={formData.nominee1Marital.substring(6)}
              onChange={(e) => handleChange({target: {name: 'nominee1Marital', value: 'Other:' + e.target.value}})}
              placeholder="Please specify"
              style={{marginTop: '0.5rem'}}
            />
          )}
        </div>

        <div className="form-group">
          <label>Relationship to Applicant *</label>
          <input 
            type="text" 
            name="nominee1Relationship" 
            value={formData.nominee1Relationship} 
            onChange={handleChange} 
            className={errors.nominee1Relationship ? 'error' : ''}
            required 
          />
          <ErrorMessage error={errors.nominee1Relationship} />
        </div>

        <div className="form-group">
          <label>Address *</label>
          <textarea 
            name="nominee1Address" 
            value={formData.nominee1Address} 
            onChange={handleChange} 
            className={errors.nominee1Address ? 'error' : ''}
            rows="3"
            required 
          />
          <ErrorMessage error={errors.nominee1Address} />
        </div>

        <div className="form-group">
          <label>Postcode *</label>
          <input 
            type="text" 
            name="nominee1Postcode" 
            value={formData.nominee1Postcode} 
            onChange={handleChange} 
            className={errors.nominee1Postcode ? 'error' : ''}
            maxLength="5"
            required 
          />
          <ErrorMessage error={errors.nominee1Postcode} />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input 
            type="email" 
            name="nominee1Email" 
            value={formData.nominee1Email} 
            onChange={handleChange} 
            className={errors.nominee1Email ? 'error' : ''}
            required 
          />
          <ErrorMessage error={errors.nominee1Email} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Telephone No. (Residence) *</label>
            <input 
              type="tel" 
              name="nominee1ResidencePhone" 
              value={formData.nominee1ResidencePhone} 
              onChange={handleChange} 
              className={errors.nominee1ResidencePhone ? 'error' : ''}
              placeholder="xxx-xxxxxxx"
              required
            />
            <ErrorMessage error={errors.nominee1ResidencePhone} />
          </div>
          <div className="form-group">
            <label>Telephone No (H/P) *</label>
            <input 
              type="tel" 
              name="nominee1Telephone" 
              value={formData.nominee1Telephone} 
              onChange={handleChange} 
              className={errors.nominee1Telephone ? 'error' : ''}
              placeholder="xxx-xxxxxxx"
              required 
            />
            <ErrorMessage error={errors.nominee1Telephone} />
          </div>
        </div>
      </section>

      <div className="form-group">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            name="hasSecondNominee" 
            checked={formData.hasSecondNominee} 
            onChange={handleChange} 
          />
          <span>Add Second Nominee</span>
        </label>
      </div>

      {formData.hasSecondNominee && (
        <section className="form-section conditional-section">
          <h3>Nominee 2 (Secondary) *</h3>
          
          <div className="form-group">
            <label>Salutation</label>
            <select name="nominee2Salutation" value={formData.nominee2Salutation} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
            </select>
          </div>

          <div className="form-group">
            <label>Name as per NRIC *</label>
            <input 
              type="text" 
              name="nominee2Name" 
              value={formData.nominee2Name} 
              onChange={handleChange} 
              className={errors.nominee2Name ? 'error' : ''}
              required 
            />
            <ErrorMessage error={errors.nominee2Name} />
          </div>

          <div className="form-group">
            <label>NRIC No. *</label>
            <input 
              type="text" 
              name="nominee2Ic" 
              value={formData.nominee2Ic} 
              onChange={handleChange} 
              className={errors.nominee2Ic ? 'error' : ''}
              placeholder="Format: xxxxxx-xx-xxxx"
              required 
            />
            <small style={{color: '#666', fontSize: '0.85rem'}}>ℹ️ Birthdate and sex will be auto-filled from IC number</small>
            <ErrorMessage error={errors.nominee2Ic} />
          </div>

          <div className="form-group">
            <label>Date of Birth (DD/MM/YYYY) * <span style={{color: '#666', fontSize: '0.85rem'}}>(Auto-filled from IC)</span></label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select name="nominee2DobDay" value={formData.nominee2DobDay} onChange={handleChange} style={{width: '70px'}} required>
                <option value="">DD</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
              </select>
              <select name="nominee2DobMonth" value={formData.nominee2DobMonth} onChange={handleChange} style={{width: '70px'}} required>
                <option value="">MM</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
              </select>
              <select name="nominee2DobYear" value={formData.nominee2DobYear} onChange={handleChange} style={{width: '90px'}} required>
                <option value="">YYYY</option>
                {Array.from({length: 100}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Sex * <span style={{color: '#666', fontSize: '0.85rem'}}>(Auto-filled from IC)</span></label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="nominee2Sex" value="Male" checked={formData.nominee2Sex === 'Male'} onChange={handleChange} required /> Male</label>
              <label className="radio-label"><input type="radio" name="nominee2Sex" value="Female" checked={formData.nominee2Sex === 'Female'} onChange={handleChange} /> Female</label>
            </div>
          </div>

          <div className="form-group">
            <label>Race</label>
            <select name="nominee2Race" value={formData.nominee2Race?.startsWith('Other:') ? 'Other' : formData.nominee2Race} onChange={(e) => {
              if (e.target.value === 'Other') {
                handleChange({target: {name: 'nominee2Race', value: 'Other:'}})
              } else {
                handleChange(e)
              }
            }}>
              <option value="">Select</option>
              <option value="Malay">Malay</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Other">Other</option>
            </select>
            {formData.nominee2Race?.startsWith('Other:') && (
              <input
                type="text"
                name="nominee2Race"
                value={formData.nominee2Race.substring(6)}
                onChange={(e) => handleChange({target: {name: 'nominee2Race', value: 'Other:' + e.target.value}})}
                placeholder="Please specify"
                style={{marginTop: '0.5rem'}}
              />
            )}
          </div>

          <div className="form-group">
            <label className={`checkbox-label ${errors.nominee2Malaysian ? 'error' : ''}`}>
              <input type="checkbox" name="nominee2Malaysian" checked={formData.nominee2Malaysian} onChange={handleChange} required />
              <span>Malaysian *</span>
            </label>
            {errors.nominee2Malaysian && <ErrorMessage error={errors.nominee2Malaysian} />}
          </div>

          <div className="form-group">
            <label>Marital Status *</label>
            <select name="nominee2Marital" value={formData.nominee2Marital?.startsWith('Other:') ? 'Other' : formData.nominee2Marital} onChange={(e) => {
              if (e.target.value === 'Other') {
                handleChange({target: {name: 'nominee2Marital', value: 'Other:'}})
              } else {
                handleChange(e)
              }
            }} required>
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Other">Other</option>
            </select>
            {formData.nominee2Marital?.startsWith('Other:') && (
              <input
                type="text"
                name="nominee2Marital"
                value={formData.nominee2Marital.substring(6)}
                onChange={(e) => handleChange({target: {name: 'nominee2Marital', value: 'Other:' + e.target.value}})}
                placeholder="Please specify"
                style={{marginTop: '0.5rem'}}
              />
            )}
          </div>

          <div className="form-group">
            <label>Relationship to Applicant *</label>
            <input 
              type="text" 
              name="nominee2Relationship" 
              value={formData.nominee2Relationship} 
              onChange={handleChange} 
              className={errors.nominee2Relationship ? 'error' : ''}
              required 
            />
            <ErrorMessage error={errors.nominee2Relationship} />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea 
              name="nominee2Address" 
              value={formData.nominee2Address} 
              onChange={handleChange} 
              className={errors.nominee2Address ? 'error' : ''}
              rows="3"
              required 
            />
            <ErrorMessage error={errors.nominee2Address} />
          </div>

          <div className="form-group">
            <label>Postcode *</label>
            <input 
              type="text" 
              name="nominee2Postcode" 
              value={formData.nominee2Postcode} 
              onChange={handleChange} 
              className={errors.nominee2Postcode ? 'error' : ''}
              maxLength="5"
              required 
            />
            <ErrorMessage error={errors.nominee2Postcode} />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input 
              type="email" 
              name="nominee2Email" 
              value={formData.nominee2Email} 
              onChange={handleChange} 
              className={errors.nominee2Email ? 'error' : ''}
              required 
            />
            <ErrorMessage error={errors.nominee2Email} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Telephone No. (Residence) *</label>
              <input 
                type="tel" 
                name="nominee2ResidencePhone" 
                value={formData.nominee2ResidencePhone} 
                onChange={handleChange} 
                className={errors.nominee2ResidencePhone ? 'error' : ''}
                placeholder="xxx-xxxxxxx"
                required
              />
              <ErrorMessage error={errors.nominee2ResidencePhone} />
            </div>
            <div className="form-group">
              <label>Telephone No (H/P) *</label>
              <input 
                type="tel" 
                name="nominee2Telephone" 
                value={formData.nominee2Telephone} 
                onChange={handleChange} 
                className={errors.nominee2Telephone ? 'error' : ''}
                placeholder="xxx-xxxxxxx"
                required 
              />
              <ErrorMessage error={errors.nominee2Telephone} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// Step 5: Privacy & Declaration
function Step5InfoDisplay({ formData, handleChange, errors = {} }) {
  const handleSignatureChange = (field) => (value) => {
    handleChange({ target: { name: field, value } })
  }

  return (
    <div className="step-container info-display-container">
      <h2>Privacy, Supporting Documents & Declaration</h2>
      <p className="step-description">Please read the following information carefully.</p>

      {/* Privacy Statement */}
      <div className="info-section">
        <h3>Privacy Statement & Consent</h3>
        <div className="info-content">
          <p>
            By submitting this Form, I/we hereby agree that <strong>Organization (Company Name)</strong> may collect, use, obtain, disclose, store and process Personal Data that are provided in this form and/or otherwise provided by me/us or possessed by Organization, for one or more of the purposes as stated in Organizations' Privacy Statement, which in summary includes but not limited to the following:
          </p>
          
          <ul className="info-list">
            <li>(a) processing my/our application for and providing me/us with the services and products of Organization as well as services and products by external providers provided through Organization;</li>
            <li>(b) administering and/or managing my/our relationship with Organization and</li>
            <li>(c) receiving updates, news, promotional and marketing mails or materials from Organization, business partners and related companies may be offering and which Organization believes may be of interest or benefit to me/us ("Marketing Messages") by way of postal mail and/or electronic transmission to my/our email address(es), (collectively the "Purposes").</li>
          </ul>

          <h4>Opt Out for subclause (c)</h4>
          <p>
            Please be informed that you have the right to opt out of receiving Marketing Messages. Kindly visit [insert opt-out contact/method] for further details on how you may exercise your right to opt out of receiving Marketing Messages.
          </p>

          <p><strong>I/We hereby give my/our consent(s) to Organization (Company Name) to:</strong></p>
          <ul className="info-list">
            <li>Collect, use, obtain, store and process Personal Data provided by me/us</li>
            <li>Disclose the Personal Data to Organizations' third party service providers or agents (including its lawyers/law firms), which may be sited outside of Malaysia</li>
            <li>Transfer Personal Data to any company within the Organization group of companies which may involve data processing</li>
          </ul>

          <p className="info-disclaimer">
            For the avoidance of doubt, Personal Data includes all data defined within the Personal Data Protection Act 2010 including all data Applicant(s) had disclosed to Organization in this Form and/or otherwise provided by Applicant(s) or possessed by Organization.
          </p>
        </div>
      </div>

      {/* Supporting Documents */}
      <div className="info-section">
        <h3>Supporting Documents Submitted</h3>
        <div className="info-content">
          <p><strong>I have confirmed the submission of the following documents:</strong></p>
          <ul className="info-list">
            <li>Copy of NRIC (Applicant & Joint Applicant)</li>
            <li>Copy of Birth Certificate / Marriage Certificate (if applicable)</li>
            <li>Latest 3 months payslip</li>
            <li>Latest 6 months bank statement</li>
            <li>Latest EPF statement</li>
            <li>Copy of Grant / Title Deed</li>
            <li>Copy of Sale & Purchase Agreement / Deed of Assignment</li>
            <li>Valuation Report</li>
            <li>Copy of Fire Insurance Policy</li>
            <li>Property Loan Statement (if property is encumbered)</li>
          </ul>
        </div>
      </div>

      {/* Declaration */}
      <div className="info-section">
        <h3>Declaration & Acknowledgement</h3>
        <div className="info-content">
          <p><strong>I/We hereby declare and confirm that:</strong></p>
          <ul className="info-list">
            <li>All information provided in this application form is true, accurate and complete</li>
            <li>I/We have read and understood all terms and conditions</li>
            <li>I/We acknowledge that Organization has the right to reject this application without providing any reason</li>
            <li>I/We agree to provide any additional information or documents as may be required by Organization</li>
            <li>I/We understand that providing false information may result in rejection of this application</li>
          </ul>

          <p className="info-disclaimer">
            <strong>I/We hereby acknowledged that the information provided above is true and valid and that I/we have read and understood all of the above provisions, including Organization' Privacy Statement.</strong>
          </p>

          <p className="info-disclaimer">
            In the event that I/we do not proceed with my/our application herein, I/we agree to reimburse Organization for any costs, expenses and charges incurred on my/our behalf pursuant to my/our application herein.
          </p>
        </div>
      </div>

      {/* Signature Section */}
      <div className="info-section">
        <h3>Signatures</h3>
        <div className="signature-grid">
          {/* Applicant Signature */}
          <div className="signature-column">
            <h4>Applicant</h4>
            <SignaturePad
              label="Signed by Applicant *"
              value={formData.applicant_signature}
              onChange={handleSignatureChange('applicant_signature')}
            />
            <ErrorMessage error={errors.applicant_signature} />
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="applicant_signature_name"
                value={formData.applicant_signature_name}
                readOnly
                style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                placeholder="Full name"
                required
                className={errors.applicant_signature_name ? 'error' : ''}
              />
              <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from applicant name</small>
              <ErrorMessage error={errors.applicant_signature_name} />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="text"
                name="applicant_signature_date"
                value={formData.applicant_signature_date}
                readOnly
                style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                required
                className={errors.applicant_signature_date ? 'error' : ''}
              />
              <small style={{color: '#666', fontSize: '0.85rem'}}>Current date (auto-filled)</small>
              <ErrorMessage error={errors.applicant_signature_date} />
            </div>
          </div>

          {/* Joint Applicant Signature */}
          <div 
            className="signature-column"
            style={{
              opacity: formData.isJointApplicant ? 1 : 0.5,
              pointerEvents: formData.isJointApplicant ? 'auto' : 'none'
            }}
          >
            <h4>Joint Applicant</h4>
            <SignaturePad
              label={formData.isJointApplicant ? "Signed by Joint Applicant *" : "Signed by Joint Applicant"}
              value={formData.jApplicant_signature}
              onChange={handleSignatureChange('jApplicant_signature')}
            />
            <ErrorMessage error={errors.jApplicant_signature} />
            <div className="form-group">
              <label>{formData.isJointApplicant ? "Name *" : "Name"}</label>
              <input
                type="text"
                name="jApplicant_signature_name"
                value={formData.jApplicant_signature_name}
                readOnly
                style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                placeholder="Full name"
                disabled={!formData.isJointApplicant}
                required={formData.isJointApplicant}
                className={errors.jApplicant_signature_name ? 'error' : ''}
              />
              {formData.isJointApplicant && <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from joint applicant name</small>}
              <ErrorMessage error={errors.jApplicant_signature_name} />
            </div>
            <div className="form-group">
              <label>{formData.isJointApplicant ? "Date *" : "Date"}</label>
              <input
                type="text"
                name="jApplicant_signature_date"
                value={formData.jApplicant_signature_date}
                readOnly
                style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                disabled={!formData.isJointApplicant}
                required={formData.isJointApplicant}
                className={errors.jApplicant_signature_date ? 'error' : ''}
              />
              {formData.isJointApplicant && <small style={{color: '#666', fontSize: '0.85rem'}}>Current date (auto-filled)</small>}
              <ErrorMessage error={errors.jApplicant_signature_date} />
            </div>
          </div>
        </div>
      </div>

      <div className="confidential-notice">
        <p>Strictly Confidential | OPE/SSB/FRM/001/v12</p>
      </div>
    </div>
  );
}

function Step6Acknowledgement({ formData, handleChange, errors = {} }) {
  const handleSignatureChange = (field) => (value) => {
    handleChange({ target: { name: field, value } })
  }

  return (
    <div className="step-container">
      <h2>Acknowledgement Form</h2>
      <p className="step-description">To be completed by Nominee(s) - Review information and sign</p>
      <ErrorSummary errors={errors} />
      
      <section className="form-section">
        <div className="info-box" style={{padding: '1.5rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1.5rem'}}>
          <p><strong>ACKNOWLEDGEMENT BY NOMINEE</strong></p>
          <p style={{marginTop: '0.5rem'}}>I hereby acknowledge that:</p>
          <ol style={{marginLeft: '1.5rem', marginTop: '0.5rem'}}>
            <li>I have been nominated by the applicant(s) as a beneficiary under the Skim Saraan Bercagar (SSB)</li>
            <li>I understand my rights and obligations as a nominee</li>
            <li>I agree to accept the nomination</li>
            <li>I consent to the collection, use, and processing of my personal data by Organization</li>
            <li>I understand that the property will be transferred to me/us upon fulfillment of loan obligations</li>
          </ol>
        </div>

        <h3>Nominee Information (Auto-filled)</h3>
        
        <div className="form-group">
          <label>Nominee Name (as per NRIC) *</label>
          <input 
            type="text" 
            name="ack_nomineeName" 
            value={formData.ack_nomineeName} 
            readOnly
            style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
            className={errors.ack_nomineeName ? 'error' : ''}
            required 
          />
          <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from Nominee 1 information</small>
          <ErrorMessage error={errors.ack_nomineeName} />
        </div>

        <div className="form-group">
          <label>Nominee NRIC No. *</label>
          <input 
            type="text" 
            name="ack_nomineeNRIC" 
            value={formData.ack_nomineeNRIC} 
            readOnly
            style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
            className={errors.ack_nomineeNRIC ? 'error' : ''}
            placeholder="Format: xxxxxx-xx-xxxx"
            required 
          />
          <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from Nominee 1 information</small>
          <ErrorMessage error={errors.ack_nomineeNRIC} />
        </div>

        <div className="form-group">
          <label>Nominee Address *</label>
          <textarea 
            name="ack_nomineeAddress" 
            value={formData.ack_nomineeAddress} 
            readOnly
            style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
            className={errors.ack_nomineeAddress ? 'error' : ''}
            rows="3"
            required 
          />
          <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from Nominee 1 information</small>
          <ErrorMessage error={errors.ack_nomineeAddress} />
        </div>

        <h3 style={{marginTop: '2rem'}}>Applicant Information (Auto-filled)</h3>
        
        <div className="form-group">
          <label>Applicant Name *</label>
          <input 
            type="text" 
            name="ack_applicantName" 
            value={formData.ack_applicantName} 
            readOnly
            style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
            className={errors.ack_applicantName ? 'error' : ''}
            required 
          />
          <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from Applicant information</small>
          <ErrorMessage error={errors.ack_applicantName} />
        </div>

        <div className="form-group">
          <label>Applicant NRIC No. *</label>
          <input 
            type="text" 
            name="ack_applicantNRIC" 
            value={formData.ack_applicantNRIC} 
            readOnly
            style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
            className={errors.ack_applicantNRIC ? 'error' : ''}
            placeholder="Format: xxxxxx-xx-xxxx"
            required 
          />
          <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from Applicant information</small>
          <ErrorMessage error={errors.ack_applicantNRIC} />
        </div>

        {formData.isJointApplicant && (
          <div className="conditional-group">
            <div className="form-group">
              <label>Joint Applicant Name *</label>
              <input 
                type="text" 
                name="ack_jointApplicantName" 
                value={formData.ack_jointApplicantName} 
                readOnly
                style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                className={errors.ack_jointApplicantName ? 'error' : ''}
                required 
              />
              <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from Joint Applicant information</small>
              <ErrorMessage error={errors.ack_jointApplicantName} />
            </div>

            <div className="form-group">
              <label>Joint Applicant NRIC No. *</label>
              <input 
                type="text" 
                name="ack_jointApplicantNRIC" 
                value={formData.ack_jointApplicantNRIC} 
                readOnly
                style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                className={errors.ack_jointApplicantNRIC ? 'error' : ''}
                placeholder="Format: xxxxxx-xx-xxxx"
                required 
              />
              <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from Joint Applicant information</small>
              <ErrorMessage error={errors.ack_jointApplicantNRIC} />
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Applicant Address *</label>
          <textarea 
            name="ack_applicantAddress" 
            value={formData.ack_applicantAddress} 
            readOnly
            style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
            className={errors.ack_applicantAddress ? 'error' : ''}
            rows="3"
            required 
          />
          <small style={{color: '#666', fontSize: '0.85rem'}}>Auto-filled from Applicant information</small>
          <ErrorMessage error={errors.ack_applicantAddress} />
        </div>

        <h3 style={{marginTop: '2rem'}}>Application Date (Auto-filled)</h3>
        
        <div className="form-group">
          <label>Application Date (DD/MM/YYYY) *</label>
          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <input 
              type="text" 
              value={formData.ack_applicationDay} 
              readOnly
              style={{width: '70px', backgroundColor: '#f5f5f5', cursor: 'not-allowed', textAlign: 'center'}}
            />
            <span>/</span>
            <input 
              type="text" 
              value={formData.ack_applicationMonth} 
              readOnly
              style={{width: '70px', backgroundColor: '#f5f5f5', cursor: 'not-allowed', textAlign: 'center'}}
            />
            <span>/</span>
            <input 
              type="text" 
              value={formData.ack_applicationYear} 
              readOnly
              style={{width: '90px', backgroundColor: '#f5f5f5', cursor: 'not-allowed', textAlign: 'center'}}
            />
          </div>
          <small style={{color: '#666', fontSize: '0.85rem'}}>Date of application submission (auto-filled)</small>
          <ErrorMessage error={errors.ack_applicationDate} />
        </div>

        <h3 style={{marginTop: '2rem'}}>Acknowledgement Date (Auto-filled)</h3>
        
        <div className="form-group">
          <label>Date (DD/MM/YYYY) *</label>
          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <input 
              type="text" 
              value={formData.ack_dateDay} 
              readOnly
              style={{width: '70px', backgroundColor: '#f5f5f5', cursor: 'not-allowed', textAlign: 'center'}}
            />
            <span>/</span>
            <input 
              type="text" 
              value={formData.ack_dateMonth} 
              readOnly
              style={{width: '70px', backgroundColor: '#f5f5f5', cursor: 'not-allowed', textAlign: 'center'}}
            />
            <span>/</span>
            <input 
              type="text" 
              value={formData.ack_dateYear} 
              readOnly
              style={{width: '90px', backgroundColor: '#f5f5f5', cursor: 'not-allowed', textAlign: 'center'}}
            />
          </div>
          <small style={{color: '#666', fontSize: '0.85rem'}}>Date of acknowledgement (auto-filled)</small>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              name="ack_nomineeConsent" 
              checked={formData.ack_nomineeConsent} 
              onChange={handleChange} 
              required
            />
            <span>I confirm that I have read and agree to the acknowledgement above *</span>
          </label>
          <ErrorMessage error={errors.ack_nomineeConsent} />
        </div>

        <div className="form-group">
          <SignaturePad
            label="Nominee Signature *"
            value={formData.ackNominee_signature}
            onChange={handleSignatureChange('ackNominee_signature')}
          />
          <ErrorMessage error={errors.ackNominee_signature} />
        </div>
      </section>

      <div className="info-box" style={{marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px'}}>
        <strong>Important:</strong> The nominee must complete this acknowledgement form. If the nominee is unable to sign digitally, a physical signature on the printed form will be required.
      </div>
    </div>
  )
}

// Step 7: Review & Submit
function Step7Review({ formData }) {
  const formatDate = (day, month, year) => {
    if (!day || !month || !year) return 'Not provided'
    return `${day}/${month}/${year}`
  }

  const getValue = (value) => {
    if (value === true) return 'Yes'
    if (value === false) return 'No'
    if (value === '' || value === undefined || value === null) return 'Not provided'
    return value
  }

  const formatCurrency = (value) => {
    if (!value) return 'Not provided'
    return `RM ${parseFloat(value).toLocaleString('en-MY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
  }

  // Get dependent ages as array
  const getDependentAges = () => {
    const ages = []
    if (formData.dependentAge1) ages.push(formData.dependentAge1)
    if (formData.dependentAge2) ages.push(formData.dependentAge2)
    if (formData.dependentAge3) ages.push(formData.dependentAge3)
    if (formData.dependentAge4) ages.push(formData.dependentAge4)
    if (formData.dependentAge5) ages.push(formData.dependentAge5)
    return ages.length > 0 ? ages.join(', ') : 'Not provided'
  }

  return (
    <div className="step-container review-container">
      <h2>Review Your Application</h2>
      <p className="step-description">Please review all information carefully before submitting. Use the "Back" button to make any corrections.</p>

      {/* STEP 1: PERSONAL INFORMATION */}
      <div className="review-section">
        <h3>Step 1: Personal Information</h3>
        
        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Basic Information</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Salutation:</strong> {getValue(formData.salutation)}</div>
          <div className="review-field"><strong>Full Name:</strong> {getValue(formData.nameAsPerNRIC)}</div>
          <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.nricNo)}</div>
          <div className="review-field"><strong>Date of Birth:</strong> {formatDate(formData.dobDay, formData.dobMonth, formData.dobYear)}</div>
          <div className="review-field"><strong>Sex:</strong> {getValue(formData.sex)}</div>
          <div className="review-field"><strong>Race:</strong> {getValue(formData.race)}</div>
          <div className="review-field"><strong>Malaysian Citizen:</strong> {getValue(formData.malaysian)}</div>
          <div className="review-field"><strong>Marital Status:</strong> {getValue(formData.maritalStatus)}</div>
        </div>

        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Contact Information</h4>
        <div className="review-field"><strong>Address:</strong> {getValue(formData.address)}</div>  
        <div className="review-field"><strong>Postcode:</strong> {getValue(formData.postcode)}</div>
        <div className="review-field"><strong>Email:</strong> {getValue(formData.email)}</div>
        <div className="review-grid">
          <div className="review-field"><strong>Residence Phone:</strong> {getValue(formData.residencePhone)}</div>
          <div className="review-field"><strong>Mobile Phone:</strong> {getValue(formData.telephone)}</div>
        </div>

        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Family & Housing</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Number of Dependents:</strong> {getValue(formData.numOfDependents)}</div>
          <div className="review-field"><strong>Present House Ownership:</strong> {getValue(formData.presentHouse)}</div>
        </div>
        {formData.numOfDependents && parseInt(formData.numOfDependents) > 0 && (
          <div className="review-field"><strong>Ages of Dependents:</strong> {getDependentAges()}</div>
        )}

        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Employment Details</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Occupation:</strong> {getValue(formData.occupation)}</div>
          <div className="review-field"><strong>Employer Name:</strong> {getValue(formData.employerName)}</div>
        </div>
        <div className="review-field"><strong>Employer Address:</strong> {getValue(formData.employerAddress)}</div>
        <div className="review-field"><strong>Employer Postcode:</strong> {getValue(formData.employerPostcode)}</div>

        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Application Preferences</h4>
        <div className="review-field"><strong>Purpose of Application:</strong> {getValue(formData.purposeOfApplication)}</div>
        <div className="review-field"><strong>How did you hear about SSB:</strong> {getValue(formData.howDidYouKnow)}</div>
        <div className="review-field"><strong>Preferred Scheme:</strong> {getValue(formData.preferredScheme)}</div>
        <div className="review-grid">
          <div className="review-field"><strong>Payout Option:</strong> {getValue(formData.payoutOption)}</div>
          {formData.payoutOption === 'monthlyPayout_lumpSum' && (
            <div className="review-field"><strong>Lump Sum Usage:</strong> {getValue(formData.lumpSumUsage)}</div>
          )}
          <div className="review-field"><strong>Payment Option:</strong> {getValue(formData.paymentOption)}</div>
        </div>
      </div>

      {/* STEP 2: JOINT APPLICANT */}
      {formData.isJointApplicant && (
        <div className="review-section">
          <h3>Step 2: Joint Applicant Information</h3>
          
          <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Basic Information</h4>
          <div className="review-grid">
            <div className="review-field"><strong>Salutation:</strong> {getValue(formData.jSalutation)}</div>
            <div className="review-field"><strong>Full Name (as per NRIC):</strong> {getValue(formData.jName)}</div>
            <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.jIc)}</div>
            <div className="review-field"><strong>Date of Birth:</strong> {formatDate(formData.jDobDay, formData.jDobMonth, formData.jDobYear)}</div>
            <div className="review-field"><strong>Sex:</strong> {getValue(formData.jSex)}</div>
            <div className="review-field"><strong>Race:</strong> {getValue(formData.jRace)}</div>
            <div className="review-field"><strong>Malaysian Citizen:</strong> {getValue(formData.jMalaysian)}</div>
            <div className="review-field"><strong>Marital Status:</strong> {getValue(formData.jMarital)}</div>
            <div className="review-field"><strong>Relationship to Applicant:</strong> {getValue(formData.jRelationship)}</div>
          </div>

          <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Contact Information</h4>
          <div className="review-field"><strong>Address:</strong> {getValue(formData.jAddress)}</div>
          <div className="review-field"><strong>Postcode:</strong> {getValue(formData.jPostcode)}</div>
          <div className="review-grid">
            <div className="review-field"><strong>Email:</strong> {getValue(formData.jEmail)}</div>
            <div className="review-field"><strong>Residence Phone:</strong> {getValue(formData.jResidencePhone)}</div>
            <div className="review-field"><strong>Mobile Phone:</strong> {getValue(formData.jTelephone)}</div>
          </div>

          <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Employment Details</h4>
          <div className="review-grid">
            <div className="review-field"><strong>Occupation:</strong> {getValue(formData.jOccupation)}</div>
            <div className="review-field"><strong>Employer Name:</strong> {getValue(formData.jEmployerName)}</div>
          </div>
          <div className="review-field"><strong>Employer Address:</strong> {getValue(formData.jEmployerAddress)}</div>
          <div className="review-field"><strong>Employer Postcode:</strong> {getValue(formData.jEmployerPostcode)}</div>

          <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Banking Information</h4>
          <div className="review-grid">
            <div className="review-field"><strong>Bank Name:</strong> {getValue(formData.bankName)}</div>
            <div className="review-field"><strong>Account Type:</strong> {getValue(formData.accountType)}</div>
            <div className="review-field"><strong>Account Number:</strong> {getValue(formData.accountNumber)}</div>
            <div className="review-field"><strong>Account Preference:</strong> {getValue(formData.accountPreference)}</div>
          </div>
        </div>
      )}

      {/* Banking for non-joint applicants */}
      {!formData.isJointApplicant && (
        <div className="review-section">
          <h3>Step 2: Banking Information</h3>
          <div className="review-grid">
            <div className="review-field"><strong>Bank Name:</strong> {getValue(formData.bankName)}</div>
            <div className="review-field"><strong>Account Type:</strong> {getValue(formData.accountType)}</div>
            <div className="review-field"><strong>Account Number:</strong> {getValue(formData.accountNumber)}</div>
            <div className="review-field"><strong>Account Preference:</strong> {getValue(formData.accountPreference)}</div>
          </div>
        </div>
      )}

      {/* STEP 3: PROPERTY INFORMATION */}
      <div className="review-section">
        <h3>Step 3: Property Information</h3>
        
        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Property Details</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Property Type:</strong> {getValue(formData.propertyType)}</div>
          <div className="review-field"><strong>Tenure/Title:</strong> {getValue(formData.tenureTitle)}</div>
        </div>
        {formData.tenureTitle === 'Leasehold' && (
          <div className="review-field"><strong>Lease Expiry Date:</strong> {formatDate(formData.expiryDay, formData.expiryMonth, formData.expiryYear)}</div>
        )}
        <div className="review-field"><strong>Property Address:</strong> {getValue(formData.propertyAddress)}</div>
        <div className="review-field"><strong>Postcode:</strong> {getValue(formData.propertyPostcode)}</div>

        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Property Measurements</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Land Area:</strong> {getValue(formData.landArea)} {formData.landArea ? 'sq ft' : ''}</div>
          <div className="review-field"><strong>Built-up Area:</strong> {getValue(formData.buildUpArea)} {formData.buildUpArea ? 'sq ft' : ''}</div>
        </div>

        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Valuation & Purchase</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Indicative Market Value:</strong> {formatCurrency(formData.indicativeMarketValue)}</div>
          <div className="review-field"><strong>Valuation Date:</strong> {formatDate(formData.valuationDay, formData.valuationMonth, formData.valuationYear)}</div>
          <div className="review-field"><strong>Expected Market Value:</strong> {formatCurrency(formData.expectedMarketValue)}</div>
          <div className="review-field"><strong>Purchase Price:</strong> {formatCurrency(formData.purchasePrice)}</div>
          <div className="review-field"><strong>Purchase Date:</strong> {formatDate(formData.purchaseDay, formData.purchaseMonth, formData.purchaseYear)}</div>
        </div>

        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Property Financing</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Property Encumbered:</strong> {getValue(formData.propertyEncumbered)}</div>
          {formData.propertyEncumbered === 'Yes' && (
            <>
              <div className="review-field"><strong>Bank/Financial Institution:</strong> {getValue(formData.propertyBankName)}</div>
              <div className="review-field"><strong>Est. Outstanding Balance:</strong> {formatCurrency(formData.estOutstandingBalance)}</div>
            </>
          )}
        </div>

        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Fire Insurance</h4>
        <div className="review-field"><strong>Fire Insurance Status:</strong> {getValue(formData.fireInsurance)}</div>
        {formData.fireInsurance === 'inForce' && (
          <div className="review-grid">
            <div className="review-field"><strong>Insurance Company:</strong> {getValue(formData.insuranceCompany)}</div>
            <div className="review-field"><strong>Period of Validity:</strong> {getValue(formData.periodValidity)}</div>
          </div>
        )}
        {formData.fireInsurance === 'notAvailable' && (
          <div className="review-field"><strong>Insurance to be purchased by Organization:</strong> Yes (to be added to loan amount)</div>
        )}
        <div className="review-field"><strong>Renewal Status:</strong> {getValue(formData.renewalFireInsurance)}</div>
      </div>

      {/* STEP 4: NOMINEE INFORMATION */}
      <div className="review-section">
        <h3>Step 4: Nominee Information</h3>
        
        <h4 style={{color: '#2196f3', marginTop: '1rem', marginBottom: '0.5rem'}}>Nominee 1 (Primary)</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Salutation:</strong> {getValue(formData.nominee1Salutation)}</div>
          <div className="review-field"><strong>Full Name:</strong> {getValue(formData.nominee1Name)}</div>
          <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.nominee1Ic)}</div>
          <div className="review-field"><strong>Date of Birth:</strong> {formatDate(formData.nominee1DobDay, formData.nominee1DobMonth, formData.nominee1DobYear)}</div>
          <div className="review-field"><strong>Sex:</strong> {getValue(formData.nominee1Sex)}</div>
          <div className="review-field"><strong>Race:</strong> {getValue(formData.nominee1Race)}</div>
          <div className="review-field"><strong>Malaysian Citizen:</strong> {getValue(formData.nominee1Malaysian)}</div>
          <div className="review-field"><strong>Marital Status:</strong> {getValue(formData.nominee1Marital)}</div>
          <div className="review-field"><strong>Relationship to Applicant:</strong> {getValue(formData.nominee1Relationship)}</div>
        </div>
        <div className="review-field"><strong>Address:</strong> {getValue(formData.nominee1Address)}</div>
        <div className="review-field"><strong>Postcode:</strong> {getValue(formData.nominee1Postcode)}</div>
        <div className="review-field"><strong>Email:</strong> {getValue(formData.nominee1Email)}</div>

        <div className="review-grid">
          <div className="review-field"><strong>Residence Phone:</strong> {getValue(formData.nominee1ResidencePhone)}</div>
          <div className="review-field"><strong>Mobile Phone:</strong> {getValue(formData.nominee1Telephone)}</div>
        </div>

        {formData.hasSecondNominee && (
          <>
            <h4 style={{color: '#2196f3', marginTop: '1.5rem', marginBottom: '0.5rem'}}>Nominee 2 (Secondary)</h4>
            <div className="review-grid">
              <div className="review-field"><strong>Salutation:</strong> {getValue(formData.nominee2Salutation)}</div>
              <div className="review-field"><strong>Full Name:</strong> {getValue(formData.nominee2Name)}</div>
              <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.nominee2Ic)}</div>
              <div className="review-field"><strong>Date of Birth:</strong> {formatDate(formData.nominee2DobDay, formData.nominee2DobMonth, formData.nominee2DobYear)}</div>
              <div className="review-field"><strong>Sex:</strong> {getValue(formData.nominee2Sex)}</div>
              <div className="review-field"><strong>Race:</strong> {getValue(formData.nominee2Race)}</div>
              <div className="review-field"><strong>Malaysian Citizen:</strong> {getValue(formData.nominee2Malaysian)}</div>
              <div className="review-field"><strong>Marital Status:</strong> {getValue(formData.nominee2Marital)}</div>
              <div className="review-field"><strong>Relationship to Applicant:</strong> {getValue(formData.nominee2Relationship)}</div>
            </div>
            <div className="review-field"><strong>Address:</strong> {getValue(formData.nominee2Address)}</div>
            <div className="review-field"><strong>Postcode:</strong> {getValue(formData.nominee2Postcode)}</div>
            <div className="review-grid">
              <div className="review-field"><strong>Email:</strong> {getValue(formData.nominee2Email)}</div>
              <div className="review-field"><strong>Residence Phone:</strong> {getValue(formData.nominee2ResidencePhone)}</div>
              <div className="review-field"><strong>Mobile Phone:</strong> {getValue(formData.nominee2Telephone)}</div>
            </div>
          </>
        )}
      </div>

      <div className="info-box" style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#e3f2fd', border: '2px solid #2196f3', borderRadius: '4px'}}>
        <h4 style={{marginTop: 0, color: '#1976d2'}}>✓ Ready to Submit?</h4>
        <p>Click the <strong>"Submit"</strong> button below to:</p>
        <ol style={{marginLeft: '1.5rem', marginTop: '0.5rem'}}>
          <li>Generate a filled PDF of your SSB Application Form</li>
          <li>Download the PDF automatically to your device</li>
          <li>Submit your application to e-Rumah</li>
        </ol>
        <p style={{marginTop: '1rem', marginBottom: 0, color: '#f57c00'}}><strong>⚠ Important:</strong> Review all information carefully. If you find any errors, use the "Back" button to return to the relevant step and make corrections before submitting.</p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN VIEW COMPONENT
// ============================================================================

export default function ApplicationFormView({
  currentStep,
  totalSteps,
  formData,
  errors,
  handleChange,
  handleNext,
  handleBack,
  handleSubmit,
  isLoading = false,
  isSaving = false,
  isSubmitting = false,
  handleFileUpload,
  handleFileDelete,
  uploadProgress,
  readOnlyMode = false,
  editNomineeOnly = false,
  nomineeCount = 0
}) {
  // Force step 4 if in editNomineeOnly mode
  const displayStep = editNomineeOnly ? 4 : currentStep
  
  const renderStep = () => {
    switch (displayStep) {
      case 1:
        return <Step1PersonalInfo formData={formData} handleChange={handleChange} errors={errors} handleFileUpload={handleFileUpload} handleFileDelete={handleFileDelete} uploadProgress={uploadProgress} disabled={readOnlyMode || editNomineeOnly} />
      case 2:
        return <Step2JointApplicant formData={formData} handleChange={handleChange} errors={errors} disabled={readOnlyMode || editNomineeOnly} />
      case 3:
        return <Step3PropertyDetails formData={formData} handleChange={handleChange} errors={errors} handleFileUpload={handleFileUpload} handleFileDelete={handleFileDelete} uploadProgress={uploadProgress} disabled={readOnlyMode || editNomineeOnly} />
      case 4:
        return <Step4Nominees formData={formData} handleChange={handleChange} errors={errors} editNomineeOnly={editNomineeOnly} nomineeCount={nomineeCount} />
      case 5:
        return <Step5InfoDisplay formData={formData} handleChange={handleChange} errors={errors} disabled={readOnlyMode || editNomineeOnly} />
      case 6:
        return <Step6Acknowledgement formData={formData} handleChange={handleChange} errors={errors} disabled={readOnlyMode || editNomineeOnly} />
      case 7:
        return <Step7Review formData={formData} />
      default:
        return <Step1PersonalInfo formData={formData} handleChange={handleChange} errors={errors} />
    }
  }

  if (isLoading) {
    return (
      <div className="application-form">
        <div className="app-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div className="loading-spinner"></div>
            <p>Loading your application...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="application-form">
      <div className="app-container">
        <h1>{editNomineeOnly ? 'Nominate New Nominee' : 'SKIM SARAAN BERCAGAR (SSB) Application Form'}</h1>
        {isSaving && (
          <div style={{ 
            position: 'fixed', 
            top: '70px', 
            right: '20px', 
            background: '#4CAF50', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '5px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}>
            💾 Saving...
          </div>
        )}
        <div className="wizard-container">
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isLastStep={currentStep === totalSteps}
            isSubmitting={isSubmitting}
            editNomineeOnly={editNomineeOnly}
            nomineeCount={nomineeCount}
          />
          {renderStep()}
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isLastStep={currentStep === totalSteps}
            isSubmitting={isSubmitting}
            editNomineeOnly={editNomineeOnly}
            nomineeCount={nomineeCount}
          />
        </div>
      </div>
    </div>
  )
}
