import './App.css'
import Header from './layouts/Header'
import Footer from './layouts/Footer'
import Hero from './features/home/components/Hero'
import Features from './features/home/components/Features'
import Eligibility from './features/home/components/Eligibility'
import CTA from './features/home/components/CTA'

function App() {
  return (
    <div className="app">
      <Header />
      <Hero />
      <Features />
      <Eligibility />
      <CTA />
      <Footer />
    </div>
  )
}

export default App
