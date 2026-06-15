import React from 'react';

function ProductDetail({ product, onBack }) {
  
  const handleWhatsAppConnect = () => {
    // 1. DYNAMIC MATCHING: Grab the real seller phone number supplied by the SQL JOIN
    const sellerPhoneNumber = product.seller_phone; 
    const sellerName = product.seller_name || 'Seller';
    
    if (!sellerPhoneNumber) {
      alert("This seller did not provide a WhatsApp number during registration.");
      return;
    }
    
    // 2. Customized message template including the seller's actual name
    const messageText = `Hello ${sellerName}! I saw your listing for "${product.title}" on CampuSwap for ₹${product.price}. Is it still available for pickup?`;
    const encodedMessage = encodeURIComponent(messageText);
    
    const whatsappUrl = `https://wa.me/${sellerPhoneNumber}?text=${encodedMessage}`;
    
    // Smoothly opens standard WhatsApp Web or the WhatsApp smartphone app instantly
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'sans-serif' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        ← Back to Marketplace
      </button>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {product.image_url && (
          <div style={{ flex: '1', minWidth: '300px' }}>
            <img src={`http://localhost:5000${product.image_url}`} alt={product.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee' }} />
          </div>
        )}
        
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#007bff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem' }}>{product.category || 'Other'}</span>
            <h2 style={{ color: '#333', margin: '5px 0 10px 0', fontSize: '2rem' }}>{product.title}</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745', margin: '0 0 20px 0' }}>₹{product.price}</p>
            
            <h4 style={{ margin: '0 0 5px 0', color: '#666' }}>Product Description:</h4>
            <p style={{ color: '#555', lineHeight: '1.6', fontSize: '1.05rem', marginTop: '0', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
              {product.description}
            </p>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            {/* Displaying real seller name on the screen info */}
            <p style={{ color: '#777', fontSize: '0.9rem', marginBottom: '15px' }}>
              Listed by: <strong>{product.seller_name || `User #${product.seller_id}`}</strong>
            </p>
            
            {/* UPGRADED: Dynamic Instant Chat Connector */}
            <button 
              onClick={handleWhatsAppConnect}
              style={{ width: '100%', padding: '15px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <span>Chat on WhatsApp 💬</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;