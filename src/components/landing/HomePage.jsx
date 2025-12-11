import './HomePage.css'
import Button from '../common/Button.jsx'
import heroImage from '../../assets/images/main_page/hero_coupleLookingPhone.jpg'
import eligibilityImage from '../../assets/images/main_page/hero_whatYouNeedToKnow.jpg'
import partnershipImage from '../../assets/images/main_page/hero_aboutUs.jpeg'
import elderImage from '../../assets/images/main_page/hero_asianAttractiveHappySenior.jpg'
import appleLogo from '../../assets/images/main_page/hero_apple.png'
import teslaLogo from '../../assets/images/main_page/hero_tesla.png'
import sunwayLogo from '../../assets/images/main_page/hero_sunway.png'

import iconHealthcare from '../../assets/icons/main_page/icon_healthcareFinancing.png'
import iconRetirement from '../../assets/icons/main_page/icon_retirementResilience.png'
import iconProperty from '../../assets/icons/main_page/icon_propertyValueEstimation.svg'
import iconBenefit1 from '../../assets/icons/main_page/icon_schemeBenefits1.jpg'
import iconBenefit2 from '../../assets/icons/main_page/icon_schemeBenefits2.png'
import iconBenefit3 from '../../assets/icons/main_page/icon_schemeBenefits3.png'
import iconComplimentary1 from '../../assets/icons/main_page/icon_complimentaryService1.png'
import iconComplimentary2 from '../../assets/icons/main_page/icon_complimentaryService2.png'
import iconComplimentary3 from '../../assets/icons/main_page/icon_complimentaryService3.png'
import iconComplimentary4 from '../../assets/icons/main_page/icon_complimentaryService4.png'
import iconComplimentary5 from '../../assets/icons/main_page/icon_complimentaryService5.png'
import iconInnovation from '../../assets/icons/main_page/icon_innovation.png'
import iconImpact from '../../assets/icons/main_page/icon_impact.png'
import iconIntegrity from '../../assets/icons/main_page/icon_integrity.png'

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-image">
            <img src={heroImage} alt="Senior couple" />
            <div className="hero-badge">
              <h2>Innovation-driven healthcare and retirement financing for Malaysia's seniors</h2>
            </div>
          </div>
        </div>
      </section>

      {/* Services + Narrative Section */}
      <section className="services-section">
        <div className="services-shell">
          <div className="services-left">
            <p className="section-label">WHAT WE DO AT E-RUMAH</p>
            <h2 className="services-heading">
              We invest in people to create a progressive society that is meaningfully invested in each other.
            </h2>
            <Button className="btn btn-tertiary" showArrow={true} to={"/about"}>Our Impact</Button>
          </div>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <img src={iconHealthcare} alt="Healthcare financing icon" className="icon-img" />
              </div>
              <h3>Healthcare Financing</h3>
              <p>e-Rumah enables seniors battling cancer to fund their treatments and retirement by unlocking wealth from their biggest assets: their homes.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <img src={iconRetirement} alt="Retirement resilience icon" className="icon-img" />
              </div>
              <h3>Retirement Resilience</h3>
              <p>e-Rumah enhances the financial resilience of seniors with lump sum payouts and monthly annuities for life while being able to age in place without moving.</p>
            </div>

            <div className="service-card service-card-image">
              <img src={elderImage} alt="Smiling senior at home" />
            </div>

            <div className="service-card">
              <div className="service-icon">
                <img src={iconProperty} alt="Property value estimation icon" className="icon-img" />
              </div>
              <h3>Property Value Estimation</h3>
              <p>e-Rumah provides an estimation to your property’s value and recommendations to make more out of your assets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="eligibility-section">
        <div className="eligibility-container">
          <div className="eligibility-content">
            <p className="eligibility-label">ELIGIBILITY CRITERIA</p>
            <h2 className="eligibility-title">What you need to know</h2>
            <p className="eligibility-subtitle">Senior must be:</p>
            <ul className="eligibility-list">
              <li>Applicants should be aged 55 years & above</li>
              <li>Owner of the home and has the requisite legal capacity to sell the home</li>
            </ul>
            <p className="eligibility-subtitle">Property must be:</p>
            <ul className="eligibility-list">
              <li>Freehold, landed and located in Klang Valley (certain postcodes excluded), Johor Bahru, Penang, Ipoh, Seremban and Malacca City</li>
              <li>Occupied by owner as their primary place of residence</li>
              <li>Free from all encumbrances, such as mortgage and/or other financial liabilities. All property taxes,management fees (where applicable) and utility bills have to be paid up to date</li>
              <li>Not built on Malay reserved land, not a low-cost/ medium-cost affordable home, not adesignated Bumiputera unit</li>
              <li>Valid and effective legal title issued under the name of the senior</li>
              <li>Valid Certificate of Completion and Compliance / Certificate of Fitness for Occupation</li>
              <li>Meets e-Rumah evaluation criteria</li>
            </ul>
            <div className="eligibility-buttons">
              <Button className="btn btn-secondary" showArrow={true}>FAQs</Button>
              <Button className="btn btn-secondary" showArrow={true}>Excluded Postcodes</Button>
              <Button className="btn btn-secondary" showArrow={true}>Brochure</Button>
            </div>
          </div>
          <div className="eligibility-image">
            <img src={eligibilityImage} alt="Senior couple" />
          </div>
        </div>
      </section>

      {/* Scheme Benefits Section */}
      <section className="scheme-benefits">
        <div className="benefits-container">
          <p className="benefits-label">WHAT WILL YOU GET</p>
          <h2 className="benefits-title">Scheme Benefits</h2>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <img src={iconBenefit1} alt="Benefit lump sum icon" className="icon-img" />
              </div>
              <h3>Immediate lumpsum payout up to 20% for healthcare needs, property maintenance and debt clearance</h3>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <img src={iconBenefit2} alt="Benefit monthly icon" className="icon-img" />
              </div>
              <h3>Monthly lifetime instalment for living expenses</h3>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <img src={iconBenefit3} alt="Benefit age in place icon" className="icon-img" />
              </div>
              <h3>Age in place without moving and in the comfort of home</h3>
            </div>
          </div>

          <h3 className="complementary-title">Complementary Services</h3>

          <div className="complementary-grid">
            <div className="complementary-item">
              <div className="complementary-icon">
                <img src={iconComplimentary1} alt="Complimentary service 1" className="icon-img" />
              </div>
              <p>Basic home repairs and home maintenance*</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <img src={iconComplimentary2} alt="Complimentary service 2" className="icon-img" />
              </div>
              <p>Basic pest control*</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <img src={iconComplimentary3} alt="Complimentary service 3" className="icon-img" />
              </div>
              <p>Selected fire safety devices provided</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <img src={iconComplimentary4} alt="Complimentary service 4" className="icon-img" />
              </div>
              <p>Home insurance (for structure only)</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <img src={iconComplimentary5} alt="Complimentary service 5" className="icon-img" />
              </div>
              <p>Quit rent and assessment charges covered fully</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="partnership-section">
        <div className="partnership-container">
          <p className="partnership-label">THE PEOPLE BEHIND E-RUMAH</p>

          <div className="partnership-content">
            <div className="partnership-left">
              <div className="partnership-image">
                <img src={partnershipImage} alt="AKPK Partnership" />
              </div>
              <div className="partnership-text">
                <h2>A partnership with innovation and impact at its core</h2>
                <div className="partnership-buttons">
                  <Button variant="tertiary" to="/about" showArrow={true}>About Us</Button>
                  <Button variant="primary" to="/get-started" showArrow={true}>Our Impact</Button>
                </div>
              </div>
            </div>

            <div className="partnership-right">
              <div className="philosophy-cards">
                <div className="philosophy-card">
                  <h3>Our decisions and actions are guided by these philosophies</h3>
                </div>
                <div className="philosophy-card">
                  <div className="philosophy-icon">
                    <img src={iconInnovation} alt="Innovation icon" className="icon-img" />
                  </div>
                  <h4>Innovation</h4>
                  <p>Innovate in creating the ecosystem, bringing new solutions to market that aid in the social advancement of our society</p>
                </div>

                <div className="philosophy-card">
                  <div className="philosophy-icon">
                    <img src={iconImpact} alt="Impact icon" className="icon-img" />
                  </div>
                  <h4>Impact</h4>
                  <p>Inspire in reinforcing shared values and beliefs, and build trust towards achieving our societal goals</p>
                </div>

                <div className="philosophy-card">
                  <div className="philosophy-icon">
                    <img src={iconIntegrity} alt="Integrity icon" className="icon-img" />
                  </div>
                  <h4>Integrity</h4>
                  <p>We are an ethical, efficient representative for you in your lifetime, and in your legacy. We aim to uphold our core values and principles.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="partners-section">
        <div className="partners-container">
          <div className="partners-banner">
            <p>e-Rumah partners and investors creating a better tomorrow</p>
          </div>
          <div className="partners-logos">
            <img src={appleLogo} alt="Apple" className="partner-logo" />
            <img src={teslaLogo} alt="Tesla" className="partner-logo" />
            <img src={sunwayLogo} alt="Sunway" className="partner-logo" />
          </div>
        </div>
      </section>

      {/* Important Notice Section */}
      <section className="notice-section">
        <div className="notice-container">
          <div className="notice-left">
            <h3>Important Notice</h3>
            <p>Our communications with you start from a safe and trusted place to protect you and the public. As policy to help keep you safe:</p>
            <ol>
              <li>We do not appoint individuals other than our employees to represent us.</li>
              <li>We will never ask you for your banking details or passwords.</li>
              <li>We will never ask you for any payments or fees as e-Rumah is funded by institutional investors participating in the Scheme.</li>
              <li>We will never send you links in any SMS or emails from us.</li>
            </ol>
            <p className="notice-bottom">When in doubt, always connect with us via the e-Rumah website to verify.</p>
          </div>
          <div className="notice-right">
            <h3>Our Address</h3>
            <p className="address-lines">
              e-Rumah Sdn Bhd HeadQuarter<br />
              219, Jalan Yap Ah Loy<br />
              50300 Kuala Lumpur<br />
              Malaysia
            </p>
            <Button variant="secondary" to="/about" showArrow={true}>Connect with Us</Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
