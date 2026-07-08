import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CATEGORIES = ['Textbooks', 'Electronics', 'Lab & Engineering Gears', 'Hostel Essentials', 'Clothing', 'Other'];

function ProductForm({ onProductAdded }) {
  const [formData, setFormData] = useState({ title: '', price: '', description: '', category: 'Textbooks' });
  const [images, setImages] = useState([null, null, null]); // slots 0,1,2
  const [previews, setPreviews] = useState([null, null, null]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (index, file) => {
    if (!file) return;
    const newImages = [...images];
    const newPreviews = [...previews];
    newImages[index] = file;
    newPreviews[index] = URL.createObjectURL(file);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    newImages[index] = null;
    newPreviews[index] = null;
    // Shift remaining images left
    const compacted = newImages.filter(Boolean);
    const compactedPreviews = newPreviews.filter(Boolean);
    while (compacted.length < 3) compacted.push(null);
    while (compactedPreviews.length < 3) compactedPreviews.push(null);
    setImages(compacted);
    setPreviews(compactedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');

    const token = localStorage.getItem('token');
    if (!token) { setError('You must be logged in to post an item.'); setLoading(false); return; }
    if (!images[0]) { setError('Please select at least one product image.'); setLoading(false); return; }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('price', parseFloat(formData.price));
    data.append('description', formData.description);
    data.append('category', formData.category);
    if (images[0]) data.append('image_1', images[0]);
    if (images[1]) data.append('image_2', images[1]);
    if (images[2]) data.append('image_3', images[2]);

    try {
      await axios.post(`${API_URL}/api/products/upload`, data, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Product listed successfully! 🎉');
      setFormData({ title: '', price: '', description: '', category: 'Textbooks' });
      setImages([null, null, null]);
      setPreviews([null, null, null]);
      onProductAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // How many image slots to show: always show slot 0, show slot 1 if slot 0 filled, show slot 2 if slot 1 filled
  const visibleSlots = images[0] ? (images[1] ? 3 : 2) : 1;

  return (
    <div className="cs-form-card">
      <h3 className="cs-form-title">List an Item for Sale</h3>

      <form onSubmit={handleSubmit}>
        <div className="cs-form-row">
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label className="cs-label">Item Title</label>
            <input className="cs-input" type="text" name="title"
              value={formData.title} onChange={handleChange}
              placeholder="e.g. Engineering Physics Textbook" required />
          </div>
          <div style={{ flex: 1, minWidth: '110px' }}>
            <label className="cs-label">Price (₹)</label>
            <input className="cs-input" type="number" name="price"
              value={formData.price} onChange={handleChange}
              placeholder="299" required />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="cs-label">Category</label>
            <select className="cs-select" name="category"
              value={formData.category} onChange={handleChange}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* IMAGE UPLOAD SLOTS */}
        <div className="cs-form-group">
          <label className="cs-label">
            Product Photos <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— 1 required, up to 3</span>
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Array.from({ length: visibleSlots }).map((_, index) => (
              <div key={index} style={{ position: 'relative' }}>
                {previews[index] ? (
                  <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <img
                      src={previews[index]}
                      alt={`preview ${index + 1}`}
                      style={{
                        width: '100px', height: '100px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '1px solid rgba(99,179,237,0.2)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        width: '22px', height: '22px',
                        background: '#ef4444', color: '#fff',
                        border: 'none', borderRadius: '50%',
                        fontSize: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1
                      }}
                    >✕</button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    width: '100px', height: '100px',
                    background: '#0a0f1a',
                    border: `1px dashed ${index === 0 ? 'rgba(99,179,237,0.4)' : 'rgba(99,179,237,0.15)'}`,
                    borderRadius: '10px', cursor: 'pointer',
                    color: '#475569', fontSize: '0.7rem',
                    gap: '6px', transition: 'border-color 0.2s'
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>{index === 0 ? '📷' : '+'}</span>
                    <span>{index === 0 ? 'Required' : 'Optional'}</span>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={e => handleImageChange(index, e.target.files[0])}
                      style={{ display: 'none' }}
                      required={index === 0}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="cs-form-group">
          <label className="cs-label">Description</label>
          <textarea className="cs-textarea" name="description"
            value={formData.description} onChange={handleChange}
            placeholder="Describe the condition, edition, or any relevant details..."
            rows="3" required />
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
