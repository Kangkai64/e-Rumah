// StepByStep Component - Step by step guide for applying to Reverse Mortgage Scheme
// Displays scheme information, eligibility, application process, and FAQs

import { useState } from 'react'
import { Link } from 'react-router-dom'
import './StepByStep.css'
import Container from '../common/Container'

function StepByStep() {
  const [expandedFaqId, setExpandedFaqId] = useState(null)
  // Application steps
  const applicationSteps = [
    {
      id: 1,
      icon: '/src/assets/icons/step_by_step_page/step1.svg',
      title: 'Walk in to any of the EPF / AKPK Designated Branches below',
      branches: ['EPF Kuala Lumpur', 'EPF Petaling Jaya', 'EPF Johor Bahru', 'EPF Seremban Jaya', 'EPF Ipoh', 'EPF Seremban', 'EPF Melaka', 'AKPK Kuala Lumpur*', 'AKPK Johor Bahru', 'AKPK Penang', 'AKPK Ipoh', 'AKPK Melaka', '*For Selangor, Negeri Sembilan & Kuala Lumpur']
    },
    {
      id: 2,
      icon: '/src/assets/icons/step_by_step_page/step2.svg',
      title: 'Take a pre-assessment test to determine your eligibility'
    },
    {
      id: 3,
      icon: '/src/assets/icons/step_by_step_page/step3.svg',
      title: "Make an appointment with AKPK's Financial Advisor"
    },
    {
      id: 4,
      icon: '/src/assets/icons/step_by_step_page/step4.svg',
      title: 'Complete the reverse mortgage financial advisory module with AKPK'
    },
    {
      id: 5,
      icon: '/src/assets/icons/step_by_step_page/step5.svg',
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
      question: 'What happens to the balance payed if a borrower passes away just a few years after signing up for the Reverse Mortgage Loan? Will it be passed on to the next-of-kin?',
      answer: 'The outstanding loan balance becomes due upon the borrower\'s passing. The estate can choose to repay the loan to retain the property, or the property may be sold to settle the outstanding amount.'
    },
    {
      id: 2,
      question: 'Can a borrower surrender or terminate the loan during his/her lifetime?',
      answer: 'Yes, a borrower can surrender or terminate the loan at any time during their lifetime by repaying the outstanding loan amount. Please contact us for details on the repayment and termination process.'
    },
    {
      id: 3,
      question: 'For joint-borrowers, would the property be sold if one of the joint-borrowers passes away and the surviving joint-borrower has to move out as a result?',
      answer: 'For joint-borrowers, the scheme continues for the surviving borrower if they remain in the property. The property would only need to be sold if the surviving borrower chooses to move out or passes away.'
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
          <a href="#sbs-how-to-apply" className="sbs-scroll-btn">
            <img src="/src/assets/icons/step_by_step_page/down_arrow.svg" alt="Scroll down"/>
            SCROLL DOWN
          </a>
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
            <div className="sbs-about-left">
              <h3>What is Reverse Mortgage Scheme?</h3>
              <p>Reverse Mortgage Scheme is a type of loan that is targeted for the elderly or retired home owners. Since, and they convert their one-by-their residential property – into a fixed monthly income stream throughout their lifetime, without necessarily owning their home.</p>
              
              <ul className="sbs-about-benefits">
                <li>To enable retired home owners to gain access to a lifetime of supplemental income stream for daily subsistence.</li>
                <li>Home owners can now draw on their home equity to supplement their retirement income, thus reducing dependency on their next-of-kin.</li>
              </ul>
            </div>

            <div className="sbs-about-right">
              <div className="sbs-about-card">
                <img src="/src/assets/icons/step_by_step_page/lifetime_tenure.svg" alt="Lifetime tenure" className="sbs-card-icon"/>
                <h3>Lifetime tenure</h3>
                <p>Fixed monthly payouts throughout the entire life of the borrower or joint borrower.</p>
              </div>

              <div className="sbs-about-card">
                <img src="/src/assets/icons/step_by_step_page/residing_in_own_home.svg" alt="Residing in own home" className="sbs-card-icon"/>
                <h3>Residing in own home</h3>
                <p>Borrower and joint borrower can continue to stay in their property throughout their life.</p>
              </div>

              <div className="sbs-about-card">
                <img src="/src/assets/icons/step_by_step_page/no_repayment.svg" alt="No repayment during lifetime" className="sbs-card-icon"/>
                <h3>No repayment during lifetime</h3>
                <p>Repayment only due when borrower or joint borrower passes away, whichever later.</p>
              </div>

              <div className="sbs-about-card">
                <img src="/src/assets/icons/step_by_step_page/non_recourse.svg" alt="Non-recourse" className="sbs-card-icon"/>
                <h3>Non-recourse</h3>
                <p>Borrower's estate will not be responsible for any shortfall to settle the Reverse Mortgage Loan if the sale proceeds of the property is less than the outstanding loan amount.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How Does It Work */}
        <section className="sbs-how-section" id="sbs-how-does-it-work">
          <h2>How does it work?</h2>
          <p className="sbs-section-subtitle">To qualify for a Reverse Mortgage Loan, the person must be at least 55 years of age and own a home.</p>

          <div className="sbs-eligibility-grid">
            <div className="sbs-eligibility-card">
              <img src="/src/assets/icons/step_by_step_page/eligibility_borrower.svg" alt="Eligibility Borrower" className="sbs-card-icon"/> 
              <h3>Eligibility Criteria for Borrower</h3>
              <ul>
                {eligibilityCriteria.borrower.map((item, idx) => (
                  <li key={idx}>✓ {item}</li>
                ))}
              </ul>
            </div>
            
            <div className="sbs-eligibility-card">
              <img src="/src/assets/icons/step_by_step_page/eligibility_property.svg" alt="Eligibility Property" className="sbs-card-icon"/> 
              <h3>Eligibility Criteria for Property</h3>
              <ul>
                {eligibilityCriteria.property.map((item, idx) => (
                  <li key={idx}>✓ {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </Container>

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

      <Container>


        {/* How To Apply */}
        <section className="sbs-apply-section" id="sbs-how-to-apply">
          <div className="sbs-apply-header">
            <h2>How To Apply</h2>
            <p className="sbs-section-subtitle">
              We make the application process for Reverse Mortgage Scheme as simple as possible. Follow these steps below and you're on your way to a Reverse Mortgage Loan!
            </p>
          </div>

          <div className="sbs-apply-steps">
            {applicationSteps.map((step) => (
              <div key={step.id} className={`sbs-apply-step ${step.id === 1 ? 'first-step' : ''}`}>
                <div className="sbs-step-icon">{step.icon.includes('.svg') ? <img src={step.icon} alt="Step icon" /> : step.icon}</div>
                <div className="sbs-step-content">
                  <p className="sbs-step-text">{step.title}</p>
                  {step.branches && (
                    <div className="sbs-branches-list">
                      {step.branches.map((branch, idx) => (
                        <span key={idx} className="sbs-branch-item">{branch}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
              <div
                key={faq.id}
                className={`sbs-faq-item ${expandedFaqId === faq.id ? 'expanded' : ''}`}
              >
                <button
                  className="sbs-faq-button"
                  onClick={() => setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)}
                  aria-expanded={expandedFaqId === faq.id}
                >
                  <p className="sbs-faq-question">{faq.question}</p>
                  <span className="sbs-faq-toggle">{expandedFaqId === faq.id ? '−' : '+'}</span>
                </button>
                {expandedFaqId === faq.id && (
                  <div className="sbs-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="sbs-view-more-btn-container">
            <Link to="/faqs" className="sbs-view-more-btn">View More</Link>
          </div>
        </section>
      </Container>

      {/* Contact Section */}
      <section className="sbs-contact-section">
        <div className="sbs-contact-content">
          <h2>Want to talk to us about Reverse Mortgage?</h2>
          <p>We're here to answer your questions and guide you through the Reverse Mortgage Scheme process</p>
          <Link to="/about" className="sbs-contact-btn">Contact Us</Link>
        </div>
        <div className="sbs-contact-image">
          <img src="/src/assets/images/step_by_step_page/ContactUs.png" alt="Contact us" />
        </div>
      </section>
    </div>
  )
}

export default StepByStep
