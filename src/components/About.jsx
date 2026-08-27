import React from 'react';

const About = () => {
  return (
    <div className="about-page-container">
      {/* 2. ABOUT HERO SECTION */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="hero-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>About Our System</span>
          </div>
          
          <h1 className="about-hero-title">
            <span className="title-white">Empowering You Through</span>
            <span className="title-gold">Better Communication</span>
          </h1>
          
          <p className="about-hero-description">
            Our complaint management system is designed to bridge the gap between you and resolution, making the process transparent, efficient, and user-friendly.
          </p>
        </div>
        
        {/* Wave curve overlay */}
        <div className="hero-curve">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path fill="#f8fafc" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* 3. THREE FEATURE CARDS */}
      <section className="about-features">
        <div className="about-container">
          <div className="feature-grid">
            {/* Card 1 */}
            <div className="feature-card">
              <div className="feature-icon icon-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <h3 className="feature-title">Quick Response</h3>
              <p className="feature-desc">We acknowledge all complaints within 24 hours and provide regular updates throughout the resolution process.</p>
            </div>

            {/* Card 2 */}
            <div className="feature-card">
              <div className="feature-icon icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
                </svg>
              </div>
              <h3 className="feature-title">Transparent Tracking</h3>
              <p className="feature-desc">Track your complaint status in real-time with detailed progress updates from submission to resolution.</p>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <div className="feature-icon icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="feature-title">Secure & Private</h3>
              <p className="feature-desc">Your personal information and complaint details are kept confidential and secure throughout the process.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="about-how-it-works">
        <div className="about-container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Simple, transparent, and efficient complaint resolution in three easy steps</p>
          </div>
          
          <div className="process-timeline">
            {/* Step 1 */}
            <div className="process-step">
              <div className="step-number-badge">01</div>
              <div className="step-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <h4 className="step-title">Submit</h4>
              <p className="step-desc">Fill out the complaint form with your details and upload relevant images if needed.</p>
            </div>

            <div className="process-line"></div>

            {/* Step 2 */}
            <div className="process-step">
              <div className="step-number-badge">02</div>
              <div className="step-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h4 className="step-title">Track</h4>
              <p className="step-desc">Use your mobile number to track the status of your complaint anytime.</p>
            </div>

            <div className="process-line"></div>

            {/* Step 3 */}
            <div className="process-step">
              <div className="step-number-badge">03</div>
              <div className="step-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
              </div>
              <h4 className="step-title">Resolve</h4>
              <p className="step-desc">Our team works diligently to resolve your complaint and keep you updated.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STATISTICS SECTION */}
      <section className="about-statistics">
        <div className="about-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">5000+</div>
              <div className="stat-label">Complaints Resolved</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24hrs</div>
              <div className="stat-label">Avg Response Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">System Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. OUR MISSION SECTION */}
      <section className="about-mission">
        <div className="about-container">
          <div className="mission-content">
            <div className="mission-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            
            <h2 className="section-title">Our Mission</h2>
            
            <p className="mission-paragraph">
              To provide a seamless, transparent, and efficient platform that empowers individuals to voice their concerns and receive timely resolutions. We believe in accountability, transparency, and putting people first.
            </p>
            
            <div className="mission-badges">
              <span className="badge-blue">◷ Fast Response</span>
              <span className="badge-green">◎ Goal-Oriented</span>
              <span className="badge-purple">♧ People-Centric</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE MES COMPLAINT CORNER? */}
      <section className="about-why-choose">
        <div className="about-container">
          <div className="section-header">
            <h2>Why Choose MES Complaint Corner?</h2>
          </div>
          
          <div className="why-choose-grid">
            <div className="why-card">
              <div className="why-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              </div>
              <h4 className="why-title">Easy Complaint Submission</h4>
              <p className="why-desc">User-friendly bilingual interface designed to accept your complaint details accurately and effortlessly.</p>
            </div>

            <div className="why-card">
              <div className="why-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h4 className="why-title">Transparent Status Tracking</h4>
              <p className="why-desc">Live timeline feature that displays the exact current stage of your complaint.</p>
            </div>

            <div className="why-card">
              <div className="why-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h4 className="why-title">Secure Information</h4>
              <p className="why-desc">Advanced data protection measures ensure your personal details remain completely confidential.</p>
            </div>

            <div className="why-card">
              <div className="why-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <h4 className="why-title">Efficient Resolution</h4>
              <p className="why-desc">Automated escalation matrix that guarantees timely responses from concerned departments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. OUR VISION SECTION */}
      <section className="about-vision">
        <div className="about-container">
          <div className="vision-card">
            <div className="vision-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <h2>Our Vision</h2>
            <p>
              To create a trusted digital platform where every complaint is heard, every issue is tracked, and every resolution is delivered with accountability.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
