import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Mail, Shield, RotateCcw, Truck, MessageSquare, Plus, Clock, HelpCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { apiUrl } from '../apiConfig';

export default function SupportModal({ tab, onClose }) {
  if (!tab) return null;

  const { user } = useAuth();

  // Ticketing and Support States
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [formCategory, setFormCategory] = useState('inquiry');
  const [formOrderId, setFormOrderId] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const tabs = [
    { id: 'about', label: 'About Us' },
    { id: 'faqs', label: 'Store FAQs' },
    { id: 'shipping', label: 'Shipping & Delivery' },
    { id: 'returns', label: 'Returns & Exchange' },
    { id: 'help_desk', label: 'Help Desk' },
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' },
  ];

  // Fetch tickets and orders when help desk tab is loaded
  useEffect(() => {
    if (tab === 'help_desk' && user) {
      loadHelpDeskData();
    }
  }, [tab, user]);

  const loadHelpDeskData = async () => {
    setTicketsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // 1. Fetch tickets from backend API
      const ticketsRes = await fetch(apiUrl('/api/support/tickets'), { headers });
      if (ticketsRes.ok) {
        const ticketData = await ticketsRes.json();
        setTickets(ticketData || []);
      }

      // 2. Fetch orders from Supabase directly
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setOrders(orderData || []);
    } catch (err) {
      console.error('Error loading help desk data:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!formSubject.trim() || !formMessage.trim()) return;

    setTicketSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(apiUrl('/api/support/tickets'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: formOrderId || null,
          category: formCategory,
          subject: formSubject.trim(),
          message: formMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ticket.');
      }

      // Prepend to tickets list
      setTickets(prev => [data, ...prev]);
      
      // Clear form
      setFormSubject('');
      setFormMessage('');
      setFormOrderId('');
      setFormCategory('inquiry');
      setShowNewTicketForm(false);
      alert('Support ticket submitted successfully. Our team will review it shortly.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit ticket.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <div className="support-modal-overlay animate-fade">
      <div className="support-modal-backdrop" onClick={onClose}></div>
      <div className="support-modal-card animate-slide-up">
        {/* Header */}
        <div className="support-modal-header">
          <h3>Customer Support Info</h3>
          <button onClick={onClose} className="support-close-btn" title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Inner layout: Left sidebar tabs, Right scroll content */}
        <div className="support-modal-body">
          <div className="support-tabs-sidebar">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  // Dispatch event to switch active tab
                  window.dispatchEvent(new CustomEvent('open-support-modal', { detail: t.id }));
                }}
                className={`support-tab-btn ${tab === t.id ? 'active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="support-content-area">
            {tab === 'about' && (
              <div className="support-pane animate-fade">
                <h2>About RockyShoes</h2>
                <p className="lead-text">Step Into Greatness.</p>
                <p>Founded in 2026, RockyShoes is dedicated to crafting premium, high-performance footwear for athletes, urban commuters, and trend-setters alike. We combine cutting-edge design, ergonomic support structures, and bold visual aesthetics to construct shoes that support you on every terrain.</p>
                <div className="support-stats">
                  <div className="stat-item"><h4>25k+</h4><p>Happy Customers</p></div>
                  <div className="stat-item"><h4>27+</h4><p>Premium Models</p></div>
                  <div className="stat-item"><h4>100%</h4><p>Quality Guarantee</p></div>
                </div>
              </div>
            )}

            {tab === 'faqs' && (
              <div className="support-pane animate-fade">
                <h2>Store FAQs</h2>
                <div className="faq-list">
                  <div className="faq-item">
                    <h4>How do I know my correct shoe size?</h4>
                    <p>We use standard UK/Indian sizing. You can refer to our size selector on any product page. If in doubt, we recommend choosing your standard athletic sneaker size.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Are your payment checkouts secure?</h4>
                    <p>Yes. All payment operations on RockyShoes are handled securely by Razorpay standard gateway checkouts. We never store your card details on our servers.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Do I need an account to place orders?</h4>
                    <p>No, we fully support **Guest Checkout**. Simply enter your email and delivery details during checkout to place orders without registration.</p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'shipping' && (
              <div className="support-pane animate-fade">
                <h2>Shipping & Delivery</h2>
                <div className="policy-block">
                  <Truck size={32} className="policy-icon" />
                  <div>
                    <h4>Delivery Timelines</h4>
                    <p>All items are shipped from our Bangalore fulfillment hub. Standard transit times are:</p>
                    <ul>
                      <li>Metro Cities: 2 - 4 business days</li>
                      <li>Other Locations: 4 - 7 business days</li>
                    </ul>
                  </div>
                </div>
                <p>We provide completely **FREE shipping** on all orders above ₹999. For smaller orders, a flat delivery fee of ₹99 is applied at checkout.</p>
              </div>
            )}

            {tab === 'returns' && (
              <div className="support-pane animate-fade">
                <h2>Returns & Exchange</h2>
                <div className="policy-block">
                  <RotateCcw size={32} className="policy-icon" />
                  <div>
                    <h4>30-Day Replacements</h4>
                    <p>If your shoe does not fit perfectly, we offer a **30-day hassle-free replacement warranty**! You can request a size exchange or store refund within 30 days of delivery, provided the item is unused and in original tags.</p>
                  </div>
                </div>
                <p>To initiate a return or swap request, please get in touch with our operations support at `returns@rockyshoes.com` with your Order ID.</p>
              </div>
            )}

            {tab === 'help_desk' && (
              <div className="support-pane help-desk-pane animate-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Help Desk & Ticket Center</h2>
                  {user && (
                    <button
                      onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 0 }}
                    >
                      {showNewTicketForm ? (
                        <>Cancel</>
                      ) : (
                        <><Plus size={14} /> New Ticket</>
                      )}
                    </button>
                  )}
                </div>

                {!user ? (
                  <div className="help-desk-unauth" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    <HelpCircle size={48} style={{ color: 'var(--border-light)', marginBottom: '1rem' }} />
                    <h3>Authentication Required</h3>
                    <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0' }}>Please log in to your Rocky account to file returns, request refunds, or submit support tickets.</p>
                    <a href="/profile" onClick={onClose} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>Go To Sign In</a>
                  </div>
                ) : showNewTicketForm ? (
                  /* Create Ticket Form */
                  <form onSubmit={handleTicketSubmit} className="ticket-form animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Category</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="form-control"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                        >
                          <option value="inquiry">General Inquiry</option>
                          <option value="return">Request Return</option>
                          <option value="refund">Refund Status</option>
                          <option value="delivery">Delivery Help</option>
                          <option value="payment">Payment Issue</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Link Order (Optional)</label>
                        <select
                          value={formOrderId}
                          onChange={(e) => setFormOrderId(e.target.value)}
                          className="form-control"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                        >
                          <option value="">-- No Order Selected --</option>
                          {orders.map(o => (
                            <option key={o.id} value={o.id}>
                              #{o.id.slice(0, 8).toUpperCase()} (₹{parseFloat(o.total_amount).toLocaleString('en-IN')} - {o.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Subject / Topic</label>
                      <input
                        type="text"
                        placeholder="e.g. Size swap query, Delivery delay"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        className="form-control"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>How can we help you?</label>
                      <textarea
                        placeholder="Describe your issue or return details in full..."
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        className="form-control"
                        rows="4"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)', resize: 'vertical' }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={ticketSubmitting}
                      className="btn btn-primary"
                      style={{ padding: '0.6rem', borderRadius: '8px', fontSize: '0.9rem', width: '100%', marginTop: '0.5rem' }}
                    >
                      {ticketSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
                    </button>
                  </form>
                ) : (
                  /* Tickets List */
                  <div className="tickets-list-wrapper" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                    {ticketsLoading ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: 'auto' }}></div></div>
                    ) : tickets.length === 0 ? (
                      <div className="tickets-empty" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        <MessageSquare size={32} style={{ color: 'var(--border-light)', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '0.85rem' }}>No support tickets filed yet. Need help with an order or return? Click "New Ticket" to begin.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tickets.map(t => (
                          <div key={t.id} style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem', backgroundColor: 'var(--bg-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--border-light)', marginRight: '0.5rem' }}>
                                  {t.category}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {new Date(t.created_at).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                              <span
                                className={`status-badge ${t.status}`}
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: '800',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '20px',
                                  textTransform: 'uppercase',
                                  backgroundColor: t.status === 'open' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                  color: t.status === 'open' ? '#f59e0b' : '#10b981'
                                }}
                              >
                                {t.status}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t.subject}</h4>
                            {t.order_id && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem' }}>
                                Linked Order: #{t.order_id.slice(0, 8).toUpperCase()}
                              </p>
                            )}
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t.message}</p>
                            
                            {t.resolution_notes && (
                              <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderLeft: '3px solid var(--primary)', backgroundColor: 'var(--white)', borderRadius: '0 8px 8px 0' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle size={12} style={{ color: 'var(--success)' }} /> Staff Response
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{t.resolution_notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === 'terms' && (

              <div className="support-pane animate-fade">
                <h2>Terms of Service</h2>
                <p>Welcome to RockyShoes. By using this e-commerce application, you agree to comply with our Terms of Service. All designs, catalog descriptions, and image assets are trademarked properties of RockyShoes. Any unauthorized commercial reuse is strictly prohibited.</p>
                <p>We reserve the right to edit prices, adjust inventory stock levels, and decline purchases if fraudulent credit metrics or payment signature violations are detected during checkout validation.</p>
              </div>
            )}

            {tab === 'privacy' && (
              <div className="support-pane animate-fade">
                <h2>Privacy Policy</h2>
                <div className="policy-block">
                  <Shield size={32} className="policy-icon" />
                  <div>
                    <h4>Secure Customer Data Handling</h4>
                    <p>Your privacy is important to us. We store your account name, email, phone, and delivery address securely in encrypted Supabase database nodes. We never sell your personal information or contact details to third-party marketing companies.</p>
                  </div>
                </div>
                <p>If you wish to request GDPR data exports or delete your profile credentials from our systems, please write to us at `privacy@rockyshoes.com`.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded CSS for support modals */}
      <style dangerouslySetInnerHTML={{ __html: `
        .support-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .support-modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .support-modal-card {
          position: relative;
          background-color: var(--white);
          width: 100%;
          max-width: 800px;
          height: 520px;
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          z-index: 3001;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .support-modal-card {
            height: 90vh;
            flex-direction: column;
          }
        }

        .support-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
        }

        .support-modal-header h3 {
          font-weight: 800;
          font-size: 1.15rem;
        }

        .support-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }

        .support-close-btn:hover {
          background-color: var(--bg-subtle);
          color: var(--primary);
        }

        .support-modal-body {
          display: grid;
          grid-template-columns: 220px 1fr;
          height: calc(100% - 58px);
        }

        @media (max-width: 768px) {
          .support-modal-body {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }
        }

        .support-tabs-sidebar {
          background-color: var(--bg-subtle);
          border-right: 1px solid var(--border-light);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .support-tabs-sidebar {
            flex-direction: row;
            overflow-x: auto;
            border-right: 0;
            border-bottom: 1px solid var(--border-light);
            padding: 0.75rem;
          }
        }

        .support-tab-btn {
          width: 100%;
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          font-weight: 700;
          border-radius: 8px;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }

        @media (max-width: 768px) {
          .support-tab-btn {
            width: auto;
            white-space: nowrap;
            padding: 0.5rem 0.8rem;
          }
        }

        .support-tab-btn:hover {
          color: var(--primary);
          background-color: rgba(225, 29, 72, 0.03);
        }

        .support-tab-btn.active {
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .support-content-area {
          padding: 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .support-pane {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .support-pane h2 {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-main);
        }

        .lead-text {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--primary);
        }

        .support-pane p {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .support-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .stat-item {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          padding: 1rem;
          border-radius: 12px;
          text-align: center;
        }

        .stat-item h4 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--primary);
        }

        .stat-item p {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
          font-weight: 600;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .faq-item h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        .policy-block {
          display: flex;
          gap: 1rem;
          background-color: var(--primary-light);
          border: 1px solid rgba(225, 29, 72, 0.1);
          padding: 1.25rem;
          border-radius: 16px;
        }

        .policy-icon {
          color: var(--primary);
          flex-shrink: 0;
        }

        .policy-block h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        .policy-block p {
          font-size: 0.85rem;
          margin: 0;
        }

        .support-pane ul {
          padding-left: 1.25rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.4rem;
        }
      `}} />
    </div>
  );
}
