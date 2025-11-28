import Button from '../../../shared/components/Button'
import './CTA.css'

const CTA = () => {
  return (
    <section className="cta">
      <div className="container">
        <h2>Ready to Get Started?</h2>
        <p>Join hundreds of Malaysian seniors who have secured their financial future.</p>
        <Button variant="primary" to="/application">Start Your Application</Button>
      </div>
    </section>
  )
}

export default CTA
