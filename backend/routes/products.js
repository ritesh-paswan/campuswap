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
// Accepts up to 3 images: image_1 (required), image_2, image_3 (optional)
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
      // Clean up uploaded files on validation failure
      for (const key of ['image_1', 'image_2', 'image_3']) {
        if (files[key]?.[0]?.filename) {
          await cloudinary.uploader.destroy(files[key][0].filename).catch(() => {});
        }
      }
      return res.status(400).json({ message: 'Title and price are required.' });
    }

    const primaryImageUrl = files.image_1[0].path;

    // Insert main product with primary image
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

    // Insert all images into product_images table (including primary at position 0)
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
    console.error('🚨 Product Upload Error:', error);
    return res.status(500).json({ message: 'Failed to list product.', error: error.message });
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
       ORDER BY p.id DESC`
    );

    return res.json({ products });
  } catch (error) {
    console.error('🚨 Fetch Products Error:', error);
    return res.status(500).json({ message: 'Failed to fetch products.', error: error.message });
  }
});

// ─────────────────────────────────────────────
// 3. GET /api/products/:id
// Returns product + all images
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         p.id, p.title, p.description, p.price, p.category,
         p.image_url, p.seller_id, p.status, p.created_at,
         u.name AS seller_name, u.phone AS seller_phone
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Fetch all images for this product
    const [images] = await pool.query(
      `SELECT image_url, position FROM product_images 
       WHERE product_id = ? ORDER BY position ASC`,
      [req.params.id]
    );

    const product = rows[0];
    // If product_images has entries use them, otherwise fall back to image_url
    product.images = images.length > 0
      ? images.map(img => img.image_url)
      : (product.image_url ? [product.image_url] : []);

    return res.json({ product });
  } catch (error) {
    console.error('🚨 Fetch Product Error:', error);
    return res.status(500).json({ message: 'Failed to fetch product.', error: error.message });
  }
});

// ─────────────────────────────────────────────
// 4. PATCH /api/products/:id/status
// ─────────────────────────────────────────────
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'sold'].includes(status)) {
      return res.status(400).json({ message: 'Status must be available or sold.' });
    }
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND seller_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }
    await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ message: `Product marked as ${status}.`, status });
  } catch (error) {
    console.error('🚨 Status Update Error:', error);
    return res.status(500).json({ message: 'Failed to update status.', error: error.message });
  }
});

// ─────────────────────────────────────────────
// 5. DELETE /api/products/:id
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

    // Delete all images from Cloudinary
    const [images] = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = ?',
      [req.params.id]
    );

    const allImageUrls = images.length > 0
      ? images.map(img => img.image_url)
      : (product.image_url ? [product.image_url] : []);

    for (const url of allImageUrls) {
      const urlParts = url.split('/');
      const fileWithExt = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    // Delete image records then product
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    return res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('🚨 Delete Product Error:', error);
    return res.status(500).json({ message: 'Failed to delete product.', error: error.message });
  }
});

module.exports = router;