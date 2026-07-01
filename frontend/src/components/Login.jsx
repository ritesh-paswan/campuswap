import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function Login({ switchToSignup, onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
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
            <input
              className="cs-input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@college.edu"
              required
              disabled={loading}
            />
          </div>
          <div className="cs-field">
            <label className="cs-label">Password</label>
            <input
              className="cs-input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          <button className="cs-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>

        {error && <div className="cs-error">{error}</div>}

        <p className="cs-switch">
          No account?{' '}
          <span className="cs-switch-link" onClick={switchToSignup}>
            Create one free
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
