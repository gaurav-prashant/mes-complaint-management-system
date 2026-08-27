import React from 'react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Trusted Complaint Management System</span>
        </div>
        
        <h1 className="hero-title">
          Your Voice, <span>Our Priority</span>
        </h1>
        
        <p className="hero-subtitle">
          Submit, track, and resolve complaints efficiently with our modern complaint management system.
        </p>
        
        <div className="hero-buttons">
          <Link
            to="/submit-complaint"
            className="hero-btn primary-btn"
          >
            <span className="btn-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </span>
            Submit Complaint
            <span className="btn-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </Link>
          <Link
            to="/track-status"
            className="hero-btn secondary-btn"
          >
            <span className="btn-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            Track Status
          </Link>
        </div>
        
        <div className="developer-badge">
          <span>Developed by</span>
          <strong>Computer Cell 17 Bihar</strong>
        </div>
      </div>
      
      <div className="hero-curve">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,15 Q720,110 1440,15 L1440,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>
  )
}
