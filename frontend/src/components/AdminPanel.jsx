import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function AdminPanel({ user, onBack }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'products') fetchProducts();
  }, [tab]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/stats`, { headers });
      setStats(res.data);
    } catch {}
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, { headers });
      setUsers(res.data.users || []);
    } catch {} finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/products`, { headers });
      setProducts(res.data.products || []);
    } catch {} finally { setLoading(false); }
  };

  const banUser = async (userId, name) => {
    if (!window.confirm(`Ban ${name} and delete all their listings?`)) return;
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/ban`, {}, { headers });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: 1 } : u));
      fetchStats();
      alert(`${name} has been banned.`);
    } catch (err) { alert(err.response?.data?.message || 'Failed to ban user.'); }
  };

  const unbanUser = async (userId, name) => {
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/unban`, {}, { headers });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: 0 } : u));
      alert(`${name} has been unbanned.`);
    } catch { alert('Failed to unban.'); }
  };

  const deleteProduct = async (productId, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/products/${productId}`, { headers });
      setProducts(prev => prev.filter(p => p.id !== productId));
      fetchStats();
    } catch { alert('Failed to delete.'); }
  };

  const clearReport = async (productId) => {
    try {
      await axios.post(`${API_URL}/api/admin/products/${productId}/clear-report`, {}, { headers });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_reported: 0 } : p));
    } catch { alert('Failed to clear report.'); }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.seller_name?.toLowerCase().includes(search.toLowerCase())
  );

  const s = { /* inline styles */
    wrap: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' },
    header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' },
    title: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' },
    badge: { padding: '4px 12px', background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange)' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' },
    tab: (active) => ({ padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: active ? '2px solid var(--orange)' : '2px solid transparent', color: active ? 'var(--orange)' : 'var(--text3)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', marginBottom: '-1px' }),
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' },
    statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' },
    statNum: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' },
    statLabel: { fontSize: '0.75rem', color: 'var(--text3)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    searchInput: { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '10px', color: 'var(--text)', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none', marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' },
    td: { padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text2)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
    btnBan: { padding: '5px 12px', background: 'rgba(244,63,94,0.1)', color: '#F87171', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
    btnUnban: { padding: '5px 12px', background: 'rgba(16,185,129,0.1)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
    btnDelete: { padding: '5px 12px', background: 'rgba(244,63,94,0.1)', color: '#F87171', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginRight: '6px' },
    btnClear: { padding: '5px 12px', background: 'rgba(16,185,129,0.1)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
    reported: { padding: '3px 8px', background: 'rgba(244,63,94,0.1)', color: '#F87171', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 },
    banned: { padding: '3px 8px', background: 'rgba(244,63,94,0.1)', color: '#F87171', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 },
    productImg: { width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', background: 'var(--surface2)' },
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.title}>⚡ Admin Panel</h1>
        <span style={s.badge}>CampuSwap Admin</span>
      </div>

      <div style={s.tabs}>
        {['stats', 'users', 'products'].map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => { setTab(t); setSearch(''); }}>
            {t === 'stats' ? '📊 Stats' : t === 'users' ? '👥 Users' : '📦 Listings'}
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === 'stats' && stats && (
        <div style={s.statsGrid}>
          {[
            { label: 'Total Users', value: stats.total_users, color: 'var(--orange)' },
            { label: 'Total Listings', value: stats.total_products, color: 'var(--purple-light)' },
            { label: 'Conversations', value: stats.total_conversations, color: 'var(--green)' },
            { label: 'Messages', value: stats.total_messages, color: '#60A5FA' },
            { label: 'Banned Users', value: stats.banned_users, color: '#F87171' },
            { label: 'Reported', value: stats.reported_products, color: '#FBBF24' },
          ].map(({ label, value, color }) => (
            <div key={label} style={s.statCard}>
              <div style={{ ...s.statNum, color }}>{value}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div>
          <input style={s.searchInput} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          {loading ? <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px' }}>Loading...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>ID</th>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Email</th>
                    <th style={s.th}>Listings</th>
                    <th style={s.th}>Joined</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={s.td}>{u.id}</td>
                      <td style={{ ...s.td, fontWeight: 600, color: 'var(--text)' }}>{u.name}</td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>{u.product_count}</td>
                      <td style={s.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={s.td}>{u.is_banned ? <span style={s.banned}>Banned</span> : <span style={{ color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600 }}>Active</span>}</td>
                      <td style={s.td}>
                        {u.id !== 60001 && (
                          u.is_banned
                            ? <button style={s.btnUnban} onClick={() => unbanUser(u.id, u.name)}>Unban</button>
                            : <button style={s.btnBan} onClick={() => banUser(u.id, u.name)}>Ban</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px' }}>No users found.</div>}
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS */}
      {tab === 'products' && (
        <div>
          <input style={s.searchInput} placeholder="Search by title or seller..." value={search} onChange={e => setSearch(e.target.value)} />
          {loading ? <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px' }}>Loading...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Image</th>
                    <th style={s.th}>Title</th>
                    <th style={s.th}>Price</th>
                    <th style={s.th}>Seller</th>
                    <th style={s.th}>Date</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} style={{ background: p.is_reported ? 'rgba(244,63,94,0.03)' : 'transparent' }}>
                      <td style={s.td}>
                        {p.image_url ? <img src={p.image_url} alt="" style={s.productImg} /> : <div style={{ ...s.productImg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>}
                      </td>
                      <td style={{ ...s.td, fontWeight: 600, color: 'var(--text)', maxWidth: '200px' }}>{p.title}</td>
                      <td style={{ ...s.td, color: 'var(--green)', fontWeight: 700 }}>₹{p.price}</td>
                      <td style={s.td}>{p.seller_name}<br /><span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{p.seller_email}</span></td>
                      <td style={s.td}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={s.td}>{p.is_reported ? <span style={s.reported}>⚠️ Reported<br /><span style={{ fontSize: '0.68rem' }}>{p.report_reason}</span></span> : <span style={{ color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600 }}>Clean</span>}</td>
                      <td style={s.td}>
                        <button style={s.btnDelete} onClick={() => deleteProduct(p.id, p.title)}>Delete</button>
                        {p.is_reported && <button style={s.btnClear} onClick={() => clearReport(p.id)}>Clear</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px' }}>No listings found.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
