# 🏠 RentFlux — Rent Management System

A production-ready MERN stack rent management system for managing multiple properties, tenants, electricity bills, and rent slips.

---

## 🚀 Quick Start

### 1. Clone & set up environment variables

**Server** — copy and fill:
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/rentflux
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
```

**Client** — copy and fill:
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

---

### 2. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

---

### 3. Run development servers

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open: **http://localhost:3000**

---

## 📁 Project Structure

```
rentflux/
├── server/
│   ├── index.js               # Entry point
│   ├── models/
│   │   ├── User.js
│   │   ├── Area.js
│   │   ├── House.js
│   │   └── Payment.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── areaController.js
│   │   ├── houseController.js
│   │   └── paymentController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── areas.js
│   │   ├── houses.js
│   │   └── payments.js
│   ├── middleware/
│   │   ├── auth.js            # JWT protect middleware
│   │   └── validate.js        # express-validator middleware
│   └── package.json
│
└── client/
    ├── src/
    │   ├── App.jsx            # Routes
    │   ├── main.jsx           # Entry
    │   ├── index.css          # Tailwind + global styles
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js         # Axios + all API calls
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── MobileNav.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── UI.jsx         # Reusable components
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Areas.jsx
    │   │   ├── Houses.jsx
    │   │   ├── History.jsx
    │   │   ├── Slips.jsx
    │   │   └── Settings.jsx
    │   ├── modals/
    │   │   ├── AreaModal.jsx
    │   │   ├── HouseModal.jsx
    │   │   ├── TenantModal.jsx
    │   │   ├── RentCalcModal.jsx
    │   │   ├── HouseDetailModal.jsx
    │   │   └── SlipModal.jsx
    │   ├── hooks/
    │   │   └── useAsync.js
    │   └── utils/
    │       └── helpers.js
    └── package.json
```

---

## 🔑 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login`    | Login |
| GET  | `/api/auth/me`       | Get current user |
| PUT  | `/api/auth/password` | Change password |

### Areas
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/areas`      | Get all areas |
| POST   | `/api/areas`      | Create area |
| PUT    | `/api/areas/:id`  | Update area |
| DELETE | `/api/areas/:id`  | Delete area |

### Houses
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/houses?area=<id>` | Get houses by area |
| GET    | `/api/houses/:id`       | Get single house |
| POST   | `/api/houses`           | Add house |
| PUT    | `/api/houses/:id`       | Update house/tenant |
| DELETE | `/api/houses/:id`       | Delete house |
| POST   | `/api/houses/:id/vacate`| Vacate house |

### Payments
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/payments/dashboard` | Dashboard stats |
| GET    | `/api/payments`           | All payments (filterable) |
| GET    | `/api/payments/:id`       | Single payment |
| POST   | `/api/payments`           | Create payment record |
| DELETE | `/api/payments/:id`       | Delete payment |

---

## ☁️ Free Deployment

### MongoDB Atlas (Free Tier)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create free M0 cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (for Render)
5. Get connection string → paste into `MONGO_URI`

### Backend → Render (Free)
1. Push `server/` to GitHub
2. New Web Service on [render.com](https://render.com)
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add all env vars from `server/.env`

### Frontend → Vercel (Free)
1. Push `client/` to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Framework: Vite
4. Add env var: `VITE_API_URL=https://your-render-app.onrender.com/api`

---

## ⚡ Key Features

- **JWT Authentication** — secure login, token stored in localStorage
- **Area Management** — multiple areas with occupancy stats
- **House Management** — per-area house cards with tenant details
- **Electricity Calculation** — automatic `(curr - prev) × rate` in real-time
- **Due Carry-forward** — unpaid amounts auto-roll to next month
- **Month Lock** — prevents duplicate records for same tenant + month
- **Payment History** — filterable by status and month
- **Rent Slips** — professional PDF/image download via html2canvas + jsPDF
- **Mobile Responsive** — full mobile layout with bottom navigation
- **Pagination** — server-side via mongoose-paginate-v2
