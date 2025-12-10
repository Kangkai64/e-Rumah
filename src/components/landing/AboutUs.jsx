import './AboutUs.css'
import heroImage from '../../assets/images/about_us/hero_contactUs.jpg'
import ourPurposeImage from '../../assets/images/about_us/image_ourPurpose.jpg'
import jeffreyCheahImage from '../../assets/images/about_us/image_jeffreyCheah.png'
import iconEmail from '../../assets/icons/about_us_page/icon_email.svg'
import iconContact from '../../assets/icons/about_us_page/icon_contact.svg'

const AboutUs = () => {
  return (
    <div className="about-us-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <img src={heroImage} alt="About Us" className="about-hero-image" />
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
            <img src={jeffreyCheahImage} alt="Jeffrey Cheah" />
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
            <img src={heroImage} alt="Contact Us" />
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
              <p>Ground Floor, KWSP Building</p>
              <p>Jalan Raja Laut</p>
              <p>50350 Kuala Lumpur</p>
            </div>
            <div className="branch-card">
              <h3>EPF Petaling Jaya</h3>
              <p>EPF Building</p>
              <p>Jalan Gasing</p>
              <p>46000 Petaling Jaya</p>
              <p>Tel.: 154, Persekaran Barat</p>
              <p>46050 Petaling Jaya, Selangor</p>
            </div>
            <div className="branch-card">
              <h3>EPF Johor Bahru</h3>
              <p>KWSP, Lot 111 & 112, Ground Floor, AKPK</p>
              <p>Johor</p>
              <p>80000, Johor Bahru, Johor</p>
            </div>
            <div className="branch-card">
              <h3>EPF Seberang Jaya</h3>
              <p>No. 3070, Mk 13</p>
              <p>Jalan Perusahaan</p>
              <p>Prai Industrial Estate</p>
              <p>13600, SPT, Lebuh Tenggiri 2</p>
              <p>Bandar Seberang Jaya</p>
            </div>
            <div className="branch-card">
              <h3>EPF Ipoh</h3>
              <p>No. 1, 3, 5, Ground Floor</p>
              <p>Persiaran AKPK, Greentown</p>
              <p>30450 Ipoh, Perak</p>
            </div>
            <div className="branch-card">
              <h3>EPF Seremban</h3>
              <p>70/80 Jalan Dato Bandar Tunggal</p>
              <p>70000, Seremban, Negeri Sembilan</p>
            </div>
            <div className="branch-card">
              <h3>EPF Melaka</h3>
              <p>KWSP, Lot 1831, Jalan Hang Jebat</p>
              <p>Kampung Satu, AKPK Melaka</p>
              <p>75200 Kota Melaka, Melaka</p>
            </div>
          </div>

          {/* AKPK Branches */}
          <h3 className="akpk-heading">AKPK Branches</h3>
          <div className="branches-grid">
            <div className="branch-card">
              <h3>AKPK Kuala Lumpur*</h3>
              <p>Ground Floor, Wisma Bank Rakyat</p>
              <p>No.1, Jalan Travers</p>
              <p>Kuala Lumpur</p>
              <p>50470 Kuala Lumpur</p>
              <p className="branch-note">*for Selangor, Negeri Sembilan & Kuala Lumpur.</p>
            </div>
            <div className="branch-card">
              <h3>AKPK Johor Bahru</h3>
              <p>Level 2A, Wisma AKPK (Blok B), Menara Ansar</p>
              <p>Johor Bahru Headquarters</p>
              <p>65 Jalan Trus</p>
              <p>80000 Johor Bahru, Johor</p>
            </div>
            <div className="branch-card">
              <h3>AKPK Penang</h3>
              <p>Block 3A Level 11, Komtar</p>
              <p>Jalan Penang</p>
              <p>10000 Penang</p>
              <p>Tel: 04 Penang Lebih</p>
              <p>016 Jalan Ujong</p>
            </div>
            <div className="branch-card">
              <h3>AKPK Ipoh</h3>
              <p>AKPK Ipoh, Wisma Bank Rakyat</p>
              <p>Jalan CMS Sultan Idris Shah</p>
              <p>30000 Ipoh, Perak</p>
            </div>
            <div className="branch-card">
              <h3>AKPK Melaka</h3>
              <p>Greenland 30, Wisma Al-Bukhary</p>
              <p>Lot 2, 3, & 5, Ground Floor</p>
              <p>Jalan Kota Laksamana 3</p>
              <p>Taman Kota Laksamana</p>
              <p>75200 Melaka</p>
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
              at <a href="mailto:info@e-rumah.com.my">info@e-rumah.com.my</a> or call{' '}
              <a href="tel:03-5883-0000">03-5883-0000</a>.
            </p>
            
            <div className="contact-cards">
              <div className="contact-card">
                <img src={iconEmail} alt="Email" />
                <div>
                  <h4>Email</h4>
                  <a href="mailto:info@e-rumah.com.my">info@e-rumah.com.my</a>
                </div>
              </div>
              <div className="contact-card">
                <img src={iconContact} alt="Phone" />
                <div>
                  <h4>Phone Number</h4>
                  <a href="tel:03-5883-0000">03-5883-0000</a>
                </div>
              </div>
            </div>
          </div>

          <div className="enquiry-right">
            <div className="enquiry-form-container">
              <h3>Enquire Now</h3>
              <form className="enquiry-form">
                <div className="form-group">
                  <label>
                    Name <span className="required">*</span>
                  </label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>
                    Contact Number <span className="required">*</span>
                  </label>
                  <input type="tel" required />
                </div>
                <div className="form-group">
                  <label>
                    Email address <span className="required">*</span>
                  </label>
                  <input type="email" required />
                </div>
                <div className="form-group">
                  <label>
                    Subject <span className="required">*</span>
                  </label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>
                    Message <span className="required">*</span>
                  </label>
                  <textarea rows="5" required></textarea>
                </div>
                
                <div className="captcha-section">
                  <p className="captcha-label">CAPTCHA</p>
                  <p className="captcha-description">
                    This question is for testing whether or not you are a human visitor and to 
                    prevent automated spam submissions.
                  </p>
                  <div className="captcha-container">
                    <div className="captcha-checkbox">
                      <input type="checkbox" id="not-robot" />
                      <label htmlFor="not-robot">I'm not a robot</label>
                    </div>
                    <div className="captcha-logo">
                      <span>reCAPTCHA</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="submit-button">
                  Submit Enquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutUs
