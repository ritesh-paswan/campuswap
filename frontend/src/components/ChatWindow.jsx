import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = "https://campuswap.onrender.com";

function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatWindow({ conversation, user, onBack, onMessageRead }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    setupSocket();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/chat/messages/${conversation.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages || []);
      onMessageRead(); // refresh unread badge
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const token = localStorage.getItem('token');
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_conversation', conversation.id);
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => {
        // Avoid duplicate if we sent it
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
      onMessageRead();
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    setSocket(newSocket);
  };

  const handleSend = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', {
      conversationId: conversation.id,
      content: input.trim()
    });
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const product = conversation.product || {};
  const otherName = conversation.buyer_id === user.id
    ? conversation.seller_name
    : conversation.buyer_name;

  return (
    <div className="cs-chat-wrap">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <button className="cs-btn-back" onClick={onBack}>← Back to Inbox</button>
      </div>

      <div className="cs-chat-header">
        {product.image_url
          ? <img className="cs-chat-product-img" src={product.image_url} alt={product.title} />
          : <div className="cs-chat-product-img-placeholder">📦</div>
        }
        <div className="cs-chat-header-info">
          <div className="cs-chat-header-title">{product.title || conversation.product_title || 'Product'}</div>
          <div className="cs-chat-header-sub">Chat with {otherName} · ₹{product.price || ''}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="cs-chat-messages">
        {loading ? (
          <div className="cs-chat-empty">
            <span className="cs-loading-dot"></span>
            <span className="cs-loading-dot"></span>
            <span className="cs-loading-dot"></span>
          </div>
        ) : messages.length === 0 ? (
          <div className="cs-chat-empty">
            <div className="cs-chat-empty-icon">👋</div>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>Say hello to start the conversation!</div>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`cs-msg ${isMine ? 'mine' : 'theirs'}`}>
                {!isMine && <div className="cs-msg-sender">{msg.sender_name}</div>}
                <div className="cs-msg-bubble">{msg.content}</div>
                <div className="cs-msg-time">{timeAgo(msg.created_at)}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="cs-chat-input-wrap">
        <input
          className="cs-chat-input"
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="cs-btn-send"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          Send ↗
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
