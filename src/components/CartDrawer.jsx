import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    toggleCart,
    updateCartQuantity,
    removeFromCart,
    totalPrice,
    totalQuantity
  } = useCart();
  
  const drawerRef = useRef();

  // Prevent scroll on body when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    toggleCart(false);
    navigate('/checkout');
  };

  return (
    <div className="cart-drawer-overlay animate-fade">
      <div className="cart-drawer-backdrop" onClick={() => toggleCart(false)}></div>
      
      <div ref={drawerRef} className="cart-drawer-panel">
        {/* Drawer Header */}
        <div className="drawer-header-pane">
          <h3 className="drawer-title-heading">
            <ShoppingBag size={20} /> Your Cart <span className="drawer-count-lbl">({totalQuantity})</span>
          </h3>
          <button onClick={() => toggleCart(false)} className="drawer-close-btn" title="Close Cart">
            <X size={22} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-items-list">
          {cart.length === 0 ? (
            <div className="drawer-empty-state">
              <div className="empty-cart-circle">
                <ShoppingBag size={36} className="empty-cart-icon" />
              </div>
              <h4>Your cart is empty</h4>
              <p>Looks like you haven't added anything to your cart yet.</p>
              <button
                onClick={() => {
                  toggleCart(false);
                  navigate('/shop');
                }}
                className="btn btn-primary"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.product.id}-${item.size}`} className="drawer-cart-item">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="drawer-item-img"
                />
                
                <div className="drawer-item-details">
                  <h4 className="drawer-item-name">{item.product.name}</h4>
                  <p className="drawer-item-meta">Size: <span className="meta-value">UK {item.size}</span></p>
                  <p className="drawer-item-price">₹{item.product.price.toLocaleString('en-IN')}</p>
                  
                  {/* Quantity Controls */}
                  <div className="drawer-qty-controls">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.size, item.quantity - 1)}
                      className="qty-btn"
                      title="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.size, item.quantity + 1)}
                      className="qty-btn"
                      title="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id, item.size)}
                  className="drawer-item-remove-btn"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer (Calculations & Checkout) */}
        {cart.length > 0 && (
          <div className="drawer-footer-pane animate-slide-up">
            <div className="drawer-summary-row">
              <span className="summary-lbl">Subtotal</span>
              <span className="summary-val">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="drawer-summary-row shipping-row">
              <span className="summary-lbl">Shipping</span>
              <span className="summary-val shipping-free">FREE</span>
            </div>
            
            <hr className="drawer-footer-divider" />
            
            <div className="drawer-summary-row total-row">
              <span className="summary-lbl">Total</span>
              <span className="summary-val">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>

            <button onClick={handleCheckoutClick} className="btn btn-primary btn-block btn-checkout-drawer">
              Proceed To Checkout <ArrowRight size={18} />
            </button>

            <button onClick={() => toggleCart(false)} className="btn-continue-shopping-drawer">
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      {/* Embedded CSS for Cart Drawer Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .cart-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2000;
          display: flex;
          justify-content: flex-end;
        }

        .cart-drawer-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .cart-drawer-panel {
          position: relative;
          width: 100%;
          max-width: 440px;
          height: 100%;
          background-color: var(--white);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          z-index: 2001;
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .drawer-header-pane {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-light);
        }

        .drawer-title-heading {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .drawer-count-lbl {
          color: var(--primary);
          font-size: 1.1rem;
        }

        .drawer-close-btn {
          color: var(--text-main);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: var(--transition-fast);
        }

        .drawer-close-btn:hover {
          background-color: var(--bg-subtle);
          color: var(--primary);
        }

        .drawer-items-list {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .drawer-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          gap: 1rem;
          color: var(--text-muted);
        }

        .empty-cart-circle {
          background-color: var(--primary-light);
          color: var(--primary);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drawer-empty-state h4 {
          color: var(--text-main);
          font-size: 1.25rem;
          font-weight: 700;
        }

        .drawer-empty-state p {
          font-size: 0.9rem;
          max-width: 250px;
          margin-bottom: 1rem;
        }

        /* Cart Item Card */
        .drawer-cart-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-light);
        }

        .drawer-item-img {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 12px;
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          padding: 0.5rem;
        }

        .drawer-item-details {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .drawer-item-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .drawer-item-meta {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .meta-value {
          font-weight: 600;
          color: var(--text-main);
        }

        .drawer-item-price {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--primary);
        }

        .drawer-qty-controls {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--border-light);
          border-radius: 6px;
          margin-top: 0.4rem;
          max-width: 90px;
        }

        .qty-btn {
          width: 28px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }

        .qty-btn:hover {
          color: var(--primary);
          background-color: var(--bg-subtle);
        }

        .qty-value {
          font-size: 0.85rem;
          font-weight: 600;
          width: 32px;
          text-align: center;
        }

        .drawer-item-remove-btn {
          color: var(--text-muted);
          transition: var(--transition-fast);
          padding: 0.5rem;
        }

        .drawer-item-remove-btn:hover {
          color: var(--error);
        }

        /* Footer calculations */
        .drawer-footer-pane {
          background-color: var(--bg-subtle);
          padding: 1.5rem;
          border-top: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .drawer-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .shipping-free {
          color: var(--success);
          font-weight: 700;
        }

        .drawer-footer-divider {
          border: 0;
          border-top: 1px dashed var(--border-light);
        }

        .total-row {
          font-size: 1.15rem;
          font-weight: 800;
        }

        .btn-checkout-drawer {
          padding: 1rem !important;
          border-radius: 12px;
        }

        .btn-continue-shopping-drawer {
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
        }

        .btn-continue-shopping-drawer:hover {
          color: var(--primary);
        }
      `}} />
    </div>
  );
}
