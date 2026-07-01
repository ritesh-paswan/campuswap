import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CATEGORIES = ['Textbooks', 'Electronics', 'Lab & Engineering Gears', 'Hostel Essentials', 'Clothing', 'Other'];

function ProductForm({ onProductAdded }) {
  const [formData, setFormData] = useState({ title: '', price: '', description: '', category: 'Textbooks' });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');

    const token = localStorage.getItem('token');
    if (!token) { setError('You must be logged in to post an item.'); setLoading(false); return; }
    if (!imageFile) { setError('Please select a product image.'); setLoading(false); return; }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('price', parseFloat(formData.price));
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('image', imageFile);

    try {
      await axios.post(`${API_URL}/api/products/upload`, data, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Product listed successfully! 🎉');
      setFormData({ title: '', price: '', description: '', category: 'Textbooks' });
      setImageFile(null);
      document.getElementById('imageInput').value = '';
      onProductAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="cs-form-group">
          <label className="cs-label">Product Image</label>
          <input
            id="imageInput"
            className="cs-file-input"
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => setImageFile(e.target.files[0])}
            required
          />
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
