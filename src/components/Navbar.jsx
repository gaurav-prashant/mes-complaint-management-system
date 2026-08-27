import React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminDashboard = location.pathname === '/admin/dashboard';
  const isSuperAdminDashboard = location.pathname === '/super-admin/dashboard';

  // Function to close the mobile menu when a link is clicked
  const closeMenu = () => {
    const checkbox = document.getElementById('mobile-menu-toggle');
    if (checkbox) checkbox.checked = false;
  };

  const handleAdminLogout = () => {
    closeMenu();
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  };

  const handleSuperAdminLogout = () => {
    closeMenu();
    localStorage.removeItem('superAdminAuthenticated');
    localStorage.removeItem('superAdminToken');
    sessionStorage.removeItem('superAdminAuthenticated');
    sessionStorage.removeItem('superAdminToken');
    navigate('/super-admin/login', { replace: true });
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
        <NavLink to="/admin/login" onClick={closeMenu} className={({ isActive }) => `nav-link admin-button ${isActive ? 'nav-active' : ''}`}>Admin</NavLink>
        <NavLink to="/super-admin/login" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>Super Admin</NavLink>

        {isAdminDashboard && (
          <button
            type="button"
            className="navbar-admin-logout"
            onClick={handleAdminLogout}
            aria-label="Logout from Admin Dashboard"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        )}

        {isSuperAdminDashboard && (
          <button
            type="button"
            className="navbar-admin-logout"
            onClick={handleSuperAdminLogout}
            aria-label="Logout from Super Admin Dashboard"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  )
}
