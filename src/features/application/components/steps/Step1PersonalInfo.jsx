import ErrorSummary from '../ErrorSummary'
import ErrorMessage from '../ErrorMessage'

export default function Step1PersonalInfo({ formData, handleChange, errors = {} }) {
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
        <label>Name of Employer</label>
        <input 
          type="text" 
          name="employerName" 
          value={formData.employerName} 
          onChange={handleChange} 
        />
      </div>

      <div className="form-group">
        <label>Address of Employer</label>
        <textarea name="employerAddress" value={formData.employerAddress} onChange={handleChange} rows="2" />
      </div>

      <div className="form-group">
        <label>Postcode</label>
        <input type="text" name="employerPostcode" value={formData.employerPostcode} onChange={handleChange} />
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
  );
}
