// Application Form View - Pure Presentational Component
// Receives all props from ApplicationController
// NO business logic - only UI rendering
// NO imports from other views allowed!

import { useRef, useEffect } from 'react'
import '../components/application/applicationForm.css'

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
function WizardNavigation({ currentStep, totalSteps, onNext, onBack, onSubmit, isLastStep }) {
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

  return (
    <div className="wizard-navigation">
      <div className="wizard-header">
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="step-indicator">
          <span className="step-number">Step {currentStep} of {totalSteps}</span>
          <span className="step-title">{stepTitles[currentStep - 1]}</span>
        </div>
      </div>
      
      <div className="wizard-buttons">
        {currentStep > 1 && (
          <button type="button" className="wizard-btn wizard-btn-back" onClick={onBack}>
            ← Back
          </button>
        )}
        {!isLastStep ? (
          <button type="button" className="wizard-btn wizard-btn-next" onClick={onNext}>
            Next →
          </button>
        ) : (
          <button type="button" className="wizard-btn wizard-btn-submit" onClick={onSubmit}>
            Generate PDF
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// STEP COMPONENTS (All inline - no separate files)
// ============================================================================

// Step 1: Personal Information
function Step1PersonalInfo({ formData, handleChange, errors = {} }) {
  return (
    <div className="step-container">
      <h2>Personal Information</h2>
      <p className="step-description">Please provide your personal details as per your NRIC.</p>
      
      <ErrorSummary errors={errors} />

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
        <label>Which one you prefer? *</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="preferredScheme"
              value="conventional"
              checked={formData.preferredScheme === 'conventional'}
              onChange={handleChange}
              required
            />
            Conventional (SSB)
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="preferredScheme"
              value="islamic"
              checked={formData.preferredScheme === 'islamic'}
              onChange={handleChange}
            />
            Islamic (SSB-i)
          </label>
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
        <ErrorMessage error={errors.nricNo} />
      </div>

      <div className="form-group">
        <label>Date of Birth (DD/MM/YYYY) *</label>
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
        <label>Sex *</label>
        <div className="radio-group">
          <label className="radio-label"><input type="radio" name="sex" value="male" checked={formData.sex === 'male'} onChange={handleChange} required /> Male</label>
          <label className="radio-label"><input type="radio" name="sex" value="female" checked={formData.sex === 'female'} onChange={handleChange} /> Female</label>
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
        <label className="checkbox-label">
          <input type="checkbox" name="malaysian" checked={formData.malaysian} onChange={handleChange} />
          <span>Malaysian</span>
        </label>
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
          <label>Telephone No. (Residence)</label>
          <input 
            type="tel" 
            name="residencePhone" 
            value={formData.residencePhone} 
            onChange={handleChange} 
            className={errors.residencePhone || errors.phone ? 'error' : ''}
            placeholder="10-11 digits"
          />
          <ErrorMessage error={errors.residencePhone} />
        </div>
        <div className="form-group">
          <label>Telephone No (H/P)</label>
          <input 
            type="tel" 
            name="telephone" 
            value={formData.telephone} 
            onChange={handleChange} 
            className={errors.telephone || errors.phone ? 'error' : ''}
            placeholder="10-11 digits"
          />
          <ErrorMessage error={errors.telephone} />
        </div>
      </div>
      {errors.phone && <ErrorMessage error={errors.phone} />}

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
          <label className="radio-label"><input type="radio" name="paymentOption" value="toBeAdvanced" checked={formData.paymentOption === 'toBeAdvanced'} onChange={handleChange} /> To be advanced by Cagamas</label>
        </div>
      </div>
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
            <ErrorMessage error={errors.jIc} />
          </div>

          <div className="form-group">
            <label>Date of Birth (DD/MM/YYYY) *</label>
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
            <label>Sex *</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="jSex" value="male" checked={formData.jSex === 'male'} onChange={handleChange} required /> Male</label>
              <label className="radio-label"><input type="radio" name="jSex" value="female" checked={formData.jSex === 'female'} onChange={handleChange} /> Female</label>
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
            <label className="checkbox-label">
              <input type="checkbox" name="jMalaysian" checked={formData.jMalaysian} onChange={handleChange} />
              <span>Malaysian</span>
            </label>
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
              <label>Telephone No. (Residence)</label>
              <input 
                type="tel" 
                name="jResidencePhone" 
                value={formData.jResidencePhone} 
                onChange={handleChange} 
                placeholder="10-11 digits"
              />
            </div>
            <div className="form-group">
              <label>Telephone No (H/P)</label>
              <input 
                type="tel" 
                name="jTelephone" 
                value={formData.jTelephone} 
                onChange={handleChange} 
                placeholder="10-11 digits"
              />
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
          <label>Account Type</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="accountType" value="savings" checked={formData.accountType === 'savings'} onChange={handleChange} /> Savings</label>
            <label className="radio-label"><input type="radio" name="accountType" value="current" checked={formData.accountType === 'current'} onChange={handleChange} /> Current</label>
            <label className="radio-label"><input type="radio" name="accountType" value="joint_savings" checked={formData.accountType === 'joint_savings'} onChange={handleChange} /> Joint Account Saving</label>
            <label className="radio-label"><input type="radio" name="accountType" value="joint_current" checked={formData.accountType === 'joint_current'} onChange={handleChange} /> Joint Account Current</label>
          </div>
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
// Step 3: Property Details
function Step3PropertyDetails({ formData, handleChange, errors = {} }) {
  return (
    <div className="step-container">
      <h2>Property Information</h2>
      <p className="step-description">
        Provide details about the property
      </p>
      
      <ErrorSummary errors={errors} />

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
          <input 
            type="text" 
            name="propertyPostcode" 
            value={formData.propertyPostcode} 
            onChange={handleChange} 
            className={errors.propertyPostcode ? 'error' : ''}
            placeholder="5 digits"
          />
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
          <div className="form-group" style={{marginTop: '0.5rem', opacity: formData.tenureTitle === 'leasehold' ? 1 : 0.5}}>
            <label>Specify Expiry Date of Lease (DD/MM/YYYY)</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select name="expiryDay" value={formData.expiryDay} onChange={handleChange} style={{width: '70px'}} disabled={formData.tenureTitle !== 'leasehold'}>
                <option value="">DD</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
              </select>
              <select name="expiryMonth" value={formData.expiryMonth} onChange={handleChange} style={{width: '70px'}} disabled={formData.tenureTitle !== 'leasehold'}>
                <option value="">MM</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
              </select>
              <select name="expiryYear" value={formData.expiryYear} onChange={handleChange} style={{width: '90px'}} disabled={formData.tenureTitle !== 'leasehold'}>
                <option value="">YYYY</option>
                {Array.from({length: 100}, (_, i) => 2025 + i).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
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
          <label>Property encumbered</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="propertyEncumbered" value="yes" checked={formData.propertyEncumbered === 'yes'} onChange={handleChange} /> Yes</label>
            <label className="radio-label"><input type="radio" name="propertyEncumbered" value="no" checked={formData.propertyEncumbered === 'no'} onChange={handleChange} /> No</label>
          </div>
          <div style={{marginTop: '0.5rem', opacity: formData.propertyEncumbered === 'yes' ? 1 : 0.5}}>
            <div className="form-group">
              <label>Name of Bank</label>
              <input 
                type="text" 
                name="propertyBankName" 
                value={formData.propertyBankName} 
                onChange={handleChange} 
                disabled={formData.propertyEncumbered !== 'yes'}
                style={{cursor: formData.propertyEncumbered === 'yes' ? 'text' : 'not-allowed'}}
              />
            </div>
            <div className="form-group">
              <label>Estimated Outstanding Balance</label>
              <input 
                type="text" 
                name="estOutstandingBalance" 
                value={formData.estOutstandingBalance} 
                onChange={handleChange} 
                disabled={formData.propertyEncumbered !== 'yes'}
                style={{cursor: formData.propertyEncumbered === 'yes' ? 'text' : 'not-allowed'}}
              />
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
            <div className="form-group" style={{flex: 1, opacity: formData.fireInsurance === 'notAvailable' ? 1 : 0.5}}>
              <label>Insurance/Takaful Policy to be purchased by Cagamas</label>
              <div className="radio-group">
                <label className="radio-label"><input type="radio" name="fireInsuranceNotAvailable" value="yes" checked={formData.fireInsuranceNotAvailable === 'yes'} onChange={handleChange} disabled={formData.fireInsurance !== 'notAvailable'} /> Yes</label>
                <label className="radio-label"><input type="radio" name="fireInsuranceNotAvailable" value="no" checked={formData.fireInsuranceNotAvailable === 'no'} onChange={handleChange} disabled={formData.fireInsurance !== 'notAvailable'} /> No</label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Renewal of Fire & Home Insurance/Takaful policy</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="renewalFireInsurance" value="selfRenewal" checked={formData.renewalFireInsurance === 'selfRenewal'} onChange={handleChange} /> Self-renewal</label>
            <label className="radio-label"><input type="radio" name="renewalFireInsurance" value="cagamasRenew" checked={formData.renewalFireInsurance === 'cagamasRenew'} onChange={handleChange} /> To be renewed by Cagamas</label>
          </div>
        </div>
      </section>
    </div>
  )
}

function Step4Nominees({ formData, handleChange, errors = {} }) {
  return (
    <div className="step-container">
      <h2>Nominee Information</h2>
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
          <ErrorMessage error={errors.nominee1Ic} />
        </div>

        <div className="form-group">
          <label>Date of Birth (DD/MM/YYYY) *</label>
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
          <label>Sex *</label>
          <div className="radio-group">
            <label className="radio-label"><input type="radio" name="nominee1Sex" value="male" checked={formData.nominee1Sex === 'male'} onChange={handleChange} required /> Male</label>
            <label className="radio-label"><input type="radio" name="nominee1Sex" value="female" checked={formData.nominee1Sex === 'female'} onChange={handleChange} /> Female</label>
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
          <label className="checkbox-label">
            <input type="checkbox" name="nominee1Malaysian" checked={formData.nominee1Malaysian} onChange={handleChange} />
            <span>Malaysian</span>
          </label>
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
            <label>Telephone No. (Residence)</label>
            <input 
              type="tel" 
              name="nominee1ResidencePhone" 
              value={formData.nominee1ResidencePhone} 
              onChange={handleChange} 
              placeholder="10-11 digits"
            />
          </div>
          <div className="form-group">
            <label>Telephone No (H/P) *</label>
            <input 
              type="tel" 
              name="nominee1Telephone" 
              value={formData.nominee1Telephone} 
              onChange={handleChange} 
              className={errors.nominee1Telephone ? 'error' : ''}
              placeholder="10-11 digits"
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
            <ErrorMessage error={errors.nominee2Ic} />
          </div>

          <div className="form-group">
            <label>Date of Birth (DD/MM/YYYY) *</label>
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
            <label>Sex *</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="nominee2Sex" value="male" checked={formData.nominee2Sex === 'male'} onChange={handleChange} required /> Male</label>
              <label className="radio-label"><input type="radio" name="nominee2Sex" value="female" checked={formData.nominee2Sex === 'female'} onChange={handleChange} /> Female</label>
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
            <label className="checkbox-label">
              <input type="checkbox" name="nominee2Malaysian" checked={formData.nominee2Malaysian} onChange={handleChange} />
              <span>Malaysian</span>
            </label>
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
              <label>Telephone No. (Residence)</label>
              <input 
                type="tel" 
                name="nominee2ResidencePhone" 
                value={formData.nominee2ResidencePhone} 
                onChange={handleChange} 
                placeholder="10-11 digits"
              />
            </div>
            <div className="form-group">
              <label>Telephone No (H/P) *</label>
              <input 
                type="tel" 
                name="nominee2Telephone" 
                value={formData.nominee2Telephone} 
                onChange={handleChange} 
                className={errors.nominee2Telephone ? 'error' : ''}
                placeholder="10-11 digits"
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
            By submitting this Form, I/we hereby agree that <strong>Cagamas Berhad (Cagamas)</strong> may collect, use, obtain, disclose, store and process Personal Data that are provided in this form and/or otherwise provided by me/us or possessed by Cagamas, for one or more of the purposes as stated in Cagamas' Privacy Statement, which in summary includes but not limited to the following:
          </p>
          
          <ul className="info-list">
            <li>(a) processing my/our application for and providing me/us with the services and products of Cagamas as well as services and products by external providers provided through Cagamas;</li>
            <li>(b) administering and/or managing my/our relationship with Cagamas and</li>
            <li>(c) receiving updates, news, promotional and marketing mails or materials from Cagamas, business partners and related companies may be offering and which Cagamas believes may be of interest or benefit to me/us ("Marketing Messages") by way of postal mail and/or electronic transmission to my/our email address(es), (collectively the "Purposes").</li>
          </ul>

          <h4>Opt Out for subclause (c)</h4>
          <p>
            Please be informed that you have the right to opt out of receiving Marketing Messages. Kindly visit <a href="https://www.cagamas.com.my/privacy-statement" target="_blank" rel="noopener noreferrer">https://www.cagamas.com.my/privacy-statement</a> for further details on how you may exercise your right to opt out of receiving Marketing Messages.
          </p>

          <p><strong>I/We hereby give my/our consent(s) to Cagamas Berhad (Cagamas) to:</strong></p>
          <ul className="info-list">
            <li>Collect, use, obtain, store and process Personal Data provided by me/us</li>
            <li>Disclose the Personal Data to Cagamas' third party service providers or agents (including its lawyers/law firms), which may be sited outside of Malaysia</li>
            <li>Transfer Personal Data to any company within the Cagamas group of companies which may involve data processing</li>
          </ul>

          <p className="info-disclaimer">
            For the avoidance of doubt, Personal Data includes all data defined within the Personal Data Protection Act 2010 including all data Applicant(s) had disclosed to Cagamas in this Form and/or otherwise provided by Applicant(s) or possessed by Cagamas.
          </p>
        </div>
      </div>

      {/* Supporting Documents */}
      <div className="info-section">
        <h3>Supporting Documents Required</h3>
        <div className="info-content">
          <p><strong>Please prepare the following documents for submission:</strong></p>
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
            <li>I/We acknowledge that Cagamas has the right to reject this application without providing any reason</li>
            <li>I/We agree to provide any additional information or documents as may be required by Cagamas</li>
            <li>I/We understand that providing false information may result in rejection of this application</li>
          </ul>

          <p className="info-disclaimer">
            <strong>I/We hereby acknowledged that the information provided above is true and valid and that I/we have read and understood all of the above provisions, including Cagamas' Privacy Statement.</strong>
          </p>

          <p className="info-disclaimer">
            In the event that I/we do not proceed with my/our application herein, I/we agree to reimburse Cagamas for any costs, expenses and charges incurred on my/our behalf pursuant to my/our application herein.
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
                onChange={handleChange}
                placeholder="Full name"
                required
                className={errors.applicant_signature_name ? 'error' : ''}
              />
              <ErrorMessage error={errors.applicant_signature_name} />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="applicant_signature_date"
                value={formData.applicant_signature_date}
                onChange={handleChange}
                required
                className={errors.applicant_signature_date ? 'error' : ''}
              />
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
                onChange={handleChange}
                placeholder="Full name"
                disabled={!formData.isJointApplicant}
                required={formData.isJointApplicant}
                className={errors.jApplicant_signature_name ? 'error' : ''}
              />
              <ErrorMessage error={errors.jApplicant_signature_name} />
            </div>
            <div className="form-group">
              <label>{formData.isJointApplicant ? "Date *" : "Date"}</label>
              <input
                type="date"
                name="jApplicant_signature_date"
                value={formData.jApplicant_signature_date}
                onChange={handleChange}
                disabled={!formData.isJointApplicant}
                required={formData.isJointApplicant}
                className={errors.jApplicant_signature_date ? 'error' : ''}
              />
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
      <p className="step-description">To be completed by Nominee(s)</p>
      <ErrorSummary errors={errors} />
      
      <section className="form-section">
        <div className="info-box" style={{padding: '1.5rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1.5rem'}}>
          <p><strong>ACKNOWLEDGEMENT BY NOMINEE</strong></p>
          <p style={{marginTop: '0.5rem'}}>I hereby acknowledge that:</p>
          <ol style={{marginLeft: '1.5rem', marginTop: '0.5rem'}}>
            <li>I have been nominated by the applicant(s) as a beneficiary under the Skim Saraan Bercagar (SSB)</li>
            <li>I understand my rights and obligations as a nominee</li>
            <li>I agree to accept the nomination</li>
            <li>I consent to the collection, use, and processing of my personal data by Cagamas Berhad</li>
            <li>I understand that the property will be transferred to me/us upon fulfillment of loan obligations</li>
          </ol>
        </div>

        <h3>Nominee Information</h3>
        
        <div className="form-group">
          <label>Nominee Name (as per NRIC) *</label>
          <input 
            type="text" 
            name="ack_nomineeName" 
            value={formData.ack_nomineeName} 
            onChange={handleChange} 
            className={errors.ack_nomineeName ? 'error' : ''}
            required 
          />
          <ErrorMessage error={errors.ack_nomineeName} />
        </div>

        <div className="form-group">
          <label>Nominee NRIC No. *</label>
          <input 
            type="text" 
            name="ack_nomineeNRIC" 
            value={formData.ack_nomineeNRIC} 
            onChange={handleChange} 
            className={errors.ack_nomineeNRIC ? 'error' : ''}
            placeholder="Format: xxxxxx-xx-xxxx"
            required 
          />
          <ErrorMessage error={errors.ack_nomineeNRIC} />
        </div>

        <div className="form-group">
          <label>Nominee Address *</label>
          <textarea 
            name="ack_nomineeAddress" 
            value={formData.ack_nomineeAddress} 
            onChange={handleChange} 
            className={errors.ack_nomineeAddress ? 'error' : ''}
            rows="3"
            required 
          />
          <ErrorMessage error={errors.ack_nomineeAddress} />
        </div>

        <h3 style={{marginTop: '2rem'}}>Applicant Information</h3>
        
        <div className="form-group">
          <label>Applicant Name *</label>
          <input 
            type="text" 
            name="ack_applicantName" 
            value={formData.ack_applicantName} 
            onChange={handleChange} 
            className={errors.ack_applicantName ? 'error' : ''}
            required 
          />
          <ErrorMessage error={errors.ack_applicantName} />
        </div>

        <div className="form-group">
          <label>Applicant NRIC No. *</label>
          <input 
            type="text" 
            name="ack_applicantNRIC" 
            value={formData.ack_applicantNRIC} 
            onChange={handleChange} 
            className={errors.ack_applicantNRIC ? 'error' : ''}
            placeholder="Format: xxxxxx-xx-xxxx"
            required 
          />
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
                onChange={handleChange} 
                className={errors.ack_jointApplicantName ? 'error' : ''}
                required 
              />
              <ErrorMessage error={errors.ack_jointApplicantName} />
            </div>

            <div className="form-group">
              <label>Joint Applicant NRIC No. *</label>
              <input 
                type="text" 
                name="ack_jointApplicantNRIC" 
                value={formData.ack_jointApplicantNRIC} 
                onChange={handleChange} 
                className={errors.ack_jointApplicantNRIC ? 'error' : ''}
                placeholder="Format: xxxxxx-xx-xxxx"
                required 
              />
              <ErrorMessage error={errors.ack_jointApplicantNRIC} />
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Applicant Address *</label>
          <textarea 
            name="ack_applicantAddress" 
            value={formData.ack_applicantAddress} 
            onChange={handleChange} 
            className={errors.ack_applicantAddress ? 'error' : ''}
            rows="3"
            required 
          />
          <ErrorMessage error={errors.ack_applicantAddress} />
        </div>

        <h3 style={{marginTop: '2rem'}}>Application Date</h3>
        
        <div className="form-group">
          <label>Date of Application (DD/MM/YYYY) *</label>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <select name="ack_applicationDay" value={formData.ack_applicationDay} onChange={handleChange} style={{width: '70px'}} required>
              <option value="">DD</option>
              {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
            </select>
            <select name="ack_applicationMonth" value={formData.ack_applicationMonth} onChange={handleChange} style={{width: '70px'}} required>
              <option value="">MM</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
            </select>
            <select name="ack_applicationYear" value={formData.ack_applicationYear} onChange={handleChange} style={{width: '90px'}} required>
              <option value="">YYYY</option>
              {Array.from({length: 10}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
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

  return (
    <div className="step-container review-container">
      <h2>Review Your Application</h2>
      <p className="step-description">Please review all information carefully before generating the PDF. You can go back to any step to make corrections.</p>

      <div className="review-section">
        <h3>1. Personal Information</h3>
        <div className="review-grid">
          <div className="review-field"><strong>Salutation:</strong> {getValue(formData.salutation)}</div>
          <div className="review-field"><strong>Name:</strong> {getValue(formData.nameAsPerNRIC)}</div>
          <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.nricNo)}</div>
          <div className="review-field"><strong>Date of Birth:</strong> {formatDate(formData.dobDay, formData.dobMonth, formData.dobYear)}</div>
          <div className="review-field"><strong>Sex:</strong> {getValue(formData.sex)}</div>
          <div className="review-field"><strong>Race:</strong> {getValue(formData.race)}</div>
          <div className="review-field"><strong>Malaysian:</strong> {getValue(formData.malaysian)}</div>
          <div className="review-field"><strong>Marital Status:</strong> {getValue(formData.maritalStatus)}</div>
          <div className="review-field"><strong>No. of Dependents:</strong> {getValue(formData.numOfDependents)}</div>
          <div className="review-field"><strong>Occupation:</strong> {getValue(formData.occupation)}</div>
          <div className="review-field"><strong>Present House:</strong> {getValue(formData.presentHouse)}</div>
          <div className="review-field"><strong>Preferred Scheme:</strong> {getValue(formData.preferredScheme)}</div>
        </div>
        <div className="review-field" style={{marginTop: '0.5rem'}}><strong>Address:</strong> {getValue(formData.address)}</div>
        <div className="review-field"><strong>Postcode:</strong> {getValue(formData.postcode)}</div>
        <div className="review-field"><strong>Email:</strong> {getValue(formData.email)}</div>
        <div className="review-field"><strong>Residence Phone:</strong> {getValue(formData.residencePhone)}</div>
        <div className="review-field"><strong>Mobile Phone:</strong> {getValue(formData.telephone)}</div>
        <div className="review-field"><strong>Employer:</strong> {getValue(formData.employerName)}</div>
        <div className="review-field"><strong>Purpose of Application:</strong> {getValue(formData.purposeOfApplication)}</div>
        <div className="review-field"><strong>How did you hear about us:</strong> {getValue(formData.hearAboutUs)}</div>
        <div className="review-field"><strong>Payout Option:</strong> {getValue(formData.payoutOption)}</div>
        {formData.payoutOption === 'monthlyPayout_lumpSum' && (
          <div className="review-field"><strong>Lump Sum Usage:</strong> {getValue(formData.lumpSumUsage)}</div>
        )}
        <div className="review-field"><strong>Payment Option:</strong> {getValue(formData.paymentOption)}</div>
      </div>

      {formData.isJointApplicant && (
        <div className="review-section">
          <h3>2. Joint Applicant Information</h3>
          <div className="review-grid">
            <div className="review-field"><strong>Salutation:</strong> {getValue(formData.jSalutation)}</div>
            <div className="review-field"><strong>Name:</strong> {getValue(formData.jName)}</div>
            <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.jIc)}</div>
            <div className="review-field"><strong>Date of Birth:</strong> {formatDate(formData.jDobDay, formData.jDobMonth, formData.jDobYear)}</div>
            <div className="review-field"><strong>Sex:</strong> {getValue(formData.jSex)}</div>
            <div className="review-field"><strong>Race:</strong> {getValue(formData.jRace)}</div>
            <div className="review-field"><strong>Malaysian:</strong> {getValue(formData.jMalaysian)}</div>
            <div className="review-field"><strong>Marital Status:</strong> {getValue(formData.jMarital)}</div>
            <div className="review-field"><strong>No. of Dependents:</strong> {getValue(formData.jNumOfDependents)}</div>
            <div className="review-field"><strong>Occupation:</strong> {getValue(formData.jOccupation)}</div>
          </div>
          <div className="review-field" style={{marginTop: '0.5rem'}}><strong>Address:</strong> {getValue(formData.jAddress)}</div>
          <div className="review-field"><strong>Postcode:</strong> {getValue(formData.jPostcode)}</div>
          <div className="review-field"><strong>Email:</strong> {getValue(formData.jEmail)}</div>
          <div className="review-field"><strong>Residence Phone:</strong> {getValue(formData.jResidencePhone)}</div>
          <div className="review-field"><strong>Mobile Phone:</strong> {getValue(formData.jTelephone)}</div>
          <div className="review-field"><strong>Employer:</strong> {getValue(formData.jEmployerName)}</div>
        </div>
      )}

      <div className="review-section">
        <h3>{formData.isJointApplicant ? '3' : '2'}. Banking Information</h3>
        <div className="review-field"><strong>Bank Name:</strong> {getValue(formData.bankName)}</div>
        <div className="review-field"><strong>Account Type:</strong> {getValue(formData.accountType)}</div>
        <div className="review-field"><strong>Account Number:</strong> {getValue(formData.accountNumber)}</div>
        <div className="review-field"><strong>Branch:</strong> {getValue(formData.bankBranch)}</div>
      </div>

      <div className="review-section">
        <h3>{formData.isJointApplicant ? '4' : '3'}. Property Information</h3>
        <div className="review-field"><strong>Address:</strong> {getValue(formData.propertyAddress)}</div>
        <div className="review-field"><strong>Postcode:</strong> {getValue(formData.propertyPostcode)}</div>
        <div className="review-grid">
          <div className="review-field"><strong>Property Type:</strong> {getValue(formData.propertyType)}</div>
          <div className="review-field"><strong>Tenure:</strong> {getValue(formData.propertyTenure)}</div>
          {formData.propertyTenure === 'leasehold' && (
            <div className="review-field"><strong>Remaining Lease:</strong> {getValue(formData.leaseholdYears)} years</div>
          )}
          <div className="review-field"><strong>Land Area:</strong> {getValue(formData.landArea)} sq ft</div>
          <div className="review-field"><strong>Built-up Area:</strong> {getValue(formData.builtUpArea)} sq ft</div>
          <div className="review-field"><strong>Year Built:</strong> {getValue(formData.yearBuilt)}</div>
          <div className="review-field"><strong>Market Value:</strong> {formatCurrency(formData.indicativeMarketValue)}</div>
          <div className="review-field"><strong>Title Number:</strong> {getValue(formData.titleNumber)}</div>
          <div className="review-field"><strong>Encumbered:</strong> {getValue(formData.isEncumbered)}</div>
        </div>
        {formData.isEncumbered === 'yes' && (
          <>
            <div className="review-field"><strong>Financial Institution:</strong> {getValue(formData.encumbranceBank)}</div>
            <div className="review-field"><strong>Outstanding Loan:</strong> {formatCurrency(formData.outstandingLoanAmount)}</div>
          </>
        )}
        <div className="review-field"><strong>Insured:</strong> {getValue(formData.isInsured)}</div>
        {formData.isInsured === 'yes' && (
          <>
            <div className="review-field"><strong>Insurance Company:</strong> {getValue(formData.insuranceCompany)}</div>
            <div className="review-field"><strong>Policy Number:</strong> {getValue(formData.insurancePolicyNumber)}</div>
            <div className="review-field"><strong>Sum Insured:</strong> {formatCurrency(formData.insuranceSumInsured)}</div>
          </>
        )}
      </div>

      <div className="review-section">
        <h3>{formData.isJointApplicant ? '5' : '4'}. Nominee Information</h3>
        <h4>Nominee 1 (Primary)</h4>
        <div className="review-grid">
          <div className="review-field"><strong>Name:</strong> {getValue(formData.nominee1Name)}</div>
          <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.nominee1Ic)}</div>
          <div className="review-field"><strong>Relationship:</strong> {getValue(formData.nominee1Relationship)}</div>
          <div className="review-field"><strong>Share:</strong> {getValue(formData.nominee1Share)}%</div>
        </div>
        <div className="review-field"><strong>Address:</strong> {getValue(formData.nominee1Address)}</div>
        <div className="review-field"><strong>Postcode:</strong> {getValue(formData.nominee1Postcode)}</div>
        <div className="review-field"><strong>Email:</strong> {getValue(formData.nominee1Email)}</div>
        <div className="review-field"><strong>Phone:</strong> {getValue(formData.nominee1Phone)}</div>

        {formData.hasSecondNominee && (
          <>
            <h4 style={{marginTop: '1rem'}}>Nominee 2 (Secondary)</h4>
            <div className="review-grid">
              <div className="review-field"><strong>Name:</strong> {getValue(formData.nominee2Name)}</div>
              <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.nominee2Ic)}</div>
              <div className="review-field"><strong>Relationship:</strong> {getValue(formData.nominee2Relationship)}</div>
              <div className="review-field"><strong>Share:</strong> {getValue(formData.nominee2Share)}%</div>
            </div>
            <div className="review-field"><strong>Address:</strong> {getValue(formData.nominee2Address)}</div>
            <div className="review-field"><strong>Postcode:</strong> {getValue(formData.nominee2Postcode)}</div>
            <div className="review-field"><strong>Email:</strong> {getValue(formData.nominee2Email)}</div>
            <div className="review-field"><strong>Phone:</strong> {getValue(formData.nominee2Phone)}</div>
          </>
        )}
      </div>

      <div className="review-section">
        <h3>{formData.isJointApplicant ? '6' : '5'}. Declarations & Consents</h3>
        <div className="review-field"><strong>Privacy Consent:</strong> {getValue(formData.privacyConsent)}</div>
        <div className="review-field"><strong>Documents Ready:</strong> {getValue(formData.documentsReady)}</div>
        <div className="review-field"><strong>Declaration Confirmed:</strong> {getValue(formData.declarationConfirm)}</div>
        <div className="review-field"><strong>Applicant Signature Date:</strong> {getValue(formData.applicantSignatureDate)}</div>
        {formData.isJointApplicant && (
          <div className="review-field"><strong>Joint Applicant Signature Date:</strong> {getValue(formData.jointApplicantSignatureDate)}</div>
        )}
      </div>

      <div className="review-section">
        <h3>{formData.isJointApplicant ? '7' : '6'}. Nominee Acknowledgements</h3>
        <h4>Nominee 1</h4>
        <div className="review-field"><strong>Name:</strong> {getValue(formData.ack_nominee1Name)}</div>
        <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.ack_nominee1Ic)}</div>
        <div className="review-field"><strong>Consent Given:</strong> {getValue(formData.ack_nominee1Consent)}</div>
        <div className="review-field"><strong>Signature Date:</strong> {getValue(formData.nominee1SignatureDate)}</div>
        <div className="review-field"><strong>Witness:</strong> {getValue(formData.nominee1WitnessName)}</div>

        {formData.hasSecondNominee && (
          <>
            <h4 style={{marginTop: '1rem'}}>Nominee 2</h4>
            <div className="review-field"><strong>Name:</strong> {getValue(formData.ack_nominee2Name)}</div>
            <div className="review-field"><strong>NRIC No:</strong> {getValue(formData.ack_nominee2Ic)}</div>
            <div className="review-field"><strong>Consent Given:</strong> {getValue(formData.ack_nominee2Consent)}</div>
            <div className="review-field"><strong>Signature Date:</strong> {getValue(formData.nominee2SignatureDate)}</div>
            <div className="review-field"><strong>Witness:</strong> {getValue(formData.nominee2WitnessName)}</div>
          </>
        )}
      </div>

      <div className="info-box" style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#e3f2fd', border: '2px solid #2196f3', borderRadius: '4px'}}>
        <h4 style={{marginTop: 0, color: '#1976d2'}}>Ready to Submit?</h4>
        <p>Click the <strong>"Generate PDF & Submit"</strong> button below to:</p>
        <ol style={{marginLeft: '1.5rem', marginTop: '0.5rem'}}>
          <li>Generate a filled PDF of your SSB Application Form</li>
          <li>Download the PDF automatically</li>
          <li>Save your application for record-keeping</li>
        </ol>
        <p style={{marginTop: '1rem', marginBottom: 0}}><strong>Note:</strong> If you notice any errors, use the "Back" button to return to the relevant step and make corrections.</p>
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
  handleSubmit
}) {
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
        return <Step5InfoDisplay formData={formData} handleChange={handleChange} errors={errors} />
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
