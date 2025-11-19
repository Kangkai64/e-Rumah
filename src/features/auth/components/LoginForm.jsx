// Placeholder for login component
import './LoginForm.css'

const LoginForm = () => {
  return (
    <div className="login-form">
      <h2>Login</h2>
      <form>
        <input type="text" placeholder="IC Number / Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default LoginForm
