export default function Step7Review({ formData }) {
  const formatDate = (day, month, year) => {
    if (!day || !month || !year) return 'Not provided';
    return `${day}/${month}/${year}`;
  };

  const getValue = (value) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (value === '' || value === undefined || value === null) return 'Not provided';
    return value;
  };

  return (
    <div className="step-container review-container">
      <h2>Review Your Application</h2>
      <p className="step-description">Please review all the information before generating your PDF.</p>

      <div className="review-section">
        <h3>How You Found Us</h3>
        <div className="review-field">
          <strong>Source:</strong> {getValue(formData.howDidYouKnow)}
        </div>
        <div className="review-field">
          <strong>Preferred Scheme:</strong> {getValue(formData.preferredScheme)}
        </div>
        <div className="review-field">
          <strong>Joint Applicant:</strong> {formData.isJointApplicant ? 'Yes' : 'No'}
        </div>
      </div>

      <div className="review-section">
        <h3>Personal Information</h3>
        <div className="review-field">
          <strong>Name:</strong> {getValue(formData.salutation)} {getValue(formData.nameAsPerNRIC)}
        </div>
        <div className="review-field">
          <strong>NRIC:</strong> {getValue(formData.nricNo)}
        </div>
        <div className="review-field">
          <strong>Date of Birth:</strong> {formatDate(formData.dobDay, formData.dobMonth, formData.dobYear)}
        </div>
        <div className="review-field">
          <strong>Sex:</strong> {getValue(formData.sex)}
        </div>
        <div className="review-field">
          <strong>Race:</strong> {getValue(formData.race)}
        </div>
        <div className="review-field">
          <strong>Malaysian:</strong> {formData.malaysian ? 'Yes' : 'No'}
        </div>
        <div className="review-field">
          <strong>Marital Status:</strong> {getValue(formData.maritalStatus)}
        </div>
        <div className="review-field">
          <strong>No. of Dependents:</strong> {getValue(formData.numOfDependents)}
        </div>
        <div className="review-field">
          <strong>Address:</strong> {getValue(formData.address)}
        </div>
        <div className="review-field">
          <strong>Postcode:</strong> {getValue(formData.postcode)}
        </div>
        <div className="review-field">
          <strong>Email:</strong> {getValue(formData.email)}
        </div>
        <div className="review-field">
          <strong>Telephone (Residence):</strong> {getValue(formData.residencePhone)}
        </div>
        <div className="review-field">
          <strong>Telephone (H/P):</strong> {getValue(formData.telephone)}
        </div>
        <div className="review-field">
          <strong>Present House:</strong> {getValue(formData.presentHouse)}
        </div>
        <div className="review-field">
          <strong>Occupation:</strong> {getValue(formData.occupation)}
        </div>
        <div className="review-field">
          <strong>Employer:</strong> {getValue(formData.employerName)}
        </div>
        <div className="review-field">
          <strong>Payout Option:</strong> {getValue(formData.payoutOption)}
        </div>
        {formData.payoutOption === 'monthlyPayout_lumpSum' && (
          <div className="review-field">
            <strong>Lump Sum Usage:</strong> {getValue(formData.lumpSumUsage)}
          </div>
        )}
      </div>

      {formData.isJointApplicant && (
        <div className="review-section">
          <h3>Joint Applicant Information</h3>
          <div className="review-field">
            <strong>Name:</strong> {getValue(formData.jSalutation)} {getValue(formData.jName)}
          </div>
          <div className="review-field">
            <strong>NRIC:</strong> {getValue(formData.jIc)}
          </div>
          <div className="review-field">
            <strong>Date of Birth:</strong> {formatDate(formData.jDobDay, formData.jDobMonth, formData.jDobYear)}
          </div>
          <div className="review-field">
            <strong>Relationship:</strong> {getValue(formData.jRelationship)}
          </div>
          <div className="review-field">
            <strong>Email:</strong> {getValue(formData.jEmail)}
          </div>
          <div className="review-field">
            <strong>Occupation:</strong> {getValue(formData.jOccupation)}
          </div>
        </div>
      )}

      <div className="review-section">
        <h3>Banking Information</h3>
        <div className="review-field">
          <strong>Bank Name:</strong> {getValue(formData.bankName)}
        </div>
        <div className="review-field">
          <strong>Account No:</strong> {getValue(formData.accountNumber)}
        </div>
      </div>

      <div className="review-section">
        <h3>Property Details</h3>
        <div className="review-field">
          <strong>Address:</strong> {getValue(formData.propertyAddress)}
        </div>
        <div className="review-field">
          <strong>Postcode:</strong> {getValue(formData.propertyPostcode)}
        </div>
        <div className="review-field">
          <strong>Type:</strong> {getValue(formData.propertyType)}
        </div>
        <div className="review-field">
          <strong>Tenure Title:</strong> {getValue(formData.tenureTitle)}
        </div>
        <div className="review-field">
          <strong>Market Value:</strong> RM {getValue(formData.indicativeMarketValue)}
        </div>
        <div className="review-field">
          <strong>Fire Insurance:</strong> {getValue(formData.fireInsurance)}
        </div>
      </div>

      <div className="review-section">
        <h3>Nominee 1</h3>
        <div className="review-field">
          <strong>Name:</strong> {getValue(formData.nominee1Name)}
        </div>
        <div className="review-field">
          <strong>NRIC:</strong> {getValue(formData.nominee1Ic)}
        </div>
        <div className="review-field">
          <strong>Relationship:</strong> {getValue(formData.nominee1Relationship)}
        </div>
      </div>

      {formData.hasSecondNominee && formData.nominee2Name && (
        <div className="review-section">
          <h3>Nominee 2</h3>
          <div className="review-field">
            <strong>Name:</strong> {getValue(formData.nominee2Name)}
          </div>
          <div className="review-field">
            <strong>NRIC:</strong> {getValue(formData.nominee2Ic)}
          </div>
          <div className="review-field">
            <strong>Relationship:</strong> {getValue(formData.nominee2Relationship)}
          </div>
        </div>
      )}

      <div className="review-notice">
        <p><strong>Note:</strong> Once you click "Generate PDF", your filled application form will be downloaded.</p>
      </div>
    </div>
  );
}