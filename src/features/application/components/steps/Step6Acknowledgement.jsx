import ErrorSummary from '../ErrorSummary'
import ErrorMessage from '../ErrorMessage'
import SignaturePad from '../SignaturePad'

export default function Step5bAcknowledgement({ formData, handleChange, errors = {} }) {
  const handleSignatureChange = (field) => (value) => {
    handleChange({ target: { name: field, value } })
  }

  return (
    <div className="step-container">
      <h2>Acknowledgement Form</h2>
      <p className="step-description">
        Nominee acknowledgement details
      </p>
      
      <ErrorSummary errors={errors} />

      <section className="form-section">
        <div className="info-content" style={{marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff5f5', borderRadius: '4px', border: '1px solid #A8202D'}}>
          <p style={{margin: 0, fontSize: '0.9rem', lineHeight: '1.6'}}>
            <strong>To: Cagamas Berhad ("Cagamas")</strong><br />
            Level 32, The Gardens North Tower, Mid Valley City,<br />
            Lingkaran Syed Putra, 59200 Kuala Lumpur
          </p>
        </div>

        <h3>Nominee Information</h3>
        
        <div className="form-group">
          <label>Name of Nominee *</label>
          <input 
            type="text" 
            name="ack_nomineeName" 
            value={formData.ack_nomineeName} 
            onChange={handleChange}
            className={errors.ack_nomineeName ? 'error' : ''}
          />
          <ErrorMessage error={errors.ack_nomineeName} />
        </div>

        <div className="form-group">
          <label>NRIC No. *</label>
          <input 
            type="text" 
            name="ack_nomineeNRIC" 
            value={formData.ack_nomineeNRIC} 
            onChange={handleChange}
            placeholder="Format: xxxxxx-xx-xxxx"
            className={errors.ack_nomineeNRIC ? 'error' : ''}
          />
          <ErrorMessage error={errors.ack_nomineeNRIC} />
        </div>

        <div className="form-group">
          <label>Address *</label>
          <textarea 
            name="ack_nomineeAddress" 
            value={formData.ack_nomineeAddress} 
            onChange={handleChange}
            rows="2"
            className={errors.ack_nomineeAddress ? 'error' : ''}
          />
          <ErrorMessage error={errors.ack_nomineeAddress} />
        </div>

        <h3>Applicant Information</h3>

        <div className="form-group">
          <label>Name of Applicant *</label>
          <input 
            type="text" 
            name="ack_applicantName" 
            value={formData.ack_applicantName} 
            onChange={handleChange}
            className={errors.ack_applicantName ? 'error' : ''}
          />
          <ErrorMessage error={errors.ack_applicantName} />
        </div>

        <div className="form-group">
          <label>NRIC No. *</label>
          <input 
            type="text" 
            name="ack_applicantNRIC" 
            value={formData.ack_applicantNRIC} 
            onChange={handleChange}
            placeholder="Format: xxxxxx-xx-xxxx"
            className={errors.ack_applicantNRIC ? 'error' : ''}
          />
          <ErrorMessage error={errors.ack_applicantNRIC} />
        </div>

        <div className="form-group">
          <label>Joint Applicant Name (if applicable)</label>
          <input 
            type="text" 
            name="ack_jointApplicantName" 
            value={formData.ack_jointApplicantName} 
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Joint Applicant NRIC No. (if applicable)</label>
          <input 
            type="text" 
            name="ack_jointApplicantNRIC" 
            value={formData.ack_jointApplicantNRIC} 
            onChange={handleChange}
            placeholder="Format: xxxxxx-xx-xxxx"
          />
        </div>

        <div className="form-group">
          <label>Address *</label>
          <textarea 
            name="ack_applicantAddress" 
            value={formData.ack_applicantAddress} 
            onChange={handleChange}
            rows="2"
            className={errors.ack_applicantAddress ? 'error' : ''}
          />
          <ErrorMessage error={errors.ack_applicantAddress} />
        </div>

        <div className="form-group">
          <label>Date of Application *</label>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <select 
              name="ack_applicationDay" 
              value={formData.ack_applicationDay} 
              onChange={handleChange}
              style={{width: '70px'}}
              className={errors.ack_applicationDate ? 'error' : ''}
            >
              <option value="">DD</option>
              {Array.from({length: 31}, (_, i) => i + 1).map(day => 
                <option key={day} value={String(day).padStart(2, '0')}>
                  {String(day).padStart(2, '0')}
                </option>
              )}
            </select>
            <select 
              name="ack_applicationMonth" 
              value={formData.ack_applicationMonth} 
              onChange={handleChange}
              style={{width: '70px'}}
              className={errors.ack_applicationDate ? 'error' : ''}
            >
              <option value="">MM</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(month => 
                <option key={month} value={String(month).padStart(2, '0')}>
                  {String(month).padStart(2, '0')}
                </option>
              )}
            </select>
            <select 
              name="ack_applicationYear" 
              value={formData.ack_applicationYear} 
              onChange={handleChange}
              style={{width: '90px'}}
              className={errors.ack_applicationDate ? 'error' : ''}
            >
              <option value="">YYYY</option>
              {Array.from({length: 10}, (_, i) => 2025 + i).map(year => 
                <option key={year} value={year}>{year}</option>
              )}
            </select>
          </div>
          <ErrorMessage error={errors.ack_applicationDate} />
        </div>

        <div className="info-content" style={{marginTop: '1.5rem', padding: '1rem', backgroundColor: '#F5F5F5', borderRadius: '4px'}}>
          <p style={{fontSize: '0.9rem', lineHeight: '1.8', margin: 0}}>
            I hereby confirm that I am a duly appointed nominee of <strong>(Name of Applicant)</strong>, 
            in relation to the Reverse Mortgage Loan / Islamic Reverse Mortgage Financing Facility applied for by the 
            Applicant on <strong>(Date of Application)</strong>, ("Reverse Mortgage Loan / Islamic Reverse Mortgage Financing Facility"), 
            and in the event the Reverse Mortgage Loan/Islamic Reverse Mortgage Financing Facility is entered into 
            between the Applicant(s) and Cagamas, I undertake to carry out and perform all obligations as a Nominee 
            under the Reverse Mortgage Loan / Islamic Reverse Mortgage Financing Facility, as follows:
          </p>
          
          <ul style={{marginTop: '1rem', marginBottom: '1rem', paddingLeft: '1.5rem'}}>
            <li style={{marginBottom: '0.5rem'}}>
              (i) Undertake to promptly notify Cagamas in writing of the death of the Applicant(s); and
            </li>
            <li style={{marginBottom: '0.5rem'}}>
              (ii) Agree to receive and/or acknowledge receipt of all documents and notices served upon me by 
              Cagamas (including any documents relating to any proceedings or actions commenced by Cagamas under 
              the Reverse Mortgage Loan / Islamic Reverse Mortgage Financing).
            </li>
          </ul>
        </div>
      </section>

      {/* Nominee Signature */}
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <SignaturePad
          label="Signed by Nominee *"
          value={formData.ackNominee_signature}
          onChange={handleSignatureChange('ackNominee_signature')}
        />
      </div>
    </div>
  )
}
