// StepByStep Component - Step by step guide for applying to Reverse Mortgage Scheme
// Displays scheme information, eligibility, application process, and FAQs

import './StepByStep.css'
import Container from '../common/Container'

function StepByStep() {
  // Application steps
  const applicationSteps = [
    {
      id: 1,
      icon: '👥',
      title: 'Walk in to any of the EPF / AKPK Designated Branches below',
      branches: ['EPF Kuala Lumpur', 'EPF Petaling Jaya', 'EPF Johor Bahru', 'EPF Seremban Jaya', 'EPF Ipoh', 'EPF Seremban', 'EPF Melaka', 'AKPK Kuala Lumpur*', 'AKPK Johor Bahru', 'AKPK Penang', 'AKPK Ipoh', 'AKPK Melaka', '*For Selangor, Negeri Sembilan & Kuala Lumpur']
    },
    {
      id: 2,
      icon: '📋',
      title: 'Take a pre-assessment test to determine your eligibility'
    },
    {
      id: 3,
      icon: '📅',
      title: "Make an appointment with AKPK's Financial Advisor"
    },
    {
      id: 4,
      icon: '📝',
      title: 'Complete the reverse mortgage financial advisory module with AKPK'
    },
    {
      id: 5,
      icon: '✓',
      title: 'Submit your application to e-Rumah/AKPK, Online Application is now available'
    }
  ]

  const eligibilityCriteria = {
    borrower: [
      'Malaysian aged 55 years and above, applicable for single and joint list users',
      'Owner or joint owners of a residential property'
    ],
    property: [
      'Residential property in Malaysia in Borrower\'s name (joint ownership for list users)',
      'Borrower occupied and the primary place of residence',
      'Individual property or strata property with remaining lease tenure not less than 50 years',
      'Unencumbered and mortgage-free'
    ]
  }

  const faqs = [
    {
      id: 1,
      question: 'What happens to the balance payed if a borrower passes away just a few years after signing up for the Reverse Mortgage Loan? Will it be passed on to the next-of-kin?'
    },
    {
      id: 2,
      question: 'Can a borrower surrender or terminate the loan during his/her lifetime?'
    },
    {
      id: 3,
      question: 'For joint-borrowers, would the property be sold if one of the joint-borrowers passes away and the surviving joint-borrower has to move out as a result?'
    }
  ]

  return (
    <div className="sbs-page">
      {/* Hero Section */}
      <div className="sbs-hero-section">
        <div className="sbs-hero-content">
          <h1 className="sbs-hero-title">Reverse Mortgage Scheme</h1>
          <p className="sbs-hero-desc">
            Enabling retired home owners to gain access to a lifetime of supplemental income stream for daily subsistence to cater to potential increases in the cost of living.
          </p>
          <p className="sbs-hero-desc">
            From 3 December 2025, Reverse Mortgage Scheme will be available in Klang Valley, Johor Bahru, Penang Island, Ipoh, Seremban and Malacca City. Customer can now submit application online.
          </p>
          <a href="#sbs-how-to-apply" className="sbs-scroll-btn">⬇ SCROLL DOWN</a>
        </div>
        <div className="sbs-hero-image">
          <img src="/src/assets/images/step_by_step_page/banner1.png" alt="Reverse Mortgage Scheme" />
        </div>
      </div>
      <Container>
        {/* About Section */}
        <section className="sbs-about-section">
          <h2>About Reverse Mortgage Scheme</h2>
          <p className="sbs-section-subtitle">Senior home owners can now generate cash during retirement by taking out a reverse mortgage</p>

          <div className="sbs-about-grid">
            <div className="sbs-about-card">
              <div className="sbs-card-icon">💳</div>
              <h3>Lifetime tenure</h3>
              <p>Fixed monthly payouts throughout the entire life of the borrower or joint borrower.</p>
            </div>

            <div className="sbs-about-card">
              <div className="sbs-card-icon">🏠</div>
              <h3>Residing in own home</h3>
              <p>Borrower and joint borrower can continue to stay in their property throughout their life.</p>
            </div>

            <div className="sbs-about-card">
              <div className="sbs-card-icon">❌</div>
              <h3>No repayment during lifetime</h3>
              <p>Repayment only due when borrower or joint borrower passes away, whichever later.</p>
            </div>

            <div className="sbs-about-card">
              <div className="sbs-card-icon">❤️</div>
              <h3>Non-recourse</h3>
              <p>Borrower's estate will not be responsible for any shortfall to settle the Reverse Mortgage Loan if the sale proceeds of the property is less than the outstanding loan amount.</p>
            </div>
          </div>
        </section>

        {/* What is Reverse Mortgage Scheme */}
        <section className="sbs-what-section">
          <h2>What is Reverse Mortgage Scheme?</h2>
          <p className="sbs-section-desc">
            Reverse Mortgage Scheme is a type of loan that is targeted for the elderly or retired home owners. Since, and they convert their one-by-their residential property – into a fixed monthly income stream throughout their lifetime, without necessarily owning their home.
          </p>

          <ul className="sbs-benefits-list">
            <li>✓ To enable retired home owners to gain access to a lifetime of supplemental income stream for daily subsistence.</li>
            <li>✓ Home owners can now draw on their home equity to supplement their retirement income, thus reducing dependency on their next-of-kin.</li>
          </ul>
        </section>

        {/* How Does It Work */}
        <section className="sbs-how-section" id="sbs-how-does-it-work">
          <h2>How does it work?</h2>
          <p className="sbs-section-subtitle">To qualify for a Reverse Mortgage Loan, the person must be at least 55 years of age and own a home.</p>

          <div className="sbs-eligibility-grid">
            <div className="sbs-eligibility-card">
              <h3>👥 Eligibility Criteria for Borrower</h3>
              <ul>
                {eligibilityCriteria.borrower.map((item, idx) => (
                  <li key={idx}>✓ {item}</li>
                ))}
              </ul>
            </div>

            <div className="sbs-eligibility-card">
              <h3>🏠 Eligibility Criteria for Property</h3>
              <ul>
                {eligibilityCriteria.property.map((item, idx) => (
                  <li key={idx}>✓ {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Get Peace of Mind Section */}
        <section className="sbs-peace-section">
          <div className="sbs-peace-image">
            <img src="/src/assets/images/step_by_step_page/Get a peace of mind with Cagamas.png" alt="Peace of mind" />
          </div>
          <div className="sbs-peace-content">
            <h2>Get peace of mind with Reverse Mortgage at a fixed rate financing</h2>
            <p>
              The amount of payout that a Borrower receives will largely depend on the Borrower's age and property value, location and type.
            </p>
            <p>
              Use our reverse mortgage calculator to estimate the monthly payout amount. A step-by-step loan session is available with monthly cash disbursements is also available. Learn more about the sum total and costs here.
            </p>
          </div>
        </section>

        {/* How To Apply */}
        <section className="sbs-apply-section" id="sbs-how-to-apply">
          <h2>How To Apply</h2>
          <p className="sbs-section-subtitle">
            We make the application process for Reverse Mortgage Scheme as simple as possible. Follow these steps below and you're on your way to a Reverse Mortgage Loan!
          </p>

          <div className="sbs-apply-steps">
            {applicationSteps.map((step) => (
              <div key={step.id} className="sbs-apply-step">
                <div className="sbs-step-icon">{step.icon}</div>
                <div className="sbs-step-content">
                  <p className="sbs-step-text">{step.title}</p>
                  {step.branches && (
                    <div className="sbs-branches-list">
                      {step.branches.map((branch, idx) => (
                        <span key={idx} className="sbs-branch-item">✓ {branch}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="sbs-view-more-btn-container">
            <button className="sbs-view-more-btn">View More</button>
          </div>
        </section>

        {/* More Information */}
        <section className="sbs-more-info-section">
          <h2>More Information</h2>
          <div className="sbs-info-cards">
            <a href="#" className="sbs-info-card">
              📄 Application Form
            </a>
            <a href="#" className="sbs-info-card">
              📘 Brochure (BM)
            </a>
            <a href="#" className="sbs-info-card">
              📗 Brochure (CN)
            </a>
            <a href="#" className="sbs-info-card">
              📙 Brochure (EN)
            </a>
          </div>
        </section>

        {/* FAQs */}
        <section className="sbs-faq-section">
          <h2>Frequently Asked Questions</h2>
          <p className="sbs-section-subtitle">
            Have a question about Reverse Mortgage? Find the answers about Reverse Mortgage Loan eligibility, costs and more. here in our FAQs
          </p>

          <div className="sbs-faq-items">
            {faqs.map((faq) => (
              <div key={faq.id} className="sbs-faq-item">
                <p className="sbs-faq-question">{faq.question}</p>
                <span className="sbs-faq-toggle">⌄</span>
              </div>
            ))}
          </div>

          <div className="sbs-view-more-btn-container">
            <button className="sbs-view-more-btn">View More</button>
          </div>
        </section>
      </Container>

      {/* Contact Section */}
      <section className="sbs-contact-section">
        <div className="sbs-contact-content">
          <h2>Want to talk to us about Reverse Mortgage?</h2>
          <p>We're here to answer your questions and guide you through the Reverse Mortgage Scheme process</p>
          <button className="sbs-contact-btn">Contact Us</button>
        </div>
        <div className="sbs-contact-image">
          <img src="/src/assets/images/step_by_step_page/Image.png" alt="Contact us" />
        </div>
      </section>
    </div>
  )
}

export default StepByStep
