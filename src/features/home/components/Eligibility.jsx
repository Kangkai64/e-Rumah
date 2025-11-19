import './Eligibility.css'

const Eligibility = () => {
  return (
    <section className="eligibility">
      <div className="container">
        <h2 className="section-title">Eligibility Requirements</h2>
        <div className="eligibility-grid">
          <div className="eligibility-box">
            <h3>For Applicants</h3>
            <ul>
              <li>Malaysian citizen / PR / MM2H</li>
              <li>Age 60 years or above</li>
              <li>Legally capable</li>
              <li>Must have at least one nominee</li>
            </ul>
          </div>
          <div className="eligibility-box">
            <h3>For Property</h3>
            <ul>
              <li>Freehold landed property</li>
              <li>Located in Setapak</li>
              <li>No existing loans or mortgages</li>
              <li>Owner-occupied</li>
              <li>Has CCC/CF certification</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Eligibility
