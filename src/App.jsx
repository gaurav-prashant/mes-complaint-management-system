import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Features from './components/Features'
import Footer from './components/Footer'
import SubmitComplaint from './components/SubmitComplaint'
import TrackComplaint from './components/TrackComplaint'
import About from './components/About'
import AdminDashboard from './components/AdminDashboard'
import AdminLogin from './components/AdminLogin'
import SuperAdminLogin from './components/SuperAdminLogin'
import SuperAdminDashboard from './components/SuperAdminDashboard'

import CTA from './components/CTA'

function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <CTA />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container" style={{ background: '#f7f9fc', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit-complaint" element={<SubmitComplaint />} />
            <Route path="/track-status" element={<TrackComplaint />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
