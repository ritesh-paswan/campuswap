import React, { useState, useEffect } from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Inbox from './components/Inbox';
import ChatWindow from './components/ChatWindow';
import { usePushNotifications } from './hooks/usePushNotifications';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

// Inject design system
const injectStyles = () => {
  if (document.getElementById('cs-design-system')) return;
  const link1 = document.createElement('link');
  link1.rel = 'preconnect';
  link1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(link1);
  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap';
  document.head.appendChild(link2);
};

function App() {
  const [view, setView] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPushBanner, setShowPushBanner] = useState(false);

  const { permission, requestPermission } = usePushNotifications(user);

  useEffect(() => {
    injectStyles();
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user && permission === 'default') {
      if (!localStorage.getItem('pushBannerDismissed')) setShowPushBanner(true);
    } else setShowPushBanner(false);
  }, [user, permission]);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/chat/unread`, { headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(res.data.unread_count || 0);
    } catch {}
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data.products || []);
    } catch { setProducts([]); }
    finally { setProductsLoading(false); }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await axios.delete(`${API_URL}/api/push/unsubscribe`, { headers: { Authorization: `Bearer ${token}` } });
        }
      } catch {}
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null); setSelectedProduct(null); setShowForm(false);
    setActiveConversation(null); setUnreadCount(0); setView(null); setShowPushBanner(false);
  };

  const handleLoginSuccess = (loggedUser) => { setUser(loggedUser); setView(null); };

  const handleMessageSeller = async (product) => {
    if (!user) { setView('login'); return; }
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_URL}/api/chat/conversation`, { product_id: product.id }, { headers: { Authorization: `Bearer ${token}` } });
      setActiveConversation({ ...res.data.conversation, product });
      setSelectedProduct(null); setView('chat');
    } catch (err) { alert(err.response?.data?.message || 'Could not open chat.'); }
  };

  const getBackAction = () => {
    if (view === 'login' || view === 'signup' || view === 'forgot') return () => setView(null);
    if (view === 'chat') return () => setView('inbox');
    if (view === 'inbox') return () => setView(null);
    if (selectedProduct) return () => setSelectedProduct(null);
    return null;
  };

  const backAction = getBackAction();
  const isOnAuthPage = view === 'login' || view === 'signup' || view === 'forgot';
  const isOnChatPage = view === 'chat';
  const isOnInboxPage = view === 'inbox';

  const Nav = () => (
    <nav className="cs-nav">
      <div className="cs-nav-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {backAction && <button className="cs-btn-nav-back" onClick={backAction}>← Back</button>}
          <div className="cs-logo" onClick={() => { setSelectedProduct(null); setShowForm(false); setView(null); }}>
            CampuSwap ⚡
          </div>
        </div>
        <div className="cs-nav-right">
          {user ? (
            <>
              <span className="cs-greeting">Hey, <span>{user.name.split(' ')[0]}</span></span>
              {!isOnInboxPage && !isOnChatPage && (
                <button className={`cs-btn-inbox`} onClick={() => { setView('inbox'); setSelectedProduct(null); }}>
                  💬 Inbox
                  {unreadCount > 0 && <span className="cs-unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
              )}
              <button className="cs-btn-logout" onClick={handleLogout}>Sign out</button>
            </>
          ) : !isOnAuthPage && (
            <>
              <button className="cs-btn-nav-login" onClick={() => setView('login')}>Sign in</button>
              <button className="cs-btn-nav-signup" onClick={() => setView('signup')}>Join free</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="cs-app">
      <Nav />

      {view === 'login' && <Login switchToSignup={() => setView('signup')} onLoginSuccess={handleLoginSuccess} switchToForgot={() => setView('forgot')} />}
      {view === 'signup' && <Signup switchToLogin={() => setView('login')} onLoginSuccess={handleLoginSuccess} />}
      {view === 'forgot' && <ForgotPassword onBack={() => setView('login')} onResetSuccess={() => setView('login')} />}

      {view === 'inbox' && user && (
        <main className="cs-main">
          <h2 className="cs-inbox-title">💬 Inbox</h2>
          <Inbox user={user} onOpenChat={(conv) => { setActiveConversation(conv); setView('chat'); }} />
        </main>
      )}

      {view === 'chat' && user && activeConversation && (
        <ChatWindow conversation={activeConversation} user={user} onBack={() => setView('inbox')} onMessageRead={fetchUnreadCount} />
      )}

      {!view && (
        <>
          {selectedProduct ? (
            <main className="cs-main">
              <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} onLoginRequired={() => setView('login')} isLoggedIn={!!user} onMessageSeller={handleMessageSeller} />
            </main>
          ) : (
            <>
              {!user && (
                <section className="cs-hero">
                  <h1 className="cs-hero-title">
                    Buy & Sell on Campus,<br /><span>Instantly</span>
                  </h1>
                  <p className="cs-hero-sub">Textbooks, electronics, hostel essentials — find what you need from students around you.</p>
                  <div className="cs-hero-actions">
                    <button className="cs-btn-hero-primary" onClick={() => setView('signup')}>Start selling free →</button>
                    <button className="cs-btn-hero-secondary" onClick={() => setView('login')}>Sign in</button>
                  </div>
                  <div className="cs-hero-stats">
                    <div><div className="cs-hero-stat-num">{products.length}<span>+</span></div><div className="cs-hero-stat-label">Listings</div></div>
                    <div><div className="cs-hero-stat-num">0<span>%</span></div><div className="cs-hero-stat-label">Commission</div></div>
                    <div><div className="cs-hero-stat-num">100<span>%</span></div><div className="cs-hero-stat-label">Free</div></div>
                  </div>
                </section>
              )}
              <main className="cs-main">
                {showPushBanner && (
                  <div className="cs-push-banner">
                    <div className="cs-push-banner-text"><strong>🔔 Enable notifications</strong> — get alerted when someone messages you.</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="cs-btn-push-enable" onClick={async () => { await requestPermission(); setShowPushBanner(false); }}>Enable</button>
                      <button className="cs-btn-push-dismiss" onClick={() => { localStorage.setItem('pushBannerDismissed', '1'); setShowPushBanner(false); }}>Not now</button>
                    </div>
                  </div>
                )}
                {user && (
                  <div className="cs-market-header">
                    <h2 className="cs-market-title">Campus <span>Marketplace</span></h2>
                    <button className={`cs-btn-sell ${showForm ? 'cancel' : ''}`} onClick={() => setShowForm(!showForm)}>
                      {showForm ? '✕ Cancel' : '+ Sell an Item'}
                    </button>
                  </div>
                )}
                {user && showForm && <ProductForm onProductAdded={() => { fetchProducts(); setShowForm(false); }} />}
                {!user && (
                  <div className="cs-login-prompt">
                    <div className="cs-login-prompt-text"><strong>Want to sell or chat?</strong> Create a free account in 30 seconds.</div>
                    <div className="cs-login-prompt-actions">
                      <button className="cs-btn-prompt-login" onClick={() => setView('login')}>Sign in</button>
                      <button className="cs-btn-prompt-signup" onClick={() => setView('signup')}>Join free</button>
                    </div>
                  </div>
                )}
                <ProductList products={products} loading={productsLoading} onProductClick={(p) => setSelectedProduct(p)} onProductDeleted={fetchProducts} isLoggedIn={!!user} />
              </main>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
