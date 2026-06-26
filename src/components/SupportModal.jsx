import React from 'react';
import { X, MapPin, Phone, Mail, Shield, RotateCcw, Truck } from 'lucide-react';

export default function SupportModal({ tab, onClose }) {
  if (!tab) return null;

  const tabs = [
    { id: 'about', label: 'About Us' },
    { id: 'faqs', label: 'Store FAQs' },
    { id: 'shipping', label: 'Shipping & Delivery' },
    { id: 'returns', label: 'Returns & Exchange' },
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' },
  ];

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
