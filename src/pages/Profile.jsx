import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { apiUrl } from '../apiConfig';
import { Link } from 'react-router-dom';
import { ShoppingBag, Settings, LogOut, CheckCircle, Clock, AlertTriangle, Truck } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Profile() {
  const { user, profile, signUp, signIn, signOut, resetPassword, updateProfile, loading } = useAuth();
  
  // Auth Form State
  const [authTab, setAuthTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useDocumentTitle('Customer Portal');

  // Profile Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Return Request Wizard State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState({});
  const [returnReason, setReturnReason] = useState('size_issue');
  const [returnComments, setReturnComments] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  // Sync profile details into form state
  useEffect(() => {
    if (profile) {
      setFormName(profile.full_name || '');
      setFormPhone(profile.phone || '');
      setFormAddress(profile.address || '');
    }
  }, [profile]);

  // Fetch orders when user is logged in
  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const { data, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                *,
                products (name, image_url)
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setOrders(data || []);
        } catch (err) {
          console.error('Error fetching user orders:', err);
        } finally {
          setOrdersLoading(false);
        }
      };

      fetchOrders();
    }
  }, [user]);

  // Sign In / Sign Up / Forgot Password handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authTab === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else if (authTab === 'signup') {
        if (!fullName.trim()) throw new Error('Full Name is required.');
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        alert("Account created successfully! Welcome to RockyShoes.");
      } else if (authTab === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setForgotSuccess(true);
      }
    } catch (err) {
      setAuthError(err.message || 'Action failed. Please check input details.');
    } finally {
      setAuthLoading(false);
    }
  };

  const openReturnModal = (order) => {
    setReturnOrder(order);
    const initialSelection = {};
    order.order_items?.forEach(item => {
      initialSelection[item.product_id] = true;
    });
    setSelectedReturnItems(initialSelection);
    setReturnReason('size_issue');
    setReturnComments('');
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    const itemsToReturn = returnOrder.order_items
      .filter(item => selectedReturnItems[item.product_id])
      .map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size || 'N/A'
      }));

    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return.');
      return;
    }

    setReturnSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(apiUrl('/api/orders/return-request'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: returnOrder.id,
          items: itemsToReturn,
          reason: returnReason,
          comments: returnComments
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit return request.');
      }

      setOrders(prev => prev.map(o => o.id === returnOrder.id ? { ...o, status: 'returning' } : o));
      setIsReturnModalOpen(false);
      alert('Return request submitted successfully. The admin will review and process your refund.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit return request.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileLoading(true);

    try {
      const { error } = await updateProfile({
        full_name: formName,
        phone: formPhone,
        address: formAddress,
      });

      if (error) throw error;
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile settings.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Return Loading Screen
  if (loading) {
    return (
      <div className="profile-loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  // 1. AUTHENTICATION GUEST SCREEN
  if (!user) {
    return (
      <div className="auth-container animate-fade">
        <div className="auth-card">
          {authTab !== 'forgot' && (
            <div className="auth-tabs">
              <button
                onClick={() => { setAuthTab('signin'); setAuthError(''); }}
                className={`auth-tab-btn ${authTab === 'signin' ? 'active' : ''}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                className={`auth-tab-btn ${authTab === 'signup' ? 'active' : ''}`}
              >
                Register
              </button>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="auth-form">
            <h2 className="auth-title">
              {authTab === 'signin' && 'Welcome Back To Rocky'}
              {authTab === 'signup' && 'Join RockyShoes E-Store'}
              {authTab === 'forgot' && 'Reset Your Password'}
            </h2>
            
            {authError && <div className="auth-error-banner">{authError}</div>}

            {forgotSuccess ? (
              <div className="forgot-success-pane animate-fade">
                <p>A recovery link has been sent to **{email}**. Please click the link inside the email to set your new password.</p>
                <button
                  type="button"
                  onClick={() => { setAuthTab('signin'); setForgotSuccess(false); setEmail(''); }}
                  className="btn btn-secondary btn-block"
                  style={{ marginTop: '1rem' }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {authTab === 'signup' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Srinivasa Prabhu"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="form-control"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                  />
                </div>

                {authTab !== 'forgot' && (
                  <div className="form-group">
                    <div className="flex-between">
                      <label className="form-label">Password</label>
                      {authTab === 'signin' && (
                        <button
                          type="button"
                          onClick={() => { setAuthTab('forgot'); setAuthError(''); }}
                          className="btn-forgot-pwd-link"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control"
                    />
                  </div>
                )}

                <button type="submit" disabled={authLoading} className="btn btn-primary btn-block btn-auth-submit">
                  {authLoading ? 'Verifying...' : authTab === 'signin' ? 'Sign In' : authTab === 'signup' ? 'Create Account' : 'Send Reset Link'}
                </button>

                {authTab === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signin'); setAuthError(''); }}
                    className="btn-back-signin-text"
                  >
                    Back to Sign In
                  </button>
                )}
              </>
            )}
          </form>
        </div>

        {/* Embedded CSS for Auth Form */}
        <style dangerouslySetInnerHTML={{ __html: `
          .auth-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            padding: 3rem 0;
            background-color: var(--bg-subtle);
          }

          .auth-card {
            background-color: var(--white);
            border: 1px solid var(--border-light);
            border-radius: 24px;
            width: 100%;
            max-width: 440px;
            overflow: hidden;
            box-shadow: var(--shadow-md);
          }

          .auth-tabs {
            display: flex;
            border-bottom: 1px solid var(--border-light);
            background-color: var(--bg-subtle);
          }

          .auth-tab-btn {
            flex: 1;
            padding: 1.25rem 0;
            font-size: 1rem;
            font-weight: 700;
            color: var(--text-muted);
            text-align: center;
            border-bottom: 2.5px solid transparent;
            transition: var(--transition-fast);
          }

          .auth-tab-btn:hover {
            color: var(--primary);
          }

          .auth-tab-btn.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
            background-color: var(--white);
          }

          .auth-form {
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }

          .auth-title {
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            text-align: center;
          }

          .auth-error-banner {
            background-color: hsl(0, 84%, 97%);
            color: var(--error);
            border: 1px solid hsl(0, 84%, 90%);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
            font-weight: 500;
            text-align: center;
          }

          .btn-auth-submit {
            padding: 0.9rem !important;
            font-size: 1rem;
            border-radius: 12px;
            margin-top: 0.5rem;
          }
          .btn-forgot-pwd-link {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-muted);
            background: none;
            border: none;
            cursor: pointer;
            text-decoration: underline;
          }
          .btn-forgot-pwd-link:hover {
            color: var(--primary);
          }
          .btn-back-signin-text {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-muted);
            text-align: center;
            margin-top: 1rem;
            width: 100%;
            background: none;
            border: none;
            cursor: pointer;
            text-decoration: underline;
          }
          .btn-back-signin-text:hover {
            color: var(--primary);
          }
          .forgot-success-pane {
            font-size: 0.9rem;
            line-height: 1.6;
            color: var(--text-muted);
            text-align: center;
          }
        `}} />
      </div>
    );
  }

  // 2. LOGGED IN CUSTOMER DASHBOARD
  return (
    <div className="profile-page animate-fade">
      <div className="container profile-dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header-strip flex-between">
          <div>
            <h1>Customer Portal</h1>
            <p>Welcome, {profile?.full_name || 'Rocky Customer'}</p>
          </div>
          <button onClick={signOut} className="btn btn-secondary btn-signout-dash">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="dashboard-grid">
          {/* Left Column: Account Details Update Form */}
          <div className="dashboard-card profile-settings-card">
            <h3 className="dash-card-title"><Settings size={18} /> Profile Settings</h3>
            <hr className="dash-divider" />
            
            <form onSubmit={handleUpdateProfile} className="profile-form">
              {profileSuccessMsg && (
                <div className="profile-success-banner">{profileSuccessMsg}</div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="form-control disabled-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 99999 88888"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shipping Address</label>
                <textarea
                  placeholder="Complete delivery address details..."
                  rows="3"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="form-control text-area-control"
                />
              </div>

              <button type="submit" disabled={profileLoading} className="btn btn-primary btn-block">
                {profileLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Right Column: Order History */}
          <div className="dashboard-card profile-orders-card">
            <h3 className="dash-card-title"><ShoppingBag size={18} /> Order History</h3>
            <hr className="dash-divider" />

            {ordersLoading ? (
              <div className="order-loader">
                <div className="spinner"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-empty-state">
                <ShoppingBag size={48} className="empty-orders-icon" />
                <h4>No orders found</h4>
                <p>You haven't placed any orders with us yet.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-history-box">
                    <div className="order-box-header flex-between">
                      <div>
                        <p className="order-id-lbl">ORDER #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="order-date-lbl">{new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                      </div>
                      <div className="order-status-badge-container">
                        {order.status === 'paid' && (
                          <span className="order-badge status-paid"><CheckCircle size={12} /> Paid</span>
                        )}
                        {order.status === 'pending' && (
                          <span className="order-badge status-pending"><Clock size={12} /> Pending</span>
                        )}
                        {order.status === 'shipped' && (
                          <span className="order-badge status-shipped"><Truck size={12} /> Shipped</span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="order-badge status-delivered"><CheckCircle size={12} /> Delivered</span>
                        )}
                        {order.status === 'returning' && (
                          <span className="order-badge status-returning"><Clock size={12} /> Returning</span>
                        )}
                        {order.status === 'returned' && (
                          <span className="order-badge status-returned"><CheckCircle size={12} /> Returned</span>
                        )}
                        {(order.status === 'failed' || order.status === 'cancelled') && (
                          <span className="order-badge status-failed"><AlertTriangle size={12} /> {order.status}</span>
                        )}
                      </div>
                    </div>

                    <div className="order-box-items">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="order-box-item-row">
                          <img
                            src={item.products?.image_url}
                            alt={item.products?.name}
                            className="order-item-thumb"
                          />
                          <div className="order-item-desc">
                            <p className="order-item-name">{item.products?.name || 'Shoe'}</p>
                            <p className="order-item-qty">Size: UK {item.quantity} &times; Qty: {item.quantity}</p>
                          </div>
                          <span className="order-item-price-val">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    <hr className="order-box-divider" />
                    
                    <div className="order-box-footer flex-between">
                      <span className="order-total-lbl">Total Paid: <strong>₹{order.total_amount.toLocaleString('en-IN')}</strong></span>
                      <div className="order-actions-row">
                        {(order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') && (
                          <a 
                            href={apiUrl(`/api/orders/${order.id}/invoice`)} 
                            download 
                            className="btn btn-outline btn-xs btn-invoice"
                          >
                            Invoice PDF
                          </a>
                        )}
                        {(order.status === 'shipped' || order.status === 'delivered') && (
                          <Link 
                            to={`/track/${order.id}`} 
                            className="btn btn-outline btn-xs btn-track"
                          >
                            Track Order
                          </Link>
                        )}
                        {order.status === 'delivered' && (
                          <button 
                            onClick={() => openReturnModal(order)} 
                            className="btn btn-primary btn-xs btn-return"
                          >
                            Request Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Request Wizard Modal */}
      {isReturnModalOpen && returnOrder && (
        <div className="support-modal-overlay product-crud-modal animate-fade" style={{ zIndex: 4000 }}>
          <div className="support-modal-backdrop" onClick={() => setIsReturnModalOpen(false)}></div>
          <div className="support-modal-card animate-slide-up product-crud-card" style={{ maxWidth: '550px' }}>
            <div className="support-modal-header">
              <h3>Return Request Wizard</h3>
              <button type="button" onClick={() => setIsReturnModalOpen(false)} className="support-close-btn" style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleReturnSubmit} className="product-crud-form" style={{ padding: '1.5rem' }}>
              <p className="return-disclaimer" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Order ID: #{returnOrder.id.slice(0, 8).toUpperCase()}
              </p>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Select Items to Return</label>
                <div className="return-items-selection-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)', maxHeight: '180px', overflowY: 'auto' }}>
                  {returnOrder.order_items?.map(item => (
                    <label key={item.id} className="return-item-checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedReturnItems[item.product_id]}
                        onChange={(e) => setSelectedReturnItems({
                          ...selectedReturnItems,
                          [item.product_id]: e.target.checked
                        })}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontWeight: '600' }}>{item.products?.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}> (Qty: {item.quantity} | Size: UK {item.size || 'N/A'})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}
                  required
                >
                  <option value="size_issue">Size issue (too small / too big)</option>
                  <option value="wrong_item">Received wrong shoe/color</option>
                  <option value="damaged">Shoe arrived damaged/defective</option>
                  <option value="quality_issue">Item quality not as expected</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Return Comments / Details</label>
                <textarea
                  placeholder="Explain why you are returning this item..."
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  className="form-control text-area-control"
                  rows="3"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-light)', resize: 'vertical' }}
                  required
                />
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsReturnModalOpen(false)} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '8px' }}>Cancel</button>
                <button type="submit" disabled={returnSubmitting} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '8px' }}>
                  {returnSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded CSS for Profile & Dashboard */}
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-loading-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80vh;
        }

        .profile-dashboard-container {
          padding-top: 3rem;
          padding-bottom: 5rem;
        }

        .dashboard-header-strip {
          margin-bottom: 2.5rem;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 1.5rem;
        }

        .dashboard-header-strip h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .dashboard-header-strip p {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
          font-weight: 500;
        }

        .btn-signout-dash {
          border-radius: 10px;
          padding: 0.6rem 1.2rem;
          font-size: 0.9rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (max-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .dashboard-card {
          background-color: var(--white);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .dash-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .dash-divider {
          border: 0;
          border-top: 1px solid var(--border-light);
          margin: 1.25rem 0;
        }

        .profile-success-banner {
          background-color: hsl(142, 70%, 97%);
          color: var(--success);
          border: 1px solid hsl(142, 70%, 90%);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 1.25rem;
        }

        .disabled-input {
          cursor: not-allowed;
          background-color: var(--border-light);
          color: var(--text-muted);
        }

        .order-badge.status-shipped { background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.2); }
        .order-badge.status-delivered { background-color: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .order-badge.status-returning { background-color: rgba(236, 72, 153, 0.1); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.2); }
        .order-badge.status-returned { background-color: var(--border-light); color: var(--text-muted); border: 1px solid var(--border-light); }

        .order-actions-row { display: flex; gap: 0.5rem; }
        .btn-xs { padding: 0.35rem 0.75rem !important; font-size: 0.75rem !important; border-radius: 30px !important; }
        .btn-invoice { border-color: var(--text-muted); color: var(--text-main); }
        .btn-track { border-color: var(--primary); color: var(--primary); }
        .btn-return { background-color: var(--text-main); color: var(--white); border-color: var(--text-main); }
        .btn-return:hover { background-color: var(--primary); border-color: var(--primary); }

        .text-area-control {
          resize: none;
        }

        /* Orders list */
        .order-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 0;
        }

        .orders-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          text-align: center;
          color: var(--text-muted);
          gap: 0.8rem;
        }

        .empty-orders-icon {
          color: var(--border-light);
        }

        .orders-empty-state h4 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .orders-empty-state p {
          font-size: 0.9rem;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .order-history-box {
          border: 1px solid var(--border-light);
          border-radius: 16px;
          padding: 1.25rem;
          transition: var(--transition-fast);
        }

        .order-history-box:hover {
          border-color: var(--primary);
        }

        .order-id-lbl {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .order-date-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .order-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.75rem;
          border-radius: 30px;
          text-transform: uppercase;
        }

        .status-paid {
          background-color: hsl(142, 70%, 95%);
          color: var(--success);
        }

        .status-pending {
          background-color: hsl(45, 100%, 95%);
          color: hsl(45, 95%, 40%);
        }

        .status-failed {
          background-color: hsl(0, 84%, 95%);
          color: var(--error);
        }

        .order-box-items {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-top: 1.25rem;
        }

        .order-box-item-row {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .order-item-thumb {
          width: 50px;
          height: 50px;
          object-fit: contain;
          border-radius: 8px;
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          padding: 0.25rem;
        }

        .order-item-desc {
          flex-grow: 1;
        }

        .order-item-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .order-item-qty {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .order-item-price-val {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .order-box-divider {
          border: 0;
          border-top: 1px dashed var(--border-light);
          margin: 1rem 0;
        }

        .order-total-lbl {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .order-total-val {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--primary);
        }
      `}} />
    </div>
  );
}
