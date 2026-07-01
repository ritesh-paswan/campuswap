import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CATEGORIES = ['All', 'Textbooks', 'Electronics', 'Lab & Engineering Gears', 'Hostel Essentials', 'Clothing', 'Other'];

function ProductList({ products = [], loading, onProductClick, onProductDeleted }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
                <div className="cs-product-cat">{product.category || 'Other'}</div>
                <div className="cs-product-title">{product.title}</div>
                <div className="cs-product-desc">{product.description}</div>
              </div>
              <div className="cs-product-footer">
                <span className="cs-product-price">₹{product.price}</span>
                {currentUserId === product.seller_id ? (
                  <button className="cs-btn-delete" onClick={e => handleDelete(e, product.id)}>
                    Delete
                  </button>
                ) : (
                  <span className="cs-product-seller">{product.seller_name || 'Campus Seller'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
