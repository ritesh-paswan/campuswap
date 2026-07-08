import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function ImageCarousel({ images }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <img className="cs-detail-img" src={images[0]} alt="Product" />
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <img
        className="cs-detail-img"
        src={images[current]}
        alt={`Product image ${current + 1}`}
        style={{ transition: 'opacity 0.2s' }}
      />

      {/* Prev / Next arrows */}
      {current > 0 && (
        <button
          onClick={() => setCurrent(current - 1)}
          style={{
            position: 'absolute', left: '10px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(8,12,20,0.7)',
            border: '1px solid rgba(99,179,237,0.2)',
            color: '#94a3b8', borderRadius: '50%',
            width: '36px', height: '36px',
            cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >‹</button>
      )}
      {current < images.length - 1 && (
        <button
          onClick={() => setCurrent(current + 1)}
          style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(8,12,20,0.7)',
            border: '1px solid rgba(99,179,237,0.2)',
            color: '#94a3b8', borderRadius: '50%',
            width: '36px', height: '36px',
            cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >›</button>
      )}

      {/* Dot indicators */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px'
      }}>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? '20px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === current ? '#3b82f6' : 'rgba(99,179,237,0.2)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.2s', padding: 0
            }}
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`thumb ${i + 1}`}
              onClick={() => setCurrent(i)}
              style={{
                width: '60px', height: '60px',
                objectFit: 'cover', borderRadius: '8px',
                cursor: 'pointer',
                border: i === current
                  ? '2px solid #3b82f6'
                  : '2px solid rgba(99,179,237,0.1)',
                transition: 'border-color 0.2s',
                opacity: i === current ? 1 : 0.6
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetail({ product, onBack, onLoginRequired, isLoggedIn }) {
  const [fullProduct, setFullProduct] = useState(null);
  const [loadingImages, setLoadingImages] = useState(true);

  // Fetch full product with images array
  useEffect(() => {
    const fetchFull = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products/${product.id}`);
        setFullProduct(res.data.product);
      } catch (err) {
        // Fallback to passed product with image_url
        setFullProduct({ ...product, images: product.image_url ? [product.image_url] : [] });
      } finally {
        setLoadingImages(false);
      }
    };
    fetchFull();
  }, [product.id]);

  const handleWhatsAppConnect = () => {
    if (!isLoggedIn) { onLoginRequired(); return; }
    const sellerPhoneNumber = fullProduct?.seller_phone || product.seller_phone;
    const sellerName = fullProduct?.seller_name || product.seller_name || 'Seller';
    if (!sellerPhoneNumber) {
      alert("This seller didn't provide a WhatsApp number.");
      return;
    }
    const messageText = `Hello ${sellerName}! I saw your listing for "${product.title}" on CampuSwap for ₹${product.price}. Is it still available?`;
    window.open(`https://wa.me/${sellerPhoneNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const display = fullProduct || product;
  const images = fullProduct?.images || (product.image_url ? [product.image_url] : []);

  return (
    <div>
      <button className="cs-btn-back" onClick={onBack}>
        ← Back to Marketplace
      </button>

      <div className="cs-detail-layout">
        {images.length > 0 && (
          <div className="cs-detail-img-wrap">
            <ImageCarousel images={images} />
          </div>
        )}

        <div className="cs-detail-info">
          <div className="cs-detail-cat">{display.category || 'Other'}</div>
          <h2 className="cs-detail-title">{display.title}</h2>
          <div className="cs-detail-price">₹{display.price}</div>

          <div className="cs-detail-desc-label">About this item</div>
          <div className="cs-detail-desc">{display.description}</div>

          <div className="cs-detail-seller">
            Listed by <strong>{display.seller_name || `User #${display.seller_id}`}</strong>
          </div>

          <button className="cs-btn-whatsapp" onClick={handleWhatsAppConnect}>
            <span>💬</span>
            {isLoggedIn ? 'Chat on WhatsApp' : 'Sign in to contact seller'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
