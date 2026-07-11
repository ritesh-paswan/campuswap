import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function Signup({ switchToLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    // ✅ Phone is now optional
    if (!formData.email || !formData.name)
      return alert('Please fill in your Name and Email first.');
    setLoading(true); setMessage(''); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, { email: formData.email.trim().toLowerCase() });
      setMessage(res.data.message);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSignup = async (e) => {
    e.preventDefault();
    if (!formData.password || formData.password.length < 4)
      return alert('Password must be at least 4 characters.');
    if (!formData.otp || formData.otp.length !== 6)
      return alert('Enter the complete 6-digit code.');
    setLoading(true); setMessage(''); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/signup`, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        otp: formData.otp.trim()
      });
      setMessage(res.data.message);
      setFormData({ name: '', email: '', password: '', phone: '', otp: '' });
      setOtpSent(false);
      setTimeout(() => switchToLogin(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cs-auth-page">
      <div className="cs-auth-box">
        <div className="cs-auth-logo">🎓</div>
        <h2 className="cs-auth-title">Join CampuSwap</h2>
        <p className="cs-auth-sub">
          {otpSent ? 'Enter the code sent to your email' : 'Create your free campus account'}
        </p>

        <form onSubmit={otpSent ? handleFinalSignup : handleRequestOtp}>
          {!otpSent && (
            <>
              <div className="cs-field">
                <label className="cs-label">Full Name</label>
                <input className="cs-input" type="text" name="name" value={formData.name}
                  onChange={handleChange} placeholder="Your full name" required />
              </div>
              <div className="cs-field">
                <label className="cs-label">College Email</label>
                <input className="cs-input" type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="you@college.edu" required />
              </div>
              <div className="cs-field">
                {/* ✅ Phone is optional — no required attribute */}
                <label className="cs-label">
                  WhatsApp Number <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input className="cs-input" type="text" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
              </div>
            </>
          )}

          {otpSent && (
            <>
              <div className="cs-otp-box">
                <label className="cs-otp-label">📨 Verification Code</label>
                <input
                  className="cs-otp-input"
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength="6"
                  placeholder="000000"
                  required
                />
              </div>
              <div className="cs-field">
                <label className="cs-label">Choose Password</label>
                <input className="cs-input" type="password" name="password" value={formData.password}
                  onChange={handleChange} placeholder="Min. 4 characters" required />
              </div>
            </>
          )}

          <button className="cs-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Processing...' : otpSent ? 'Verify & Create Account →' : 'Send Verification Code →'}
          </button>
        </form>

        {message && <div className="cs-success">{message}</div>}
        {error && <div className="cs-error">{error}</div>}

        {!otpSent && (
          <p className="cs-switch">
            Already have an account?{' '}
            <span className="cs-switch-link" onClick={switchToLogin}>Sign in</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default Signup;
