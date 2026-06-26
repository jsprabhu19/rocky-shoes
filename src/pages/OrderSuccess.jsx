import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function OrderSuccess() {
  const location = useLocation();
  const [orderId, setOrderId] = useState('');
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useDocumentTitle('Order Confirmed');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('orderId');
    if (idParam) {
      setOrderId(idParam);
      
      // Fetch order details
      const fetchOrderDetails = async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                *,
                products (name, price)
              )
            `)
            .eq('id', idParam)
            .single();

          if (error) throw error;
          setOrderDetail(data);
        } catch (err) {
          console.error('Error fetching success order details:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [location.search]);

  return (
    <div className="order-success-page animate-fade">
      <div className="container success-container">
        <div className="success-card">
          {/* Animated Success Checkmark */}
          <div className="success-icon-wrapper">
            <CheckCircle2 size={64} className="success-icon" />
          </div>

          <h1 className="success-title">Order Confirmed!</h1>
          <p className="success-message">
            Thank you for your purchase! Your payment was verified successfully and your package is being prepared for shipment.
          </p>

          {orderId && (
            <div className="order-number-box">
              <span className="order-lbl">Order Number</span>
              <span className="order-id-val">{orderId.toUpperCase()}</span>
            </div>
          )}

          {loading ? (
            <div className="spinner-success">
              <div className="spinner"></div>
            </div>
          ) : orderDetail ? (
            <div className="success-summary-box">
              <h3 className="summary-box-title">Order Details</h3>
              <hr className="success-divider" />
              
              <div className="success-summary-items">
                {orderDetail.order_items?.map((item) => (
                  <div key={item.id} className="success-summary-item-row flex-between">
                    <span>{item.products?.name} (Qty: {item.quantity})</span>
                    <span className="success-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <hr className="success-divider dashed" />

              <div className="success-summary-totals flex-between">
                <span>Total Amount Paid</span>
                <span className="success-final-price">₹{orderDetail.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : null}

          <div className="success-actions-row">
            <Link to="/shop" className="btn btn-primary">
              Continue Shopping <ShoppingBag size={16} />
            </Link>
            <Link to="/profile" className="btn btn-secondary">
              Go to Account Dashboard <User size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Order Success Page */}
      <style dangerouslySetInnerHTML={{ __html: `
        .success-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          min-height: 75vh;
        }

        .success-card {
          background-color: var(--white);
          border: 1px solid var(--border-light);
          border-radius: 28px;
          padding: 3.5rem;
          max-width: 580px;
          width: 100%;
          text-align: center;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        @media (max-width: 576px) {
          .success-card {
            padding: 2rem;
          }
        }

        .success-icon-wrapper {
          color: var(--success);
          background-color: hsl(142, 70%, 95%);
          width: 96px;
          height: 96px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes scaleBounce {
          0% { transform: scale(0.3); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .success-icon {
          animation: rotateCheck 0.4s ease forwards;
          animation-delay: 0.2s;
        }

        @keyframes rotateCheck {
          from { transform: rotate(-20deg); }
          to { transform: rotate(0); }
        }

        .success-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .success-message {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-muted);
          max-width: 440px;
        }

        .order-number-box {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 0.8rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          width: 100%;
        }

        .order-lbl {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .order-id-val {
          font-size: 1rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.02em;
        }

        .spinner-success {
          display: flex;
          justify-content: center;
          padding: 2rem 0;
        }

        /* Summary details */
        .success-summary-box {
          border: 1px solid var(--border-light);
          border-radius: 16px;
          padding: 1.5rem;
          width: 100%;
          text-align: left;
          background-color: var(--bg-subtle);
        }

        .summary-box-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .success-divider {
          border: 0;
          border-top: 1px solid var(--border-light);
          margin: 0.75rem 0;
        }

        .success-divider.dashed {
          border-top-style: dashed;
        }

        .success-summary-items {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .success-item-price {
          color: var(--text-main);
          font-weight: 600;
        }

        .success-summary-totals {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .success-final-price {
          color: var(--primary);
          font-size: 1.15rem;
          font-weight: 800;
        }

        /* Actions row */
        .success-actions-row {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }

        .success-actions-row .btn {
          border-radius: 12px;
          padding: 0.9rem !important;
          font-size: 0.95rem;
        }
      `}} />
    </div>
  );
}
