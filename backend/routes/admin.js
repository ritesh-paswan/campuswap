const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { cloudinary } = require('../config/cloudinary');

const ADMIN_USER_ID = 60001; // Ritesh Paswan

// ─────────────────────────────────────────────
// Admin Auth Middleware
// ─────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id !== ADMIN_USER_ID) {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired session.' });
  }
}

// ─────────────────────────────────────────────
// 1. GET /api/admin/stats
// ─────────────────────────────────────────────
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [[{ total_users }]] = await pool.query('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_products }]] = await pool.query('SELECT COUNT(*) AS total_products FROM products');
    const [[{ total_messages }]] = await pool.query('SELECT COUNT(*) AS total_messages FROM messages');
    const [[{ total_conversations }]] = await pool.query('SELECT COUNT(*) AS total_conversations FROM conversations');
    const [[{ banned_users }]] = await pool.query('SELECT COUNT(*) AS banned_users FROM users WHERE is_banned = 1');
    const [[{ reported_products }]] = await pool.query('SELECT COUNT(*) AS reported_products FROM products WHERE is_reported = 1');

    return res.json({ total_users, total_products, total_messages, total_conversations, banned_users, reported_products });
  } catch (error) {
    console.error('🚨 Admin Stats Error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch stats.' });
  }
});

// ─────────────────────────────────────────────
// 2. GET /api/admin/users
// ─────────────────────────────────────────────
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, phone, created_at, is_banned,
         (SELECT COUNT(*) FROM products WHERE seller_id = users.id) AS product_count
       FROM users
       ORDER BY created_at DESC
       LIMIT 200`
    );
    return res.json({ users });
  } catch (error) {
    console.error('🚨 Admin Users Error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// ─────────────────────────────────────────────
// 3. POST /api/admin/users/:id/ban
// ─────────────────────────────────────────────
router.post('/users/:id/ban', requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId === ADMIN_USER_ID) {
    return res.status(400).json({ message: 'Cannot ban yourself.' });
  }
  try {
    await pool.query('UPDATE users SET is_banned = 1 WHERE id = ?', [userId]);
    // Also delete all their listings
    await pool.query('DELETE FROM products WHERE seller_id = ?', [userId]);
    return res.json({ message: 'User banned and listings removed.' });
  } catch (error) {
    console.error('🚨 Ban Error:', error.message);
    return res.status(500).json({ message: 'Failed to ban user.' });
  }
});

// ─────────────────────────────────────────────
// 4. POST /api/admin/users/:id/unban
// ─────────────────────────────────────────────
router.post('/users/:id/unban', requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_banned = 0 WHERE id = ?', [req.params.id]);
    return res.json({ message: 'User unbanned.' });
  } catch (error) {
    console.error('🚨 Unban Error:', error.message);
    return res.status(500).json({ message: 'Failed to unban user.' });
  }
});

// ─────────────────────────────────────────────
// 5. GET /api/admin/products
// All products with reported ones first
// ─────────────────────────────────────────────
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.id, p.title, p.price, p.category, p.image_url,
              p.created_at, p.is_reported, p.report_reason,
              u.name AS seller_name, u.email AS seller_email
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       ORDER BY p.is_reported DESC, p.created_at DESC
       LIMIT 200`
    );
    return res.json({ products });
  } catch (error) {
    console.error('🚨 Admin Products Error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

// ─────────────────────────────────────────────
// 6. DELETE /api/admin/products/:id
// ─────────────────────────────────────────────
router.delete('/products/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Product not found.' });

    const product = rows[0];

    // Delete images from Cloudinary
    const [images] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
    const allUrls = images.length > 0 ? images.map(i => i.image_url) : (product.image_url ? [product.image_url] : []);
    for (const url of allUrls) {
      try {
        const parts = url.split('/');
        const publicId = `${parts[parts.length - 2]}/${parts[parts.length - 1].split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch {}
    }

    await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    return res.json({ message: 'Product deleted.' });
  } catch (error) {
    console.error('🚨 Admin Delete Product Error:', error.message);
    return res.status(500).json({ message: 'Failed to delete product.' });
  }
});

// ─────────────────────────────────────────────
// 7. POST /api/admin/products/:id/clear-report
// ─────────────────────────────────────────────
router.post('/products/:id/clear-report', requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_reported = 0, report_reason = NULL WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Report cleared.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to clear report.' });
  }
});

module.exports = router;
