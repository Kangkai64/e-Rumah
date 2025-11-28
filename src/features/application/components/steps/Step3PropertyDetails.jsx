import ErrorSummary from '../ErrorSummary'
import ErrorMessage from '../ErrorMessage'

export default function Step3PropertyDetails({ formData, handleChange, errors = {} }) {
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
