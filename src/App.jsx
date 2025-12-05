import './App.css'
import { Routes, Route } from 'react-router-dom'
import Header from './layouts/Header'
import Footer from './layouts/Footer'
import HomePage from './components/landing/HomePage'
import ApplicationController from './controllers/ApplicationController.jsx'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <HomePage />
            <Footer />
          </>
        } />
        <Route path="/application" element={
          <>
            <Header />
            <ApplicationController />
            <Footer />
          </>
        } />
      </Routes>
    </div>
  )
}

export default App
