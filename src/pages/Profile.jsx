import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ShoppingBag, Settings, LogOut, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function Profile() {
  const { user, profile, signUp, signIn, signOut, updateProfile, loading } = useAuth();
  
  // Auth Form State
  const [authTab, setAuthTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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

  // Sign In / Sign Up handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authTab === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (!fullName.trim()) throw new Error('Full Name is required.');
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        alert("Account created successfully! Welcome to RockyShoes.");
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check details.');
    } finally {
      setAuthLoading(false);
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

          <form onSubmit={handleAuthSubmit} className="auth-form">
            <h2 className="auth-title">
              {authTab === 'signin' ? 'Welcome Back To Rocky' : 'Join RockyShoes E-Store'}
            </h2>
            
            {authError && <div className="auth-error-banner">{authError}</div>}

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

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
              />
            </div>

            <button type="submit" disabled={authLoading} className="btn btn-primary btn-block btn-auth-submit">
              {authLoading ? 'Verifying...' : authTab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
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
                      <span className="order-total-lbl">Total Amount</span>
                      <span className="order-total-val">₹{order.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
          border-color: var(--border-light);
        }

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
