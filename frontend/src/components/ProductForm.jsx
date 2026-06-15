import React, { useState } from 'react';
import axios from 'axios';

const CATEGORIES = ['Textbooks', 'Electronics', 'Lab & Engineering Gears', 'Hostel Essentials', 'Clothing', 'Other'];

function ProductForm({ onProductAdded }) {
  const [formData, setFormData] = useState({ title: '', price: '', description: '', category: 'Textbooks' });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const savedUser = JSON.parse(localStorage.getItem('user'));
    const data = new FormData();
    data.append('seller_id', savedUser?.id || 1);
    data.append('title', formData.title);
    data.append('price', parseFloat(formData.price));
    data.append('description', formData.description);
    data.append('category', formData.category); // ◄ Sending category to backend
    if (imageFile) data.append('image', imageFile);

    try {
      await axios.post('http://localhost:5000/api/products', data);
      setMessage('Product uploaded to CampuSwap! 🎉');
      setFormData({ title: '', price: '', description: '', category: 'Textbooks' });
      setImageFile(null);
      document.getElementById('imageInput').value = '';
      onProductAdded(); 
    } catch (err) {
      setMessage('Failed to post product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>List an Item for Sale</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Item Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Engineering Physics Vol 1"
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Price (₹)</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="350"
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          {/* Category Dropdown Selection */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', height: '40px', backgroundColor: '#fff' }}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Product Image</label>
          <input id="imageInput" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required
            style={{ width: '100%', padding: '5px 0' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Description / Pickup Specifications</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required placeholder="Condition details, room number, or hostel name..." rows="3"
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <button type="submit" disabled={loading} style={{ backgroundColor: '#28a745', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Uploading...' : 'Post Item'}
        </button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '10px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}

export default ProductForm;