const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { cloudinary, upload } = require('../config/cloudinary');

// ─────────────────────────────────────────────
// JWT Auth Middleware
// ─────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: user.id }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired session. Please login again.' });
  }
}

// ─────────────────────────────────────────────
// 1. POST /api/products/upload
// ─────────────────────────────────────────────
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Product image is required.' });
    }

    const { title, description, price, category } = req.body;

    if (!title || !price) {
      await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: 'Title and price are required.' });
    }

    const imageUrl = req.file.path;

    const [result] = await pool.query(
      `INSERT INTO products (seller_id, title, description, price, category, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title.trim(),
        description?.trim() || '',
        parseFloat(price),
        category?.trim() || 'General',
        imageUrl
      ]
    );

    return res.status(201).json({
      message: 'Product listed successfully!',
      product: {
        id: result.insertId,
        title: title.trim(),
        image_url: imageUrl
      }
    });

  } catch (error) {
    console.error('🚨 Product Upload Error:', error);

    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }

    return res.status(500).json({
      message: 'Failed to list product.',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// 2. GET /api/products
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT 
         p.id, p.title, p.description, p.price, p.category,
         p.image_url, p.seller_id,
         u.name AS seller_name, u.phone AS seller_phone
       FROM products p
       JOIN users u ON p.seller_id = u.id
       ORDER BY p.id DESC`
    );

    return res.json({ products });
  } catch (error) {
    console.error('🚨 Fetch Products Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch products.',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// 3. GET /api/products/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         p.id, p.title, p.description, p.price, p.category,
         p.image_url, p.seller_id,
         u.name AS seller_name, u.phone AS seller_phone
       FROM products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.json({ product: rows[0] });
  } catch (error) {
    console.error('🚨 Fetch Product Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch product.',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// 4. DELETE /api/products/:id
// ─────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND seller_id = ?',
      [req.params.id, req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }

    const product = rows[0];

    // Extract Cloudinary public_id from URL to delete the image
    const urlParts = product.image_url.split('/');
    const fileWithExt = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${fileWithExt.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId).catch(() => {
      console.warn('⚠️ Cloudinary image delete failed for:', publicId);
    });

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    return res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('🚨 Delete Product Error:', error);
    return res.status(500).json({
      message: 'Failed to delete product.',
      error: error.message
    });
  }
});

module.exports = router;
