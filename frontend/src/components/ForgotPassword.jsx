import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function ForgotPassword({ onBack, onResetSuccess }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault(); setLoading(true); setMessage(''); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email: email.trim().toLowerCase() });
      setMessage(res.data.message); setStep('otp');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send reset code.'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) return alert('Password must be at least 4 characters.');
    if (otp.length !== 6) return alert('Enter the complete 6-digit code.');
    setLoading(true); setMessage(''); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/reset-password`, { email: email.trim().toLowerCase(), otp: otp.trim(), newPassword });
      setMessage(res.data.message); setTimeout(() => onResetSuccess(), 2000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset password.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="cs-auth-page">
      <div className="cs-auth-box">
        <div className="cs-auth-logo">🔒</div>
        <h2 className="cs-auth-title">Reset Password</h2>
        <p className="cs-auth-sub">{step === 'email' ? 'Enter your email to receive a reset code' : 'Enter the code and your new password'}</p>
        {step === 'email' ? (
          <form onSubmit={handleSendOtp}>
            <div className="cs-field"><label className="cs-label">College Email</label><input className="cs-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" required /></div>
            <button className="cs-btn-primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Code →'}</button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="cs-otp-box">
              <label className="cs-otp-label">🔑 Reset Code</label>
              <input className="cs-otp-input" type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength="6" placeholder="000000" required />
            </div>
            <div className="cs-field"><label className="cs-label">New Password</label><input className="cs-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 4 characters" required /></div>
            <button className="cs-btn-primary" type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password →'}</button>
          </form>
        )}
        {message && <div className="cs-success">{message}</div>}
        {error && <div className="cs-error">{error}</div>}
        <p className="cs-switch"><span className="cs-switch-link" onClick={onBack}>← Back to Sign in</span></p>
      </div>
    </div>
  );
}

export default ForgotPassword;
