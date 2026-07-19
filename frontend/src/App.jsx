import React, { useState, useEffect } from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Inbox from './components/Inbox';
import ChatWindow from './components/ChatWindow';
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

  .cs-app { min-height: 100vh; background: #080c14; }

  /* NAV */
  .cs-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(8,12,20,0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(99,179,237,0.1);
    padding: 0 24px;
  }
  .cs-nav-inner {
    max-width: 1100px; margin: 0 auto; height: 56px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .cs-logo {
    font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; font-weight: 700;
    background: linear-gradient(135deg, #63b3ed, #9f7aea);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    cursor: pointer; letter-spacing: -0.5px;
  }
  .cs-nav-right { display: flex; align-items: center; gap: 10px; }
  .cs-greeting { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
  .cs-greeting span { color: #63b3ed; font-weight: 600; }

  /* NAV BACK BUTTON */
  .cs-btn-nav-back {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    background: rgba(99,179,237,0.08); color: #94a3b8;
    border: 1px solid rgba(99,179,237,0.12); border-radius: 8px;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .cs-btn-nav-back:hover { background: rgba(99,179,237,0.14); color: #e2e8f0; }

  .cs-btn-logout {
    padding: 6px 14px; background: rgba(239,68,68,0.1); color: #f87171;
    border: 1px solid rgba(239,68,68,0.2); border-radius: 8px;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .cs-btn-logout:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); }
  .cs-btn-nav-login {
    padding: 6px 14px; background: rgba(59,130,246,0.1); color: #63b3ed;
    border: 1px solid rgba(59,130,246,0.2); border-radius: 8px;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .cs-btn-nav-login:hover { background: rgba(59,130,246,0.2); }
  .cs-btn-nav-signup {
    padding: 6px 14px; background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff; border: none; border-radius: 8px;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .cs-btn-nav-signup:hover { opacity: 0.9; transform: translateY(-1px); }

  /* INBOX NAV BUTTON */
  .cs-btn-inbox {
    position: relative; padding: 6px 14px;
    background: rgba(99,179,237,0.08); color: #94a3b8;
    border: 1px solid rgba(99,179,237,0.15); border-radius: 8px;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
    display: flex; align-items: center; gap: 6px;
  }
  .cs-btn-inbox:hover { background: rgba(99,179,237,0.14); color: #e2e8f0; }
  .cs-btn-inbox.active { background: rgba(59,130,246,0.15); color: #63b3ed; border-color: rgba(59,130,246,0.3); }
  .cs-unread-badge {
    position: absolute; top: -6px; right: -6px;
    background: #ef4444; color: #fff;
    font-size: 0.65rem; font-weight: 700;
    padding: 2px 5px; border-radius: 10px; min-width: 18px; text-align: center;
    line-height: 1.4;
  }

  /* HERO */
  .cs-hero {
    background: #080c14; padding: 70px 24px 50px;
    text-align: center; position: relative; overflow: hidden;
  }
  .cs-hero::before {
    content: ''; position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
    width: 600px; height: 400px;
    background: radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .cs-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; background: rgba(59,130,246,0.08);
    border: 1px solid rgba(59,130,246,0.2); border-radius: 20px;
    font-size: 0.75rem; font-weight: 600; color: #63b3ed;
    letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px;
  }
  .cs-hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 700; color: #f1f5f9;
    line-height: 1.15; letter-spacing: -1px; margin-bottom: 20px;
    max-width: 700px; margin-left: auto; margin-right: auto;
  }
  .cs-hero-title span {
    background: linear-gradient(135deg, #63b3ed, #9f7aea);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .cs-hero-sub { font-size: 1rem; color: #64748b; max-width: 500px; margin: 0 auto 36px; line-height: 1.7; }
  .cs-hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 48px; }
  .cs-btn-hero-primary {
    padding: 13px 28px; background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff; border: none; border-radius: 12px;
    font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    font-family: 'Inter', sans-serif; box-shadow: 0 0 24px rgba(99,102,241,0.3);
  }
  .cs-btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 0 36px rgba(99,102,241,0.5); }
  .cs-btn-hero-secondary {
    padding: 13px 28px; background: rgba(255,255,255,0.04); color: #94a3b8;
    border: 1px solid rgba(99,179,237,0.15); border-radius: 12px;
    font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .cs-btn-hero-secondary:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
  .cs-hero-stats { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; padding-top: 36px; border-top: 1px solid rgba(99,179,237,0.08); }
  .cs-hero-stat-num { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 700; color: #f1f5f9; }
  .cs-hero-stat-num span { color: #63b3ed; }
  .cs-hero-stat-label { font-size: 0.78rem; color: #475569; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }

  /* MAIN */
  .cs-main { max-width: 1100px; margin: 0 auto; padding: 24px 24px; }

  /* MARKETPLACE HEADER */
  .cs-market-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
  .cs-market-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #f1f5f9; letter-spacing: -0.5px; }
  .cs-market-title span { color: #63b3ed; }
  .cs-btn-sell {
    padding: 9px 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff; border: none; border-radius: 10px;
    font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    font-family: 'Inter', sans-serif; box-shadow: 0 0 20px rgba(99,102,241,0.3);
  }
  .cs-btn-sell:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(99,102,241,0.5); }
  .cs-btn-sell.cancel { background: rgba(100,116,139,0.2); color: #94a3b8; border: 1px solid rgba(100,116,139,0.3); box-shadow: none; }
  .cs-btn-sell.cancel:hover { background: rgba(100,116,139,0.3); transform: none; }

  /* LOADING */
  .cs-loading { text-align: center; padding: 60px 20px; color: #64748b; }
  .cs-loading-dot { display: inline-block; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin: 0 4px; animation: pulse 1.4s infinite ease-in-out; }
  .cs-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .cs-loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes pulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

  /* INPUTS */
  .cs-input {
    width: 100%; padding: 11px 14px; background: #0a0f1a;
    border: 1px solid rgba(99,179,237,0.15); border-radius: 10px; color: #e2e8f0;
    font-size: 0.9rem; font-family: 'Inter', sans-serif; transition: border-color 0.2s, box-shadow 0.2s; outline: none;
  }
  .cs-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
  .cs-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .cs-input::placeholder { color: #475569; }
  .cs-label { display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

  /* PRIMARY BUTTON */
  .cs-btn-primary {
    width: 100%; padding: 13px; background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; box-shadow: 0 0 20px rgba(99,102,241,0.25);
  }
  .cs-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 30px rgba(99,102,241,0.4); }
  .cs-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* SUCCESS / ERROR */
  .cs-success { margin-top: 16px; padding: 12px 16px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 8px; color: #34d399; font-size: 0.875rem; font-weight: 500; text-align: center; }
  .cs-error { margin-top: 16px; padding: 12px 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; color: #f87171; font-size: 0.875rem; font-weight: 500; text-align: center; }

  /* AUTH */
  .cs-auth-page { min-height: calc(100vh - 56px); display: flex; align-items: center; justify-content: center; padding: 32px 20px; }
  .cs-auth-box { width: 100%; max-width: 420px; background: #0f1623; border: 1px solid rgba(99,179,237,0.1); border-radius: 20px; padding: 36px; box-shadow: 0 25px 60px rgba(0,0,0,0.4); }
  .cs-auth-logo { text-align: center; margin-bottom: 8px; font-size: 2rem; }
  .cs-auth-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; text-align: center; color: #f1f5f9; margin-bottom: 6px; }
  .cs-auth-sub { text-align: center; color: #64748b; font-size: 0.875rem; margin-bottom: 28px; }
  .cs-field { margin-bottom: 18px; }
  .cs-switch { text-align: center; margin-top: 20px; font-size: 0.875rem; color: #64748b; }
  .cs-switch-link { color: #63b3ed; cursor: pointer; font-weight: 600; }
  .cs-switch-link:hover { text-decoration: underline; }

  /* OTP */
  .cs-otp-box { background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 18px; margin-bottom: 18px; }
  .cs-otp-label { display: block; margin-bottom: 10px; font-size: 0.8rem; font-weight: 600; color: #63b3ed; text-transform: uppercase; letter-spacing: 0.05em; }
  .cs-otp-input { width: 100%; padding: 14px; background: #0a0f1a; border: 1px solid rgba(59,130,246,0.3); border-radius: 10px; color: #63b3ed; font-size: 1.6rem; font-weight: 700; text-align: center; letter-spacing: 8px; font-family: 'Space Grotesk', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
  .cs-otp-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }

  /* PRODUCT FORM */
  .cs-form-card { background: #0f1623; border: 1px solid rgba(99,179,237,0.08); border-radius: 16px; padding: 24px; margin-bottom: 28px; }
  .cs-form-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 700; color: #f1f5f9; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .cs-form-title::before { content: ''; display: block; width: 4px; height: 20px; background: linear-gradient(180deg, #3b82f6, #8b5cf6); border-radius: 2px; }
  .cs-form-row { display: flex; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
  .cs-form-group { margin-bottom: 18px; }
  .cs-file-input { width: 100%; padding: 11px 14px; background: #0a0f1a; border: 1px dashed rgba(99,179,237,0.25); border-radius: 10px; color: #94a3b8; font-size: 0.875rem; font-family: 'Inter', sans-serif; cursor: pointer; }
  .cs-file-input::-webkit-file-upload-button { padding: 6px 14px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 6px; color: #63b3ed; font-size: 0.8rem; font-weight: 600; cursor: pointer; margin-right: 12px; font-family: 'Inter', sans-serif; }
  .cs-textarea { width: 100%; padding: 11px 14px; background: #0a0f1a; border: 1px solid rgba(99,179,237,0.15); border-radius: 10px; color: #e2e8f0; font-size: 0.9rem; font-family: 'Inter', sans-serif; resize: vertical; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
  .cs-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
  .cs-select { width: 100%; padding: 11px 14px; background: #0a0f1a; border: 1px solid rgba(99,179,237,0.15); border-radius: 10px; color: #e2e8f0; font-size: 0.9rem; font-family: 'Inter', sans-serif; outline: none; cursor: pointer; transition: border-color 0.2s; }
  .cs-select:focus { border-color: #3b82f6; }
  .cs-btn-post { padding: 11px 28px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; box-shadow: 0 0 20px rgba(16,185,129,0.2); }
  .cs-btn-post:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 30px rgba(16,185,129,0.35); }
  .cs-btn-post:disabled { opacity: 0.6; cursor: not-allowed; }

  /* SEARCH & FILTER */
  .cs-search-wrap { background: #0f1623; border: 1px solid rgba(99,179,237,0.08); border-radius: 16px; padding: 16px; margin-bottom: 20px; }
  .cs-search-wrap-inner { position: relative; }
  .cs-search-input { width: 100%; padding: 11px 16px 11px 40px; background: #0a0f1a; border: 1px solid rgba(99,179,237,0.15); border-radius: 10px; color: #e2e8f0; font-size: 0.875rem; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
  .cs-search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
  .cs-search-input::placeholder { color: #475569; }
  .cs-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #475569; font-size: 0.95rem; pointer-events: none; }
  .cs-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
  .cs-filter-btn { padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(99,179,237,0.15); background: transparent; color: #64748b; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
  .cs-filter-btn:hover { border-color: rgba(99,179,237,0.3); color: #94a3b8; }
  .cs-filter-btn.active { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.4); color: #63b3ed; font-weight: 600; }

  /* LISTINGS */
  .cs-listings-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .cs-listings-title { font-family: 'Space Grotesk', sans-serif; font-size: 0.95rem; font-weight: 600; color: #94a3b8; }
  .cs-listings-count { padding: 3px 10px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 20px; font-size: 0.72rem; font-weight: 600; color: #63b3ed; }

  /* PRODUCT GRID */
  .cs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  .cs-product-card { background: #0f1623; border: 1px solid rgba(99,179,237,0.08); border-radius: 14px; overflow: hidden; cursor: pointer; transition: all 0.25s; position: relative; }
  .cs-product-card:hover { border-color: rgba(99,179,237,0.2); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
  .cs-product-img { width: 100%; height: 175px; object-fit: cover; display: block; background: #0a0f1a; }
  .cs-product-img-placeholder { width: 100%; height: 175px; background: #0a0f1a; display: flex; align-items: center; justify-content: center; color: #1e293b; font-size: 2.5rem; }
  .cs-product-body { padding: 14px; }
  .cs-product-cat { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8b5cf6; margin-bottom: 5px; }
  .cs-product-title { font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem; font-weight: 600; color: #e2e8f0; margin-bottom: 5px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cs-product-desc { font-size: 0.78rem; color: #475569; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cs-product-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-top: 1px solid rgba(99,179,237,0.06); }
  .cs-product-price { font-family: 'Space Grotesk', sans-serif; font-size: 1rem; font-weight: 700; color: #34d399; }
  .cs-product-seller { font-size: 0.72rem; color: #475569; }
  .cs-btn-delete { padding: 4px 10px; background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); border-radius: 6px; font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
  .cs-btn-delete:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); }

  /* LOGIN PROMPT */
  .cs-login-prompt { background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .cs-login-prompt-text { font-size: 0.875rem; color: #64748b; }
  .cs-login-prompt-text strong { color: #94a3b8; }
  .cs-login-prompt-actions { display: flex; gap: 10px; }
  .cs-btn-prompt-login { padding: 7px 16px; background: transparent; color: #63b3ed; border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
  .cs-btn-prompt-login:hover { background: rgba(59,130,246,0.1); }
  .cs-btn-prompt-signup { padding: 7px 16px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
  .cs-btn-prompt-signup:hover { opacity: 0.9; }

  /* EMPTY */
  .cs-empty { text-align: center; padding: 60px 20px; color: #334155; }
  .cs-empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
  .cs-empty-text { font-size: 0.9rem; }

  /* DETAIL */
  .cs-detail-layout { display: flex; gap: 36px; flex-wrap: wrap; }
  .cs-detail-img-wrap { flex: 1; min-width: 260px; }
  .cs-detail-img { width: 100%; max-height: 400px; object-fit: contain; border-radius: 14px; border: 1px solid rgba(99,179,237,0.08); background: #0a0f1a; }
  .cs-detail-info { flex: 1; min-width: 260px; display: flex; flex-direction: column; }
  .cs-detail-cat { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8b5cf6; margin-bottom: 8px; }
  .cs-detail-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 700; color: #f1f5f9; line-height: 1.2; margin-bottom: 12px; letter-spacing: -0.5px; }
  .cs-detail-price { font-family: 'Space Grotesk', sans-serif; font-size: 1.8rem; font-weight: 700; color: #34d399; margin-bottom: 20px; }
  .cs-detail-desc-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin-bottom: 8px; }
  .cs-detail-desc { background: #0a0f1a; border: 1px solid rgba(99,179,237,0.08); border-radius: 12px; padding: 14px; color: #94a3b8; font-size: 0.875rem; line-height: 1.7; margin-bottom: 20px; flex: 1; }
  .cs-detail-seller { padding: 12px 14px; background: rgba(99,179,237,0.04); border: 1px solid rgba(99,179,237,0.08); border-radius: 12px; font-size: 0.82rem; color: #64748b; margin-bottom: 14px; }
  .cs-detail-seller strong { color: #94a3b8; }

  /* MESSAGE SELLER BUTTON */
  .cs-btn-message {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff; border: none; border-radius: 12px;
    font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: 0 0 24px rgba(99,102,241,0.25);
  }
  .cs-btn-message:hover { transform: translateY(-2px); box-shadow: 0 0 36px rgba(99,102,241,0.4); }

  /* SORT */
  .cs-sort-select { padding: 5px 10px; background: #0a0f1a; border: 1px solid rgba(99,179,237,0.15); border-radius: 8px; color: #94a3b8; font-size: 0.78rem; font-family: 'Inter', sans-serif; outline: none; cursor: pointer; }
  .cs-sort-select:focus { border-color: #3b82f6; }

  /* TIME AGO */
  .cs-product-time { font-size: 0.68rem; color: #bfc2c6; font-weight: 500; }

  /* SHARE */
  .cs-btn-share { padding: 3px 9px; background: rgba(99,179,237,0.08); color: #64748b; border: 1px solid rgba(99,179,237,0.12); border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
  .cs-btn-share:hover { background: rgba(99,179,237,0.15); color: #94a3b8; }

  /* INBOX PAGE */
  .cs-inbox-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; font-weight: 700; color: #f1f5f9; letter-spacing: -0.5px; margin-bottom: 20px; }
  .cs-conv-list { display: flex; flex-direction: column; gap: 10px; }
  .cs-conv-card {
    background: #0f1623; border: 1px solid rgba(99,179,237,0.08);
    border-radius: 14px; padding: 14px 18px;
    display: flex; align-items: center; gap: 14px;
    cursor: pointer; transition: all 0.2s;
  }
  .cs-conv-card:hover { border-color: rgba(99,179,237,0.2); transform: translateX(2px); }
  .cs-conv-card.unread { border-color: rgba(59,130,246,0.2); background: rgba(59,130,246,0.04); }
  .cs-conv-img { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; background: #0a0f1a; flex-shrink: 0; }
  .cs-conv-img-placeholder { width: 48px; height: 48px; border-radius: 10px; background: #0a0f1a; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
  .cs-conv-body { flex: 1; min-width: 0; }
  .cs-conv-product { font-size: 0.72rem; color: #8b5cf6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
  .cs-conv-name { font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem; font-weight: 600; color: #e2e8f0; margin-bottom: 3px; }
  .cs-conv-last { font-size: 0.78rem; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cs-conv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .cs-conv-time { font-size: 0.7rem; color: #334155; }
  .cs-conv-unread-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; }

  /* CHAT WINDOW — maximized space */
  .cs-chat-wrap {
    display: flex; flex-direction: column;
    height: calc(100vh - 72px); /* full viewport minus navbar only */
    max-width: 1100px; margin: 0 auto; padding: 0 24px;
  }
  .cs-chat-topbar {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 0; border-bottom: 1px solid rgba(99,179,237,0.08);
    flex-shrink: 0;
  }
  .cs-chat-product-img { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; background: #0a0f1a; flex-shrink: 0; }
  .cs-chat-product-img-placeholder { width: 38px; height: 38px; border-radius: 8px; background: #0a0f1a; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
  .cs-chat-header-info { flex: 1; }
  .cs-chat-header-title { font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem; font-weight: 600; color: #f1f5f9; }
  .cs-chat-header-sub { font-size: 0.72rem; color: #64748b; margin-top: 1px; }
  .cs-chat-messages {
    flex: 1; overflow-y: auto; padding: 12px 0;
    display: flex; flex-direction: column; gap: 2px;
  }
  .cs-chat-messages::-webkit-scrollbar { width: 4px; }
  .cs-chat-messages::-webkit-scrollbar-track { background: transparent; }
  .cs-chat-messages::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.1); border-radius: 2px; }
  .cs-msg { display: flex; flex-direction: column; max-width: 68%; }
  .cs-msg.mine { align-self: flex-end; align-items: flex-end; }
  .cs-msg.theirs { align-self: flex-start; align-items: flex-start; }
  .cs-msg-bubble { padding: 8px 13px; border-radius: 14px; font-size: 0.875rem; line-height: 1.45; }
  .cs-msg.mine .cs-msg-bubble { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; border-bottom-right-radius: 4px; }
  .cs-msg.theirs .cs-msg-bubble { background: #0f1623; border: 1px solid rgba(99,179,237,0.1); color: #e2e8f0; border-bottom-left-radius: 4px; }
  .cs-chat-input-wrap { padding: 10px 0; border-top: 1px solid rgba(99,179,237,0.08); display: flex; gap: 8px; flex-shrink: 0; }
  .cs-chat-input { flex: 1; padding: 10px 14px; background: #0a0f1a; border: 1px solid rgba(99,179,237,0.15); border-radius: 10px; color: #e2e8f0; font-size: 0.875rem; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
  .cs-chat-input:focus { border-color: #3b82f6; }
  .cs-chat-input::placeholder { color: #475569; }
  .cs-btn-send { padding: 10px 18px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; white-space: nowrap; }
  .cs-btn-send:hover:not(:disabled) { transform: translateY(-1px); }
  .cs-btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
  .cs-chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: #334155; gap: 10px; }
  .cs-chat-empty-icon { font-size: 2rem; }

  /* RESPONSIVE */
  @media (max-width: 640px) {
    .cs-nav { padding: 0 14px; }
    .cs-main { padding: 16px; }
    .cs-hero { padding: 40px 16px 36px; }
    .cs-hero-stats { gap: 20px; }
    .cs-auth-box { padding: 24px 18px; }
    .cs-form-card { padding: 16px; }
    .cs-market-title { font-size: 1.15rem; }
    .cs-detail-title { font-size: 1.3rem; }
    .cs-detail-price { font-size: 1.5rem; }
    .cs-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .cs-product-img { height: 130px; }
    .cs-greeting { display: none; }
    .cs-login-prompt { flex-direction: column; text-align: center; }
    .cs-msg { max-width: 85%; }
    .cs-chat-wrap { padding: 0 14px; height: calc(100vh - 56px); }
  }
`;

function App() {
  const [view, setView] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/chat/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {}
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data.products || []);
    } catch (err) {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedProduct(null);
    setShowForm(false);
    setActiveConversation(null);
    setUnreadCount(0);
    setView(null);
  };

  const handleLoginSuccess = (loggedUser) => {
    setUser(loggedUser);
    setView(null);
  };

  const handleMessageSeller = async (product) => {
    if (!user) { setView('login'); return; }
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        `${API_URL}/api/chat/conversation`,
        { product_id: product.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveConversation({ ...res.data.conversation, product });
      setSelectedProduct(null);
      setView('chat');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not open chat.');
    }
  };

  // ─── Determine what back button does on each page ───
  const getBackAction = () => {
    if (view === 'login' || view === 'signup') return () => setView(null);
    if (view === 'chat') return () => setView('inbox');
    if (view === 'inbox') return () => setView(null);
    if (selectedProduct) return () => setSelectedProduct(null);
    return null;
  };

  const backAction = getBackAction();
  const isOnAuthPage = view === 'login' || view === 'signup';
  const isOnChatPage = view === 'chat';
  const isOnInboxPage = view === 'inbox';

  // ─── Shared nav ───
  const Nav = () => (
    <nav className="cs-nav">
      <div className="cs-nav-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Back button in nav when there's somewhere to go back to */}
          {backAction && (
            <button className="cs-btn-nav-back" onClick={backAction}>
              ← Back
            </button>
          )}
          <div
            className="cs-logo"
            onClick={() => { setSelectedProduct(null); setShowForm(false); setView(null); }}
          >
            CampuSwap ⚡
          </div>
        </div>

        <div className="cs-nav-right">
          {user ? (
            <>
              <span className="cs-greeting">Hey, <span>{user.name.split(' ')[0]}</span></span>
              {/* Hide inbox button when already on inbox or chat */}
              {!isOnInboxPage && !isOnChatPage && (
                <button
                  className="cs-btn-inbox"
                  onClick={() => { setView('inbox'); setSelectedProduct(null); }}
                >
                  💬 Inbox
                  {unreadCount > 0 && (
                    <span className="cs-unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
              )}
              <button className="cs-btn-logout" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            /* Hide sign in/join free on auth pages */
            !isOnAuthPage && (
              <>
                <button className="cs-btn-nav-login" onClick={() => setView('login')}>Sign in</button>
                <button className="cs-btn-nav-signup" onClick={() => setView('signup')}>Join free</button>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="cs-app">
        <Nav />

        {/* AUTH SCREENS */}
        {view === 'login' && (
          <Login switchToSignup={() => setView('signup')} onLoginSuccess={handleLoginSuccess} />
        )}

        {view === 'signup' && (
          <Signup switchToLogin={() => setView('login')} />
        )}

        {/* INBOX */}
        {view === 'inbox' && user && (
          <main className="cs-main">
            <h2 className="cs-inbox-title">💬 Inbox</h2>
            <Inbox
              user={user}
              onOpenChat={(conv) => { setActiveConversation(conv); setView('chat'); }}
            />
          </main>
        )}

        {/* CHAT — full height, no cs-main wrapper */}
        {view === 'chat' && user && activeConversation && (
          <ChatWindow
            conversation={activeConversation}
            user={user}
            onBack={() => setView('inbox')}
            onMessageRead={fetchUnreadCount}
          />
        )}

        {/* MAIN CONTENT */}
        {!view && (
          <>
            {selectedProduct ? (
              <main className="cs-main">
                <ProductDetail
                  product={selectedProduct}
                  onBack={() => setSelectedProduct(null)}
                  onLoginRequired={() => setView('login')}
                  isLoggedIn={!!user}
                  onMessageSeller={handleMessageSeller}
                />
              </main>
            ) : (
              <>
                {!user && (
                  <section className="cs-hero">
                    <div className="cs-hero-badge">⚡ Campus Marketplace</div>
                    <h1 className="cs-hero-title">Buy & Sell on Campus,<br /><span>Smarter than ever</span></h1>
                    <p className="cs-hero-sub">The student marketplace for textbooks, electronics, hostel essentials and more. Chat privately with sellers on campus.</p>
                    <div className="cs-hero-actions">
                      <button className="cs-btn-hero-primary" onClick={() => setView('signup')}>Start selling free →</button>
                      <button className="cs-btn-hero-secondary" onClick={() => setView('login')}>Sign in</button>
                    </div>
                    <div className="cs-hero-stats">
                      <div><div className="cs-hero-stat-num">{products.length}<span>+</span></div><div className="cs-hero-stat-label">Active listings</div></div>
                      <div><div className="cs-hero-stat-num">100<span>%</span></div><div className="cs-hero-stat-label">Free to use</div></div>
                      <div><div className="cs-hero-stat-num">0<span>s</span></div><div className="cs-hero-stat-label">Commission</div></div>
                    </div>
                  </section>
                )}
                <main className="cs-main">
                  {user && (
                    <div className="cs-market-header">
                      <h2 className="cs-market-title">Campus <span>Marketplace</span></h2>
                      <button className={`cs-btn-sell ${showForm ? 'cancel' : ''}`} onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Cancel' : '+ Sell an Item'}
                      </button>
                    </div>
                  )}
                  {user && showForm && <ProductForm onProductAdded={() => { fetchProducts(); setShowForm(false); }} />}
                  {!user && (
                    <div className="cs-login-prompt">
                      <div className="cs-login-prompt-text"><strong>Want to sell or chat with a seller?</strong> Create a free account — takes 30 seconds.</div>
                      <div className="cs-login-prompt-actions">
                        <button className="cs-btn-prompt-login" onClick={() => setView('login')}>Sign in</button>
                        <button className="cs-btn-prompt-signup" onClick={() => setView('signup')}>Join free</button>
                      </div>
                    </div>
                  )}
                  <ProductList
                    products={products}
                    loading={productsLoading}
                    onProductClick={(product) => setSelectedProduct(product)}
                    onProductDeleted={fetchProducts}
                    isLoggedIn={!!user}
                  />
                </main>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;
