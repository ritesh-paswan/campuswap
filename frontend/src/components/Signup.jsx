import React, { useState } from 'react';
import axios from 'axios';

function Signup({ switchToLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.phone) {
      return alert('Please fill in your Name, Email, and WhatsApp number first!');
    }
    
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/send-otp', { email: formData.email });
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
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);
      setMessage(res.data.message);
      setFormData({ name: '', email: '', password: '', phone: '', otp: '' });
      setOtpSent(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Register for CampuSwap</h2>
      
      <form onSubmit={otpSent ? handleFinalSignup : handleRequestOtp}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={otpSent}
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: otpSent ? '#f0f0f0' : '#fff' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email ID</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={otpSent} 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: otpSent ? '#f0f0f0' : '#fff' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>WhatsApp Number (e.g., 8283xxxxxx)</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} required disabled={otpSent} placeholder="Include country code"
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: otpSent ? '#f0f0f0' : '#fff' }} />
        </div>

        {otpSent && (
          <>
            <div style={{ marginBottom: '15px', backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '6px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#0d47a1' }}>Enter 6-Digit Email OTP</label>
              <input type="text" name="otp" value={formData.otp} onChange={handleChange} required maxLength="6" placeholder="000000"
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Choose Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••"
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px', backgroundColor: otpSent ? '#28a745' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'
        }}>
          {loading ? 'Processing...' : otpSent ? 'Verify & Register' : 'Send Verification OTP'}
        </button>
      </form>

      {message && <p style={{ color: 'green', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>{error}</p>}
      
      {!otpSent && (
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          Already have an account? <span onClick={switchToLogin} style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>Login here</span>
        </p>
      )}
    </div>
  );
}

export default Signup;