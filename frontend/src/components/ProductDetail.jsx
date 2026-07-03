import React from 'react';

function ProductDetail({ product, onBack, onLoginRequired, isLoggedIn }) {
  const handleWhatsAppConnect = () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    const sellerPhoneNumber = product.seller_phone;
    const sellerName = product.seller_name || 'Seller';
    if (!sellerPhoneNumber) {
      alert("This seller didn't provide a WhatsApp number.");
      return;
    }
    const messageText = `Hello ${sellerName}! I saw your listing for "${product.title}" on CampuSwap for ₹${product.price}. Is it still available?`;
    window.open(`https://wa.me/${sellerPhoneNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  return (
    <div>
      <button className="cs-btn-back" onClick={onBack}>
        ← Back to Marketplace
      </button>

      <div className="cs-detail-layout">
        {product.image_url && (
          <div className="cs-detail-img-wrap">
            <img className="cs-detail-img" src={product.image_url} alt={product.title} />
          </div>
        )}

        <div className="cs-detail-info">
          <div className="cs-detail-cat">{product.category || 'Other'}</div>
          <h2 className="cs-detail-title">{product.title}</h2>
          <div className="cs-detail-price">₹{product.price}</div>

          <div className="cs-detail-desc-label">About this item</div>
          <div className="cs-detail-desc">{product.description}</div>

          <div className="cs-detail-seller">
            Listed by <strong>{product.seller_name || `User #${product.seller_id}`}</strong>
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
