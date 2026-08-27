import React from 'react'

export default function Features() {
  return (
    <div className="features-wrapper" id="about" style={{ marginTop: '35px', marginBottom: '0px' }}>
      <div className="section-title">
        Why Choose Our System?
      </div>
      <div className="section-line"></div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Easy Submission</h3>
          <p>Submit your complaints with a simple, intuitive form. Upload images and get instant confirmation.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Real-time Tracking</h3>
          <p>Track your complaint status anytime with your mobile number. Get live updates on progress.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Quick Resolution</h3>
          <p>We prioritize your complaints and work towards fast resolution with dedicated support.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>Secure &amp; Private</h3>
          <p>Your data is encrypted and secure. We maintain strict privacy standards for all complaints.</p>
        </div>
      </div>
    </div>
  )
}
