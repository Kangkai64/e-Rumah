import Button from '../common/Button'
import './Hero.css'
import heroImage from '../../assets/images/hero_coupleLookingPhone.jpg'

const Hero = () => {
  return (
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
  )
}

export default Hero
