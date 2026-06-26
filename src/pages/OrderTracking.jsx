import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Truck, CheckCircle2, Circle, Clock, Mail, ChevronRight, MapPin, Calendar, HelpCircle } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function OrderTracking() {
  const { orderId } = useParams();
  const { user } = useAuth();
  useDocumentTitle('Order Tracking');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Guest verification email input state
  const [emailInput, setEmailInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(() => {
    return localStorage.getItem(`rockyshoes_track_email_${orderId}`) || '';
  });

  const fetchOrderDetails = async (emailToVerify) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const emailParam = emailToVerify ? `?email=${encodeURIComponent(emailToVerify)}` : '';
      const res = await fetch(`/api/orders/${orderId}${emailParam}`, { headers });
      
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setErrorMsg('verification_required');
        } else {
          setErrorMsg(data.error || 'Failed to retrieve tracking details.');
        }
        return;
      }

      setOrder(data);
      if (emailToVerify) {
        setVerifiedEmail(emailToVerify);
        localStorage.setItem(`rockyshoes_track_email_${orderId}`, emailToVerify);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not establish connection to the server.');
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    // If orderId is present, try loading details
    // If logged in, the token will authorize. If guest, we try the cached email first.
    if (orderId) {
      fetchOrderDetails(verifiedEmail);
    }
  }, [orderId, user]);

  const handleVerifyEmailSubmit = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsVerifying(true);
    fetchOrderDetails(emailInput.trim());
  };

  // Determine active steps on the timeline
  const getTimelineSteps = (status) => {
    const allSteps = [
      { key: 'pending', label: 'Ordered', desc: 'Order details registered' },
      { key: 'paid', label: 'Paid', desc: 'Payment verified successfully' },
      { key: 'shipped', label: 'Shipped', desc: 'In transit with carrier' },
      { key: 'delivered', label: 'Delivered', desc: 'Arrived at destination' }
    ];

    let activeIndex = 0; // 'pending'
    if (status === 'paid') activeIndex = 1;
    if (status === 'shipped') activeIndex = 2;
    if (status === 'delivered') activeIndex = 3;
    if (status === 'returned' || status === 'cancelled') activeIndex = -1; // special handling

    return allSteps.map((step, idx) => {
      let state = 'upcoming'; // upcoming
      if (activeIndex === -1) {
        state = 'failed';
      } else if (idx < activeIndex) {
        state = 'completed';
      } else if (idx === activeIndex) {
        state = 'active';
      }
      return { ...step, state };
    });
  };

  if (loading && !isVerifying) {
    return (
      <div className="tracking-loading container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Guest Verification View
  if (errorMsg === 'verification_required') {
    return (
      <div className="guest-verify-wrapper container animate-fade">
        <div className="verify-card">
          <Mail size={40} className="verify-icon" />
          <h2>Order Verification Required</h2>
          <p>Since you are checking out as a guest, please enter the email address used during purchase to verify ownership.</p>
          
          <form onSubmit={handleVerifyEmailSubmit} className="verify-form">
            <input 
              type="email" 
              placeholder="Enter email address" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="form-control"
              required
            />
            <button type="submit" disabled={isVerifying} className="btn btn-primary verify-btn">
              {isVerifying ? 'Verifying...' : 'Verify & Track'}
            </button>
          </form>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .guest-verify-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 70vh;
            padding-top: 6.5rem;
          }
          .verify-card {
            background-color: var(--white);
            border: 1px solid var(--border-light);
            padding: 2.5rem;
            border-radius: 24px;
            max-width: 450px;
            width: 100%;
            text-align: center;
            box-shadow: var(--shadow-md);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .verify-icon { color: var(--primary); }
          .verify-card h2 { font-size: 1.4rem; font-weight: 800; color: var(--text-main); }
          .verify-card p { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }
          .verify-form { width: 100%; display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
          .verify-btn { padding: 0.8rem; border-radius: 50px; font-weight: 600; }
        `}} />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="tracking-error container animate-fade">
        <h2>Tracking Details Not Found</h2>
        <p>{errorMsg || 'Please double-check the tracking ID in your order details page.'}</p>
        <Link to="/shop" className="btn btn-primary">Go To Shop</Link>
        <style dangerouslySetInnerHTML={{ __html: `
          .tracking-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
            gap: 1.25rem;
            color: var(--text-muted);
            padding-top: 6.5rem;
          }
          .tracking-error h2 { color: var(--primary); font-size: 1.8rem; font-weight: 800; }
        `}} />
      </div>
    );
  }

  const steps = getTimelineSteps(order.status);

  return (
    <div className="order-tracking-page container animate-fade">
      <div className="tracking-header">
        <h1>Track Your Shipment</h1>
        <p className="order-id">Order ID: <strong>#{order.id.toUpperCase()}</strong></p>
      </div>

      <div className="tracking-layout-grid">
        {/* Timeline Column */}
        <div className="timeline-card">
          {/* Status Banner */}
          {order.status === 'returned' && (
            <div className="banner returned animate-fade">
              <h3>Returned</h3>
              <p>This order has been returned and refunded.</p>
            </div>
          )}
          {order.status === 'cancelled' && (
            <div className="banner cancelled animate-fade">
              <h3>Cancelled</h3>
              <p>This order was cancelled by the user or store administrator.</p>
            </div>
          )}

          <div className="timeline-steps">
            {steps.map((step, idx) => (
              <div key={step.key} className={`timeline-step-row ${step.state}`}>
                {/* Connector Line */}
                {idx < steps.length - 1 && <div className="connector-line"></div>}

                {/* Circle Icon */}
                <div className="step-icon-col">
                  {step.state === 'completed' && <CheckCircle2 size={24} className="icon completed" />}
                  {step.state === 'active' && <div className="icon active-dot"><div className="inner-dot"></div></div>}
                  {step.state === 'upcoming' && <Circle size={22} className="icon upcoming" />}
                  {step.state === 'failed' && <Circle size={22} className="icon failed" />}
                </div>

                {/* Text Content */}
                <div className="step-text-col">
                  <h4>{step.label}</h4>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Column */}
        <div className="tracking-info-sidebar">
          {/* Shipping details */}
          {order.status === 'shipped' && order.tracking_number && (
            <div className="info-card shipping-card animate-slide-up">
              <h3><Truck size={18} /> Shipping Progress</h3>
              <hr className="divider" />
              <div className="shipping-field">
                <span className="field-label">Carrier</span>
                <span className="field-val"><strong>{order.carrier}</strong></span>
              </div>
              <div className="shipping-field">
                <span className="field-label">Tracking ID</span>
                <span className="field-val code">{order.tracking_number}</span>
              </div>
              <div className="shipping-field">
                <span className="field-label">Estimated Delivery</span>
                <span className="field-val date"><Calendar size={14} /> {new Date(order.estimated_delivery).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div className="info-card address-card">
            <h3><MapPin size={18} /> Delivery Details</h3>
            <hr className="divider" />
            <p className="recipient-name"><strong>Recipient:</strong> {order.full_name}</p>
            <p className="address-text">{order.shipping_address}</p>
          </div>

          {/* Customer support help */}
          <div className="info-card help-card">
            <h3><HelpCircle size={18} /> Need Help?</h3>
            <hr className="divider" />
            <p>If you have any questions regarding your tracking timeline, sizing issues, or delivery delays, contact our dispatch support desk.</p>
            <a href="mailto:support@rockyshoes.com" className="btn btn-outline support-email-btn">
              Email support@rockyshoes.com
            </a>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .order-tracking-page { padding-top: 6.5rem; padding-bottom: 5rem; }
        .tracking-header { margin-bottom: 2.5rem; }
        .tracking-header h1 { font-size: 2.2rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem; }
        .order-id { font-size: 0.95rem; color: var(--text-muted); }
        .order-id strong { color: var(--primary); }

        .tracking-layout-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 2rem; }
        @media (max-width: 992px) { .tracking-layout-grid { grid-template-columns: 1fr; } }

        .timeline-card, .info-card {
          background-color: var(--white);
          border: 1px solid var(--border-light);
          padding: 2.2rem;
          border-radius: 24px;
          box-shadow: var(--shadow-sm);
        }
        
        /* Banners */
        .banner { padding: 1rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; }
        .banner h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .banner p { font-size: 0.85rem; }
        .banner.returned { background-color: var(--bg-subtle); color: var(--text-muted); border: 1px solid var(--border-light); }
        .banner.cancelled { background-color: rgba(225, 29, 72, 0.05); color: var(--primary); border: 1px solid rgba(225, 29, 72, 0.1); }

        /* Timeline steps */
        .timeline-steps { display: flex; flex-direction: column; gap: 2.5rem; position: relative; }
        .timeline-step-row { display: flex; gap: 1.5rem; position: relative; }
        .connector-line {
          position: absolute;
          top: 24px;
          left: 11px;
          bottom: -40px;
          width: 2px;
          background-color: var(--border-light);
          z-index: 1;
        }

        .timeline-step-row.completed .connector-line { background-color: #10b981; }

        .step-icon-col { position: relative; z-index: 2; width: 24px; display: flex; justify-content: center; }
        .icon.completed { color: #10b981; fill: rgba(16, 185, 129, 0.15); background-color: var(--white); border-radius: 50%; }
        .icon.upcoming { color: var(--border-light); background-color: var(--white); }
        .icon.failed { color: var(--primary); background-color: var(--white); }
        
        .icon.active-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: rgba(225, 29, 72, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 1.8s infinite;
        }
        .inner-dot { width: 10px; height: 10px; border-radius: 50%; background-color: var(--primary); }

        .step-text-col h4 { font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem; }
        .step-text-col p { font-size: 0.85rem; color: var(--text-muted); }
        
        .timeline-step-row.upcoming .step-text-col h4 { color: var(--text-muted); }
        .timeline-step-row.active .step-text-col h4 { color: var(--primary); }

        /* Sidebar Info */
        .tracking-info-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
        .info-card h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; }
        .divider { border: 0; border-top: 1px solid var(--border-light); margin: 1rem 0; }
        
        .shipping-card { background-color: var(--bg-subtle); }
        .shipping-field { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.75rem; }
        .field-label { color: var(--text-muted); }
        .field-val { color: var(--text-main); font-weight: 600; }
        .field-val.code { font-family: monospace; font-size: 0.95rem; background-color: var(--white); padding: 0.1rem 0.5rem; border-radius: 6px; border: 1px solid var(--border-light); }
        .field-val.date { display: flex; align-items: center; gap: 0.3rem; }

        .recipient-name { font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.4rem; }
        .address-text { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

        .help-card p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1.25rem; }
        .support-email-btn { width: 100%; border-radius: 50px; font-size: 0.85rem; text-align: center; display: inline-block; padding: 0.65rem 0; }

        .tracking-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60vh;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(225, 29, 72, 0); }
          100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
        }
      `}} />
    </div>
  );
}
