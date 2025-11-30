import ErrorSummary from '../ErrorSummary'

export default function Step5Nominees({ formData, handleChange, errors = {} }) {
  return (
    <div className="step-container">
      <h2>Nominee Information</h2>
      <p className="step-description">
        Provide details for up to two nominees
      </p>
      
      <ErrorSummary errors={errors} />

      {/* Nominee 1 */}
      <section className="form-section">
        <h3>Particulars of Nominee (1)</h3>
        
        <div className="form-group">
          <label>Salutation</label>
          <select name="nominee1Salutation" value={formData.nominee1Salutation.startsWith('Other:') ? 'Other' : formData.nominee1Salutation} onChange={(e) => {
            if (e.target.value === 'Other') {
              handleChange({target: {name: 'nominee1Salutation', value: 'Other:'}})
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
          {formData.nominee1Salutation.startsWith('Other:') && (
            <input
              type="text"
              name="nominee1Salutation"
              value={formData.nominee1Salutation.substring(6)}
              onChange={(e) => handleChange({target: {name: 'nominee1Salutation', value: 'Other:' + e.target.value}})}
              placeholder="Please specify"
              style={{marginTop: '0.5rem'}}
            />
          )}
        </div>

        <div className="form-group">
          <label>Name as per NRIC</label>
          <input type="text" name="nominee1Name" value={formData.nominee1Name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>NRIC No.</label>
          <input type="text" name="nominee1Ic" value={formData.nominee1Ic} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Residential Address</label>
          <textarea name="nominee1Address" value={formData.nominee1Address} onChange={handleChange} rows="2" />
        </div>

        <div className="form-group">
          <label>Postcode</label>
          <input type="text" name="nominee1Postcode" value={formData.nominee1Postcode} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="nominee1Email" value={formData.nominee1Email} onChange={handleChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Telephone No. (Residence)</label>
            <input type="tel" name="nominee1ResidencePhone" value={formData.nominee1ResidencePhone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Telephone No (H/P)</label>
            <input type="tel" name="nominee1Telephone" value={formData.nominee1Telephone} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth (DD/MM/YYYY)</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select name="nominee1DobDay" value={formData.nominee1DobDay} onChange={handleChange} style={{width: '70px'}}>
                <option value="">DD</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
              </select>
              <select name="nominee1DobMonth" value={formData.nominee1DobMonth} onChange={handleChange} style={{width: '70px'}}>
                <option value="">MM</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
              </select>
              <select name="nominee1DobYear" value={formData.nominee1DobYear} onChange={handleChange} style={{width: '90px'}}>
                <option value="">YYYY</option>
                {Array.from({length: 100}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sex</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="nominee1Sex" value="male" checked={formData.nominee1Sex === 'male'} onChange={handleChange} /> Male</label>
              <label className="radio-label"><input type="radio" name="nominee1Sex" value="female" checked={formData.nominee1Sex === 'female'} onChange={handleChange} /> Female</label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Race</label>
          <select name="nominee1Race" value={formData.nominee1Race.startsWith('Other:') ? 'Other' : formData.nominee1Race} onChange={(e) => {
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
          {formData.nominee1Race.startsWith('Other:') && (
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
            Malaysian
          </label>
        </div>

        <div className="form-group">
          <label>Marital Status</label>
          <select name="nominee1Marital" value={formData.nominee1Marital.startsWith('Other:') ? 'Other' : formData.nominee1Marital} onChange={(e) => {
            if (e.target.value === 'Other') {
              handleChange({target: {name: 'nominee1Marital', value: 'Other:'}})
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
          {formData.nominee1Marital.startsWith('Other:') && (
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
          <label>Relationship</label>
          <input type="text" name="nominee1Relationship" value={formData.nominee1Relationship} onChange={handleChange} />
        </div>
      </section>

      {/* Nominee 2 - Conditional */}
      <div className="form-group" style={{marginTop: '2rem'}}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="hasSecondNominee"
            checked={formData.hasSecondNominee || false}
            onChange={handleChange}
          />
          <span>Do you want to add a second nominee?</span>
        </label>
      </div>

      {formData.hasSecondNominee && (
        <section className="form-section">
          <h3>Particulars of Nominee (2)</h3>
        
        <div className="form-group">
          <label>Salutation</label>
          <select name="nominee2Salutation" value={formData.nominee2Salutation.startsWith('Other:') ? 'Other' : formData.nominee2Salutation} onChange={(e) => {
            if (e.target.value === 'Other') {
              handleChange({target: {name: 'nominee2Salutation', value: 'Other:'}})
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
          {formData.nominee2Salutation.startsWith('Other:') && (
            <input
              type="text"
              name="nominee2Salutation"
              value={formData.nominee2Salutation.substring(6)}
              onChange={(e) => handleChange({target: {name: 'nominee2Salutation', value: 'Other:' + e.target.value}})}
              placeholder="Please specify"
              style={{marginTop: '0.5rem'}}
            />
          )}
        </div>

        <div className="form-group">
          <label>Name as per NRIC</label>
          <input type="text" name="nominee2Name" value={formData.nominee2Name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>NRIC No.</label>
          <input type="text" name="nominee2Ic" value={formData.nominee2Ic} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Residential Address</label>
          <textarea name="nominee2Address" value={formData.nominee2Address} onChange={handleChange} rows="2" />
        </div>

        <div className="form-group">
          <label>Postcode</label>
          <input type="text" name="nominee2Postcode" value={formData.nominee2Postcode} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="nominee2Email" value={formData.nominee2Email} onChange={handleChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Telephone No. (Residence)</label>
            <input type="tel" name="nominee2ResidencePhone" value={formData.nominee2ResidencePhone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Telephone No (H/P)</label>
            <input type="tel" name="nominee2Telephone" value={formData.nominee2Telephone} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth (DD/MM/YYYY)</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select name="nominee2DobDay" value={formData.nominee2DobDay} onChange={handleChange} style={{width: '70px'}}>
                <option value="">DD</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={String(day).padStart(2, '0')}>{String(day).padStart(2, '0')}</option>)}
              </select>
              <select name="nominee2DobMonth" value={formData.nominee2DobMonth} onChange={handleChange} style={{width: '70px'}}>
                <option value="">MM</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={String(month).padStart(2, '0')}>{String(month).padStart(2, '0')}</option>)}
              </select>
              <select name="nominee2DobYear" value={formData.nominee2DobYear} onChange={handleChange} style={{width: '90px'}}>
                <option value="">YYYY</option>
                {Array.from({length: 100}, (_, i) => 2025 - i).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sex</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="nominee2Sex" value="male" checked={formData.nominee2Sex === 'male'} onChange={handleChange} /> Male</label>
              <label className="radio-label"><input type="radio" name="nominee2Sex" value="female" checked={formData.nominee2Sex === 'female'} onChange={handleChange} /> Female</label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Race</label>
          <select name="nominee2Race" value={formData.nominee2Race.startsWith('Other:') ? 'Other' : formData.nominee2Race} onChange={(e) => {
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
          {formData.nominee2Race.startsWith('Other:') && (
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
            Malaysian
          </label>
        </div>

        <div className="form-group">
          <label>Marital Status</label>
          <select name="nominee2Marital" value={formData.nominee2Marital.startsWith('Other:') ? 'Other' : formData.nominee2Marital} onChange={(e) => {
            if (e.target.value === 'Other') {
              handleChange({target: {name: 'nominee2Marital', value: 'Other:'}})
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
          {formData.nominee2Marital.startsWith('Other:') && (
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
          <label>Relationship</label>
          <input type="text" name="nominee2Relationship" value={formData.nominee2Relationship} onChange={handleChange} />
        </div>
      </section>
      )}
    </div>
  );
}
