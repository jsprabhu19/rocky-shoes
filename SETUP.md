# Setup Guide - RockyShoes E-Commerce Application

Follow these steps to set up and run the **RockyShoes** premium footwear store locally.

---

## 1. Supabase Project Setup

1. **Create a Supabase Project:**
   - Go to [Supabase](https://supabase.com) and sign in or create an account.
   - Click **New Project** and select/create an organization.
   - Enter `RockyShoes` as the project name, choose a database password, and select the region closest to you.

2. **Execute the SQL Database Schema:**
   - In your Supabase Dashboard, navigate to the **SQL Editor** tab from the left sidebar.
   - Click **New Query**.
   - Copy the entire contents of the local file [schema.sql](file:///e:/Learning/antigravity-projects/rocky-shoes/schema.sql) and paste it into the query editor.
   - Click **Run** (or press Cmd/Ctrl + Enter).
   - This setup:
     - Creates `profiles`, `products`, `orders`, and `order_items` tables.
     - Seeds initial products linked to local catalog images.
     - configures Row Level Security (RLS) policies.
     - Adds user registration triggers and stock decrement helpers.

3. **Retrieve API Credentials:**
   - Go to **Project Settings** (gear icon) &rsaquo; **API**.
   - Copy the **Project API URL** (which will map to `VITE_SUPABASE_URL` in `.env`).
   - Copy the **`anon` `public` API key** (which will map to `VITE_SUPABASE_ANON_KEY` in `.env`).
   - Copy the **`service_role` API key** (which will map to `SUPABASE_SERVICE_ROLE_KEY` in `.env`). *Keep this secret key safe!*

---

## 2. Razorpay Configuration

1. **Sign Up / Login to Razorpay:**
   - Access the [Razorpay Dashboard](https://dashboard.razorpay.com) and switch to **Test Mode** (to process free test payments).

2. **Generate API Key & Secret:**
   - Navigate to **Account & Settings** &rsaquo; **API Keys**.
   - Click **Generate Key** to receive a new **Key ID** and **Key Secret**.
   - Note these down; they will map to `VITE_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` respectively.

---

## 3. Configure Local Environment Variables

1. Open the file [.env](file:///e:/Learning/antigravity-projects/rocky-shoes/.env) in the root of the project.
2. Fill in the keys retrieved from Supabase and Razorpay:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-supabase-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_yourRazorpayKeyId
RAZORPAY_KEY_SECRET=yourRazorpayKeySecret

# Server Configuration
PORT=5000
```

---

## 4. Run and Build Locally

Since NodeJS is installed on the machine, execution is simple. Due to PowerShell script block policies, we run npm scripts via `npm.cmd`.

1. **Install Dependencies:**
   - Open your terminal in the project directory and run:
     ```powershell
     npm.cmd install
     ```
   *(Note: This is already completed on this system).*

2. **Start the Application:**
   - Run both the React Vite frontend and the Express payment verification backend concurrently:
     ```powershell
     npm.cmd run dev
     ```
   - The React UI launches on: [http://localhost:3000](http://localhost:3000)
   - The Payment Verification API launches on: [http://localhost:5000](http://localhost:5000)

3. **Build for Production:**
   - To verify the build or package the application:
     ```powershell
     npm.cmd run build
     ```

---

## 5. Git Setup & Push to GitHub Remote

Initialize git repository and publish your code to GitHub:

1. **Initialize Git:**
   ```powershell
   git init
   ```

2. **Configure `.gitignore`:**
   Ensure files like `node_modules/` and `.env` are ignored. A standard `.gitignore` is provided in the workspace.

3. **Stage and Commit Code:**
   ```powershell
   git add .
   git commit -m "Initialize RockyShoes premium e-commerce platform"
   ```

4. **Link Remote and Push:**
   ```powershell
   git remote add origin https://github.com/jsprabhu19/rocky-shoes.git
   git branch -M main
   git push -u origin main
   ```
