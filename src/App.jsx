import './App.css'
import { Routes, Route } from 'react-router-dom'
import Header from './layouts/Header'
import Footer from './layouts/Footer'
import Hero from './features/home/components/Hero'
import Features from './features/home/components/Features'
import Eligibility from './features/home/components/Eligibility'
import CTA from './features/home/components/CTA'
import ApplicationForm from './features/application/components/ApplicationForm'

function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <Features />
            <Eligibility />
            <CTA />
          </>
        } />
        <Route path="/application" element={<ApplicationForm />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
