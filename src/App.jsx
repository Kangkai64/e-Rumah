import './App.css'
import { Routes, Route } from 'react-router-dom'
import Header from './layouts/Header'
import Footer from './layouts/Footer'
import Hero from './components/landing/Hero'
import Features from './components/landing/Features'
import Eligibility from './components/landing/Eligibility'
import CTA from './components/landing/CTA'
import ApplicationController from './controllers/ApplicationController.jsx'

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
        <Route path="/application" element={<ApplicationController />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
