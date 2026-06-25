import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from root directory
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize Supabase Client with Service Role Key (to bypass RLS for payment verification)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn("WARNING: Supabase URL or Service Role Key is missing. Database operations will fail.");
}

// Initialize Razorpay Client
let razorpay;
if (process.env.VITE_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.VITE_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("WARNING: Razorpay keys are missing. Payment operations will fail.");
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    supabase: !!supabase,
    razorpay: !!razorpay,
  });
});

// API 1: Create Razorpay Order
app.post('/api/payment/order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.value || req.body;

    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay integration is not configured on the server.' });
    }

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required.' });
    }

    // Amount in Razorpay is in paise (e.g. 500.00 Rupees = 50000 Paise)
    const options = {
      amount: Math.round(amount * 100), 
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment order.' });
  }
});

// API 2: Verify Razorpay Payment Signature and Update Order
app.post('/api/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      db_order_id // Supabase order ID to update
    } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay Secret Key is missing on the server.' });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !db_order_id) {
      return res.status(400).json({ error: 'Missing verification parameters.' });
    }

    // Verify cryptographic signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Mark order as failed in Supabase if database client is ready
      if (supabase) {
        await supabase
          .from('orders')
          .update({ status: 'failed', razorpay_order_id, razorpay_payment_id })
          .eq('id', db_order_id);
      }
      return res.status(400).json({ error: 'Invalid payment signature. Potential tampering.' });
    }

    // Update order status to 'paid' in Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          razorpay_order_id,
          razorpay_payment_id
        })
        .eq('id', db_order_id)
        .select();

      if (error) {
        console.error('Error updating order in Supabase:', error);
        return res.status(500).json({ error: 'Payment verified, but database update failed.', details: error });
      }

      // Optionally deduct inventory stock for purchased products
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', db_order_id);

      if (items) {
        for (const item of items) {
          // Decrement stock
          await supabase.rpc('decrement_product_stock', {
            product_id_param: item.product_id,
            qty_param: item.quantity
          });
        }
      }

      return res.json({ success: true, message: 'Payment verified and order updated.', order: data[0] });
    } else {
      return res.json({ success: true, message: 'Payment verified successfully, but Supabase connection was not available.' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`RockyShoes Payment Server running on http://localhost:${PORT}`);
});
