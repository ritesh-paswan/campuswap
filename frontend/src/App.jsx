import React, { useState, useEffect } from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: #080c14;
    color: #e2e8f0;
    min-height: 100vh;
  }

  .cs-app {
    min-height: 100vh;
    background: #080c14;
  }

  /* NAV */
  .cs-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(8,12,20,0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(99,179,237,0.1);
    padding: 0 24px;
  }
  .cs-nav-inner {
    max-width: 1100px;
    margin: 0 auto;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cs-logo {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    background: linear-gradient(135deg, #63b3ed, #9f7aea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    cursor: pointer;
    letter-spacing: -0.5px;
  }
  .cs-nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cs-greeting {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 500;
  }
  .cs-greeting span {
    color: #63b3ed;
    font-weight: 600;
  }
  .cs-btn-logout {
    padding: 7px 16px;
    background: rgba(239,68,68,0.1);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .cs-btn-logout:hover {
    background: rgba(239,68,68,0.2);
    border-color: rgba(239,68,68,0.4);
  }

  /* MAIN */
  .cs-main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  /* MARKETPLACE HEADER */
  .cs-market-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .cs-market-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -0.5px;
  }
  .cs-market-title span {
    color: #63b3ed;
  }
  .cs-btn-sell {
    padding: 10px 22px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
  }
  .cs-btn-sell:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 30px rgba(99,102,241,0.5);
  }
  .cs-btn-sell.cancel {
    background: rgba(100,116,139,0.2);
    color: #94a3b8;
    border: 1px solid rgba(100,116,139,0.3);
    box-shadow: none;
  }
  .cs-btn-sell.cancel:hover {
    background: rgba(100,116,139,0.3);
    transform: none;
  }

  /* LOADING */
  .cs-loading {
    text-align: center;
    padding: 80px 20px;
    color: #64748b;
    font-size: 0.95rem;
  }
  .cs-loading-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    margin: 0 4px;
    animation: pulse 1.4s infinite ease-in-out;
  }
  .cs-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .cs-loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes pulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* CARD BASE */
  .cs-card {
    background: #0f1623;
    border: 1px solid rgba(99,179,237,0.08);
    border-radius: 16px;
  }

  /* INPUT BASE */
  .cs-input {
    width: 100%;
    padding: 11px 14px;
    background: #0a0f1a;
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .cs-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  .cs-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .cs-input::placeholder { color: #475569; }

  .cs-label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* PRIMARY BUTTON */
  .cs-btn-primary {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 0 20px rgba(99,102,241,0.25);
    letter-spacing: 0.01em;
  }
  .cs-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0 30px rgba(99,102,241,0.4);
  }
  .cs-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* SUCCESS / ERROR */
  .cs-success {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 8px;
    color: #34d399;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
  }
  .cs-error {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px;
    color: #f87171;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
  }

  /* AUTH PAGES */
  .cs-auth-page {
    min-height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }
  .cs-auth-box {
    width: 100%;
    max-width: 420px;
    background: #0f1623;
    border: 1px solid rgba(99,179,237,0.1);
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.4);
  }
  .cs-auth-logo {
    text-align: center;
    margin-bottom: 8px;
    font-size: 2rem;
  }
  .cs-auth-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    text-align: center;
    color: #f1f5f9;
    margin-bottom: 6px;
  }
  .cs-auth-sub {
    text-align: center;
    color: #64748b;
    font-size: 0.875rem;
    margin-bottom: 32px;
  }
  .cs-field { margin-bottom: 20px; }
  .cs-switch {
    text-align: center;
    margin-top: 24px;
    font-size: 0.875rem;
    color: #64748b;
  }
  .cs-switch-link {
    color: #63b3ed;
    cursor: pointer;
    font-weight: 600;
    text-decoration: none;
  }
  .cs-switch-link:hover { text-decoration: underline; }

  /* OTP BOX */
  .cs-otp-box {
    background: rgba(59,130,246,0.05);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }
  .cs-otp-label {
    display: block;
    margin-bottom: 10px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #63b3ed;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cs-otp-input {
    width: 100%;
    padding: 14px;
    background: #0a0f1a;
    border: 1px solid rgba(59,130,246,0.3);
    border-radius: 10px;
    color: #63b3ed;
    font-size: 1.6rem;
    font-weight: 700;
    text-align: center;
    letter-spacing: 8px;
    font-family: 'Space Grotesk', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cs-otp-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }

  /* PRODUCT FORM */
  .cs-form-card {
    background: #0f1623;
    border: 1px solid rgba(99,179,237,0.08);
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 32px;
  }
  .cs-form-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cs-form-title::before {
    content: '';
    display: block;
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, #3b82f6, #8b5cf6);
    border-radius: 2px;
  }
  .cs-form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .cs-form-group { margin-bottom: 20px; }
  .cs-file-input {
    width: 100%;
    padding: 11px 14px;
    background: #0a0f1a;
    border: 1px dashed rgba(99,179,237,0.25);
    border-radius: 10px;
    color: #94a3b8;
    font-size: 0.875rem;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
  }
  .cs-file-input::-webkit-file-upload-button {
    padding: 6px 14px;
    background: rgba(59,130,246,0.15);
    border: 1px solid rgba(59,130,246,0.3);
    border-radius: 6px;
    color: #63b3ed;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    margin-right: 12px;
    font-family: 'Inter', sans-serif;
  }
  .cs-textarea {
    width: 100%;
    padding: 11px 14px;
    background: #0a0f1a;
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cs-textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  .cs-select {
    width: 100%;
    padding: 11px 14px;
    background: #0a0f1a;
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .cs-select:focus { border-color: #3b82f6; }
  .cs-btn-post {
    padding: 11px 28px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 0 20px rgba(16,185,129,0.2);
  }
  .cs-btn-post:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0 30px rgba(16,185,129,0.35);
  }
  .cs-btn-post:disabled { opacity: 0.6; cursor: not-allowed; }

  /* SEARCH & FILTER */
  .cs-search-wrap {
    background: #0f1623;
    border: 1px solid rgba(99,179,237,0.08);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }
  .cs-search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    background: #0a0f1a;
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    position: relative;
  }
  .cs-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  .cs-search-input::placeholder { color: #475569; }
  .cs-search-wrap-inner { position: relative; }
  .cs-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #475569;
    font-size: 1rem;
    pointer-events: none;
  }
  .cs-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .cs-filter-btn {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid rgba(99,179,237,0.15);
    background: transparent;
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .cs-filter-btn:hover {
    border-color: rgba(99,179,237,0.3);
    color: #94a3b8;
  }
  .cs-filter-btn.active {
    background: rgba(59,130,246,0.15);
    border-color: rgba(59,130,246,0.4);
    color: #63b3ed;
    font-weight: 600;
  }

  /* LISTINGS HEADER */
  .cs-listings-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .cs-listings-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #94a3b8;
  }
  .cs-listings-count {
    padding: 3px 10px;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #63b3ed;
  }

  /* PRODUCT GRID */
  .cs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
  .cs-product-card {
    background: #0f1623;
    border: 1px solid rgba(99,179,237,0.08);
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.25s;
    position: relative;
  }
  .cs-product-card:hover {
    border-color: rgba(99,179,237,0.2);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
  }
  .cs-product-img {
    width: 100%;
    height: 190px;
    object-fit: cover;
    display: block;
    background: #0a0f1a;
  }
  .cs-product-img-placeholder {
    width: 100%;
    height: 190px;
    background: #0a0f1a;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e293b;
    font-size: 2.5rem;
  }
  .cs-product-body { padding: 16px; }
  .cs-product-cat {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8b5cf6;
    margin-bottom: 6px;
  }
  .cs-product-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 6px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .cs-product-desc {
    font-size: 0.8rem;
    color: #475569;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .cs-product-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid rgba(99,179,237,0.06);
  }
  .cs-product-price {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #34d399;
  }
  .cs-product-seller {
    font-size: 0.75rem;
    color: #475569;
  }
  .cs-btn-delete {
    padding: 5px 12px;
    background: rgba(239,68,68,0.1);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .cs-btn-delete:hover {
    background: rgba(239,68,68,0.2);
    border-color: rgba(239,68,68,0.4);
  }

  /* EMPTY STATE */
  .cs-empty {
    text-align: center;
    padding: 80px 20px;
    color: #334155;
  }
  .cs-empty-icon { font-size: 3rem; margin-bottom: 16px; }
  .cs-empty-text { font-size: 0.95rem; }

  /* PRODUCT DETAIL */
  .cs-btn-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    background: rgba(99,179,237,0.08);
    color: #94a3b8;
    border: 1px solid rgba(99,179,237,0.12);
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 28px;
    font-family: 'Inter', sans-serif;
  }
  .cs-btn-back:hover {
    background: rgba(99,179,237,0.12);
    color: #e2e8f0;
  }
  .cs-detail-layout {
    display: flex;
    gap: 40px;
    flex-wrap: wrap;
  }
  .cs-detail-img-wrap {
    flex: 1;
    min-width: 280px;
  }
  .cs-detail-img {
    width: 100%;
    max-height: 420px;
    object-fit: contain;
    border-radius: 16px;
    border: 1px solid rgba(99,179,237,0.08);
    background: #0a0f1a;
  }
  .cs-detail-info {
    flex: 1;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .cs-detail-cat {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8b5cf6;
    margin-bottom: 10px;
  }
  .cs-detail-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1.2;
    margin-bottom: 14px;
    letter-spacing: -0.5px;
  }
  .cs-detail-price {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: #34d399;
    margin-bottom: 24px;
  }
  .cs-detail-desc-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #475569;
    margin-bottom: 10px;
  }
  .cs-detail-desc {
    background: #0a0f1a;
    border: 1px solid rgba(99,179,237,0.08);
    border-radius: 12px;
    padding: 16px;
    color: #94a3b8;
    font-size: 0.9rem;
    line-height: 1.7;
    margin-bottom: 28px;
    flex: 1;
  }
  .cs-detail-seller {
    padding: 14px 16px;
    background: rgba(99,179,237,0.04);
    border: 1px solid rgba(99,179,237,0.08);
    border-radius: 12px;
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 16px;
  }
  .cs-detail-seller strong { color: #94a3b8; }
  .cs-btn-whatsapp {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #25D366, #128C7E);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 0 24px rgba(37,211,102,0.2);
    letter-spacing: 0.01em;
  }
  .cs-btn-whatsapp:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 36px rgba(37,211,102,0.35);
  }

  /* RESPONSIVE */
  @media (max-width: 640px) {
    .cs-nav { padding: 0 16px; }
    .cs-main { padding: 20px 16px; }
    .cs-auth-box { padding: 28px 20px; }
    .cs-form-card { padding: 20px; }
    .cs-market-title { font-size: 1.2rem; }
    .cs-detail-title { font-size: 1.4rem; }
    .cs-detail-price { font-size: 1.6rem; }
    .cs-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .cs-product-img { height: 140px; }
    .cs-greeting { display: none; }
  }
`;

function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Error fetching marketplace items:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedProduct(null);
    setShowForm(false);
    setView('login');
  };

  return (
    <>
      <style>{styles}</style>
      <div className="cs-app">
        {user && (
          <nav className="cs-nav">
            <div className="cs-nav-inner">
              <div className="cs-logo" onClick={() => { setSelectedProduct(null); setShowForm(false); }}>
                CampuSwap ⚡
              </div>
              <div className="cs-nav-right">
                <span className="cs-greeting">Hey, <span>{user.name.split(' ')[0]}</span></span>
                <button className="cs-btn-logout" onClick={handleLogout}>Sign out</button>
              </div>
            </div>
          </nav>
        )}

        <main className="cs-main">
          {user ? (
            selectedProduct ? (
              <ProductDetail
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
              />
            ) : (
              <div>
                <div className="cs-market-header">
                  <h2 className="cs-market-title">Campus <span>Marketplace</span></h2>
                  <button
                    className={`cs-btn-sell ${showForm ? 'cancel' : ''}`}
                    onClick={() => setShowForm(!showForm)}
                  >
                    {showForm ? '✕ Cancel' : '+ Sell an Item'}
                  </button>
                </div>

                {showForm && (
                  <ProductForm onProductAdded={() => { fetchProducts(); setShowForm(false); }} />
                )}

                <ProductList
                  products={products}
                  loading={productsLoading}
                  onProductClick={(product) => setSelectedProduct(product)}
                  onProductDeleted={fetchProducts}
                />
              </div>
            )
          ) : view === 'login' ? (
            <Login
              switchToSignup={() => setView('signup')}
              onLoginSuccess={(loggedUser) => setUser(loggedUser)}
            />
          ) : (
            <Signup switchToLogin={() => setView('login')} />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
