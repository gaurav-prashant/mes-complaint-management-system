import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getApiBase from '../utils/apiBase';

export default function SuperAdminLogin() {
  const navigate = useNavigate();

  // ── Login state ─────────────────────────────────────────────────────────────
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
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
      const response = await fetch(`${API_BASE}/super-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('superAdminToken', data.token);
        localStorage.setItem('superAdminAuthenticated', 'true');
        navigate('/super-admin/dashboard', { replace: true });
      } else {
        setLoginError(data.message || 'Invalid email or password.');
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
      const response = await fetch(`${API_BASE}/super-admin/forgot-password`, {
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
      <div className="super-admin-login-container">
        <div className="super-admin-login-card">
          <h2 className="super-admin-title">SuperAdmin Forgot Password</h2>
          <p className="super-admin-subtitle">Enter your SuperAdmin email to receive a reset link</p>

          {fpMessage ? (
            <div className="super-admin-login-error" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
              <span>{fpMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="super-admin-form">
              <div className="super-admin-input-group">
                <label htmlFor="fp-email">Email Address</label>
                <input
                  type="email"
                  id="fp-email"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  placeholder="superadmin@example.com"
                  className={`super-admin-input ${fpEmailError ? 'super-admin-input-error' : ''}`}
                />
                {fpEmailError && <span className="super-admin-error-text">{fpEmailError}</span>}
              </div>

              <button type="submit" className="super-admin-submit-btn" disabled={fpLoading}>
                {fpLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => { setView('login'); setFpMessage(''); setFpEmailError(''); }}
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
            >
              Back to SuperAdmin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Login view ───────────────────────────────────────────────────────

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
              placeholder="superadmin@example.com"
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

          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => { setView('forgot'); setLoginError(''); }}
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="super-admin-submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login as Super Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
