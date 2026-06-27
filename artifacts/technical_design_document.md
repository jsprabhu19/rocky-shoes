# RockyShoes — Technical & Low-Level Design Document

This document outlines the system architecture, core data flows, database schema, API specifications, and security model of the **RockyShoes** professional e-commerce platform.

---

## 1. System Architecture

The application is built on a split-tier architecture consisting of a static single-page application (SPA), an external serverless backend, and an instant-update database service.

```mermaid
graph TD
    %% Clients
    User([User Browser])
    Admin([Admin Browser])

    %% Frontend Hosting
    subgraph Vercel_Hosting [Frontend: Vercel]
        FE[React SPA Client]
        PWA[PWA SW / manifest.json]
    end

    %% Backend Services
    subgraph Node_Backend [Backend: Render]
        Express[Express API Server]
        PDFGen[PDFKit Invoice Gen]
    end

    %% Third-party APIs
    subgraph Third_Party [Third Party Services]
        Razorpay[Razorpay Payment API]
        Resend[Resend Email API]
    end

    %% Supabase DB & Auth
    subgraph Supabase_Platform [Database & Auth: Supabase]
        Auth[Supabase Auth]
        DB[(PostgreSQL DB)]
    end

    %% Connections
    User -->|Views & Interacts| FE
    Admin -->|Manages Products/Orders| FE
    
    %% Auth Flows
    FE -->|Client Sign Up / Sign In| Auth
    Auth -->|Triggers User Profile| DB
    
    %% Direct Database Reads
    FE -->|Reads Products & Profile| DB
    
    %% Backend API Calls
    FE -->|Checkout / Orders / Admin Updates| Express
    
    %% Backend Integrations
    Express -->|Bypass / Write Data| DB
    Express -->|Creates Payment Orders| Razorpay
    Express -->|Sends Email Notifications| Resend
    PDFGen -->|Generates Invoice PDFs| Express
```

---

## 2. Core Workflows & Sequence Diagrams

### 2.1. Checkout & Payment Verification Workflow (Razorpay)

This flow tracks the creation of orders, payment authorization, database updates, and email notifications.

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant React as React Client
    participant Supabase as Supabase DB
    participant Node as Express Backend
    participant Razorpay as Razorpay API
    participant Resend as Resend API

    Customer->>React: Click "Pay via Gateway"
    React->>Supabase: Insert Order (status: 'pending')
    Supabase-->>React: Return Order ID (db_order_id)
    React->>Supabase: Insert Order Items
    React->>Node: POST /api/payment/order { amount, receipt: db_order_id }
    Node->>Razorpay: Create Order { amount, currency, receipt }
    Razorpay-->>Node: Return Razorpay Order ID
    Node-->>React: Return rzpOrder object
    React->>Customer: Launch Razorpay standard checkout overlay
    Customer->>React: Authorize Payment
    React->>Node: POST /api/payment/verify { signature, payment_id, order_id, db_order_id }
    Node->>Node: Verify HMAC-SHA256 signature locally
    alt Signature is Valid
        Node->>Supabase: Update Order Status to 'paid'
        Supabase-->>Node: OK (Triggers inventory decrement)
        Node->>Resend: Send confirmation email with PDF Invoice
        Node-->>React: Return { success: true }
        React->>Customer: Redirect to /order-success
    else Signature Invalid
        Node-->>React: Return { success: false, error }
        React->>Customer: Show error modal
    end
```

### 2.2. Product Inventory Auto-Decrement Flow

```mermaid
flowchart TD
    A[Order Status Updated to 'paid'] --> B{Status Changed to 'paid'?};
    B -- Yes --> C[Iterate through order_items for new.id];
    C --> D[Retrieve product_id & quantity];
    D --> E[Update products table: set stock = stock - quantity];
    E --> F[Trigger inventory level checks];
    B -- No --> G[Do nothing];
```

---

## 3. Database Schema

The relational schema is implemented in Supabase (PostgreSQL) and configured with triggers and foreign keys.

```mermaid
erDiagram
    profiles ||--o{ orders : "places"
    products ||--o{ order_items : "contained in"
    orders ||--|{ order_items : "composed of"
    profiles ||--|| carts : "owns"

    profiles {
        uuid id PK "auth.users FK"
        text email "Unique"
        text full_name
        text phone
        text address
        text role "admin / customer"
        timestamp created_at
    }

    products {
        uuid id PK
        text name "Not Null"
        text description
        numeric price "Not Null"
        text category "sneakers / running_shoes / boots"
        text image_url
        integer stock "Default 0"
        timestamp created_at
    }

    orders {
        uuid id PK
        uuid user_id FK "profiles.id (Nullable for Guests)"
        text email "Not Null"
        text full_name "Not Null"
        text phone "Not Null"
        text shipping_address "Not Null"
        numeric total_amount "Not Null"
        text status "pending/paid/shipped/delivered/returning/returned/failed/cancelled"
        timestamp created_at
        text tracking_number "Nullable"
        text carrier "Nullable"
        date estimated_delivery "Nullable"
    }

    order_items {
        uuid id PK
        uuid order_id FK "orders.id ON DELETE CASCADE"
        uuid product_id FK "products.id ON DELETE RESTRICT"
        integer quantity "Not Null"
        numeric price "Not Null"
        text size "UK standard size"
    }

    carts {
        uuid id PK
        uuid user_id FK "profiles.id Unique"
        jsonb items "Array of items [{product_id, quantity, size}]"
        timestamp updated_at
    }
```

---

## 4. API Design Specifications

The backend Express application acts as an orchestrator for sensitive operations, third-party API keys, and admin validations.

### 4.1. Payment Endpoints

#### `POST /api/payment/order`
Creates an order object on Razorpay.
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "amount": 2999,
      "receipt": "db-order-uuid-here"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "id": "order_Okd8sj3hFsk",
      "entity": "order",
      "amount": 299900,
      "currency": "INR",
      "receipt": "db-order-uuid-here",
      "status": "created"
    }
    ```

#### `POST /api/payment/verify`
Verifies signature from Razorpay checkout widget.
*   **Request Body:**
    ```json
    {
      "razorpay_order_id": "order_Okd8sj3hFsk",
      "razorpay_payment_id": "pay_Oks8skfhsk",
      "razorpay_signature": "signature_hash_here",
      "db_order_id": "db-order-uuid-here"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Payment verified and order finalized."
    }
    ```

#### `POST /api/payment/simulate-success`
Bypasses gateways for testing environments.
*   **Request Body:**
    ```json
    {
      "db_order_id": "db-order-uuid-here"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Simulated payment successful."
    }
    ```

---

### 4.2. Admin Endpoints
*Must be called with Bearer JWT that belongs to a user with the `admin` role in the `profiles` table.*

#### `GET /api/admin/orders`
Retrieves all customer transactions.
*   **Response (200 OK):** Array of order entities including sub-queries of purchased items.

#### `POST /api/admin/orders/:id/status`
Updates shipment metrics, estimated delivery, and carrier details.
*   **Request Body:**
    ```json
    {
      "status": "shipped",
      "carrier": "Delhivery",
      "tracking_number": "DEL1847293",
      "estimated_delivery": "2026-07-01"
    }
    ```

#### `POST /api/admin/products`
Adds a product to the catalog. Price and stock are parsed as numbers on the backend.
*   **Request Body:**
    ```json
    {
      "name": "Rocky Running Air",
      "description": "Premium sports shoe",
      "price": 6999,
      "category": "running_shoes",
      "image_url": "/images/running-shoes/img-1.jpg",
      "stock": 25
    }
    ```

---

### 4.3. Customer Operations

#### `GET /api/orders/:id/invoice`
Generates a PDF invoice download dynamically using `PDFKit` with columns for product name, quantities, calculated taxes (GST), and totals.
*   **Response (200 OK):** Returns raw PDF application stream `Content-Type: application/pdf`.

---

## 5. Security & Authentication Model

### 5.1. Authentication Architecture
1.  **Frontend Authentication:** Managed directly via Supabase Auth (Sign-in, Registration, and Google OAuth). The client maintains access tokens in local storage.
2.  **API Verification Middleware:** 
    - Incoming headers are audited for an `Authorization` JWT: `Bearer <token>`.
    - The token is decrypted using the Supabase JWT Signature Secret.
    - If valid, the user's metadata is injected into `req.user`.

### 5.2. Admin Privilege Middleware (`requireAdmin`)
```javascript
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized token missing' });

    // Validate the token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Session expired' });

    // Query profiles to inspect role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Access restricted to administrators' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication internal server error' });
  }
};
```

---

## 6. Progressive Web App (PWA) Configuration

RockyShoes satisfies the PWA requirements for installability and offline support.

1.  **Web App Manifest (`public/manifest.json`):**
    - Defines theme colors (`#ffffff`, `#e11d48`), icons, shortcuts, and displays standard application layout modes.
2.  **Service Worker Cache (`public/sw.js`):**
    - Implements a caching strategy.
    - Caches structural stylesheets, JS dependencies, and brand fonts during the `install` phase.
    - Intercepts requests for cached content when the internet connection is disrupted, enabling fallback pages.
