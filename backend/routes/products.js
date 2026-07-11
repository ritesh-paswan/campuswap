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
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired session. Please login again.' });
  }
}

// ─────────────────────────────────────────────
// 1. POST /api/products/upload
// ─────────────────────────────────────────────
router.post('/upload', authenticateToken, upload.fields([
  { name: 'image_1', maxCount: 1 },
  { name: 'image_2', maxCount: 1 },
  { name: 'image_3', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files || {};

    if (!files.image_1 || files.image_1.length === 0) {
      return res.status(400).json({ message: 'At least one product image is required.' });
    }

    const { title, description, price, category } = req.body;

    if (!title || !price) {
      for (const key of ['image_1', 'image_2', 'image_3']) {
        if (files[key]?.[0]?.filename) {
          await cloudinary.uploader.destroy(files[key][0].filename).catch(() => {});
        }
      }
      return res.status(400).json({ message: 'Title and price are required.' });
    }

    const primaryImageUrl = files.image_1[0].path;

    const [result] = await pool.query(
      `INSERT INTO products (seller_id, title, description, price, category, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title.trim(),
        description?.trim() || '',
        parseFloat(price),
        category?.trim() || 'General',
        primaryImageUrl
      ]
    );

    const productId = result.insertId;

    const imageEntries = [];
    for (const [index, key] of ['image_1', 'image_2', 'image_3'].entries()) {
      if (files[key]?.[0]) {
        imageEntries.push([productId, files[key][0].path, index]);
      }
    }

    if (imageEntries.length > 0) {
      await pool.query(
        `INSERT INTO product_images (product_id, image_url, position) VALUES ?`,
        [imageEntries]
      );
    }

    return res.status(201).json({
      message: 'Product listed successfully!',
      product: { id: productId, title: title.trim(), image_url: primaryImageUrl }
    });

  } catch (error) {
    console.error('🚨 Product Upload Error:', error.message);
    return res.status(500).json({ message: 'Failed to list product. Please try again.' });
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
         p.image_url, p.seller_id, p.status, p.created_at,
         u.name AS seller_name, u.phone AS seller_phone
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       ORDER BY p.id DESC
       LIMIT 200`
    );

    return res.json({ products });
  } catch (error) {
    console.error('🚨 Fetch Products Error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch products. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 3. GET /api/products/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID.' });

  try {
    const [rows] = await pool.query(
      `SELECT 
         p.id, p.title, p.description, p.price, p.category,
         p.image_url, p.seller_id, p.status, p.created_at,
         u.name AS seller_name, u.phone AS seller_phone
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const [images] = await pool.query(
      `SELECT image_url, position FROM product_images 
       WHERE product_id = ? ORDER BY position ASC`,
      [id]
    );

    const product = rows[0];
    product.images = images.length > 0
      ? images.map(img => img.image_url)
      : (product.image_url ? [product.image_url] : []);

    return res.json({ product });
  } catch (error) {
    console.error('🚨 Fetch Product Error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch product. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 4. PATCH /api/products/:id/status
// ─────────────────────────────────────────────
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID.' });

  try {
    const { status } = req.body;
    if (!['available', 'sold'].includes(status)) {
      return res.status(400).json({ message: 'Status must be available or sold.' });
    }
    const [rows] = await pool.query(
      'SELECT id FROM products WHERE id = ? AND seller_id = ?',
      [id, req.user.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }
    await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, id]);
    return res.json({ message: `Product marked as ${status}.`, status });
  } catch (error) {
    console.error('🚨 Status Update Error:', error.message);
    return res.status(500).json({ message: 'Failed to update status. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 5. DELETE /api/products/:id
// ─────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID.' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND seller_id = ?',
      [id, req.user.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }

    const product = rows[0];

    const [images] = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = ?',
      [id]
    );

    const allImageUrls = images.length > 0
      ? images.map(img => img.image_url)
      : (product.image_url ? [product.image_url] : []);

    for (const url of allImageUrls) {
      try {
        const urlParts = url.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn('⚠️ Cloudinary delete failed for:', url);
      }
    }

    await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    return res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('🚨 Delete Product Error:', error.message);
    return res.status(500).json({ message: 'Failed to delete product. Please try again.' });
  }
});

module.exports = router;