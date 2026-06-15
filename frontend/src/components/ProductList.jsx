import React, { useState } from 'react';
import axios from 'axios';

const CATEGORIES = ['All', 'Textbooks', 'Electronics', 'Lab & Engineering Gears', 'Hostel Essentials', 'Clothing', 'Other'];

function ProductList({ products, loading, onProductClick, onProductDeleted }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = savedUser?.id;

  const handleDelete = async (e, productId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this listing from CampuSwap?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${productId}`, { data: { seller_id: currentUserId } });
      onProductDeleted();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  // MULTI-FILTER LOGIC: Filters products matching BOTH search text AND selected category tab
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <p style={{ textAlign: 'center' }}>Loading active campus listings...</p>;

  return (
    <div>
      {/* SEARCH BAR & FILTERS ROW */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '25px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search for textbooks, lab coats, electronics..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '1rem', marginBottom: '15px' }}
        />
        
        {/* Category Badge Tabs */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #007bff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                backgroundColor: selectedCategory === cat ? '#007bff' : '#fff',
                color: selectedCategory === cat ? '#fff' : '#007bff',
                transition: 'all 0.1s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FILTERED PRODUCTS RENDERING GRID */}
      <h3 style={{ marginBottom: '15px', color: '#333' }}>Active Campus Listings ({filteredProducts.length})</h3>
      
      {filteredProducts.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>No matches found for your search criteria.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {filteredProducts.map((product) => (
            <div key={product.id} onClick={() => onProductClick(product)}
              style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
              
              {product.image_url && (
                <img src={`http://localhost:5000${product.image_url}`} alt={product.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderBottom: '1px solid #eee' }} />
              )}
              
              <div style={{ padding: '15px', flexGrow: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#007bff', fontWeight: 'bold', textTransform: 'uppercase' }}>{product.category || 'Other'}</span>
                <h4 style={{ margin: '5px 0 10px 0', color: '#333', fontSize: '1.15rem' }}>{product.title}</h4>
                <p style={{ color: '#555', fontSize: '0.9rem', margin: '0 0 15px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', padding: '10px 15px', backgroundColor: '#fafafa' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#28a745' }}>₹{product.price}</span>
                {currentUserId === product.seller_id ? (
                  <button onClick={(e) => handleDelete(e, product.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>Seller ID: {product.seller_id}</span>
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