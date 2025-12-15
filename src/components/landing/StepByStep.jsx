// StepByStep Component - Combined controller + view
// Displays the step-by-step guide for applying to e-Rumah scheme

import './StepByStep.css'

function StepByStep() {

  const steps = [
    {
      id: 1,
      icon: '/src/assets/icons/step_by_step_page/ri_home-smile-fill.svg',
      title: 'Check Eligibility',
      description: 'Answer a few simple questions to check if you qualify for the scheme.'
    },
    {
      id: 2,
      icon: '/src/assets/icons/step_by_step_page/fa7-solid_walking.svg',
      title: 'Prepare Documents',
      description: 'Gather identity, property and income documents for fast processing.'
    },
    {
      id: 3,
      icon: '/src/assets/icons/step_by_step_page/streamline-ultimate_paper-write-bold.svg',
      title: 'Submit Application',
      description: 'Complete the online form and submit your application to Supabase.'
    },
    {
      id: 4,
      icon: '/src/assets/icons/step_by_step_page/bxs_file-pdf.svg',
      title: 'Receive Outcome',
      description: 'We will notify you when your application is processed and approved.'
    }
  ]

  // Hero/banner image
  const hero = {
    image: '/src/assets/images/step_by_step_page/banner1.png',
    title: 'Reverse Mortgage Scheme',
    subtitle: 'Enabling retired home owners to gain access to a lifetime of supplemental income\nstream for daily subsistence to cater to potentail increases in the cost of living.'
  }

  return (
    <div className="step-by-step-wrapper">

      {/* Hero Section */}
      <div className="step-hero">
        <h2 className="hero-">{hero.title}</h2>
        <img src={hero.image} alt="how to apply" className="hero" />
      </div>

      {/* Steps Section */}
      <div className="step-section">
        <div className="step-container">
          <div className="step-header">
            <h2 className="step-title-main">{hero.title}</h2>
            <p className="step-subtitle-main">{hero.subtitle}</p>
          </div>

          <div className="steps-list">
            {steps.map((s) => (
              <div key={s.id} className="step-card">
                <div className="step-icon">
                  <img src={s.icon} alt={s.title} />
                </div>
                <div className="step-body">
                  <h3 className="step-card-title">{s.title}</h3>
                  <p className="step-card-desc">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="resource-section">
        <div className="resource-container">
          <h2 className="resource-title">Helpful Resources</h2>
          <div className="resources-grid">
            <div className="resource-card">
              <img src="/src/assets/images/step_by_step_page/Get a peace of mind with Cagamas.png" alt="guide" />
              <div className="resource-meta">
                <h4>Guide to Property Eligibility</h4>
                <a href="#" className="resource-link">Download PDF</a>
              </div>
            </div>

            <div className="resource-card">
              <img src="/src/assets/images/step_by_step_page/Image.png" alt="guide2" />
              <div className="resource-meta">
                <h4>What to Prepare</h4>
                <a href="#" className="resource-link">Learn More</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Want to talk to us about Reverse Mortgage?</h2>
            <p className="cta-description">We're here to answer your questions and guide you through the Reverse Mortgage Scheme process.</p>
            <a href="#" className="cta-button">Contact Us</a>
          </div>
          <div className="cta-image">
            <img src="/src/assets/images/step_by_step_page/coffeeCouple.png" alt="Contact us" />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="step-hero">
        <img src={hero.image} alt="how to apply" className="hero-image" />
      </div>

    </div>
  )
}

export default StepByStep
