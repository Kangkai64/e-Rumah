export default function ErrorSummary({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null
  
  return (
    <div className="error-summary">
      <h3>⚠️ Please fix the following errors:</h3>
      <ul>
        {Object.values(errors).map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  )
}
