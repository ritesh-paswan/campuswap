import React, { useState } from 'react';
import axios from 'axios';

function Login({ switchToSignup, onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // <-- NEW: Loading indicator state

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // <-- Turn on loading spinner/text immediately

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false); // <-- Turn off loading once the database responds
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '30px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Login to CampusWap</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email ID</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={loading}
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: loading ? '#f0f0f0' : '#fff' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required disabled={loading}
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: loading ? '#f0f0f0' : '#fff' }} />
        </div>
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px', backgroundColor: loading ? '#cccccc' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          {loading ? 'Logging in securely...' : 'Login'} {/* <-- Dynamic button text */}
        </button>
      </form>

      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '15px' }}>{error}</p>}

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
        Don't have an account?{' '}
        <span onClick={switchToSignup} style={{ color: '#28a745', cursor: 'pointer', textDecoration: 'underline' }}>
          Register here
        </span>
      </p>
    </div>
  );
}

export default Login;