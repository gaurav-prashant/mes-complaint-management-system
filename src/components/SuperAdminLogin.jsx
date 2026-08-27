import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('[Route Render] SuperAdminLogin component mounted. Checking auth...');
    const isAuth = localStorage.getItem('superAdminAuthenticated') === 'true';
    if (isAuth) {
      console.log('[Auth Guard] superAdminAuthenticated is true -> redirecting to /super-admin/dashboard');
      navigate('/super-admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setLoginError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);

    // Authentication check
    setTimeout(() => {
      setIsLoading(false);
      
      if (email === 'superadmin@example.com' && password === 'superadmin123') {
        localStorage.setItem('superAdminAuthenticated', 'true');
        localStorage.setItem('superAdminToken', 'super-admin-token-12345');
        navigate('/super-admin/dashboard', { replace: true });
      } else {
        setLoginError('Invalid email or password.');
      }
    }, 1000);
  };

  return (
    <div className="super-admin-login-container">
      <div className="super-admin-login-card">
        <h2 className="super-admin-title">Super Admin</h2>
        <p className="super-admin-subtitle">Restricted Access</p>
        
        <form onSubmit={handleLogin} className="super-admin-form">
          <div className="super-admin-input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className={`super-admin-input ${emailError ? 'super-admin-input-error' : ''}`}
            />
            {emailError && <span className="super-admin-error-text">{emailError}</span>}
          </div>

          <div className="super-admin-input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`super-admin-input ${passwordError ? 'super-admin-input-error' : ''}`}
            />
            {passwordError && <span className="super-admin-error-text">{passwordError}</span>}
          </div>

          {loginError && (
            <div className="super-admin-login-error">
              {loginError}
            </div>
          )}

          <button type="submit" className="super-admin-submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login as Super Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
