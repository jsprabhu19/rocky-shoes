import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { CreditCard, ShoppingBag, Truck, ChevronLeft, ArrowRight, Check } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();

  useDocumentTitle('Secure Checkout');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Checkout Status States
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prefill form from user profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [user, profile]);

  // If cart is empty, redirect or block checkout page
  if (cart.length === 0) {
    return (
      <div className="empty-checkout-wrapper container animate-fade">
        <ShoppingBag size={48} className="empty-icon" />
        <h2>Your shopping bag is empty</h2>
        <p>Add some premium shoes to your cart before proceeding to checkout.</p>
        <Link to="/shop" className="btn btn-primary">Go To Shop</Link>
        <style dangerouslySetInnerHTML={{ __html: `
          .empty-checkout-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
            gap: 1rem;
            color: var(--text-muted);
          }
          .empty-checkout-wrapper h2 { color: var(--text-main); font-size: 1.5rem; font-weight: 800; }
          .empty-icon { color: var(--border-light); }
        `}} />
      </div>
    );
  }

  const handleCheckoutSubmit = async (e, forceSimulate = false) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setProcessing(true);

    try {
      // Validate inputs
      if (!fullName.trim() || !email.trim() || !phone.trim() || !address.trim()) {
        throw new Error('Please fill in all shipping fields.');
      }

      // 1. Create Pending Order in Supabase
      const orderData = {
        user_id: user ? user.id : null, // Support guest checkout
        email,
        full_name: fullName,
        phone,
        shipping_address: address,
        total_amount: totalPrice,
        status: 'pending'
      };

      const { data: dbOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;
      const dbOrderId = dbOrder.id;

      // 2. Create Order Items in Supabase
      const orderItemsData = cart.map((item) => ({
        order_id: dbOrderId,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Fetch active session token for auth headers if logged in
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const paymentHeaders = { 'Content-Type': 'application/json' };
      if (token) {
        paymentHeaders['Authorization'] = `Bearer ${token}`;
      }

      // If simulate success is clicked directly
      if (forceSimulate) {
        const simRes = await fetch('/api/payment/simulate-success', {
          method: 'POST',
          headers: paymentHeaders,
          body: JSON.stringify({
            db_order_id: dbOrderId
          })
        });

        const simData = await simRes.json();
        if (!simRes.ok) {
          throw new Error(simData.error || 'Failed to simulate payment.');
        }

        clearCart();
        navigate(`/order-success?orderId=${dbOrderId}`);
        return;
      }

      const res = await fetch('/api/payment/order', {
        method: 'POST',
        headers: paymentHeaders,
        body: JSON.stringify({
          amount: totalPrice,
          receipt: dbOrderId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to communicate with payment gateway. Please make sure the backend server is running.');
      }

      const rzpOrder = await res.json();

      // 4. Open Razorpay Standard Checkout SDK Modal
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        throw new Error('Razorpay Key ID is not configured in environment variables.');
      }

      const options = {
        key: razorpayKeyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'RockyShoes',
        description: 'Rocky Premium Footwear Purchase',
        order_id: rzpOrder.id,
        handler: async (response) => {
          // runs on successful signature validation authorization
          try {
            setProcessing(true);
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: paymentHeaders,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                db_order_id: dbOrderId
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              clearCart();
              navigate(`/order-success?orderId=${dbOrderId}`);
            } else {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (verifyError) {
            console.error('Verification error:', verifyError);
            setErrorMessage(verifyError.message || 'Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: fullName,
          email: email,
          contact: phone
        },
        theme: {
          color: '#e11d48' // Red primary brand color theme
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Checkout error details:', err);
      setErrorMessage(err.message || 'An error occurred during payment processing. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="checkout-page animate-fade">
      <div className="container checkout-container">
        {/* Back Link */}
        <Link to="/shop" className="btn-back-link">
          <ChevronLeft size={16} /> Back to Catalog
        </Link>

        {errorMessage && (
          <div className="checkout-error-banner animate-fade">{errorMessage}</div>
        )}

        <div className="checkout-grid">
          {/* Left Column: Shipping Form */}
          <div className="checkout-form-pane">
            <h2 className="pane-title"><Truck size={20} /> Shipping Details</h2>
            <hr className="pane-divider" />
            
            <form onSubmit={handleCheckoutSubmit} className="checkout-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address</label>
                <textarea
                  required
                  placeholder="Complete shipping address details..."
                  rows="4"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-control checkout-text-area"
                />
              </div>

              <div className="checkout-buttons-row">
                <button
                  type="button"
                  onClick={(e) => handleCheckoutSubmit(e, false)}
                  disabled={processing}
                  className="btn btn-primary btn-pay-submit"
                  style={{ flex: 1 }}
                >
                  <CreditCard size={18} /> {processing ? 'Processing...' : `Pay via Gateway`}
                </button>
                
                <button
                  type="button"
                  onClick={(e) => handleCheckoutSubmit(e, true)}
                  disabled={processing}
                  className="btn btn-secondary btn-simulate-submit"
                  style={{ flex: 1 }}
                >
                  <Check size={18} /> Simulate Success
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Cart Breakdown */}
          <div className="checkout-summary-pane">
            <h2 className="pane-title"><ShoppingBag size={20} /> Summary</h2>
            <hr className="pane-divider" />
            
            <div className="checkout-items-summary">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="checkout-summary-item">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="summary-item-thumb"
                  />
                  <div className="summary-item-desc">
                    <p className="summary-item-name">{item.product.name}</p>
                    <p className="summary-item-meta">Size: UK {item.size} | Qty: {item.quantity}</p>
                  </div>
                  <span className="summary-item-price">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <hr className="summary-dotted-divider" />

            <div className="checkout-calculations">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="calc-row">
                <span>Shipping</span>
                <span className="shipping-free">FREE</span>
              </div>
              <hr className="pane-divider" />
              <div className="calc-row final-row">
                <span>Total Payment</span>
                <span className="final-price-tag">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Checkout Page */}
      <style dangerouslySetInnerHTML={{ __html: `
        .checkout-container {
          padding-top: 2rem;
          padding-bottom: 5rem;
        }

        .btn-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 2rem;
        }

        .btn-back-link:hover {
          color: var(--primary);
        }

        .checkout-error-banner {
          background-color: hsl(0, 84%, 97%);
          color: var(--error);
          border: 1px solid hsl(0, 84%, 90%);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 2rem;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        @media (max-width: 992px) {
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .checkout-form-pane, .checkout-summary-pane {
          background-color: var(--white);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: var(--shadow-sm);
        }

        .pane-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .pane-divider {
          border: 0;
          border-top: 1px solid var(--border-light);
          margin: 1.25rem 0;
        }

        .form-group-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 576px) {
          .form-group-row {
            grid-template-columns: 1fr;
          }
        }

        .checkout-text-area {
          resize: none;
        }

        .btn-pay-submit {
          padding: 1.1rem !important;
          border-radius: 12px;
          font-size: 1.05rem;
          font-weight: 700;
          margin-top: 1rem;
        }

        /* Summary Panel Details */
        .checkout-items-summary {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .checkout-summary-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .summary-item-thumb {
          width: 60px;
          height: 60px;
          object-fit: contain;
          border-radius: 10px;
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          padding: 0.25rem;
        }

        .summary-item-desc {
          flex-grow: 1;
        }

        .summary-item-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .summary-item-meta {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .summary-item-price {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .summary-dotted-divider {
          border: 0;
          border-top: 1px dashed var(--border-light);
          margin: 1.5rem 0;
        }

        .checkout-calculations {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .calc-row.final-row {
          color: var(--text-main);
          font-weight: 800;
        }

        .final-price-tag {
          font-size: 1.35rem;
          color: var(--primary);
          font-weight: 800;
        }

        .checkout-buttons-row {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-simulate-submit {
          padding: 1.1rem !important;
          border-radius: 12px;
          font-size: 1.05rem;
          font-weight: 700;
          background-color: var(--text-main);
          color: var(--white);
          border: 1px solid var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-simulate-submit:hover {
          background-color: var(--primary);
          border-color: var(--primary);
        }
      `}} />
    </div>
  );
}
