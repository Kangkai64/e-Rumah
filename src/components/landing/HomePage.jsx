import './HomePage.css'
import heroImage from '../../assets/images/hero_coupleLookingPhone.jpg'
import eligibilityImage from '../../assets/images/hero_What-you-need-to-know.jpg'
import partnershipImage from '../../assets/images/hero_aboutUs.jpeg'
import elderImage from '../../assets/images/hero_Asian-Attractive-Happy-Senior.jpg'

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

      {/* Services Cards Section */}
      <section className="services-cards">
        <div className="services-container">
          <div className="service-card">
            <div className="service-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L4 16v24h12v-12h16v12h12V16L24 4z" fill="#A8202D"/>
                <circle cx="24" cy="22" r="3" fill="#A8202D"/>
              </svg>
            </div>
            <h3>Healthcare Financing</h3>
            <p>We provide healthcare financing options to help you cover medical expenses and ensure you receive the best care possible.</p>
          </div>

          <div className="service-card">
            <div className="service-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="12" width="36" height="28" rx="2" stroke="#A8202D" strokeWidth="2" fill="none"/>
                <path d="M24 12V4M18 4h12M24 20v8M20 24h8" stroke="#A8202D" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Retirement Residence Assistance</h3>
            <p>If you need to move to a retirement home, we can help you find the right place and provide financial assistance to make the transition easier.</p>
          </div>

          <div className="service-card service-card-image">
            <img src={elderImage} alt="Property" />
          </div>

          <div className="service-card">
            <div className="service-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="12" width="32" height="28" rx="2" stroke="#A8202D" strokeWidth="2" fill="none"/>
                <path d="M8 20h32M16 8v8M32 8v8" stroke="#A8202D" strokeWidth="2"/>
                <rect x="14" y="26" width="6" height="6" fill="#A8202D"/>
              </svg>
            </div>
            <h3>Property Valuation Estimation</h3>
            <p>We can provide you with an estimated value of your property, helping you understand its worth in the current market.</p>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="quote-section">
        <div className="quote-container">
          <p className="quote-label">WHAT SETS US DIFFERENT</p>
          <h2 className="quote-text">
            We invest in people to create a progressive society that is meaningfully invested in each other.
          </h2>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="eligibility-section">
        <div className="eligibility-container">
          <div className="eligibility-content">
            <p className="eligibility-label">ELIGIBILITY CRITERIA</p>
            <h2 className="eligibility-title">What you need to know</h2>
            <p className="eligibility-subtitle">Basic requirements</p>
            <ul className="eligibility-list">
              <li>Applicants should be aged 55 years & above</li>
              <li>Be a borrower, sole, or joint of a fully paid residential property</li>
              <li>Eligible for the property for use by the borrower(s) for the remaining part of their life</li>
              <li>Have a net monthly household income not exceeding RM7,500</li>
              <li>Not be recipient of monthly assistance benefit or facing enforcement actions, including bankruptcy, civil suits, and levy action</li>
              <li>Not have mortgage or charges registered on your property, with no issues regarding property ownership, or be under any court proceedings</li>
              <li>Have no existing Housing Loan for the property</li>
              <li>Not be recipients in any loan assistance schemes</li>
              <li>Own an MPB/MB house (not suitable for Taman RMBI 4G Series)</li>
              <li>Own a property that has no issue of ownership dispute and no legal action against the property</li>
              <li>Own a property that is in habitable condition</li>
              <li>Note: Borrowers at least 55 years old and not exceeding 80 years old can apply under this scheme</li>
            </ul>
            <div className="eligibility-buttons">
              <button className="btn-outline">Hear in Pdf</button>
              <button className="btn-outline">Download Brochure</button>
              <button className="btn-primary">Calculate</button>
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
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="12" width="32" height="24" rx="2" stroke="#A8202D" strokeWidth="2" fill="none"/>
                  <path d="M8 20h32M16 12v-4M32 12v-4" stroke="#A8202D" strokeWidth="2"/>
                </svg>
              </div>
              <h3>BENEFITS COMPRISING PROCEEDS OF UP TO RM 1,500 FOR HEALTHCARE NEEDS, PROPERTY MAINTENANCE AND RENT CLEARANCE</h3>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="16" stroke="#A8202D" strokeWidth="2" fill="none"/>
                  <path d="M24 12v12l8 4" stroke="#A8202D" strokeWidth="2"/>
                </svg>
              </div>
              <h3>MONTHLY PAYMENT OF RM 300 REPAYMENT PLUS LIVING EXPENSES</h3>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L4 16v16c0 8 8 12 20 12s20-4 20-12V16L24 4z" stroke="#A8202D" strokeWidth="2" fill="none"/>
                  <path d="M24 24v12" stroke="#A8202D" strokeWidth="2"/>
                </svg>
              </div>
              <h3>ABLE TO PLACE PROPERTY INHERITED UPON HIS/HER DEATH IN THE COMFORT OF HOME</h3>
            </div>
          </div>

          <h3 className="complementary-title">Complementary Services</h3>
          
          <div className="complementary-grid">
            <div className="complementary-item">
              <div className="complementary-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4L4 12v16h32V12L20 4z" stroke="#A8202D" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <p>Free rent for spouse after death</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="16" r="6" stroke="#A8202D" strokeWidth="2" fill="none"/>
                  <path d="M8 32c0-6 5-10 12-10s12 4 12 10" stroke="#A8202D" strokeWidth="2"/>
                </svg>
              </div>
              <p>Basic proof of age</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="12" stroke="#A8202D" strokeWidth="2" fill="none"/>
                  <path d="M20 12v8l6 4" stroke="#A8202D" strokeWidth="2"/>
                </svg>
              </div>
              <p>Transfer to a public sector provider</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M8 8h24v24H8z" stroke="#A8202D" strokeWidth="2" fill="none"/>
                  <path d="M20 8v24M8 20h24" stroke="#A8202D" strokeWidth="2"/>
                </svg>
              </div>
              <p>Free monthly automatic payment</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="12" width="24" height="20" rx="2" stroke="#A8202D" strokeWidth="2" fill="none"/>
                  <path d="M12 12V8a8 8 0 0116 0v4" stroke="#A8202D" strokeWidth="2"/>
                </svg>
              </div>
              <p>No age limit extending payment options</p>
            </div>

            <div className="complementary-item">
              <div className="complementary-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="6" y="10" width="28" height="20" rx="2" stroke="#A8202D" strokeWidth="2" fill="none"/>
                  <path d="M10 16h20M10 22h20" stroke="#A8202D" strokeWidth="2"/>
                </svg>
              </div>
              <p>No legal fee and processing</p>
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
                  <button className="btn-outline-dark">About Us</button>
                  <button className="btn-filled">Get Started</button>
                </div>
              </div>
            </div>

            <div className="partnership-right">
              <div className="philosophy-header">
                <h3>Our decisions and actions are guided by these philosophies</h3>
              </div>
              
              <div className="philosophy-cards">
                <div className="philosophy-card">
                  <div className="philosophy-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="16" stroke="#A8202D" strokeWidth="2" fill="none"/>
                      <path d="M24 16v8l6 4" stroke="#A8202D" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h4>Innovation</h4>
                  <p>Innovate in creating the ecosystem, bringing new solutions to market that aid in the social advancement of our society</p>
                </div>

                <div className="philosophy-card">
                  <div className="philosophy-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="18" r="6" stroke="#A8202D" strokeWidth="2" fill="none"/>
                      <path d="M12 36c0-6 5-10 12-10s12 4 12 10" stroke="#A8202D" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h4>Impact</h4>
                  <p>Inspire in reinforcing shared values and beliefs, and build trust towards achieving our societal goals</p>
                </div>

                <div className="philosophy-card">
                  <div className="philosophy-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M24 8l6 12h12l-10 8 4 12-12-8-12 8 4-12-10-8h12z" stroke="#A8202D" strokeWidth="2" fill="none"/>
                    </svg>
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
          <div className="partners-section">
            <p className="partners-title">e-Rumah partners and investors creating a better tomorrow</p>
            <div className="partners-logos">
              <img src="/src/assets/images/hero_apple.png" alt="Apple" className="partner-logo" />
              <img src="/src/assets/images/hero_tesla.png" alt="Tesla" className="partner-logo" />
              <img src="/src/assets/images/hero_sunway.png" alt="Sunway" className="partner-logo" />
            </div>
          </div>
    </div>
  )
}

export default HomePage
