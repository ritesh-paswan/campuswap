# CampuSwap ⚡

> A full-stack campus marketplace where students can buy, sell, and chat — built with React, Node.js, Socket.io, and TiDB Cloud.

![CampuSwap](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black) ![TiDB](https://img.shields.io/badge/Database-TiDB%20Cloud-red)

---

## 🌐 Live Demo

- **Frontend:** [campuswap.vercel.app](https://campuswap.vercel.app)
- **Backend:** [campuswap.onrender.com](https://campuswap.onrender.com)

---

## 📌 About

CampuSwap is a peer-to-peer campus marketplace that lets students list and discover second-hand items — textbooks, electronics, hostel essentials, and more. Buyers and sellers connect through a built-in real-time chat system, keeping all communication private and on-platform.

Key highlights:
- **No commission** — 100% free to list and buy
- **Public browsing** — anyone can view listings without signing up
- **In-app chat** — real-time messaging with seen receipts, no WhatsApp required
- **Multi-image listings** — up to 3 photos per product with a carousel viewer
- **Cloudinary storage** — images persist forever, never lost on server restarts

---

## ✨ Features

### 🛒 Marketplace
- Public product browsing without login
- Search listings by title or description
- Filter by category (Textbooks, Electronics, Lab Gear, Hostel Essentials, Clothing)
- Sort by Newest, Oldest, Price Low-High, Price High-Low
- Time ago on every listing card
- Share listing via Web Share API or clipboard copy

### 📦 Product Listings
- Upload up to 3 images per listing (1 required, 2-3 optional)
- Image preview before posting with remove option
- Category tagging and price in ₹
- Image carousel with thumbnails on product detail page
- Seller's own listing shows "This is your listing" badge

### 💬 Real-Time Chat
- Per-listing conversations between buyer and seller
- Instagram-style message bubbles with date dividers
- Seen receipts (✓ delivered, ✓✓ blue = seen)
- Grouped messages — name and time shown only on group changes
- Unread message badge on navbar Inbox button
- Automatic mark-as-read when chat is opened

### 🔐 Authentication
- Email OTP verification via Brevo API
- JWT-based session (7-day expiry)
- Rate limiting on OTP (5 requests / 15 min) and login (10 requests / 15 min)
- bcrypt password hashing
- Phone number optional at signup

### 🖼️ Image Storage
- Cloudinary integration — images survive server restarts
- Auto resize to 800×800, quality auto-optimized
- 5MB file size limit per image
- Supported formats: JPG, PNG, WEBP
- Cloudinary cleanup on product delete

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Axios, Socket.io-client |
| Backend | Node.js, Express 5, Socket.io 4 |
| Database | TiDB Cloud (MySQL-compatible) |
| Image Storage | Cloudinary |
| Email | Brevo HTTP API |
| Auth | JWT + bcrypt |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 📁 Project Structure

```
CAMPUSWAP/
├── backend/
│   ├── config/
│   │   └── cloudinary.js        # Cloudinary + Multer config
│   ├── routes/
│   │   ├── auth.js              # OTP, signup, login
│   │   ├── products.js          # CRUD + multi-image upload
│   │   └── chat.js              # Conversations + messages
│   ├── db.js                    # TiDB connection pool
│   ├── index.js                 # Express + Socket.io server
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── manifest.json        # PWA manifest
│   └── src/
│       ├── components/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── ProductList.jsx
│       │   ├── ProductDetail.jsx
│       │   ├── ProductForm.jsx
│       │   ├── Inbox.jsx
│       │   └── ChatWindow.jsx
│       ├── App.jsx
│       └── main.jsx
│
└── README.md
```

---

## 🗄️ Database Schema

```sql
users (id, name, email, password, password_hash, phone, created_at)
otps (email, otp_code, created_at)
products (id, seller_id, title, price, description, image_url, category, status, created_at)
product_images (id, product_id, image_url, position)
conversations (id, product_id, buyer_id, seller_id, created_at)
messages (id, conversation_id, sender_id, content, is_read, created_at)
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- A TiDB Cloud account (free tier)
- A Cloudinary account (free tier)
- A Brevo account (free tier, 300 emails/day)

### 1. Clone the repo

```bash
git clone https://github.com/ritesh-paswan/campuswap.git
cd campuswap
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
JWT_SECRET=your_long_random_secret

TIDB_HOST=your_tidb_host
TIDB_PORT=4000
TIDB_USER=your_tidb_user
TIDB_PASSWORD=your_tidb_password
TIDB_DATABASE=test

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_verified_sender@email.com
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🌍 Deployment

### Backend → Render
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node index.js`
- Add all `.env` variables in Render Dashboard → Environment

### Frontend → Vercel
- Root Directory: `frontend`
- Framework: Vite
- No additional config needed

---

## 🔒 Security Features

- JWT authentication on all protected routes
- Socket.io connections authenticated via JWT
- Socket message ownership verified before DB write
- Rate limiting on OTP and login endpoints
- bcrypt password hashing (cost factor 10)
- No internal error details exposed to clients
- All credentials stored in environment variables
- Cloudinary file type and size validation

---

## 📱 PWA Support

CampuSwap can be installed as a home screen app on Android and iOS:
- Custom app icon (blue lightning bolt)
- Standalone display mode
- Dark theme color `#080c14`

---

## 👨‍💻 Author

**Ritesh Paswan**
- GitHub: [@ritesh-paswan](https://github.com/ritesh-paswan)
- Project: [github.com/ritesh-paswan/campuswap](https://github.com/ritesh-paswan/campuswap)

---

## 📄 License

MIT License — feel free to use this project as a reference or starting point.
