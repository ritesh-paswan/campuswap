import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function Signup({ switchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    otp: ''
  });

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      const res = await axios.post(
        `${API_URL}/api/auth/send-otp`,
        { email: formData.email.trim().toLowerCase() }
      );

      setMessage(res.data.message);
      setOtpSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to send OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSignup = async (e) => {
    e.preventDefault();

    if (!formData.password || formData.password.length < 4) {
      return alert('Please choose a valid password (minimum 4 characters).');
    }
    if (!formData.otp || formData.otp.length !== 6) {
      return alert('Please enter the complete 6-digit verification code.');
    }

    setLoading(true);
    setMessage('');
    setError('');

    // Explicit payload structural map to guarantee safe state transfer
    const registrationPayload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone.trim(),
      otp: formData.otp.trim()
    };

    try {
      const res = await axios.post(
        `${API_URL}/api/auth/signup`,
        registrationPayload
      );

      setMessage(res.data.message);

      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        otp: ''
      });

      setOtpSent(false);

      // Auto redirect context back to the login screen panel after 2 seconds
      setTimeout(() => {
        switchToLogin();
      }, 2000);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration verification failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '50px auto',
        padding: '30px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        fontFamily: 'sans-serif'
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          color: '#333',
          marginBottom: '20px'
        }}
      >
        Register for CampuSwap
      </h2>

      <form onSubmit={otpSent ? handleFinalSignup : handleRequestOtp}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={otpSent}
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email ID</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={otpSent}
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>WhatsApp Number</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={otpSent}
            placeholder="Include country code"
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {otpSent && (
          <>
            <div
              style={{
                marginBottom: '15px',
                backgroundColor: '#e3f2fd',
                padding: '15px',
                borderRadius: '6px'
              }}
            >
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1e88e5' }}>
                Enter 6-Digit Email OTP
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                required
                maxLength="6"
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '10px',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  fontSize: '18px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Choose Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: otpSent ? '#28a745' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading
            ? 'Processing...'
            : otpSent
              ? 'Verify & Register'
              : 'Send Verification OTP'
          }
        </button>
      </form>

      {message && (
        <p style={{ color: 'green', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: 'red', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>
          {error}
        </p>
      )}

      {!otpSent && (
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account?{' '}
          <span
            onClick={switchToLogin}
            style={{
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Login here
          </span>
        </p>
      )}
    </div>
  );
}

export default Signup;