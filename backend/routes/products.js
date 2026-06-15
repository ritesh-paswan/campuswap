const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db');

// 1. Configure where to store images and what to name them
const storage = multer.diskStorage({
  destination: 'uploads/', // Files will be saved in a folder named 'uploads'
  filename: (req, file, cb) => {
    // Generates a completely unique filename using the current date timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 2. POST ROUTE: Accepts a single file named 'image' alongside text body
router.post('/', upload.single('image'), async (req, res) => {
  const { seller_id, title, price, description, category } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      'INSERT INTO products (seller_id, title, price, description, image_url, category) VALUES (?, ?, ?, ?, ?, ?)',
      [seller_id, title, price, description, image_url, category || 'Other']
    );

    res.status(201).json({ 
      message: 'Product listed successfully with image! 🎉', 
      productId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET ROUTE: Fetch items along with seller details automatically via SQL JOIN
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        products.*, 
        users.phone AS seller_phone,
        users.name AS seller_name
      FROM products
      JOIN users ON products.seller_id = users.id
      ORDER BY products.created_at DESC
    `);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE A PRODUCT (DELETE http://localhost:5000/api/products/:id)
router.delete('/:id', async (req, res) => {
  const productId = req.params.id;
  const { seller_id } = req.body; // Pass seller_id to verify ownership

  try {
    // Check if the product belongs to the user trying to delete it
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product[0].seller_id !== parseInt(seller_id)) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own items' });
    }

    // Delete the item from TiDB Cloud
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    
    res.json({ message: 'Product removed successfully from CampuSwap!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;