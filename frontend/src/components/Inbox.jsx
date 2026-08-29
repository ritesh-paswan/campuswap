import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s/60); if (m < 60) return `${m}m`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h`;
  return `${Math.floor(h/24)}d`;
}

function Inbox({ user, onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setConversations(res.data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="cs-loading"><span className="cs-loading-dot"></span><span className="cs-loading-dot"></span><span className="cs-loading-dot"></span></div>;
  if (conversations.length === 0) return <div className="cs-empty"><div className="cs-empty-icon">📭</div><div className="cs-empty-text">No conversations yet. Message a seller to get started.</div></div>;

  return (
    <div className="cs-conv-list">
      {conversations.map(conv => {
        const isUnread = conv.unread_count > 0;
        const otherName = conv.buyer_id === user.id ? conv.seller_name : conv.buyer_name;
        const role = conv.buyer_id === user.id ? 'Buyer' : 'Seller';
        return (
          <div key={conv.id} className={`cs-conv-card ${isUnread ? 'unread' : ''}`} onClick={() => onOpenChat(conv)}>
            {conv.product_image
              ? <img className="cs-conv-img" src={conv.product_image} alt={conv.product_title} />
              : <div className="cs-conv-img-placeholder">📦</div>
            }
            <div className="cs-conv-body">
              <div className="cs-conv-product">{conv.product_title || 'Deleted listing'}</div>
              <div className="cs-conv-name">{otherName} <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '0.72rem' }}>· {role}</span></div>
              <div className="cs-conv-last">{conv.last_message || 'No messages yet'}</div>
            </div>
            <div className="cs-conv-meta">
              <div className="cs-conv-time">{timeAgo(conv.last_message_at || conv.created_at)}</div>
              {isUnread && <div className="cs-conv-unread-dot"></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Inbox;
