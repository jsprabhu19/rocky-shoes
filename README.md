# RockyShoes — Premium Footwear E-Commerce Platform

RockyShoes is a professional, high-performance, and feature-rich e-commerce web application engineered for premium athletic and casual footwear. The platform features an interactive, modern user interface, fully integrated secure checkout, dynamic invoice generation, background automated tasks, and a robust administrator control portal.

---

## ⚡ Core Features

### 🛒 1. Customer Shopping Experience
*   **Modern Catalog:** Clean product categories (Sneakers, Running Shoes, Boots) with filters, search, sorting, and fast pagination.
*   **Interactive Cart Drawer:** Slide-out shopping cart for real-time item management and subtotal calculations.
*   **Wishlist System:** One-click wishlist tracking for saving favorite shoes.
*   **User Profiles:** Customer dashboards detailing order histories, addresses, and account updates.

### 💳 2. Secure Payment Gateway (Razorpay)
*   **Standard Checkout:** Integrated with the Razorpay Web SDK standard modal overlay.
*   **Signature Verification:** Backend HMAC-SHA256 verification of checkout signatures to prevent payment spoofing.
*   **Simulation Suite:** Built-in "Simulate Success" pathway to test purchase confirmations and triggers without active API keys.
*   **Discount Code Engine:** Applied at checkout (e.g., using **ROCKY10** welcome code for 10% off).

### 📋 3. Order Management & Dispatch Tracking
*   **GST-Compliant Invoices:** Dynamic, clean invoice PDFs generated using PDFKit on the backend, complete with item detail tables, taxation details, and billing.
*   **Live Order Tracking:** Stepper-based dashboard mapping package stages (Pending → Paid → Shipped → Delivered). Supports Guest tracking verification via secure email checks.

### 👑 4. Administrator Control Desk
*   **Product Catalog CRUD:** Form overlays to add, edit, and delete products (with image references, categories, pricing, and stock limits).
*   **Order Fulfillment:** Dispatch manager to assign shipping carriers, tracking numbers, and update delivery dates.
*   **Instantly Triggered Refunds:** Integrated with the Razorpay API to process customer refunds and record returns.
*   **Analytics Overview:** High-level analytics showing total sales revenue, order volumes, active items, and low/out-of-stock items.

### 📱 5. PWA (Progressive Web App)
*   **Installability:** Configured with manifest icons, desktop layouts, and install banners.
*   **Service Worker Caching:** Custom Service Worker (`sw.js`) implementing asset caching to enable basic offline catalog access.

---

## 🛠️ Technology Stack

*   **Frontend SPA:** React (Vite, React Router, Lucide Icons, HSL Vanilla CSS for premium theme styling)
*   **Backend Server:** Node.js, Express, PDFKit
*   **Database & Security:** Supabase (PostgreSQL database with Row Level Security (RLS) policies and automatic database triggers)
*   **Email Deliverability:** Resend API
*   **Payments Integration:** Razorpay API & Web SDK

---

## 📂 Project Structure

```
├── public/                 # Static assets, Web App Manifest & Service Worker
├── server/
│   └── index.js            # Express API Server, Middleware, Payment & Email routers
├── src/
│   ├── components/         # Navigation, Footer, Cart Drawer, Modals, Product Cards
│   ├── context/            # Auth, Cart, and Wishlist Context state managers
│   ├── hooks/              # Custom React Hooks (Document title, etc.)
│   ├── pages/              # Catalog, Checkout, Admin, Profile, Success pages
│   ├── apiConfig.js        # Dynamic API base URL configuration helper
│   ├── App.jsx             # Main Router layout wrapper
│   └── main.jsx            # SPA Entry point
├── vercel.json             # Vercel configuration for SPA URL rewrites
├── render.yaml             # Render infrastructure blueprint configuration
└── schema.sql              # Database DDL, table relations, and triggers
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Database Settings
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Razorpay Configuration Keys
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Email Client Configurations
RESEND_API_KEY=your-resend-api-key

# API Host URLs (For split production deployment)
VITE_API_URL=               # Empty for local dev; set to Render server URL in Vercel
FRONTEND_URL=               # Set to your Vercel URL in Render dashboard
```

---

## 🚀 Local Development Setup

### 1. Database Setup
1.  Initialize a Supabase project.
2.  Navigate to the **SQL Editor** in the Supabase Dashboard.
3.  Paste the contents of [schema.sql](file:///e:/Learning/antigravity-projects/rocky-shoes/schema.sql) and click **Run**. This constructs tables, foreign keys, constraints, and triggers.

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
Runs both Vite frontend server (port 3000) and Express server (port 5000) concurrently:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
