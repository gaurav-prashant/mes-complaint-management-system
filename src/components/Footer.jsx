import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <div className="footer-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 0, margin: 0, padding: 0, border: 'none', background: '#0b1224' }}>
      {/* TRACK FOOTER */}
      <div className="track-footer" style={{ background: '#0b1224', color: '#ffffff', padding: '28px 8% 16px 8%', marginTop: '0', marginBottom: '0', textAlign: 'left' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '28px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <img src="/assets/logo.webp" alt="MES Logo" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
              <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '0.2px' }}>MES COMPLAINT CORNER</h3>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.5', marginTop: '6px', margin: '6px 0 0 0' }}>
              Management by Efficiency &amp; Synergy.<br />Working together for a better tomorrow.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '17px', fontWeight: '700', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Link to="/" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '15px' }}>Home</Link>
              <Link to="/submit-complaint" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '15px' }}>Submit Complaint</Link>
              <Link to="/track-status" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '15px' }}>Track Status</Link>
              <Link to="/about" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '15px' }}>About Us</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '17px', fontWeight: '700', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Need Help?</h4>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.5', margin: '0 0 6px 0' }}>
              Contact Support<br />Complaint Assistance
            </p>
            <a href="mailto:support@mes-system.com" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>
              support@mes-system.com
            </a>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '16px', paddingTop: '12px', textAlign: 'center', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
          <p style={{ marginBottom: '3px', color: 'rgba(255,255,255,0.85)', fontSize: '14.5px' }}>
            Developed by <span style={{ color: '#FFD54F', fontWeight: '700' }}>Computer Cell 17 Bihar</span>
          </p>
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            &copy; 2026 MES Complaint Corner. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
