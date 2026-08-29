import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function Login({ switchToSignup, onLoginSuccess, switchToForgot }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="cs-auth-page">
      <div className="cs-auth-box">
        <div className="cs-auth-logo">⚡</div>
        <h2 className="cs-auth-title">Welcome back</h2>
        <p className="cs-auth-sub">Sign in to your CampuSwap account</p>
        <form onSubmit={handleSubmit}>
          <div className="cs-field">
            <label className="cs-label">Email</label>
            <input className="cs-input" type="email" name="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="you@college.edu" required disabled={loading} />
          </div>
          <div className="cs-field">
            <label className="cs-label">Password</label>
            <input className="cs-input" type="password" name="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" required disabled={loading} />
          </div>
          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
            <span onClick={switchToForgot} style={{ fontSize: '0.8rem', color: 'var(--orange)', cursor: 'pointer', fontWeight: 500 }}>Forgot password?</span>
          </div>
          <button className="cs-btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in →'}</button>
        </form>
        {error && <div className="cs-error">{error}</div>}
        <p className="cs-switch">No account? <span className="cs-switch-link" onClick={switchToSignup}>Create one free</span></p>
      </div>
    </div>
  );
}

export default Login;
