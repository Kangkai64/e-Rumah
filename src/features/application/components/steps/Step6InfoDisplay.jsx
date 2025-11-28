import SignaturePad from '../SignaturePad'

export default function Step6InfoDisplay({ formData, handleChange }) {
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
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="applicant_signature_name"
                value={formData.applicant_signature_name}
                onChange={handleChange}
                placeholder="Full name"
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="applicant_signature_date"
                value={formData.applicant_signature_date}
                onChange={handleChange}
              />
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
              label="Signed by Joint Applicant"
              value={formData.jApplicant_signature}
              onChange={handleSignatureChange('jApplicant_signature')}
            />
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="jApplicant_signature_name"
                value={formData.jApplicant_signature_name}
                onChange={handleChange}
                placeholder="Full name"
                disabled={!formData.isJointApplicant}
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="jApplicant_signature_date"
                value={formData.jApplicant_signature_date}
                onChange={handleChange}
                disabled={!formData.isJointApplicant}
              />
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