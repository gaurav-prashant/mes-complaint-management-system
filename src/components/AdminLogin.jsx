import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getApiBase from '../utils/apiBase';

export default function AdminLogin() {
  const navigate = useNavigate();

  // ── Login state ─────────────────────────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError]       = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError]       = useState('');
  const [isLoading, setIsLoading]         = useState(false);

  // ── Forgot Password state ────────────────────────────────────────────────────
  const [view, setView]                 = useState('login'); // 'login' | 'forgot'
  const [fpEmail, setFpEmail]           = useState('');
  const [fpEmailError, setFpEmailError] = useState('');
  const [fpMessage, setFpMessage]       = useState('');
  const [fpLoading, setFpLoading]       = useState(false);

  const API_BASE = getApiBase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ── Login validation ─────────────────────────────────────────────────────────

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setLoginError('');

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

  // ── Login submit ─────────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminAuthenticated', 'true');
        navigate('/admin/dashboard', { replace: true });
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

  // ── Forgot Password submit ───────────────────────────────────────────────────

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setFpEmailError('');
    setFpMessage('');

    if (!fpEmail) {
      setFpEmailError('Email is required');
      return;
    }
    if (!emailRegex.test(fpEmail)) {
      setFpEmailError('Please enter a valid email address');
      return;
    }

    setFpLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await response.json();
      setFpMessage(data.message || 'If an account exists, password reset instructions have been sent.');
    } catch {
      setFpMessage('If an account exists, password reset instructions have been sent.');
    } finally {
      setFpLoading(false);
    }
  };

  // ── Render: Forgot Password view ─────────────────────────────────────────────

  if (view === 'forgot') {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-icon">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className="admin-title">Forgot Password</h2>
          <p className="admin-subtitle">Enter your admin email to receive a reset link</p>

          {fpMessage ? (
            <div className="admin-fp-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{fpMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="admin-form">
              <div className="admin-input-group">
                <label htmlFor="fp-email">Admin Email</label>
                <input
                  type="email"
                  id="fp-email"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={`admin-input ${fpEmailError ? 'admin-input-error' : ''}`}
                />
                {fpEmailError && <span className="admin-error-text">{fpEmailError}</span>}
              </div>
              <button type="submit" className="admin-submit-btn" disabled={fpLoading}>
                {fpLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <button
            type="button"
            className="admin-back-link"
            onClick={() => { setView('login'); setFpEmail(''); setFpEmailError(''); setFpMessage(''); }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Login view (unchanged design) ────────────────────────────────────

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
            <button
              type="button"
              className="admin-forgot-link"
              onClick={() => { setView('forgot'); setLoginError(''); }}
            >
              Forgot Password?
            </button>
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
