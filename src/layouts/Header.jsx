import Button from '../shared/components/Button'
import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="logo">e-Rumah</div>
        <nav className="nav">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#eligibility">Eligibility</a>
          <a href="#contact">Contact</a>
          <Button variant="login">Login</Button>
        </nav>
      </div>
    </header>
  )
}

export default Header
