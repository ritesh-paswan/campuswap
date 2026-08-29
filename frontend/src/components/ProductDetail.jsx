import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CAT_CLASS = {
  'Textbooks': 'cat-textbooks', 'Electronics': 'cat-electronics',
  'Lab & Engineering Gears': 'cat-lab', 'Hostel Essentials': 'cat-hostel',
  'Clothing': 'cat-clothing', 'Other': 'cat-other',
};

function ImageCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return null;
  if (images.length === 1) return <img className="cs-detail-img" src={images[0]} alt="Product" />;
  return (
    <div style={{ position: 'relative' }}>
      <img className="cs-detail-img" src={images[current]} alt={`img ${current + 1}`} style={{ transition: 'opacity 0.2s' }} />
      {current > 0 && (
        <button onClick={() => setCurrent(current - 1)} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(10,10,15,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
      )}
      {current < images.length - 1 && (
        <button onClick={() => setCurrent(current + 1)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(10,10,15,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
        {images.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '20px' : '8px', height: '8px', borderRadius: '4px', background: i === current ? 'var(--orange)' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
        ))}
      </div>
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {images.map((img, i) => (
            <img key={i} src={img} alt={`thumb ${i + 1}`} onClick={() => setCurrent(i)} style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: i === current ? '2px solid var(--orange)' : '2px solid rgba(255,255,255,0.08)', transition: 'all 0.2s', opacity: i === current ? 1 : 0.5 }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetail({ product, onBack, onLoginRequired, isLoggedIn, onMessageSeller }) {
  const [fullProduct, setFullProduct] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/products/${product.id}`)
      .then(res => setFullProduct(res.data.product))
      .catch(() => setFullProduct({ ...product, images: product.image_url ? [product.image_url] : [] }));
  }, [product.id]);

  const display = fullProduct || product;
  const images = fullProduct?.images || (product.image_url ? [product.image_url] : []);
  const catClass = CAT_CLASS[display.category] || 'cat-other';

  const isSeller = () => {
    const u = JSON.parse(localStorage.getItem('user'));
    return u?.id === display.seller_id;
  };

  return (
    <div>
      <div className="cs-detail-layout">
        {images.length > 0 && (
          <div className="cs-detail-img-wrap"><ImageCarousel images={images} /></div>
        )}
        <div className="cs-detail-info">
          <div className={`cs-detail-cat ${catClass}`}>{display.category || 'Other'}</div>
          <h2 className="cs-detail-title">{display.title}</h2>
          <div className="cs-detail-price">₹{display.price}</div>
          <div className="cs-detail-desc-label">About this item</div>
          <div className="cs-detail-desc">{display.description}</div>
          <div className="cs-detail-seller">Listed by <strong>{display.seller_name || `User #${display.seller_id}`}</strong></div>
          {!isSeller() && (
            <button className="cs-btn-message" onClick={() => { if (!isLoggedIn) { onLoginRequired(); return; } onMessageSeller(display); }}>
              <span>💬</span> {isLoggedIn ? 'Message Seller' : 'Sign in to message seller'}
            </button>
          )}
          {isSeller() && (
            <div style={{ padding: '13px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--green)', textAlign: 'center' }}>
              ✓ This is your listing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
