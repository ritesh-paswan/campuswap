require('dotenv').config();

// ── Startup guards ──────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error('🚨 FATAL: JWT_SECRET is not set. Exiting.');
  process.exit(1);
}
if (!process.env.TIDB_HOST || !process.env.TIDB_USER || !process.env.TIDB_PASSWORD) {
  console.error('🚨 FATAL: TiDB credentials are not set. Exiting.');
  process.exit(1);
}

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
    methods: ["GET", "POST"],
    credentials: true
  },
  // Tune for stability on Render free tier
  pingTimeout: 60000,
  pingInterval: 25000,
});

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:5173", "https://campuswap.vercel.app"],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Backend Server is running smoothly' });
});

// ─────────────────────────────────────────────
// Socket.io — Real-time chat
// ─────────────────────────────────────────────

// JWT auth middleware for every socket connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 User ${socket.user.id} connected [${socket.id}]`);

  // Join a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  // Send a message — with ownership verification
  socket.on('send_message', async ({ conversationId, content }) => {
    if (!content?.trim()) return;

    try {
      // ✅ Security fix: verify sender is part of this conversation
      const [conv] = await pool.query(
        'SELECT id FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
        [conversationId, socket.user.id, socket.user.id]
      );
      if (!conv || conv.length === 0) {
        socket.emit('error', { message: 'Unauthorized.' });
        return;
      }

      const [result] = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
        [conversationId, socket.user.id, content.trim()]
      );

      const [rows] = await pool.query(
        `SELECT m.*, u.name AS sender_name 
         FROM messages m 
         JOIN users u ON m.sender_id = u.id 
         WHERE m.id = ?`,
        [result.insertId]
      );

      io.to(`conversation_${conversationId}`).emit('new_message', rows[0]);
    } catch (err) {
      console.error('🚨 Message save error:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as seen — with ownership verification
  socket.on('mark_seen', async ({ conversationId }) => {
    try {
      // ✅ Security fix: verify user is part of this conversation
      const [conv] = await pool.query(
        'SELECT id FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
        [conversationId, socket.user.id, socket.user.id]
      );
      if (!conv || conv.length === 0) return;

      await pool.query(
        `UPDATE messages SET is_read = 1 
         WHERE conversation_id = ? AND sender_id != ?`,
        [conversationId, socket.user.id]
      );

      io.to(`conversation_${conversationId}`).emit('messages_seen', {
        conversationId,
        seenBy: socket.user.id
      });
    } catch (err) {
      console.error('🚨 Mark seen error:', err.message);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 User ${socket.user.id} disconnected [${reason}]`);
  });

  socket.on('error', (err) => {
    console.error(`🚨 Socket error for user ${socket.user.id}:`, err.message);
  });
});

app.set('io', io);

async function verifyDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ TiDB Cloud Database connected and ready!');
  } catch (err) {
    console.error('🚨 DATABASE CONNECTION ERROR:', err.message);
  }
}

verifyDatabaseConnection();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});