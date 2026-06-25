import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CATEGORIES = [
  'All',
  'Textbooks',
  'Electronics',
  'Lab & Engineering Gears',
  'Hostel Essentials',
  'Clothing',
  'Other'
];

function ProductList({ products = [], loading, onProductClick, onProductDeleted }) {

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = savedUser?.id;

  const handleDelete = async (e, productId) => {
    e.stopPropagation();

    if (!window.confirm('Remove this listing from CampuSwap?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to delete a listing.');
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/products/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      onProductDeleted();

    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  const filteredProducts = products.filter(product => {

    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading)
    return (
      <p style={{ textAlign: 'center' }}>
        Loading active campus listings...
      </p>
    );

  return (
    <div>

      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '25px'
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #ccc'
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginTop: '15px'
          }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #007bff',
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat ? '#007bff' : '#fff',
                color: selectedCategory === cat ? '#fff' : '#007bff'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <h3 style={{ marginBottom: '15px', color: '#333' }}>
        Active Campus Listings ({filteredProducts.length})
      </h3>

      {filteredProducts.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#777' }}>
          No matches found.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => onProductClick(product)}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >

              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover'
                  }}
                />
              )}

              <div style={{ padding: '15px' }}>
                <span style={{
                  color: '#007bff',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  {product.category || 'Other'}
                </span>

                <h4 style={{ margin: '5px 0' }}>
                  {product.title}
                </h4>

                <p style={{ color: '#555' }}>
                  {product.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 15px',
                  borderTop: '1px solid #eee'
                }}
              >
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                  ₹{product.price}
                </span>

                {currentUserId === product.user_id ? (
                  <button
                    onClick={e => handleDelete(e, product.id)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>
                    {product.seller_name || `User #${product.user_id}`}
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default ProductList;
