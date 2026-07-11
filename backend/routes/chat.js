const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

// ─────────────────────────────────────────────
// JWT Auth Middleware
// ─────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired session.' });
  }
}

// ─────────────────────────────────────────────
// 1. POST /api/chat/conversation
// ─────────────────────────────────────────────
router.post('/conversation', authenticateToken, async (req, res) => {
  const product_id = parseInt(req.body.product_id);
  const buyer_id = req.user.id;

  if (!product_id || isNaN(product_id)) {
    return res.status(400).json({ message: 'Valid Product ID is required.' });
  }

  try {
    const [products] = await pool.query(
      'SELECT seller_id, title FROM products WHERE id = ?',
      [product_id]
    );

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const seller_id = products[0].seller_id;

    if (seller_id === buyer_id) {
      return res.status(400).json({ message: 'You cannot message yourself.' });
    }

    const [existing] = await pool.query(
      `SELECT * FROM conversations 
       WHERE product_id = ? AND buyer_id = ? AND seller_id = ?`,
      [product_id, buyer_id, seller_id]
    );

    if (existing.length > 0) {
      return res.json({ conversation: existing[0] });
    }

    const [result] = await pool.query(
      `INSERT INTO conversations (product_id, buyer_id, seller_id) VALUES (?, ?, ?)`,
      [product_id, buyer_id, seller_id]
    );

    const [newConv] = await pool.query(
      'SELECT * FROM conversations WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({ conversation: newConv[0] });
  } catch (error) {
    console.error('🚨 Conversation Error:', error.message);
    return res.status(500).json({ message: 'Failed to create conversation. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 2. GET /api/chat/conversations
// ─────────────────────────────────────────────
router.get('/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [conversations] = await pool.query(
      `SELECT 
         c.id, c.product_id, c.buyer_id, c.seller_id, c.created_at,
         p.title AS product_title,
         COALESCE(
           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position ASC LIMIT 1),
           p.image_url
         ) AS product_image,
         buyer.name AS buyer_name,
         seller.name AS seller_name,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
         (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) AS unread_count
       FROM conversations c
       JOIN products p ON c.product_id = p.id
       JOIN users buyer ON c.buyer_id = buyer.id
       JOIN users seller ON c.seller_id = seller.id
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY last_message_at DESC, c.created_at DESC
       LIMIT 50`,
      [userId, userId, userId]
    );

    return res.json({ conversations });
  } catch (error) {
    console.error('🚨 Fetch Conversations Error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch conversations. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 3. GET /api/chat/messages/:conversationId
// ─────────────────────────────────────────────
router.get('/messages/:conversationId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const conversationId = parseInt(req.params.conversationId);

  if (isNaN(conversationId)) {
    return res.status(400).json({ message: 'Invalid conversation ID.' });
  }

  try {
    const [conv] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [conversationId, userId, userId]
    );

    if (!conv || conv.length === 0) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const [messages] = await pool.query(
      `SELECT m.*, u.name AS sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [conversationId]
    );

    // Mark as read
    await pool.query(
      `UPDATE messages SET is_read = 1 
       WHERE conversation_id = ? AND sender_id != ?`,
      [conversationId, userId]
    );

    return res.json({ messages, conversation: conv[0] });
  } catch (error) {
    console.error('🚨 Fetch Messages Error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch messages. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 4. GET /api/chat/unread
// ─────────────────────────────────────────────
router.get('/unread', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.buyer_id = ? OR c.seller_id = ?)
         AND m.sender_id != ?
         AND m.is_read = 0`,
      [userId, userId, userId]
    );

    return res.json({ unread_count: result[0].unread_count });
  } catch (error) {
    console.error('🚨 Unread Count Error:', error.message);
    return res.status(500).json({ unread_count: 0 });
  }
});

module.exports = router;