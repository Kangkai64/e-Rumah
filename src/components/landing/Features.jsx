import './Features.css'

const Features = () => {
  const features = [
    {
      number: '01',
      title: 'Apply Online',
      description: 'Complete your application with guided assistance through our elderly-friendly interface.'
    },
    {
      number: '02',
      title: 'Get Approved',
      description: 'Our team reviews your eligibility and property valuation within 7-14 working days.'
    },
    {
      number: '03',
      title: 'Receive Payments',
      description: 'Choose monthly income, lump sum, or credit line while staying in your home.'
    },
    {
      number: '04',
      title: 'Stay Protected',
      description: 'Nominee monitoring and compliance reminders ensure your rights are protected.'
    }
  ]

  return (
    <section className="features">
      <div className="container">
        <h2 className="section-title">How It Works</h2>
        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.number} className="feature-card">
              <div className="feature-number">{feature.number}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
