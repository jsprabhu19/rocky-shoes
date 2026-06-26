import React, { useState } from 'react';
import { Send, MapPin, Phone, Mail } from 'lucide-react';
import { apiUrl } from '../apiConfig';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) return;

    try {
      const res = await fetch(apiUrl('/api/newsletter/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe.');
      }

      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Subscription failed.');
    }
  };

  const openSupport = (tabName, e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-support-modal', { detail: tabName }));
  };

  return (
    <footer className="footer-section">
      <div className="container footer-grid">
        {/* Info Column */}
        <div className="footer-col brand-col">
          <h3 className="footer-logo">
            <span className="logo-icon">R</span>
            Rocky<span className="text-red">Shoes</span>
          </h3>
          <p className="footer-about">
            Crafting premium, high-performance footwear for athletes, explorers, and street style enthusiasts. Walk with confidence.
          </p>
          <div className="contact-details">
            <p><MapPin size={16} /> 101 Rocky Rd, Bangalore, India</p>
            <p><Phone size={16} /> +91 80 555 0199</p>
            <p><Mail size={16} /> support@rockyshoes.com</p>
          </div>
        </div>

        {/* Link Columns */}
        <div className="footer-col">
          <h4 className="footer-title">Categories</h4>
          <ul className="footer-links">
            <li><a href="/shop?category=sneakers">Sneakers</a></li>
            <li><a href="/shop?category=running_shoes">Running Shoes</a></li>
            <li><a href="/shop?category=boots">Boots</a></li>
            <li><a href="/shop">Shop All Footwear</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Support</h4>
          <ul className="footer-links">
            <li><a href="#shipping" onClick={(e) => openSupport('shipping', e)}>Shipping & Delivery</a></li>
            <li><a href="#returns" onClick={(e) => openSupport('returns', e)}>Returns & Exchange</a></li>
            <li><a href="#faqs" onClick={(e) => openSupport('faqs', e)}>Store FAQs</a></li>
            <li><a href="#contact" onClick={(e) => openSupport('about', e)}>Contact Support</a></li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="footer-col newsletter-col">
          <h4 className="footer-title">Stay Updated</h4>
          <p className="footer-newsletter-text">
            Subscribe to receive updates, access to exclusive deals, and early product releases.
          </p>
          <form onSubmit={handleSubscribe} className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="newsletter-input"
            />
            <button type="submit" className="newsletter-btn" title="Subscribe">
              <Send size={16} />
            </button>
          </form>
          {subscribed && (
            <p className="subscribe-success animate-fade">Thank you for subscribing!</p>
          )}
          {errorMsg && (
            <p className="subscribe-error animate-fade" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '500', marginTop: '0.5rem' }}>{errorMsg}</p>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="copyright-text">&copy; {new Date().getFullYear()} RockyShoes. All rights reserved.</p>
          <div className="footer-legal-links">
            <a href="#privacy" onClick={(e) => openSupport('privacy', e)}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => openSupport('terms', e)}>Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Footer Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .footer-section {
          background-color: var(--text-main);
          color: var(--white);
          padding: 5rem 0 2rem 0;
          border-top: 1px solid var(--border-dark);
          position: relative;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 2fr;
          gap: 4rem;
          margin-bottom: 4rem;
        }

        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
          }
        }

        @media (max-width: 576px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.03em;
        }

        .footer-logo .text-red {
          color: var(--primary);
        }

        .footer-about {
          color: var(--border-light);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-size: 0.9rem;
          color: var(--border-light);
        }

        .contact-details p {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-title {
          font-size: 1.05rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          position: relative;
          padding-bottom: 0.5rem;
        }

        .footer-title::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 30px;
          height: 2px;
          background-color: var(--primary);
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .footer-links a {
          color: var(--border-light);
        }

        .footer-links a:hover {
          color: var(--primary);
          padding-left: 4px;
        }

        .footer-newsletter-text {
          color: var(--border-light);
          font-size: 0.95rem;
        }

        .newsletter-form {
          display: flex;
          position: relative;
        }

        .newsletter-input {
          width: 100%;
          padding: 0.8rem 3rem 0.8rem 1.2rem;
          border-radius: 50px;
          border: 1px solid var(--border-dark);
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--white);
          font-size: 0.9rem;
          transition: var(--transition-smooth);
        }

        .newsletter-input:focus {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: var(--primary);
        }

        .newsletter-btn {
          position: absolute;
          right: 4px;
          top: 4px;
          bottom: 4px;
          width: 40px;
          border-radius: 50%;
          background-color: var(--primary);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .newsletter-btn:hover {
          background-color: var(--primary-hover);
        }

        .subscribe-success {
          font-size: 0.85rem;
          color: var(--success);
          font-weight: 500;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-top: 4rem;
          padding-top: 2rem;
        }

        .footer-bottom-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: var(--border-light);
        }

        @media (max-width: 576px) {
          .footer-bottom-inner {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }

        .footer-legal-links {
          display: flex;
          gap: 1.5rem;
        }

        .footer-legal-links a:hover {
          color: var(--primary);
        }
      `}} />
    </footer>
  );
}
