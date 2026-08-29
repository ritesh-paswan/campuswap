import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = "https://campuswap.onrender.com";

function fmtTime(d) { if (!d) return ''; return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d), today = new Date(), yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yest.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
const showDivider = (msgs, i) => i === 0 || new Date(msgs[i].created_at).toDateString() !== new Date(msgs[i-1].created_at).toDateString();
const showAvatar = (msgs, i) => i === msgs.length - 1 || msgs[i].sender_id !== msgs[i+1].sender_id;
const showTime = (msgs, i) => i === msgs.length - 1 || msgs[i].sender_id !== msgs[i+1].sender_id || (new Date(msgs[i+1].created_at) - new Date(msgs[i].created_at)) > 5*60*1000;

function ChatWindow({ conversation, user, onBack, onMessageRead }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [seenMessageId, setSeenMessageId] = useState(null);
  const endRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchMessages(); setupSocket();
    return () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } };
  }, [conversation.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/chat/messages/${conversation.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const msgs = res.data.messages || [];
      setMessages(msgs);
      const seen = msgs.filter(m => m.sender_id === user.id && m.is_read === 1);
      if (seen.length) setSeenMessageId(seen[seen.length-1].id);
      onMessageRead();
    } catch {} finally { setLoading(false); }
  };

  const setupSocket = () => {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    const token = localStorage.getItem('token');
    const s = io(API_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5 });
    s.on('connect', () => { s.emit('join_conversation', conversation.id); s.emit('mark_seen', { conversationId: conversation.id }); });
    s.on('new_message', (msg) => {
      setMessages(prev => { if (prev.find(m => m.id === msg.id)) return prev; s.emit('mark_seen', { conversationId: conversation.id }); return [...prev, msg]; });
      onMessageRead();
    });
    s.on('messages_seen', ({ conversationId, seenBy }) => {
      if (conversationId === conversation.id && seenBy !== user.id) {
        setMessages(prev => { const my = prev.filter(m => m.sender_id === user.id); if (my.length) setSeenMessageId(my[my.length-1].id); return prev; });
      }
    });
    socketRef.current = s;
  };

  const handleSend = () => {
    if (!input.trim() || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', { conversationId: conversation.id, content: input.trim() });
    setInput('');
  };

  const product = conversation.product || {};
  const otherName = conversation.buyer_id === user.id ? (conversation.seller_name || 'Seller') : (conversation.buyer_name || 'Buyer');
  const initials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2) : '?';

  return (
    <div className="cs-chat-wrap">
      <div className="cs-chat-topbar">
        {product.image_url ? <img className="cs-chat-product-img" src={product.image_url} alt="" /> : <div className="cs-chat-product-img-placeholder">📦</div>}
        <div className="cs-chat-header-info">
          <div className="cs-chat-header-title">{product.title || conversation.product_title || 'Product'}</div>
          <div className="cs-chat-header-sub"><span style={{ color: 'var(--green)', fontWeight: 600 }}>●</span> {otherName}{product.price ? ` · ₹${product.price}` : ''}</div>
        </div>
      </div>

      <div className="cs-chat-messages">
        {loading ? (
          <div className="cs-chat-empty"><span className="cs-loading-dot"></span><span className="cs-loading-dot"></span><span className="cs-loading-dot"></span></div>
        ) : messages.length === 0 ? (
          <div className="cs-chat-empty"><div className="cs-chat-empty-icon">👋</div><div style={{ fontSize: '0.875rem', color: 'var(--text3)' }}>Say hello to start the conversation!</div></div>
        ) : messages.map((msg, i) => {
          const isMine = msg.sender_id === user.id;
          const isSeen = msg.id === seenMessageId;
          return (
            <React.Fragment key={msg.id}>
              {showDivider(messages, i) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 6px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 500 }}>{fmtDate(msg.created_at)}</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '6px', marginBottom: showTime(messages,i) ? '2px' : '1px' }}>
                {!isMine && (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--purple-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 800, color: '#fff', flexShrink: 0, opacity: showAvatar(messages,i) ? 1 : 0 }}>
                    {initials(otherName)}
                  </div>
                )}
                <div style={{ maxWidth: '65%', padding: '8px 12px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMine ? 'var(--orange)' : 'var(--surface2)', border: isMine ? 'none' : '1px solid var(--border)', color: '#fff', fontSize: '0.875rem', lineHeight: '1.45', wordBreak: 'break-word' }}>
                  {msg.content}
                </div>
              </div>
              {showTime(messages, i) && (
                <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', paddingLeft: isMine ? 0 : '30px', marginBottom: '6px', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{fmtTime(msg.created_at)}</span>
                  {isMine && <span style={{ fontSize: '0.65rem', color: isSeen ? 'var(--orange)' : 'var(--text3)', fontWeight: 700 }}>{isSeen ? '✓✓' : '✓'}</span>}
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="cs-chat-input-wrap">
        <input className="cs-chat-input" type="text" placeholder="Message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} autoComplete="off" />
        <button className="cs-btn-send" onClick={handleSend} disabled={!input.trim()}>Send ↗</button>
      </div>
    </div>
  );
}

export default ChatWindow;
