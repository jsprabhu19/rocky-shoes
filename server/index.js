import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';

// Load environment variables from root directory
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize Supabase Client with Service Role Key (to bypass RLS for payment verification)
let supabaseUrl = process.env.VITE_SUPABASE_URL;
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}
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

// Initialize Resend Client
const resendKey = process.env.RESEND_API_KEY;
let resendClient;
if (resendKey) {
  resendClient = new Resend(resendKey);
} else {
  console.warn("WARNING: RESEND_API_KEY is missing. Email features will simulate sending to console.");
}

// Helper to send emails
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (resendClient) {
      const response = await resendClient.emails.send({
        from: 'RockyShoes <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      });
      console.log(`Email successfully sent via Resend to ${to}:`, response);
      return response;
    } else {
      console.log(`\n--- [SIMULATED EMAIL TO ${to}] ---`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}`);
      console.log(`------------------------------------\n`);
      return { id: 'mock_id' };
    }
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

// --- Middlewares ---

// Rate Limiter for checkout transactions to prevent API spamming/abuse
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware using Supabase Auth JWT tokens
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow guest checkouts to proceed without profile context
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized session or expired token.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server authorization error' });
  }
};

// Admin Authorization Middleware
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing session token.' });
    }

    const token = authHeader.split(' ')[1];
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Session invalid or expired.' });
    }

    // Query profiles to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin privileges required.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ error: 'Internal server authorization error' });
  }
};

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    supabase: !!supabase,
    razorpay: !!razorpay,
  });
});

// API 1: Create Razorpay Order (Protected with Auth + Rate Limit)
app.post('/api/payment/order', paymentLimiter, authenticateUser, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

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

// API 2: Verify Razorpay Payment Signature and Update Order (Protected with Auth + Rate Limit)
app.post('/api/payment/verify', paymentLimiter, authenticateUser, async (req, res) => {
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

    // Update order status to 'paid' in Supabase.
    // NOTE: An SQL Database trigger (on_order_paid) automatically handles product inventory deduction.
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

      return res.json({ success: true, message: 'Payment verified and order updated.', order: data[0] });
    } else {
      return res.json({ success: true, message: 'Payment verified successfully, but Supabase connection was not available.' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed.' });
  }
});

// API 3: Simulate Payment Success (Bypasses Razorpay check for testing)
app.post('/api/payment/simulate-success', paymentLimiter, authenticateUser, async (req, res) => {
  try {
    const { db_order_id } = req.body;
    if (!db_order_id) {
      return res.status(400).json({ error: 'Missing database order ID.' });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          razorpay_order_id: 'sim_order_' + Math.random().toString(36).substring(7),
          razorpay_payment_id: 'sim_pay_' + Math.random().toString(36).substring(7)
        })
        .eq('id', db_order_id)
        .select();

      if (error) {
        console.error('Error simulating payment in Supabase:', error);
        return res.status(500).json({ error: 'Database update failed.', details: error });
      }

      // Try sending order confirmation email
      const order = data[0];
      await sendEmail({
        to: order.email,
        subject: `Order Confirmed - RockyShoes #${order.id.slice(0, 8)}`,
        html: `
          <h1>Thank you for your purchase!</h1>
          <p>Hi ${order.full_name},</p>
          <p>Your order <strong>#${order.id}</strong> has been successfully paid and is now processing.</p>
          <p>Total amount: <strong>₹${order.total_amount}</strong></p>
          <p>Shipping Address: ${order.shipping_address}</p>
          <p>We will notify you once it's shipped.</p>
        `
      });

      return res.json({ success: true, message: 'Simulated payment succeeded.', order: order });
    } else {
      return res.status(500).json({ error: 'Database service unavailable' });
    }
  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({ error: error.message || 'Payment simulation failed.' });
  }
});

// API 4: Refund Payment (Admin protected)
app.post('/api/payment/refund', requireAdmin, async (req, res) => {
  try {
    const { order_id, amount } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'paid' && order.status !== 'shipped' && order.status !== 'returning') {
      return res.status(400).json({ error: 'Only paid or returning orders can be refunded.' });
    }

    const paymentId = order.razorpay_payment_id;
    if (!paymentId) {
      return res.status(400).json({ error: 'No Razorpay payment ID associated with this order.' });
    }

    let refund;
    if (paymentId.startsWith('sim_pay_')) {
      refund = { id: 'sim_rfnd_' + Math.random().toString(36).substring(7), status: 'processed' };
    } else {
      if (!razorpay) {
        return res.status(500).json({ error: 'Razorpay integration is not configured on the server.' });
      }
      refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round((amount || order.total_amount) * 100),
        notes: { reason: 'Customer return request approved by admin.' }
      });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'returned' })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    await sendEmail({
      to: order.email,
      subject: `Refund Processed - RockyShoes #${order.id.slice(0, 8)}`,
      html: `
        <h1>Your refund has been processed</h1>
        <p>Hi ${order.full_name},</p>
        <p>Your return request for order <strong>#${order.id}</strong> has been approved, and a refund of <strong>₹${amount || order.total_amount}</strong> has been processed.</p>
        <p>Refund Reference ID: <strong>${refund.id}</strong></p>
        <p>Thank you for shopping with RockyShoes!</p>
      `
    });

    res.json({ success: true, refund, order: updatedOrder });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ error: error.message || 'Refund failed to execute.' });
  }
});

// API 5: Generate GST PDF Invoice
app.get('/api/orders/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, price)
        )
      `)
      .eq('id', id)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.id.slice(0, 8)}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fillColor('#111827').fontSize(20).text('RockyShoes Invoice', { align: 'left' });
    doc.fontSize(10).fillColor('#6b7280')
      .text('Rocky Premium Footwear Co.', { align: 'right' })
      .text('101 Rocky Rd, Bangalore, Karnataka - 560001', { align: 'right' })
      .text('GSTIN: 29AAACR1234A1ZP', { align: 'right' })
      .moveDown(1.5);

    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1.5);

    const startY = doc.y;
    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text('Billed To:', 50, startY)
      .font('Helvetica').fontSize(9)
      .text(order.full_name)
      .text(`Email: ${order.email}`)
      .text(`Phone: ${order.phone || 'N/A'}`)
      .text(`Address: ${order.shipping_address}`);

    doc.font('Helvetica-Bold').fontSize(11).text('Invoice Details:', 350, startY)
      .font('Helvetica').fontSize(9)
      .text(`Invoice ID: INV-${order.id.slice(0, 8).toUpperCase()}`)
      .text(`Order Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`)
      .text(`Payment ID: ${order.razorpay_payment_id || 'N/A'}`)
      .text(`Status: ${order.status.toUpperCase()}`);

    doc.moveDown(2);

    const tableTop = doc.y + 20;
    doc.font('Helvetica-Bold').fontSize(9)
      .text('Item Description', 50, tableTop)
      .text('Qty', 300, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', 380, tableTop, { width: 70, align: 'right' })
      .text('Amount', 470, tableTop, { width: 80, align: 'right' });

    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let currentY = tableTop + 25;
    order.order_items.forEach((item) => {
      const name = item.products ? item.products.name : 'Unknown Product';
      const itemPrice = item.price;
      const itemAmount = itemPrice * item.quantity;

      doc.font('Helvetica').text(name, 50, currentY, { width: 230 })
        .text(item.quantity.toString(), 300, currentY, { width: 50, align: 'right' })
        .text(`₹${itemPrice.toLocaleString('en-IN')}`, 380, currentY, { width: 70, align: 'right' })
        .text(`₹${itemAmount.toLocaleString('en-IN')}`, 470, currentY, { width: 80, align: 'right' });

      currentY += 20;
    });

    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, currentY).lineTo(550, currentY).stroke();

    const totalAmount = parseFloat(order.total_amount);
    const taxRate = 0.18;
    const basePrice = totalAmount / (1 + taxRate);
    const gstAmount = totalAmount - basePrice;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    currentY += 15;
    doc.font('Helvetica').text('Taxable Subtotal:', 350, currentY, { width: 100, align: 'right' })
      .text(`₹${basePrice.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });

    currentY += 15;
    doc.text('CGST (9%):', 350, currentY, { width: 100, align: 'right' })
      .text(`₹${cgst.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });

    currentY += 15;
    doc.text('SGST (9%):', 350, currentY, { width: 100, align: 'right' })
      .text(`₹${sgst.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });

    currentY += 20;
    doc.font('Helvetica-Bold').fontSize(11).text('Total Paid:', 340, currentY, { width: 110, align: 'right' })
      .text(`₹${totalAmount.toLocaleString('en-IN')}`, 470, currentY, { width: 80, align: 'right' });

    doc.fontSize(8).fillColor('#9ca3af')
      .text('This is a computer generated invoice and does not require physical signature.', 50, 700, { align: 'center' })
      .text('Thank you for choosing RockyShoes!', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Invoice PDF error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate PDF.' });
  }
});

// API 6: Subscribe to Newsletter
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'This email is already subscribed!' });
      }
      throw error;
    }

    await sendEmail({
      to: email,
      subject: 'Welcome to the RockyShoes Newsletter!',
      html: `
        <h1>Welcome to the Club!</h1>
        <p>Thanks for subscribing to the RockyShoes newsletter.</p>
        <p>You'll now receive updates on early product drops, seasonal deals, and premium footwear trends.</p>
        <p>Use code <strong>ROCKY10</strong> at checkout for 10% off your next purchase!</p>
      `
    });

    res.json({ success: true, message: 'Successfully subscribed to newsletter!', data });
  } catch (error) {
    console.error('Newsletter error:', error);
    res.status(500).json({ error: error.message || 'Failed to subscribe.' });
  }
});

// API 7: Fetch Admin Orders List
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, image_url, price)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
});

// API 8: Update Admin Order Status
app.post('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, carrier, estimated_delivery } = req.body;

    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const updateFields = { status };
    if (tracking_number !== undefined) updateFields.tracking_number = tracking_number;
    if (carrier !== undefined) updateFields.carrier = carrier;
    if (estimated_delivery !== undefined) updateFields.estimated_delivery = estimated_delivery;

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (status === 'shipped') {
      await sendEmail({
        to: order.email,
        subject: `Your RockyShoes Order #${order.id.slice(0, 8)} has Shipped!`,
        html: `
          <h1>Good news! Your order is on the way.</h1>
          <p>Hi ${order.full_name},</p>
          <p>Order <strong>#${order.id}</strong> has been shipped via <strong>${carrier || 'Standard Carrier'}</strong>.</p>
          <p>Tracking Number: <strong>${tracking_number || 'N/A'}</strong></p>
          <p>Estimated Delivery: <strong>${estimated_delivery || 'N/A'}</strong></p>
          <p>You can track the progress of your shipment on the RockyShoes Customer Portal.</p>
        `
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: error.message || 'Failed to update status.' });
  }
});// Admin Product CRUD APIs
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image_url, stock } = req.body;
    if (!name || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stock, 10) || 0;

    const { data, error } = await supabase
      .from('products')
      .insert({ 
        name, 
        description, 
        price: numericPrice, 
        category, 
        image_url, 
        stock: numericStock 
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, product: data });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, stock } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;
    if (image_url !== undefined) updates.image_url = image_url;
    if (stock !== undefined) updates.stock = parseInt(stock, 10) || 0;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, product: data });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message || 'Failed to delete product' });
  }
});

// Abandoned Cart Recovery Background Routine
const checkAbandonedCarts = async () => {
  try {
    if (!supabase) return;
    
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    const { data: carts, error } = await supabase
      .from('carts')
      .select(`
        *,
        profiles (email, full_name),
        cart_items (
          quantity,
          products (name, price)
        )
      `)
      .gte('updated_at', fourHoursAgo)
      .lte('updated_at', twoHoursAgo);

    if (error) throw error;
    if (!carts || carts.length === 0) return;

    for (const cart of carts) {
      if (!cart.profiles || !cart.profiles.email || !cart.cart_items.length) continue;
      
      const email = cart.profiles.email;
      const name = cart.profiles.full_name || 'Valued Customer';
      const itemsList = cart.cart_items.map(item => `<li>${item.products.name} (Qty: ${item.quantity})</li>`).join('');
      
      console.log(`Abandoned cart detected for user: ${email}. Sending recovery email...`);
      
      await sendEmail({
        to: email,
        subject: 'Did you leave something behind at RockyShoes?',
        html: `
          <h1>You left items in your shopping bag!</h1>
          <p>Hi ${name},</p>
          <p>We noticed you added items to your RockyShoes bag but didn't finish checking out. We have saved your bag for you:</p>
          <ul>
            ${itemsList}
          </ul>
          <p>Ready to check out? Return to your cart now and use coupon code <strong>COMEBACK5</strong> for an extra 5% off!</p>
          <p><a href="http://localhost:3000/checkout" style="background-color:#e11d48;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;">Complete Your Order</a></p>
        `
      });

      await supabase
        .from('carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cart.id);
    }
  } catch (err) {
    console.error("Error checking abandoned carts:", err);
  }
};

// Check every 30 minutes in background
setInterval(checkAbandonedCarts, 30 * 60 * 1000);

// API 9: Secure Order Tracking & Guest Lookup
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    // Try to get token from header to authenticate logged-in user
    let authenticatedUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      authenticatedUser = user;
    }

    // Fetch order from DB
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, image_url, price)
        )
      `)
      .eq('id', id)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate permission:
    // 1. Logged-in user matches order user_id
    // 2. Or the provided email matches order email
    const isOwner = authenticatedUser && order.user_id === authenticatedUser.id;
    const matchesEmail = email && order.email.toLowerCase() === email.toLowerCase();

    if (!isOwner && !matchesEmail) {
      return res.status(403).json({ error: 'Unauthorized to view this order.' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error retrieving order details:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve order' });
  }
});

app.listen(PORT, () => {
  console.log(`RockyShoes Payment Server running on http://localhost:${PORT}`);
});
