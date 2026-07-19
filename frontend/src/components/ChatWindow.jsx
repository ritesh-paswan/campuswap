import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = "https://campuswap.onrender.com";

function formatTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function shouldShowDivider(messages, index) {
  if (index === 0) return true;
  return new Date(messages[index].created_at).toDateString() !==
         new Date(messages[index - 1].created_at).toDateString();
}

function shouldShowAvatar(messages, index) {
  if (index === messages.length - 1) return true;
  return messages[index].sender_id !== messages[index + 1].sender_id;
}

function shouldShowTime(messages, index) {
  if (index === messages.length - 1) return true;
  const curr = messages[index];
  const next = messages[index + 1];
  if (curr.sender_id !== next.sender_id) return true;
  return (new Date(next.created_at) - new Date(curr.created_at)) > 5 * 60 * 1000;
}

function ChatWindow({ conversation, user, onBack, onMessageRead }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [seenMessageId, setSeenMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    setupSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
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
      const msgs = res.data.messages || [];
      setMessages(msgs);
      const mySeenMsgs = msgs.filter(m => m.sender_id === user.id && m.is_read === 1);
      if (mySeenMsgs.length > 0) setSeenMessageId(mySeenMsgs[mySeenMsgs.length - 1].id);
      onMessageRead();
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    const token = localStorage.getItem('token');
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    newSocket.on('connect', () => {
      newSocket.emit('join_conversation', conversation.id);
      newSocket.emit('mark_seen', { conversationId: conversation.id });
    });
    newSocket.on('new_message', (message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        newSocket.emit('mark_seen', { conversationId: conversation.id });
        return [...prev, message];
      });
      onMessageRead();
    });
    newSocket.on('messages_seen', ({ conversationId, seenBy }) => {
      if (conversationId === conversation.id && seenBy !== user.id) {
        setMessages(prev => {
          const myMsgs = prev.filter(m => m.sender_id === user.id);
          if (myMsgs.length > 0) setSeenMessageId(myMsgs[myMsgs.length - 1].id);
          return prev;
        });
      }
    });
    newSocket.on('connect_error', (err) => console.error('Socket error:', err.message));
    socketRef.current = newSocket;
  };

  const handleSend = () => {
    if (!input.trim() || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', { conversationId: conversation.id, content: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const product = conversation.product || {};
  const otherName = conversation.buyer_id === user.id
    ? (conversation.seller_name || 'Seller')
    : (conversation.buyer_name || 'Buyer');
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="cs-chat-wrap">

      {/* Compact top bar — no separate back button since nav handles it */}
      <div className="cs-chat-topbar">
        {product.image_url
          ? <img className="cs-chat-product-img" src={product.image_url} alt={product.title} />
          : <div className="cs-chat-product-img-placeholder">📦</div>
        }
        <div className="cs-chat-header-info">
          <div className="cs-chat-header-title">{product.title || conversation.product_title || 'Product'}</div>
          <div className="cs-chat-header-sub">
            <span style={{ color: '#34d399', fontWeight: 600 }}>●</span> {otherName} · ₹{product.price || ''}
          </div>
        </div>
      </div>

      {/* Messages — takes all remaining space */}
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
            <div style={{ fontSize: '0.875rem', color: '#475569' }}>Say hello to start the conversation!</div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender_id === user.id;
            const showDivider = shouldShowDivider(messages, index);
            const showTime = shouldShowTime(messages, index);
            const showAvatar = !isMine && shouldShowAvatar(messages, index);
            const isSeen = msg.id === seenMessageId;

            return (
              <React.Fragment key={msg.id}>
                {showDivider && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 6px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(99,179,237,0.08)' }} />
                    <span style={{ fontSize: '0.68rem', color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {formatDateDivider(msg.created_at)}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(99,179,237,0.08)' }} />
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: isMine ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: '6px',
                  marginBottom: showTime ? '2px' : '1px',
                }}>
                  {!isMine && (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                      flexShrink: 0, opacity: showAvatar ? 1 : 0,
                    }}>
                      {getInitials(otherName)}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '65%', padding: '8px 12px',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMine ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#0f1623',
                    border: isMine ? 'none' : '1px solid rgba(99,179,237,0.1)',
                    color: isMine ? '#fff' : '#e2e8f0',
                    fontSize: '0.875rem', lineHeight: '1.45', wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                </div>

                {showTime && (
                  <div style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    paddingLeft: isMine ? 0 : '30px',
                    paddingRight: isMine ? '2px' : 0,
                    marginBottom: '6px', gap: '4px', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.65rem', color: '#334155' }}>{formatTime(msg.created_at)}</span>
                    {isMine && (
                      <span style={{ fontSize: '0.65rem', color: isSeen ? '#63b3ed' : '#475569', fontWeight: 600 }}>
                        {isSeen ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                )}
              </React.Fragment>
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
          placeholder="Message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button className="cs-btn-send" onClick={handleSend} disabled={!input.trim()}>↗</button>
      </div>
    </div>
  );
}

export default ChatWindow;
