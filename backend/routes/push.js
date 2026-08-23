const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
const pool = require('../db');

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
// 1. GET /api/push/vapid-public-key
// Frontend needs this to subscribe
// ─────────────────────────────────────────────
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// ─────────────────────────────────────────────
// 2. POST /api/push/subscribe
// Save push subscription for logged-in user
// ─────────────────────────────────────────────
router.post('/subscribe', authenticateToken, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ message: 'Invalid subscription.' });
  }

  try {
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh || '';
    const auth = subscription.keys?.auth || '';

    // Upsert — one subscription per user per endpoint
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = ?, auth = ?, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, endpoint, p256dh, auth, p256dh, auth]
    );

    return res.json({ message: 'Subscribed to push notifications.' });
  } catch (error) {
    console.error('🚨 Subscribe Error:', error.message);
    return res.status(500).json({ message: 'Failed to save subscription.' });
  }
});

// ─────────────────────────────────────────────
// 3. DELETE /api/push/unsubscribe
// Remove push subscription
// ─────────────────────────────────────────────
router.delete('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = ?',
      [req.user.id]
    );
    return res.json({ message: 'Unsubscribed from push notifications.' });
  } catch (error) {
    console.error('🚨 Unsubscribe Error:', error.message);
    return res.status(500).json({ message: 'Failed to remove subscription.' });
  }
});

// ─────────────────────────────────────────────
// Helper: Send push notification to a user
// Used internally by chat routes
// ─────────────────────────────────────────────
async function sendPushToUser(userId, title, body, url = '/') {
  try {
    const [subscriptions] = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      const payload = JSON.stringify({ title, body, url, tag: `msg-${userId}` });

      await webpush.sendNotification(pushSubscription, payload).catch(async (err) => {
        // 410 = subscription expired, clean it up
        if (err.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
        } else {
          console.error('Push send error:', err.message);
        }
      });
    }
  } catch (error) {
    console.error('🚨 Push notification error:', error.message);
  }
}

module.exports = { router, sendPushToUser };
