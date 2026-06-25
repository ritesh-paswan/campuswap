import React, { useState, useEffect } from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data.products); // fixed: backend wraps array in { products: [] }
    } catch (err) {
      console.error('Error fetching marketplace items:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedProduct(null);
    setShowForm(false);
    setView('login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f4f6f9',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}
    >

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1000px',
          margin: '0 auto 30px'
        }}
      >
        <h1
          onClick={() => setSelectedProduct(null)}
          style={{ color: '#007bff', margin: 0, cursor: 'pointer' }}
        >
          CampuSwap 🎓
        </h1>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 'bold' }}>Hey, {user.name}!</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {user ? (

          selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
            />
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}
              >
                <h2 style={{ margin: 0, color: '#333' }}>Campus Marketplace</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: showForm ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {showForm ? 'Cancel Listing' : 'Sell an Item ➕'}
                </button>
              </div>

              {showForm && (
                <ProductForm
                  onProductAdded={() => {
                    fetchProducts();
                    setShowForm(false);
                  }}
                />
              )}

              <ProductList
                products={products}
                loading={productsLoading}
                onProductClick={(product) => setSelectedProduct(product)}
                onProductDeleted={fetchProducts}
              />
            </div>
          )

        ) : view === 'login' ? (
          <Login
            switchToSignup={() => setView('signup')}
            onLoginSuccess={(loggedUser) => setUser(loggedUser)}
          />
        ) : (
          <Signup switchToLogin={() => setView('login')} />
        )}

      </main>
    </div>
  );
}

export default App;
