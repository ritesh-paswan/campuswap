import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CATEGORIES = [
  'Textbooks',
  'Electronics',
  'Lab & Engineering Gears',
  'Hostel Essentials',
  'Clothing',
  'Other'
];

function ProductForm({ onProductAdded }) {

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: 'Textbooks'
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Pull token saved during login
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to post an item.');
      setLoading(false);
      return;
    }

    if (!imageFile) {
      setError('Please select a product image.');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('title',       formData.title);
    data.append('price',       parseFloat(formData.price));
    data.append('description', formData.description);
    data.append('category',    formData.category);
    data.append('image',       imageFile);  // must match upload.single('image') in backend

    try {
      await axios.post(
        `${API_URL}/api/products/upload`,  // fixed endpoint
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,  // required by authenticateToken
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage('Product uploaded to CampuSwap! 🎉');

      setFormData({
        title: '',
        price: '',
        description: '',
        category: 'Textbooks'
      });

      setImageFile(null);
      document.getElementById('imageInput').value = '';

      onProductAdded();

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Failed to post product. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginBottom: '30px'
      }}
    >
      <h3 style={{ margin: '0 0 15px', color: '#333' }}>
        List an Item for Sale
      </h3>

      <form onSubmit={handleSubmit}>

        <div
          style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '15px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label>Item Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '100px' }}>
            <label>Price (₹)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px' }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Product Image</label>
          <input
            id="imageInput"
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => setImageFile(e.target.files[0])}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="3"
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#28a745',
            color: '#fff',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Uploading...' : 'Post Item'}
        </button>

      </form>

      {message && (
        <p style={{ color: 'green', marginTop: '15px', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: 'red', marginTop: '15px', fontWeight: 'bold' }}>
          {error}
        </p>
      )}

    </div>
  );
}

export default ProductForm;
