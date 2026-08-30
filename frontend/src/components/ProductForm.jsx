import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";
const CATEGORIES = ['Textbooks', 'Electronics', 'Lab & Engineering Gears', 'Hostel Essentials', 'Clothing', 'Other'];

function ProductForm({ onProductAdded }) {
  const [formData, setFormData] = useState({ title: '', price: '', description: '', category: 'Textbooks' });
  const [images, setImages] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (index, file) => {
    if (!file) return;
    const ni = [...images]; const np = [...previews];
    ni[index] = file; np[index] = URL.createObjectURL(file);
    setImages(ni); setPreviews(np);
  };

  const handleRemove = (index) => {
    const ni = [...images]; const np = [...previews];
    ni[index] = null; np[index] = null;
    const ci = ni.filter(Boolean); const cp = np.filter(Boolean);
    while (ci.length < 3) ci.push(null);
    while (cp.length < 3) cp.push(null);
    setImages(ci); setPreviews(cp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');

    const token = localStorage.getItem('token');
    if (!token) { setError('You must be logged in.'); setLoading(false); return; }
    if (!images[0]) { setError('Please select at least one image.'); setLoading(false); return; }

    // ✅ Fix 1: Price validation
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 1) {
      setError('Price must be at least ₹1.');
      setLoading(false); return;
    }
    if (price > 10000) {
      setError('Price cannot exceed ₹10,000. Contact admin for high-value items.');
      setLoading(false); return;
    }

    // Title validation
    if (formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      setLoading(false); return;
    }

    // Description validation
    if (formData.description.trim().length < 10) {
      setError('Please write a more detailed description (at least 10 characters).');
      setLoading(false); return;
    }

    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('price', price);
    data.append('description', formData.description.trim());
    data.append('category', formData.category);
    if (images[0]) data.append('image_1', images[0]);
    if (images[1]) data.append('image_2', images[1]);
    if (images[2]) data.append('image_3', images[2]);

    try {
      await axios.post(`${API_URL}/api/products/upload`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Listed successfully! 🎉');
      setFormData({ title: '', price: '', description: '', category: 'Textbooks' });
      setImages([null, null, null]); setPreviews([null, null, null]);
      onProductAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post. Please try again.');
    } finally { setLoading(false); }
  };

  const visibleSlots = images[0] ? (images[1] ? 3 : 2) : 1;

  return (
    <div className="cs-form-card">
      <h3 className="cs-form-title">List an Item</h3>
      <form onSubmit={handleSubmit}>
        <div className="cs-form-row">
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label className="cs-label">Title</label>
            <input className="cs-input" type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Engineering Physics Book" required />
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label className="cs-label">Price (₹)</label>
            <input className="cs-input" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="299" min="1" max="10000" required />
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label className="cs-label">Category</label>
            <select className="cs-select" name="category" value={formData.category} onChange={handleChange}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="cs-form-group">
          <label className="cs-label">Photos <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— 1 required, up to 3</span></label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {Array.from({ length: visibleSlots }).map((_, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {previews[i] ? (
                  <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                    <img src={previews[i]} alt="" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border2)' }} />
                    <button type="button" onClick={() => handleRemove(i)} style={{ position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px', background: 'var(--pink)', color: '#fff', border: 'none', borderRadius: '50%', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', background: 'var(--bg)', border: `1px dashed ${i === 0 ? 'rgba(255,107,53,0.4)' : 'var(--border2)'}`, borderRadius: '10px', cursor: 'pointer', color: 'var(--text3)', fontSize: '0.68rem', gap: '5px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{i === 0 ? '📷' : '+'}</span>
                    <span>{i === 0 ? 'Required' : 'Optional'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleImageChange(i, e.target.files[0])} style={{ display: 'none' }} required={i === 0} />
                  </label>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '8px' }}>
            ⚠️ Inappropriate images will be automatically blocked.
          </p>
        </div>

        <div className="cs-form-group">
          <label className="cs-label">Description</label>
          <textarea className="cs-textarea" name="description" value={formData.description} onChange={handleChange} placeholder="Condition, edition, any relevant details..." rows="3" required />
        </div>

        <div style={{ padding: '12px 14px', background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text3)', marginBottom: '16px' }}>
          📋 By listing, you confirm this is a genuine item. Fake listings will result in a permanent ban.
        </div>

        <button className="cs-btn-post" type="submit" disabled={loading}>
          {loading ? 'Uploading...' : '↑ Publish Listing'}
        </button>
      </form>
      {message && <div className="cs-success">{message}</div>}
      {error && <div className="cs-error">{error}</div>}
    </div>
  );
}

export default ProductForm;
