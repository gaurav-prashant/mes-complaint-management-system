import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate();

  // Function to close the mobile menu when a link is clicked
  const closeMenu = () => {
    const checkbox = document.getElementById('mobile-menu-toggle');
    if (checkbox) checkbox.checked = false;
  };

  return (
    <div className="navbar">
      <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="logo-box">
          <img
            src="/assets/logo.webp"
            alt="MES Logo"
            style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '14px', display: 'block' }}
          />
        </div>
        <div>
          <div className="logo-title">MES COMPLAINT CORNER</div>
          <div className="logo-subtitle">Management by Efficiency &amp; Synergy</div>
        </div>
      </div>

      <input type="checkbox" id="mobile-menu-toggle" className="menu-toggle-checkbox" />
      <label htmlFor="mobile-menu-toggle" className="mobile-menu-btn" aria-label="Toggle navigation menu">
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </label>

      <div className="nav-links">
        <NavLink to="/" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>Home</NavLink>
        <NavLink to="/submit-complaint" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>Submit Complaint</NavLink>
        <NavLink to="/track-status" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>Track Status</NavLink>
        <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>About Us</NavLink>
        <NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => `nav-link admin-button ${isActive ? 'nav-active' : ''}`}>Admin</NavLink>
        <NavLink to="/super-admin/login" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>Super Admin</NavLink>
      </div>
    </div>
  )
}
