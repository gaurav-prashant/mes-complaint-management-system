import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('adminAuthenticated', 'true');
        navigate('/admin/dashboard');
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(err);
      if (err.name === 'AbortError') {
        setLoginError('Connection timed out. Server unreachable.');
      } else {
        setLoginError('Login failed. Server unreachable.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-icon">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        
        <h2 className="admin-title">Admin Login</h2>
        <p className="admin-subtitle">Complaint Management System</p>
        
        <form onSubmit={handleLogin} className="admin-form">
          <div className="admin-input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className={`admin-input ${emailError ? 'admin-input-error' : ''}`}
            />
            {emailError && <span className="admin-error-text">{emailError}</span>}
          </div>

          <div className="admin-input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`admin-input ${passwordError ? 'admin-input-error' : ''}`}
            />
            {passwordError && <span className="admin-error-text">{passwordError}</span>}
          </div>

          {loginError && (
            <div className="admin-login-error">
              {loginError}
            </div>
          )}

          <button type="submit" className="admin-submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
