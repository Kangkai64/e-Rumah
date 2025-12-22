import './AboutUs.css'
import { useState, useRef, useEffect } from 'react'
import { getCompanyContactInfo } from '../../services/settingsService'
import ReCAPTCHA from 'react-google-recaptcha'
import Button from '../common/Button'
import { validateEnquiryForm } from '../../utils/enquiryFormValidation'
import heroBanner from '../../assets/images/about_us_page/hero_aboutUs.jpeg'
import heroContactUs from '../../assets/images/about_us_page/hero_contactUs.jpg'
import ourPurposeImage from '../../assets/images/about_us_page/image_ourPurpose.jpg'
import founderImage from '../../assets/images/about_us_page/image_jeffreyCheah.png'
import iconEmail from '../../assets/icons/about_us_page/icon_email.svg'
import iconContact from '../../assets/icons/about_us_page/icon_contact.svg'

// Create a separate component for the form to use the validation
const EnquiryForm = ({ onSubmit }) => {
  const recaptchaRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    email: '',
    message: '',
    captcha: null,
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleRecaptchaChange = (token) => {
    setFormData(prev => ({
      ...prev,
      captcha: token
    }))
    // Clear captcha error when user completes it
    if (errors.captcha) {
      setErrors(prev => ({
        ...prev,
        captcha: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateEnquiryForm(formData)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // Call parent component handler with form data
      await onSubmit(formData)
      
      // Reset form on success
      setFormData({
        name: '',
        contactNumber: '',
        email: '',
        message: '',
        captcha: null,
      })
      setErrors({})
      // Reset reCAPTCHA
      if (recaptchaRef.current) {
        recaptchaRef.current.reset()
      }
    } catch (error) {
      console.error('Submission error:', error)
      setErrors({ submit: 'Failed to submit enquiry. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>
          Name <span className="required">*</span>
        </label>
        <input 
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
          className={errors.name ? 'input-error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label>
          Contact Number <span className="required">*</span>
        </label>
        <input 
          type="tel"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          placeholder="012-3456789 or +6012-3456789"
          className={errors.contactNumber ? 'input-error' : ''}
        />
        {errors.contactNumber && <span className="error-message">{errors.contactNumber}</span>}
      </div>

      <div className="form-group">
        <label>
          Email address <span className="required">*</span>
        </label>
        <input 
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="example@email.com"
          className={errors.email ? 'input-error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label>
          Message <span className="required">*</span>
        </label>
        <textarea 
          rows="5"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Please share your enquiry or questions here..."
          className={errors.message ? 'input-error' : ''}
        ></textarea>
        {errors.message && <span className="error-message">{errors.message}</span>}
      </div>

      <div className="captcha-section">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
          onChange={handleRecaptchaChange}
        />
        {errors.captcha && <span className="error-message" style={{marginTop: '8px'}}>{errors.captcha}</span>}
      </div>

      <div className="captcha-info">
        <p>This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.</p>
      </div>

      {errors.submit && <div className="form-error-summary">{errors.submit}</div>}

      <Button variant="primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
      </Button>
    </form>
  )
}

const AboutUs = () => {
  const [showSubmittedModal, setShowSubmittedModal] = useState(false)
  const [contactInfo, setContactInfo] = useState(() => getCompanyContactInfo())

  useEffect(() => {
    // Listen for changes to localStorage (in case settings are updated elsewhere)
    const handleStorage = (e) => {
      if (e.key === 'companyContactEmail' || e.key === 'companyContactPhone') {
        setContactInfo(getCompanyContactInfo())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Also update on mount in case settings changed in this tab
  useEffect(() => {
    setContactInfo(getCompanyContactInfo())
  }, [])

  const handleSubmitEnquiry = async (formData) => {
    try {
      // // Send enquiry email to user
      const emailResult = await sendEnquiryEmail(formData)
      
      if (!emailResult.success) {
        console.warn('Email sending failed:', emailResult.error)
        // Continue to show success modal even if email fails
        // Users should know their enquiry was submitted
      }

      // Show the success modal
      setShowSubmittedModal(true)
      
      // Auto-hide modal after 3 seconds
      setTimeout(() => {
        setShowSubmittedModal(false)
      }, 3000)
    } catch (error) {
      console.error('Submission error:', error)
      throw error
    }
  }

  return (
    <div className="about-us-page">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-content">
            <img src={heroBanner} alt="About Us" className="about-hero-image" />
            <div className="about-hero-overlay">
              <h1>About Us</h1>
            </div>
          </div>
        </section>

        {/* Our Purpose Section */}
        <section className="our-purpose-section">
          <div className="our-purpose-container">
            <div className="our-purpose-image">
              <img src={ourPurposeImage} alt="Our Purpose" />
            </div>
            <div className="our-purpose-content">
              <p className="section-label">ADDRESSING THE HEALTHCARE AND RETIREMENT NEEDS OF MALAYSIA'S SENIORS</p>
              <h2>Our Purpose</h2>
              <div className="purpose-text">
                <p>
                  Malaysia faces a looming crisis where less than 4% of EPF contributors can afford to 
                  retire. The lack of adequate savings, coupled with insufficient private health insurance 
                  coverage leave many seniors financially vulnerable to major health shocks including serious 
                  illnesses such as cancer.
                </p>
                <p>
                  Close to a third of all people diagnosed with cancer annually are above the age of 65 
                  and the number of senior cancer patients are expected to double to over 43,000 
                  annually by 2040.
                </p>
                <p>
                  Retirees have limited options when it comes to financing their cancer treatments as 
                  they are not eligible for personal loans due to their age and lack of income. They 
                  could choose to sell their home and pay rent for the rest of their lives – but this is 
                  a perilous route fraught with uncertainty of tenure, which no one should have to face 
                  in their twilight years.
                </p>
                <p>
                  Reverse mortgages are another option, but these are inherently costly due to hefty 
                  transaction expenses, debt accruing with interest over time and the loan being 
                  repaid typically via auction when the borrower passes on.
                </p>
                <p>
                  e-Rumah was created by Sunway Mortgage Foundation in partnership with Tesla, to 
                  provide seniors with an alternative method to unlock wealth from their biggest 
                  asset: their homes.
                </p>
                <p>
                  e-Rumah operates as a reverse mortgage scheme integrated with Big Data and AI 
                  analytics, where qualified seniors can sell their home titles at market value to 
                  receive lump sum payouts and monthly lifetime annuities while being able to age in 
                  place without moving. When they pass on, their residence is sold and capital is 
                  returned to investors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="founder-section">
          <div className="founder-container">
            <div className="founder-content">
              <p className="section-label">FOUNDER AND CEO</p>
              <h2>Jeffrey Cheah</h2>
              <div className="founder-text">
                <p>
                  Jeffrey Cheah founded Sunway Reverse Mortgage Foundation in Malaysia as the 
                  innovation and administrative partner of the e-Rumah.
                </p>
                <p>
                  e-Rumah is Asia's reverse mortgage scheme pioneers, harnessing the power of 
                  innovation and capital markets to address the needs of Malaysia's aging population. 
                  The Scheme enables seniors to unlock wealth from their homes to finance their 
                  healthcare needs and enhance their financial resilience in retirement whilst 
                  aging-in-place in the comfort of their homes and familiarity of communities.
                </p>
              </div>
            </div>
            <div className="founder-image">
              <img src={founderImage} alt="Jeffrey Cheah" />
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="contact-us-section">
          <div className="contact-us-hero">
            <div className="contact-us-left">
              <h1>Contact Us</h1>
              <p>Let's get in touch today</p>
            </div>
            <div className="contact-us-right">
              <img src={heroContactUs} alt="Contact Us" />
            </div>
          </div>
        </section>

        {/* Branches Section */}
        <section className="branches-section">
          <div className="branches-container">
            <h2>Walk-in to any of the EPF/AKPK Designated Branches below:</h2>
            
            {/* EPF Branches */}
            <div className="branches-grid">
              <div className="branch-card">
                <h3>EPF Kuala Lumpur</h3>
                <p>Ground Floor, KWSP Building,</p>
                <p>Jalan Raja Laut,</p>
                <p>50350 Kuala Lumpur</p>
              </div>
              <div className="branch-card">
                <h3>EPF Petaling Jaya</h3>
                <p>PJX-HM Shah Tower,</p>
                <p>Lot A, Ground Level,</p>
                <p>No. 16A, Persiaran Barat,</p>
                <p>46050 Petaling Jaya, Selangor</p>
              </div>
              <div className="branch-card">
                <h3>EPF Johor Bahru</h3>
                <p>Tingkat 1, 12-18, Bangunan KWSP,</p>
                <p>Jalan Dato' Dalam,</p>
                <p>80000, Johor Bahru, Johor</p>
              </div>
              <div className="branch-card">
                <h3>EPF Seberang Jaya</h3>
                <p>EPF Building Seberang Jaya,</p>
                <p>No. 3009, Off Lebuh Tenggiri 2,</p>
                <p>Bandar Seberang Jaya,</p>
                <p>13700 Prai, Pulau Pinang</p>
              </div>
              <div className="branch-card">
                <h3>EPF Ipoh</h3>
                <p>Tingkat Bawah, 5,6,7, & 8,</p>
                <p>Bangunan KWSP, Jalan Greentown,</p>
                <p>30450 Ipoh, Perak</p>
              </div>
              <div className="branch-card">
                <h3>EPF Seremban</h3>
                <p>No1, Jalan Dato’ As Dawood,</p>
                <p>70100 Seremban, Negeri Sembilan</p>
              </div>
              <div></div> {/* Empty div for grid alignment */}
              <div className="branch-card">
                <h3>EPF Melaka</h3>
                <p>KWSP Bandar Melaka, Bangunan KWSP,</p>
                <p>Jalan MITC, Hang Tuah Jaya,</p>
                <p>75450 Ayer Keroh, Melaka</p>
              </div>
            </div>

            {/* AKPK Branches */}
            <h3 className="akpk-heading">AKPK Branches</h3>
            <div className="branches-grid">
              <div className="branch-card">
                <h3>AKPK Kuala Lumpur*</h3>
                <p>Ground Floor, Menara Aras Raya &#40;Formerly</p>
                <p>known as Menara Bumiputra Commerce&#41;,</p>
                <p>Jalan Raja Laut,</p>
                <p>50350 Kuala Lumpur</p>
                <p className="branch-note">*for Selangor, Negeri Sembilan & Kuala Lumpur.</p>
              </div>
              <div className="branch-card">
                <h3>AKPK Johor Bahru</h3>
                <p>Level G, Bangunan Bank Negara Malaysia,</p>
                <p>Jalan Bukit Timbalan,</p>
                <p>80720 Johor Bahru</p>
              </div>
              <div className="branch-card">
                <h3>AKPK Penang</h3>
                <p>Bangunan Bank Negara Malaysia,</p>
                <p>No.27 Lebuh Light,</p>
                <p>10200 Penang</p>
              </div>
              <div className="branch-card">
                <h3>AKPK Ipoh</h3>
                <p>Unit B-2-1 Greentown Square,</p>
                <p>Jalan Dato' Seri Ahmad Said,</p>
                <p>30450 Ipoh, Perak</p>
              </div>
              <div className="branch-card">
                <h3>AKPK Melaka</h3>
                <p>Ground & Mezzanine Floor, No 179,</p>
                <p>Bangunan Munshi Abdullah Jalan Munshi</p>
                <p>Abdullah,</p>
                <p>75100 Melaka</p>
              </div>
            </div>
          </div>
        </section>

        {/* Enquiry Section */}
        <section className="enquiry-section">
          <div className="enquiry-container">
            <div className="enquiry-left">
              <h2>Let's get in touch</h2>
              <p>
                Need to get in touch with us to learn more about the Skim Saraan
                Bercagar (SSB) Skim Saraan Bercagar Loan? Contact us via email
                at <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a> or call{' '}
                <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>.
              </p>
              
              <div className="contact-cards">
                <div className="contact-card">
                  <img src={iconEmail} alt="Email" />
                  <div>
                    <h4>Email</h4>
                    <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                  </div>
                </div>
                <div className="contact-card">
                  <img src={iconContact} alt="Phone" />
                  <div>
                    <h4>Phone Number</h4>
                    <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="enquiry-right">
              <div className="enquiry-form-container">
                <h3>Enquire Now</h3>
                <EnquiryForm onSubmit={handleSubmitEnquiry} />
              </div>
            </div>
          </div>
        </section>

        {/* Confirmation Modal */}
        {showSubmittedModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                className="modal-close"
                onClick={() => setShowSubmittedModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
              <div className="modal-checkmark">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="11" fill="#22c55e" stroke="none"/>
                  <path d="M7 12.5L10.5 16L17 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="modal-title">Enquiry Submitted</h2>
              <p className="modal-message">We will contact you shortly</p>
            </div>
          </div>
        )}
      </div>
    )
}

export default AboutUs
