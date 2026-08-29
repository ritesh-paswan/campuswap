import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CATEGORIES = ['All', 'Textbooks', 'Electronics', 'Lab & Engineering Gears', 'Hostel Essentials', 'Clothing', 'Other'];

const CAT_CLASS = {
  'Textbooks': 'cat-textbooks',
  'Electronics': 'cat-electronics',
  'Lab & Engineering Gears': 'cat-lab',
  'Hostel Essentials': 'cat-hostel',
  'Clothing': 'cat-clothing',
  'Other': 'cat-other',
};

function timeAgo(dateString) {
  if (!dateString) return '';
  const s = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function shareProduct(e, product) {
  e.stopPropagation();
  const url = `${window.location.origin}?product=${product.id}`;
  if (navigator.share) {
    navigator.share({ title: product.title, text: `Check out "${product.title}" for ₹${product.price} on CampuSwap!`, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => alert('Link copied!')).catch(() => alert('Share: ' + url));
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
    if (!window.confirm('Remove this listing?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
      onProductDeleted();
    } catch { alert('Failed to delete.'); }
  };

  const filtered = products
    .filter(p => {
      const s = searchTerm.toLowerCase();
      return (p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)) &&
        (selectedCategory === 'All' || p.category === selectedCategory);
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
          <input className="cs-search-input" type="text" placeholder="Search listings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="cs-filters">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`cs-filter-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="cs-listings-header">
        <span className="cs-listings-title">Listings</span>
        <span className="cs-listings-count">{filtered.length}</span>
        <select className="cs-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">↓ Newest</option>
          <option value="oldest">↑ Oldest</option>
          <option value="price_asc">₹ Low to High</option>
          <option value="price_desc">₹ High to Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="cs-empty">
          <div className="cs-empty-icon">📭</div>
          <div className="cs-empty-text">No listings found.</div>
        </div>
      ) : (
        <div className="cs-grid">
          {filtered.map(product => {
            const catClass = CAT_CLASS[product.category] || 'cat-other';
            return (
              <div key={product.id} className={`cs-product-card ${catClass}`} onClick={() => onProductClick(product)}>
                {product.image_url
                  ? <img className="cs-product-img" src={product.image_url} alt={product.title} />
                  : <div className="cs-product-img-placeholder">📦</div>
                }
                <div className="cs-product-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className={`cs-product-cat-badge ${catClass}`}>{product.category || 'Other'}</span>
                    {product.created_at && <span className="cs-product-time">{timeAgo(product.created_at)}</span>}
                  </div>
                  <div className="cs-product-title">{product.title}</div>
                  <div className="cs-product-desc">{product.description}</div>
                </div>
                <div className="cs-product-footer">
                  <span className="cs-product-price">₹{product.price}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="cs-btn-share" onClick={e => shareProduct(e, product)}>↗</button>
                    {isLoggedIn && currentUserId === product.seller_id ? (
                      <button className="cs-btn-delete" onClick={e => handleDelete(e, product.id)}>Delete</button>
                    ) : (
                      <span className="cs-product-seller">{product.seller_name || 'Campus Seller'}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductList;
