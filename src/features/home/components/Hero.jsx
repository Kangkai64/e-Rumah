import Button from '../../../shared/components/Button'
import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <h1 className="hero-title">
          Reverse Annuity Scheme<br />Management System
        </h1>
        <p className="hero-subtitle">
          Convert your home equity into monthly income while continuing to live in your home.
          <br />For Malaysian seniors aged 60 and above.
        </p>
        <div className="hero-buttons">
          <Button variant="primary" to="/application">Apply Now</Button>
          <Button variant="secondary">Learn More</Button>
        </div>
      </div>
    </section>
  )
}

export default Hero
