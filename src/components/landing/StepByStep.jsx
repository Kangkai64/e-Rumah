// StepByStep Component - Combined controller + view
// Displays the step-by-step guide for applying to e-Rumah scheme

import './StepByStep.css'
import Container from '../common/Container'

function StepByStep() {
  // Dummy structured steps matching the Figma flow
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
    image: '/src/assets/images/step_by_step_page/Section.png',
    title: 'How to Apply',
    subtitle: 'Follow these simple steps to apply for the e-Rumah scheme.'
  }

  return (
    <Container>
      <div className="step-by-step-wrapper">
        <div className="step-hero">
          <div className="hero-content">
            <h1 className="hero-title">{hero.title}</h1>
            <p className="hero-subtitle">{hero.subtitle}</p>
            <a className="hero-cta" href="/application">Apply Now</a>
          </div>
          <div className="hero-image">
            <img src={hero.image} alt="how to apply" />
          </div>
        </div>

        <div className="steps-list">
          {steps.map((s) => (
            <div key={s.id} className="step-card">
              <div className="step-icon">
                <img src={s.icon} alt={s.title} />
              </div>
              <div className="step-body">
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="additional-resources">
          <h2>Helpful Resources</h2>
          <div className="resources-grid">
            <div className="resource-card">
              <img src="/src/assets/images/step_by_step_page/Get a peace of mind with Cagamas.png" alt="guide" />
              <div className="resource-meta">
                <h4>Guide to Property Eligibility</h4>
                <a href="#" className="resource-link">Download PDF</a>
              </div>
            </div>

            <div className="resource-card small">
              <img src="/src/assets/images/step_by_step_page/Image.png" alt="guide2" />
              <div className="resource-meta">
                <h4>What to Prepare</h4>
                <a href="#" className="resource-link">Learn More</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default StepByStep
