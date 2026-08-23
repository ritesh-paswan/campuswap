require('dotenv').config();

if (!process.env.JWT_SECRET) { console.error('🚨 FATAL: JWT_SECRET not set'); process.exit(1); }
if (!process.env.TIDB_HOST)  { console.error('🚨 FATAL: TiDB credentials not set'); process.exit(1); }

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://campuswap.vercel.app"],
    methods: ["GET", "POST"], credentials: true
  },
  pingTimeout: 60000, pingInterval: 25000,
});

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ["http://localhost:5173", "https://campuswap.vercel.app"], credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

const { router: pushRoutes, sendPushToUser } = require('./routes/push');
app.use('/api/push', pushRoutes);

app.get('/', (req, res) => res.json({ status: 'Backend running smoothly' }));

// ─────────────────────────────────────────────
// Socket.io
// ─────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
  console.log(`🔌 User ${socket.user.id} connected`);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  socket.on('send_message', async ({ conversationId, content }) => {
    if (!content?.trim()) return;
    try {
      // Ownership check
      const [conv] = await pool.query(
        'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
        [conversationId, socket.user.id, socket.user.id]
      );
      if (!conv || conv.length === 0) { socket.emit('error', { message: 'Unauthorized.' }); return; }

      const [result] = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
        [conversationId, socket.user.id, content.trim()]
      );
      const [rows] = await pool.query(
        `SELECT m.*, u.name AS sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
        [result.insertId]
      );

      io.to(`conversation_${conversationId}`).emit('new_message', rows[0]);

      // ✅ Send push notification to the OTHER user in this conversation
      const conversation = conv[0];
      const recipientId = conversation.buyer_id === socket.user.id
        ? conversation.seller_id
        : conversation.buyer_id;

      // Get sender name and product title for notification
      const [senderRows] = await pool.query('SELECT name FROM users WHERE id = ?', [socket.user.id]);
      const [productRows] = await pool.query('SELECT title FROM products WHERE id = ?', [conversation.product_id]);

      const senderName = senderRows[0]?.name || 'Someone';
      const productTitle = productRows[0]?.title || 'a product';

      // Only send push if recipient is NOT currently in this conversation room
      const roomSockets = await io.in(`conversation_${conversationId}`).fetchSockets();
      const recipientOnline = roomSockets.some(s => s.user?.id === recipientId);

      if (!recipientOnline) {
        await sendPushToUser(
          recipientId,
          `New message from ${senderName}`,
          `About: ${productTitle} — "${content.trim().slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
          'https://campuswap.vercel.app'
        );
      }

    } catch (err) {
      console.error('🚨 Message error:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('mark_seen', async ({ conversationId }) => {
    try {
      const [conv] = await pool.query(
        'SELECT id FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
        [conversationId, socket.user.id, socket.user.id]
      );
      if (!conv || conv.length === 0) return;
      await pool.query(
        `UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?`,
        [conversationId, socket.user.id]
      );
      io.to(`conversation_${conversationId}`).emit('messages_seen', {
        conversationId, seenBy: socket.user.id
      });
    } catch (err) { console.error('🚨 Mark seen error:', err.message); }
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 User ${socket.user.id} disconnected [${reason}]`);
  });
});

app.set('io', io);

// ─────────────────────────────────────────────
// Auto-delete listings older than 15 days
// Runs once on startup then every 24 hours
// ─────────────────────────────────────────────
async function deleteOldListings() {
  try {
    const [result] = await pool.query(
      `DELETE FROM products WHERE created_at < DATE_SUB(NOW(), INTERVAL 15 DAY)`
    );
    if (result.affectedRows > 0) {
      console.log(`🗑️ Auto-deleted ${result.affectedRows} listings older than 15 days`);
    }
  } catch (err) {
    console.error('🚨 Auto-delete error:', err.message);
  }
}

async function verifyDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ TiDB Cloud Database connected and ready!');
    await deleteOldListings(); // Run on startup
    setInterval(deleteOldListings, 24 * 60 * 60 * 1000); // Then every 24h
  } catch (err) {
    console.error('🚨 DATABASE CONNECTION ERROR:', err.message);
  }
}

verifyDatabaseConnection();

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
