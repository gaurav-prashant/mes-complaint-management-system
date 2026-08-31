import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import getApiBase from '../utils/apiBase';

export default function AdminResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token]                     = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError]     = useState('');
  const [confirmError, setConfirmError]       = useState('');
  const [message, setMessage]                 = useState('');
  const [isSuccess, setIsSuccess]             = useState(false);
  const [isLoading, setIsLoading]             = useState(false);

  const API_BASE = getApiBase();

  useEffect(() => {
    if (!token) {
      setMessage('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const validate = () => {
    let valid = true;
    setPasswordError('');
    setConfirmError('');

    if (!newPassword) {
      setPasswordError('New password is required');
      valid = false;
    } else if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (!validate()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage(data.message || 'Password reset successfully. You can now log in with your new password.');
        setTimeout(() => navigate('/admin/login', { replace: true }), 3000);
      } else {
        setMessage(data.message || 'Failed to reset password. The link may have expired.');
      }
    } catch {
      setMessage('Failed to reset password. Please try again or request a new reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-icon">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 className="admin-title">Reset Password</h2>
        <p className="admin-subtitle">Enter your new admin password</p>

        {message && (
          <div className={isSuccess ? 'admin-fp-success' : 'admin-login-error'} style={{ marginBottom: '16px' }}>
            {isSuccess && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            <span>{message}</span>
          </div>
        )}

        {!isSuccess && token && (
          <form onSubmit={handleReset} className="admin-form">
            <div className="admin-input-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={`admin-input ${passwordError ? 'admin-input-error' : ''}`}
              />
              {passwordError && <span className="admin-error-text">{passwordError}</span>}
            </div>

            <div className="admin-input-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`admin-input ${confirmError ? 'admin-input-error' : ''}`}
              />
              {confirmError && <span className="admin-error-text">{confirmError}</span>}
            </div>

            <button type="submit" className="admin-submit-btn" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <button
          type="button"
          className="admin-back-link"
          onClick={() => navigate('/admin/login', { replace: true })}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}
