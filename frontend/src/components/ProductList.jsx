import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CATEGORIES = ['All', 'Textbooks', 'Electronics', 'Lab & Engineering Gears', 'Hostel Essentials', 'Clothing', 'Other'];

// Time ago helper
function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Share helper
function shareProduct(e, product) {
  e.stopPropagation();
  const url = `${window.location.origin}?product=${product.id}`;
  if (navigator.share) {
    navigator.share({
      title: product.title,
      text: `Check out "${product.title}" for ₹${product.price} on CampuSwap!`,
      url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      alert('Share link: ' + url);
    });
  }
}

function ProductList({ products = [], loading, onProductClick, onProductDeleted, isLoggedIn }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = savedUser?.id;

  const handleDelete = async (e, productId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this listing from CampuSwap?')) return;
    const token = localStorage.getItem('token');
    if (!token) { alert('You must be logged in.'); return; }
    try {
      await axios.delete(`${API_URL}/api/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onProductDeleted();
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
      return 0;
    });

  if (loading) return (
    <div className="cs-loading">
      <span className="cs-loading-dot"></span>
      <span className="cs-loading-dot"></span>
      <span className="cs-loading-dot"></span>
    </div>
  );

  return (
    <div>
      <div className="cs-search-wrap">
        <div className="cs-search-wrap-inner">
          <span className="cs-search-icon">🔍</span>
          <input
            className="cs-search-input"
            type="text"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="cs-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cs-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="cs-listings-header">
        <span className="cs-listings-title">Active Listings</span>
        <span className="cs-listings-count">{filteredProducts.length}</span>
        <div style={{ marginLeft: 'auto' }}>
          <select
            className="cs-sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">↓ Newest first</option>
            <option value="oldest">↑ Oldest first</option>
            <option value="price_asc">₹ Price: Low to High</option>
            <option value="price_desc">₹ Price: High to Low</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="cs-empty">
          <div className="cs-empty-icon">📭</div>
          <div className="cs-empty-text">No listings found. Be the first to sell something!</div>
        </div>
      ) : (
        <div className="cs-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="cs-product-card" onClick={() => onProductClick(product)}>
              {product.image_url
                ? <img className="cs-product-img" src={product.image_url} alt={product.title} />
                : <div className="cs-product-img-placeholder">📦</div>
              }
              <div className="cs-product-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div className="cs-product-cat">{product.category || 'Other'}</div>
                  {product.created_at && (
                    <div className="cs-product-time">{timeAgo(product.created_at)}</div>
                  )}
                </div>
                <div className="cs-product-title">{product.title}</div>
                <div className="cs-product-desc">{product.description}</div>
              </div>
              <div className="cs-product-footer">
                <span className="cs-product-price">₹{product.price}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Share button — always visible */}
                  <button
                    className="cs-btn-share"
                    onClick={e => shareProduct(e, product)}
                    title="Share listing"
                  >
                    ↗
                  </button>
                  {isLoggedIn && currentUserId === product.seller_id ? (
                    <button className="cs-btn-delete" onClick={e => handleDelete(e, product.id)}>
                      Delete
                    </button>
                  ) : (
                    <span className="cs-product-seller">{product.seller_name || 'Campus Seller'}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
