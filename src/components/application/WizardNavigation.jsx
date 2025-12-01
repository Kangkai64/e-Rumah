export default function WizardNavigation({ currentStep, totalSteps, onNext, onBack, onSubmit, isLastStep }) {
  const progress = (currentStep / totalSteps) * 100;

  const stepTitles = [
    "Personal Information",
    "Joint Applicant",
    "Property Details",
    "Nominees",
    "Privacy, Documents & Declaration",
    "Acknowledgement Form",
    "Review & Submit"
  ];

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
  );
}
