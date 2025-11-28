import ErrorSummary from '../ErrorSummary'
import ErrorMessage from '../ErrorMessage'

export default function Step2JointApplicant({ formData, handleChange, errors = {} }) {
  return (
    <div className="step-container">
      <h2>Joint Applicant & Banking Information</h2>
      <p className="step-description">
        Provide joint applicant details (if applicable) and banking information
      </p>
      
      <ErrorSummary errors={errors} />

      {/* Joint Applicant - Only show if checkbox is checked */}
      {formData.isJointApplicant && (
        <section className="form-section">
          <h3>Particulars of Joint Applicant</h3>
          
          <div className="form-group">
            <label>Salutation</label>
            <select name="jSalutation" value={formData.jSalutation.startsWith('Other:') ? 'Other' : formData.jSalutation} onChange={(e) => {
              if (e.target.value === 'Other') {
                handleChange({target: {name: 'jSalutation', value: 'Other:'}})
              } else {
                handleChange(e)
              }
            }}>
              <option value="">Select</option>
              <option value="Mr">Mr</option>
              <option value="Mdm">Mdm</option>
              <option value="Ms">Ms</option>
              <option value="Tan Sri">Tan Sri</option>
              <option value="Dato'">Dato'</option>
              <option value="Other">Other</option>
            </select>
            {formData.jSalutation.startsWith('Other:') && (
              <input
                type="text"
                name="jSalutation"
                value={formData.jSalutation.substring(6)}
                onChange={(e) => handleChange({target: {name: 'jSalutation', value: 'Other:' + e.target.value}})}
                placeholder="Please specify"
                style={{marginTop: '0.5rem'}}
              />
            )}
          </div>

          <div className="form-group">
            <label>Name as per NRIC</label>
            <input type="text" name="jName" value={formData.jName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>NRIC No.</label>
            <input type="text" name="jIc" value={formData.jIc} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Residential Address</label>
            <textarea name="jAddress" value={formData.jAddress} onChange={handleChange} rows="2" />
          </div>

          <div className="form-group">
            <label>Postcode</label>
            <input type="text" name="jPostcode" value={formData.jPostcode} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Marital Status</label>
            <select name="jMarital" value={formData.jMarital.startsWith('Other:') ? 'Other' : formData.jMarital} onChange={(e) => {
              if (e.target.value === 'Other') {
                handleChange({target: {name: 'jMarital', value: 'Other:'}})
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
            {formData.jMarital.startsWith('Other:') && (
              <input
                type="text"
                name="jMarital"
                value={formData.jMarital.substring(6)}
                onChange={(e) => handleChange({target: {name: 'jMarital', value: 'Other:' + e.target.value}})}
                placeholder="Please specify"
                style={{marginTop: '0.5rem'}}
              />
            )}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="jEmail" value={formData.jEmail} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Telephone No. (Residence)</label>
              <input type="tel" name="jResidencePhone" value={formData.jResidencePhone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Telephone No (H/P)</label>
              <input type="tel" name="jTelephone" value={formData.jTelephone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth (DD/MM/YYYY)</label>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <select name="jDobDay" value={formData.jDobDay} onChange={handleChange} style={{width: '70px'}}>
                  <option value="">DD</option>
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
                </select>
                <select name="jDobMonth" value={formData.jDobMonth} onChange={handleChange} style={{width: '70px'}}>
                  <option value="">MM</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
                </select>
                <select name="jDobYear" value={formData.jDobYear} onChange={handleChange} style={{width: '90px'}}>
                  <option value="">YYYY</option>
                  {Array.from({length: 100}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Race</label>
            <select name="jRace" value={formData.jRace.startsWith('Other:') ? 'Other' : formData.jRace} onChange={(e) => {
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
            {formData.jRace.startsWith('Other:') && (
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

          <div className="form-row">
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="jMalaysian" checked={formData.jMalaysian} onChange={handleChange} />
                Malaysian
              </label>
            </div>
            <div className="form-group">
              <label>Sex</label>
              <div className="radio-group">
                <label className="radio-label"><input type="radio" name="jSex" value="male" checked={formData.jSex === 'male'} onChange={handleChange} /> Male</label>
                <label className="radio-label"><input type="radio" name="jSex" value="female" checked={formData.jSex === 'female'} onChange={handleChange} /> Female</label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Relationship with Applicant</label>
            <div className="radio-group">
              {['spouse', 'children', 'parent', 'siblings'].map(value => (
                <label key={value} className="radio-label">
                  <input type="radio" name="jRelationship" value={value} checked={formData.jRelationship === value} onChange={handleChange} />
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Occupation</label>
            <input type="text" name="jOccupation" value={formData.jOccupation} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Name of Employer</label>
            <input type="text" name="jEmployerName" value={formData.jEmployerName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Address of Employer</label>
            <textarea name="jEmployerAddress" value={formData.jEmployerAddress} onChange={handleChange} rows="2" />
          </div>

          <div className="form-group">
            <label>Postcode</label>
            <input type="text" name="jEmployerPostcode" value={formData.jEmployerPostcode} onChange={handleChange} />
          </div>
        </section>
      )}

      {/* Banking Information */}
      <section className="form-section">
        <h3>Applicant's Banking Account Number</h3>
        
        <div className="form-group">
          <label>Name of Bank</label>
          <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} />
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
          <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
        </div>
      </section>
    </div>
  )
}
