export default function ErrorMessage({ error }) {
  if (!error) return null
  return <span className="error-message">{error}</span>
}
