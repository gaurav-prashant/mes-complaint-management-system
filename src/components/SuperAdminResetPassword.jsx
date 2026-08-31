import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import getApiBase from '../utils/apiBase';

export default function SuperAdminResetPassword() {
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
      const response = await fetch(`${API_BASE}/super-admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage(data.message || 'Password reset successfully. You can now log in with your new password.');
        setTimeout(() => navigate('/super-admin/login', { replace: true }), 3000);
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
    <div className="super-admin-login-container">
      <div className="super-admin-login-card">
        <h2 className="super-admin-title">Reset SuperAdmin Password</h2>
        <p className="super-admin-subtitle">Enter your new SuperAdmin password</p>

        {message && (
          <div className="super-admin-login-error" style={{ background: isSuccess ? '#f0fdf4' : undefined, borderColor: isSuccess ? '#bbf7d0' : undefined, color: isSuccess ? '#166534' : undefined, marginBottom: '16px' }}>
            <span>{message}</span>
          </div>
        )}

        {!isSuccess && token && (
          <form onSubmit={handleReset} className="super-admin-form">
            <div className="super-admin-input-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={`super-admin-input ${passwordError ? 'super-admin-input-error' : ''}`}
              />
              {passwordError && <span className="super-admin-error-text">{passwordError}</span>}
            </div>

            <div className="super-admin-input-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`super-admin-input ${confirmError ? 'super-admin-input-error' : ''}`}
              />
              {confirmError && <span className="super-admin-error-text">{confirmError}</span>}
            </div>

            <button type="submit" className="super-admin-submit-btn" disabled={isLoading}>
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => navigate('/super-admin/login', { replace: true })}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
          >
            Back to SuperAdmin Login
          </button>
        </div>
      </div>
    </div>
  );
}
