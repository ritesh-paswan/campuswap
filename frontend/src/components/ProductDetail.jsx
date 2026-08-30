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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reported, setReported] = useState(false);

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

  const handleReport = async () => {
    if (!reportReason.trim()) { alert('Please describe the issue.'); return; }
    setReportLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API_URL}/api/products/${product.id}/report`,
        { reason: reportReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReported(true);
      setShowReportModal(false);
      alert('Report submitted. Admin will review this listing.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report.');
    } finally { setReportLoading(false); }
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
          <div className="cs-detail-seller">
            Listed by <strong>{display.seller_name || `User #${display.seller_id}`}</strong>
          </div>

          {!isSeller() && (
            <>
              <button className="cs-btn-message" onClick={() => { if (!isLoggedIn) { onLoginRequired(); return; } onMessageSeller(display); }}>
                <span>💬</span> {isLoggedIn ? 'Message Seller' : 'Sign in to message seller'}
              </button>

              {/* Report button */}
              {isLoggedIn && !reported && (
                <button
                  onClick={() => setShowReportModal(true)}
                  style={{ marginTop: '10px', width: '100%', padding: '10px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                  onMouseOver={e => e.target.style.color = '#F87171'}
                  onMouseOut={e => e.target.style.color = 'var(--text3)'}
                >
                  ⚠️ Report this listing
                </button>
              )}
              {reported && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#F87171', textAlign: 'center' }}>
                  ✓ Reported — admin will review
                </div>
              )}
            </>
          )}

          {isSeller() && (
            <div style={{ padding: '13px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--green)', textAlign: 'center' }}>
              ✓ This is your listing
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>Report Listing</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text3)', marginBottom: '16px' }}>Tell us what's wrong with this listing.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {['Fake or scam listing', 'Inappropriate image', 'Wrong/misleading price', 'Prohibited item', 'Other'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  style={{ padding: '10px 14px', background: reportReason === reason ? 'rgba(255,107,53,0.1)' : 'var(--surface2)', border: `1px solid ${reportReason === reason ? 'rgba(255,107,53,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: reportReason === reason ? 'var(--orange)' : 'var(--text2)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontWeight: reportReason === reason ? 600 : 400 }}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowReportModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={handleReport} disabled={reportLoading || !reportReason} style={{ flex: 1, padding: '11px', background: 'rgba(244,63,94,0.9)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: reportLoading || !reportReason ? 0.5 : 1 }}>
                {reportLoading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
