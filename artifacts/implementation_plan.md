# Implementation Plan - RockyShoes Growth Features (Phase 3)

This plan details the technical steps to scale **RockyShoes** into a full-featured e-commerce platform incorporating the Phase 3 Growth Features. 

---

## User Review Required

> [!IMPORTANT]
> **1. Role-Based Access Control (RBAC):**
> To secure the **Admin Dashboard**, we will add a `role` column to the `profiles` table in Supabase. By default, new signups will receive a `'customer'` role. The backend and Supabase RLS policies will verify that only users with the `'admin'` role can modify products or view other users' orders.
> 
> **2. Invoice Generation & Tax Compliance:**
> Invoices will be generated on the Express server using a PDF generation utility. Invoices will automatically calculate CGST/SGST (9% each for local transactions) or IGST (18% for interstate transactions) dynamically. Invoices will be downloadable directly from the order details window.
> 
> **3. Cart Synchronization & Abandoned Cart Logic:**
> Currently, the cart is stored solely in `localStorage`. To support **Abandoned Cart Recovery**, we must sync the customer's cart state to a new `public.carts` table in Supabase whenever they modify items (for logged-in users). A background routine on the server will check for carts inactive for over 2 hours and trigger a recovery email log.
> 
> **4. Payment Refunds:**
> Processing returns will allow self-serve return requests from customers. When an administrator updates the status to `'returned'`, the Express server will trigger the Razorpay Refund API to reverse the payment automatically.
>
> **5. Razorpay Test-Mode Payment Simulation:**
> To support full end-to-end testing without being blocked by Razorpay dashboard activation constraints, we will add a **"Simulate Test Payment"** button to the checkout page. If clicked, it will bypass the Razorpay modal, create the order in Supabase, hit a simulation backend endpoint to transition the order status directly from `'pending'` to `'paid'`, execute the database stock decrement trigger, and redirect to the order success page.

---

## Open Questions

> [!WARNING]
> **1. Email Service Provider:**
> Since we are in development and do not have an active SendGrid or Mailgun account, we propose configuring the Express server to use a **mock SMTP logger (simulated email console logs)** or dynamic Mailtrap/Ethereal sandboxes for abandoned cart and newsletter notifications. Please let us know if you have an active SMTP server we should hook up.
> 
> **2. Admin Role Seeding:**
> Once we add the `role` column, how should we elevate your account (`prabhujsp1983@gmail.com`) to Admin? We will write a simple SQL script in [migration.sql](file:///e:/Learning/antigravity-projects/rocky-shoes/migration.sql) that you can execute in your Supabase SQL editor to mark specific emails as admins.

---

## Proposed Changes

### Component 1: Database Schema & Migration

We will create a migration file to update the existing tables.

#### [NEW] [migration.sql](file:///e:/Learning/antigravity-projects/rocky-shoes/migration.sql)
- Alter `public.profiles` to add `role` text column (default: `'customer'`).
- Alter `public.orders` to support status `'delivered'`, `'returned'`, `'returning'`, and add tracking columns: `tracking_number` (text), `estimated_delivery` (date), `carrier` (text).
- Create `public.carts` and `public.cart_items` tables to store active user carts for recovery checks.
- Create `public.newsletter_subscribers` table to store subscriber emails.
- Update RLS policies:
  - Profiles: Only admins can view all profiles; customers can only view their own.
  - Orders: Only admins can view/update all orders; customers can view/update their own.
  - Products: Only admins can insert, update, or delete products.

---

### Component 2: Backend Services (Express Payment Server)

#### [MODIFY] [package.json](file:///e:/Learning/antigravity-projects/rocky-shoes/package.json)
- Add PDF generation (`pdfkit` or `pdf-lib`) and newsletter/recovery tools (`nodemailer`).

#### [MODIFY] [server/index.js](file:///e:/Learning/antigravity-projects/rocky-shoes/server/index.js)
- Add `/api/admin/...` endpoints protected by a role verification check (calls Supabase to verify user role is `'admin'`).
- Add `/api/payment/refund` endpoint that interfaces with the Razorpay SDK to request refunds.
- Add `/api/payment/simulate-success` to allow orders to be marked as `'paid'` directly without validating signature checksums (only enabled in test/sandbox environments).
- Add `/api/orders/:id/invoice` endpoint that outputs a formatted PDF file of the GST invoice.
- Add `/api/newsletter/subscribe` endpoint to append emails to the database.
- Add a periodic scheduler (e.g. check every 30 minutes) to check for abandoned carts in `public.carts` and log simulated recovery emails.

---

### Component 3: Front-End UI & State Sync (React Client)

#### [NEW] [src/pages/AdminDashboard.jsx](file:///e:/Learning/antigravity-projects/rocky-shoes/src/pages/AdminDashboard.jsx)
- Dashboard home showing key stats: revenue, orders, active carts, and out-of-stock notices.
- Products Manager panel: complete CRUD options to edit names, pricing, description, stock quantities, and categories.
- Orders Manager panel: lists all customer orders, allowing admins to edit statuses (e.g. mark as `shipped` with tracking numbers).

#### [NEW] [src/pages/OrderTracking.jsx](file:///e:/Learning/antigravity-projects/rocky-shoes/src/pages/OrderTracking.jsx)
- Custom visual progress bar page for checking shipping states: `Ordered` &rsaquo; `Paid` &rsaquo; `Shipped` &rsaquo; `Delivered`.

#### [MODIFY] [src/pages/Checkout.jsx](file:///e:/Learning/antigravity-projects/rocky-shoes/src/pages/Checkout.jsx)
- Support guest checkouts and attach Supabase authorization tokens if logged in.
- Render a **"Simulate Test Payment"** button alongside the standard Pay button when in test/dev environments. This button hits `/api/payment/simulate-success` directly to bypass Razorpay's overlay and complete the order.

#### [MODIFY] [src/context/CartContext.jsx](file:///e:/Learning/antigravity-projects/rocky-shoes/src/context/CartContext.jsx)
- Update cart modifiers (`addToCart`, `removeFromCart`, `updateQuantity`) to sync state to Supabase `public.carts` in real-time when the customer is authenticated.

#### [MODIFY] [src/components/Navbar.jsx](file:///e:/Learning/antigravity-projects/rocky-shoes/src/components/Navbar.jsx)
- Add an "Admin Panel" link in the user account dropdown if the profile role is `'admin'`.

#### [MODIFY] [src/pages/Profile.jsx](file:///e:/Learning/antigravity-projects/rocky-shoes/src/pages/Profile.jsx)
- Add "Invoice PDF Download" buttons next to completed/paid orders.
- Add a "Request Return" button on delivered orders.
- Integrate order status tracking timelines inline inside the order history list.

#### [MODIFY] [src/App.jsx](file:///e:/Learning/antigravity-projects/rocky-shoes/src/App.jsx)
- Wire up new routes: `/admin` and `/track/:orderId`.

#### [MODIFY] [index.html](file:///e:/Learning/antigravity-projects/rocky-shoes/index.html)
- Append Microsoft Clarity & Google Analytics script placeholders.
- Register service worker files for PWA installation support.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify React client compiles with PWA bundles.
- Check API routes with mock tokens to ensure customers are barred from accessing `/api/admin` routes.

### Manual Verification
1. **Admin Control:** Elevate your account to `'admin'`, log in, navigate to `/admin`, and verify that you can CRUD products, update order states, and check metrics.
2. **Order Tracking Visuals:** Update an order status to `shipped` in the Admin panel, add a tracking code, and verify that the timeline updates correctly on the Customer Portal.
3. **Refunds Verification:** Trigger a return on a paid order, verify that the admin sees the return request, approves it, and initiates the Razorpay Refund endpoint successfully.
4. **Invoice Verification:** Download a generated invoice PDF and check that GST breakdowns and address fields are accurate.
