import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Inbox({ user, onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="cs-loading">
      <span className="cs-loading-dot"></span>
      <span className="cs-loading-dot"></span>
      <span className="cs-loading-dot"></span>
    </div>
  );

  if (conversations.length === 0) return (
    <div className="cs-empty">
      <div className="cs-empty-icon">📭</div>
      <div className="cs-empty-text">No conversations yet. Message a seller to get started.</div>
    </div>
  );

  return (
    <div className="cs-conv-list">
      {conversations.map(conv => {
        const isUnread = conv.unread_count > 0;
        const otherName = conv.buyer_id === user.id ? conv.seller_name : conv.buyer_name;
        const role = conv.buyer_id === user.id ? 'Buyer' : 'Seller';

        return (
          <div
            key={conv.id}
            className={`cs-conv-card ${isUnread ? 'unread' : ''}`}
            onClick={() => onOpenChat(conv)}
          >
            {conv.product_image
              ? <img className="cs-conv-img" src={conv.product_image} alt={conv.product_title} />
              : <div className="cs-conv-img-placeholder">📦</div>
            }
            <div className="cs-conv-body">
              <div className="cs-conv-product">{conv.product_title}</div>
              <div className="cs-conv-name">
                {otherName}
                <span style={{ color: '#334155', fontWeight: 400, fontSize: '0.72rem' }}> · {role}</span>
              </div>
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
