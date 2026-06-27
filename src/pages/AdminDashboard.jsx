import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../apiConfig';
import { LayoutDashboard, ShoppingBag, CreditCard, Users, Plus, Edit, Trash2, Check, X, FileText, Truck, ArrowLeft, RotateCcw, MessageSquare } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  useDocumentTitle('Admin Control Desk');

  const [activeTab, setActiveTab] = useState('overview');

  // Stats State
  const [stats, setStats] = useState({
    totalSales: 0,
    ordersCount: 0,
    productsCount: 0,
    outOfStockCount: 0
  });

  // Product Manager State
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    category: 'sneakers',
    image_url: '',
    stock: 10
  });
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Orders Manager State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    status: '',
    tracking_number: '',
    carrier: '',
    estimated_delivery: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // Support & Help Desk Admin State
  const [adminTickets, setAdminTickets] = useState([]);
  const [adminTicketsLoading, setAdminTicketsLoading] = useState(false);
  const [adminReturns, setAdminReturns] = useState([]);
  const [adminReturnsLoading, setAdminReturnsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Fetch Session Headers helper
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  // Fetch Dashboard Stats & Lists
  const loadDashboardData = async () => {
    try {
      setProductsLoading(true);
      setOrdersLoading(true);

      // Fetch products directly
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (prodErr) throw prodErr;
      setProducts(prodData || []);

      // Fetch orders via Admin API
      const headers = await getAuthHeaders();
      const res = await fetch(apiUrl('/api/admin/orders'), { headers });
      if (!res.ok) {
        throw new Error('Failed to load orders. Verify admin privileges.');
      }
      const orderData = await res.json();
      setOrders(orderData || []);

      // Fetch support tickets
      setAdminTicketsLoading(true);
      const ticketsRes = await fetch(apiUrl('/api/admin/tickets'), { headers });
      if (ticketsRes.ok) {
        const ticketData = await ticketsRes.json();
        setAdminTickets(ticketData || []);
      }
      setAdminTicketsLoading(false);

      // Fetch return requests
      setAdminReturnsLoading(true);
      const returnsRes = await fetch(apiUrl('/api/admin/returns'), { headers });
      if (returnsRes.ok) {
        const returnsData = await returnsRes.json();
        setAdminReturns(returnsData || []);
      }
      setAdminReturnsLoading(false);

      // Calculate Stats
      const paidOrders = orderData.filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered');
      const sales = paidOrders.reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
      const outOfStock = prodData.filter(p => p.stock <= 0).length;

      setStats({
        totalSales: sales,
        ordersCount: orderData.length,
        productsCount: prodData.length,
        outOfStockCount: outOfStock
      });

    } catch (err) {
      console.error('Error loading admin statistics:', err);
      alert('Access Denied: You must be signed in with an Administrator profile to view this page.');
    } finally {
      setProductsLoading(false);
      setOrdersLoading(false);
      setAdminTicketsLoading(false);
      setAdminReturnsLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadDashboardData();
    }
  }, [user, profile]);

  // Adjust current page if needed after loading products
  useEffect(() => {
    if (products.length > 0) {
      const maxPage = Math.ceil(products.length / itemsPerPage);
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    }
  }, [products, currentPage]);

  // Block non-admins
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="admin-denied container animate-fade">
        <LayoutDashboard size={48} className="denied-icon" />
        <h2>Access Denied</h2>
        <p>This control portal is restricted to authorized store administrators.</p>
        <style dangerouslySetInnerHTML={{ __html: `
          .admin-denied {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
            gap: 1rem;
            color: var(--text-muted);
          }
          .admin-denied h2 { color: var(--primary); font-size: 2rem; font-weight: 800; }
          .denied-icon { color: var(--primary); }
        `}} />
      </div>
    );
  }

  // --- Product Management CRUD ---
  const handleProductEdit = (product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      image_url: product.image_url || '',
      stock: product.stock
    });
    setIsProductModalOpen(true);
  };

  const handleProductCreate = () => {
    setProductForm({
      id: null,
      name: '',
      description: '',
      price: '',
      category: 'sneakers',
      image_url: '',
      stock: 10
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const method = productForm.id ? 'PUT' : 'POST';
      const url = productForm.id ? apiUrl(`/api/admin/products/${productForm.id}`) : apiUrl('/api/admin/products');

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(productForm)
      });

      if (!res.ok) throw new Error('Action failed.');
      
      alert(productForm.id ? 'Product updated successfully.' : 'Product created successfully.');
      setIsProductModalOpen(false);
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(apiUrl(`/api/admin/products/${productId}`), {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Deletion failed.');
      alert('Product deleted.');
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Order Status Management & Shipping Form ---
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShippingForm({
      status: order.status,
      tracking_number: order.tracking_number || '',
      carrier: order.carrier || '',
      estimated_delivery: order.estimated_delivery || ''
    });
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      
      // Update order status and tracking fields
      const res = await fetch(apiUrl(`/api/admin/orders/${selectedOrder.id}/status`), {
        method: 'POST',
        headers,
        body: JSON.stringify(shippingForm)
      });

      if (!res.ok) throw new Error('Failed to update status.');
      const updatedOrder = await res.json();
      
      // Update local orders state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrder.order } : o));
      setSelectedOrder(prev => ({ ...prev, ...updatedOrder.order }));
      alert('Order updated.');
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefund = async (orderId, amount) => {
    if (!confirm('Are you sure you want to trigger a payment refund for this returned order?')) return;
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(apiUrl('/api/payment/refund'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ order_id: orderId, amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund transaction rejected.');
      alert('Refund processed successfully.');
      setSelectedOrder(prev => ({ ...prev, status: 'returned' }));
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(apiUrl(`/api/admin/tickets/${selectedTicket.id}/resolve`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resolution_notes: resolutionNotes.trim(),
          status: 'resolved'
        })
      });

      if (!res.ok) throw new Error('Failed to resolve support ticket.');
      
      alert('Support ticket resolved successfully.');
      setSelectedTicket(null);
      setResolutionNotes('');
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`admin-dashboard container animate-fade ${isProductModalOpen ? 'modal-open' : ''}`}>
      <div className="dashboard-header">
        <h1>Admin Control Desk</h1>
        <p>Manage product catalog, dispatch tracking, and customer transactions.</p>
      </div>

      {/* Overview Stats Row */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper sales"><CreditCard size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Revenue</span>
            <h3 className="stat-value">₹{stats.totalSales.toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper orders"><ShoppingBag size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Orders Handled</span>
            <h3 className="stat-value">{stats.ordersCount}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper catalog"><ShoppingBag size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Active Catalog</span>
            <h3 className="stat-value">{stats.productsCount} Shoes</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper out-of-stock"><X size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Out of Stock</span>
            <h3 className="stat-value">{stats.outOfStockCount} items</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          onClick={() => { setActiveTab('overview'); setSelectedOrder(null); setSelectedTicket(null); }} 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview & Products
        </button>
        <button 
          onClick={() => { setActiveTab('orders'); setSelectedTicket(null); }} 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
        >
          Customer Orders ({orders.length})
        </button>
        <button 
          onClick={() => { setActiveTab('support'); setSelectedOrder(null); }} 
          className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`}
        >
          Help & Support ({adminTickets.length})
        </button>
      </div>

      {/* Products Tab View */}
      {activeTab === 'overview' && (
        <div className="dashboard-pane animate-fade">
          <div className="pane-header">
            <h2>Product Catalog Manager</h2>
            <button onClick={handleProductCreate} className="btn btn-primary add-product-btn">
              <Plus size={16} /> Add Product
            </button>
          </div>

          {productsLoading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Thumbnail</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image_url} alt={p.name} className="admin-table-thumb" />
                        </td>
                        <td><strong>{p.name}</strong></td>
                        <td><span className="cat-tag">{p.category}</span></td>
                        <td>₹{p.price.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`stock-badge ${p.stock <= 0 ? 'out' : p.stock < 5 ? 'low' : 'ok'}`}>
                            {p.stock <= 0 ? 'Out of Stock' : `${p.stock} units`}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons">
                            <button onClick={() => handleProductEdit(p)} className="action-btn edit" title="Edit Product"><Edit size={14} /></button>
                            <button onClick={() => handleProductDelete(p.id)} className="action-btn delete" title="Delete Product"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Product Pagination controls */}
              {Math.ceil(products.length / itemsPerPage) > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, products.length)} of {products.length} products
                  </div>
                  <div className="pagination-buttons">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      Prev
                    </button>
                    {[...Array(Math.ceil(products.length / itemsPerPage))].map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(products.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
                      className="page-btn"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* Orders Tab View */}
      {activeTab === 'orders' && (
        <div className="dashboard-pane animate-fade">
          {selectedOrder ? (
            // Individual Order Operations Details Subpane
            <div className="order-operations-panel animate-slide-up">
              <button onClick={() => setSelectedOrder(null)} className="btn btn-outline back-btn">
                <ArrowLeft size={16} /> Back to Orders List
              </button>

              <div className="order-details-grid">
                {/* Details Sheet */}
                <div className="order-sheet">
                  <h3>Order Sheet: #{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
                  <p className="order-time">Placed on: {new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>

                  <div className="customer-info-section">
                    <h4>Customer Profile</h4>
                    <p><strong>Name:</strong> {selectedOrder.full_name}</p>
                    <p><strong>Email:</strong> {selectedOrder.email}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone || 'N/A'}</p>
                    <p><strong>Shipping Address:</strong> {selectedOrder.shipping_address}</p>
                  </div>

                  <div className="items-list-section">
                    <h4>Purchased Items</h4>
                    <ul className="admin-items-list">
                      {selectedOrder.order_items?.map((item) => (
                        <li key={item.id} className="admin-order-item">
                          <img src={item.products?.image_url} alt={item.products?.name} className="item-thumb" />
                          <div className="item-details">
                            <p className="item-name">{item.products?.name}</p>
                            <p className="item-qty">Qty: {item.quantity} | Size: {item.size || 'N/A'}</p>
                          </div>
                          <span className="item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="total-bar">
                      <span>Total Paid:</span>
                      <strong>₹{parseFloat(selectedOrder.total_amount).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="invoice-download-section">
                    <a href={apiUrl(`/api/orders/${selectedOrder.id}/invoice`)} download className="btn btn-outline download-invoice-btn">
                      <FileText size={16} /> Download PDF Invoice
                    </a>
                  </div>
                </div>

                {/* Status Management Form */}
                <div className="status-management-card">
                  <h3>Order Controls</h3>

                  <form onSubmit={handleShippingSubmit} className="status-form">
                    <div className="form-group">
                      <label>Set Order Status</label>
                      <select 
                        value={shippingForm.status} 
                        onChange={(e) => setShippingForm({ ...shippingForm, status: e.target.value })}
                        className="form-control"
                      >
                        <option value="pending">Pending Payment</option>
                        <option value="paid">Paid (Processing)</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="returning">Return Requested</option>
                        <option value="returned">Returned (Refunded)</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {shippingForm.status === 'shipped' && (
                      <div className="shipping-details-fields animate-fade">
                        <div className="form-group">
                          <label>Shipping Carrier</label>
                          <input 
                            type="text" 
                            placeholder="e.g. BlueDart, Delhivery" 
                            value={shippingForm.carrier}
                            onChange={(e) => setShippingForm({ ...shippingForm, carrier: e.target.value })}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Tracking Number</label>
                          <input 
                            type="text" 
                            placeholder="e.g. BD184750284" 
                            value={shippingForm.tracking_number}
                            onChange={(e) => setShippingForm({ ...shippingForm, tracking_number: e.target.value })}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Estimated Delivery Date</label>
                          <input 
                            type="date" 
                            value={shippingForm.estimated_delivery}
                            onChange={(e) => setShippingForm({ ...shippingForm, estimated_delivery: e.target.value })}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <button type="submit" disabled={submitting} className="btn btn-primary submit-status-btn">
                      {submitting ? 'Updating...' : 'Save Status Update'}
                    </button>
                  </form>

                  {/* Payment Refund Quick Action */}
                  {(selectedOrder.status === 'paid' || selectedOrder.status === 'shipped' || selectedOrder.status === 'returning') && (
                    <div className="refund-quick-action-block">
                      <h4>Trigger Refunds (Razorpay Integration)</h4>
                      <p className="refund-warning">Approving a return will instantly call the Razorpay gateway APIs to process a full refund to the customer's account.</p>
                      <button 
                        onClick={() => handleRefund(selectedOrder.id, selectedOrder.total_amount)}
                        disabled={submitting}
                        className="btn btn-outline refund-btn"
                      >
                        Approve Return & Refund Full Amount
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Customer Orders List Table
            <div className="orders-list-subpane animate-fade">
              <h2>Customer Transactions</h2>

              {ordersLoading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td><strong>#{o.id.slice(0, 8).toUpperCase()}</strong></td>
                          <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          <td>{o.full_name}</td>
                          <td>{o.email}</td>
                          <td>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`status-badge ${o.status}`}>
                              {o.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => openOrderDetails(o)} className="btn btn-outline btn-sm">
                              Manage Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help & Support Tab View */}
      {activeTab === 'support' && (
        <div className="dashboard-pane animate-fade">
          {selectedTicket ? (
            /* Ticket Details and Resolution Form */
            <div className="order-operations-panel animate-slide-up" style={{ maxWidth: '600px', margin: 'auto' }}>
              <button onClick={() => setSelectedTicket(null)} className="btn btn-outline back-btn" style={{ marginBottom: '1.5rem' }}>
                <ArrowLeft size={16} /> Back to Support Desk
              </button>

              <div className="status-management-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className={`status-badge ${selectedTicket.status}`} style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '30px', textTransform: 'uppercase', backgroundColor: selectedTicket.status === 'open' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: selectedTicket.status === 'open' ? '#f59e0b' : '#10b981' }}>
                    {selectedTicket.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Filed: {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{selectedTicket.subject}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Customer: <strong>{selectedTicket.profiles?.full_name || 'Rocky Customer'}</strong> ({selectedTicket.profiles?.email || 'N/A'})
                </p>

                {selectedTicket.order_id && (
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)' }}>
                      Linked Order: #{selectedTicket.order_id.slice(0, 8).toUpperCase()}
                    </span>
                    <button
                      onClick={() => {
                        const ord = orders.find(o => o.id === selectedTicket.order_id);
                        if (ord) {
                          setActiveTab('orders');
                          openOrderDetails(ord);
                        } else {
                          alert('Order details not found.');
                        }
                      }}
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                    >
                      Manage Order
                    </button>
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--white)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)', minHeight: '100px' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Customer Message:</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</p>
                </div>

                {selectedTicket.status === 'resolved' && selectedTicket.resolution_notes && (
                  <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--success)', marginBottom: '0.5rem' }}>Resolution Notes:</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{selectedTicket.resolution_notes}</p>
                  </div>
                )}

                {selectedTicket.status === 'open' && (
                  <form onSubmit={handleResolveTicket} className="status-form" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>Write Response / Resolution Notes</label>
                      <textarea
                        rows="4"
                        placeholder="Provide details on how this issue was resolved..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-light)', resize: 'vertical' }}
                        required
                      />
                    </div>
                    <button type="submit" disabled={submitting} className="btn btn-primary submit-status-btn" style={{ width: '100%', padding: '0.8rem', borderRadius: '50px', fontWeight: '600' }}>
                      {submitting ? 'Resolving...' : 'Mark as Resolved & Close'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* Ticket Center Dashboard Split View */
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
              
              {/* Return Requests List */}
              <div className="returns-section">
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RotateCcw size={18} /> Active Return Requests ({adminReturns.filter(r => r.status === 'pending').length})
                </h3>

                {adminReturnsLoading ? (
                  <div className="loading-spinner"><div className="spinner"></div></div>
                ) : adminReturns.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--border-light)', borderRadius: '16px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.85rem' }}>No return requests pending approval.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {adminReturns.map(r => (
                      <div key={r.id} style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.25rem', backgroundColor: r.status === 'pending' ? 'var(--white)' : 'var(--bg-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>
                              ORDER #{r.order_id.slice(0, 8).toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                              {new Date(r.created_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <span className={`status-badge ${r.status}`} style={{ fontSize: '0.7rem', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '20px', textTransform: 'uppercase', backgroundColor: r.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : r.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(225, 29, 72, 0.1)', color: r.status === 'pending' ? '#f59e0b' : r.status === 'approved' ? '#10b981' : 'var(--primary)' }}>
                            {r.status}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                          Customer: <strong>{r.profiles?.full_name || 'Guest'}</strong> ({r.profiles?.email || 'N/A'})
                        </p>
                        
                        <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Reason for Return:</span>
                          <span style={{ fontWeight: '600' }}>{r.reason.replace('_', ' ').toUpperCase()}</span>
                          {r.comments && <p style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>"{r.comments}"</p>}
                        </div>

                        <div style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Items to Return:</span>
                          {r.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                              <span>• Product ID: {item.product_id.slice(0, 8)} | Qty: {item.quantity} | Size: UK {item.size}</span>
                            </div>
                          ))}
                        </div>

                        {r.status === 'pending' && (
                          <button
                            onClick={() => {
                              const ord = orders.find(o => o.id === r.order_id);
                              if (ord) {
                                setActiveTab('orders');
                                openOrderDetails(ord);
                              } else {
                                alert('Order details not found.');
                              }
                            }}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', marginTop: '0.25rem' }}
                          >
                            Review & Process Refund
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Tickets List */}
              <div className="tickets-section" style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '2.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={18} /> Support Tickets ({adminTickets.filter(t => t.status === 'open').length})
                </h3>

                {adminTicketsLoading ? (
                  <div className="loading-spinner"><div className="spinner"></div></div>
                ) : adminTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--border-light)', borderRadius: '16px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.85rem' }}>No support tickets filed.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {adminTickets.map(t => (
                      <div key={t.id} style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1rem', backgroundColor: t.status === 'open' ? 'var(--white)' : 'var(--bg-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--border-light)' }}>
                            {t.category}
                          </span>
                          <span className={`status-badge ${t.status}`} style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.1rem 0.4rem', borderRadius: '20px', textTransform: 'uppercase', backgroundColor: t.status === 'open' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: t.status === 'open' ? '#f59e0b' : '#10b981' }}>
                            {t.status}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t.subject}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          By: {t.profiles?.full_name || 'Customer'}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '0.75rem' }}>
                          {t.message}
                        </p>

                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setResolutionNotes(t.resolution_notes || '');
                          }}
                          className="btn btn-outline"
                          style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', fontSize: '0.75rem' }}
                        >
                          {t.status === 'open' ? 'Respond & Resolve' : 'View Resolution'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* Product Edit/Create Overlay Modal */}
      {isProductModalOpen && (
        <div className="support-modal-overlay product-crud-modal animate-fade">
          <div className="support-modal-backdrop" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="support-modal-card animate-slide-up product-crud-card">
            <div className="support-modal-header">
              <h3>{productForm.id ? 'Edit Product Details' : 'Add New Product'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="support-close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="product-crud-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Shoe Name</label>
                  <input 
                    type="text" 
                    value={productForm.name} 
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
                    className="form-control"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Price (INR)</label>
                  <input 
                    type="number" 
                    value={productForm.price} 
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} 
                    className="form-control"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Stock Count</label>
                  <input 
                    type="number" 
                    value={productForm.stock} 
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} 
                    className="form-control"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={productForm.category} 
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} 
                    className="form-control"
                  >
                    <option value="sneakers">Sneakers</option>
                    <option value="running_shoes">Running Shoes</option>
                    <option value="boots">Boots</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Image Reference Path / URL</label>
                <input 
                  type="text" 
                  placeholder="e.g. /images/sneakers/img-1.jpg"
                  value={productForm.image_url} 
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} 
                  className="form-control"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Product Description</label>
                <textarea 
                  rows="4" 
                  value={productForm.description} 
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} 
                  className="form-control text-area"
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Dashboard Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-dashboard { padding-top: 6.5rem; padding-bottom: 5rem; }
        .admin-dashboard.modal-open { position: relative; z-index: 3100; }
        .dashboard-header { margin-bottom: 2.5rem; }
        .dashboard-header h1 { font-size: 2.2rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem; }
        .dashboard-header p { color: var(--text-muted); font-size: 0.95rem; }
        
        /* Stats Cards */
        .dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .stat-card {
          background-color: var(--white);
          border: 1px solid var(--border-light);
          padding: 1.5rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow-sm);
        }
        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon-wrapper.sales { background-color: rgba(225, 29, 72, 0.1); color: var(--primary); }
        .stat-icon-wrapper.orders { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .stat-icon-wrapper.catalog { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stat-icon-wrapper.out-of-stock { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        
        .stat-info { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-top: 0.2rem; }

        /* Tabs */
        .dashboard-tabs { display: flex; gap: 1rem; border-bottom: 2px solid var(--border-light); margin-bottom: 2rem; }
        .tab-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-muted);
          position: relative;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .tab-btn:hover { color: var(--primary); }
        .tab-btn.active { color: var(--primary); }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--primary);
        }

        /* Products Tab */
        .dashboard-pane { background-color: var(--white); border: 1px solid var(--border-light); border-radius: 24px; padding: 2rem; box-shadow: var(--shadow-sm); }
        .pane-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .pane-header h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-main); }
        .add-product-btn { display: flex; align-items: center; gap: 0.5rem; border-radius: 50px; font-weight: 600; padding: 0.65rem 1.25rem; }

        /* Tables styling */
        .table-responsive { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 1rem; font-weight: 600; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid var(--border-light); }
        .admin-table td { padding: 1rem; border-bottom: 1px solid var(--border-light); font-size: 0.95rem; color: var(--text-main); vertical-align: middle; }
        .admin-table-thumb { width: 44px; height: 44px; border-radius: 10px; object-fit: contain; background-color: var(--bg-subtle); border: 1px solid var(--border-light); }
        .cat-tag { background-color: var(--bg-subtle); border: 1px solid var(--border-light); padding: 0.2rem 0.6rem; border-radius: 30px; font-size: 0.75rem; font-weight: 600; }
        
        .stock-badge { padding: 0.25rem 0.65rem; border-radius: 30px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
        .stock-badge.ok { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stock-badge.low { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .stock-badge.out { background-color: rgba(225, 29, 72, 0.1); color: var(--primary); }

        .action-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; }
        .action-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-light);
          background: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .action-btn.edit:hover { background-color: rgba(59, 130, 246, 0.05); color: #3b82f6; border-color: #3b82f6; }
        .action-btn.delete:hover { background-color: rgba(225, 29, 72, 0.05); color: var(--primary); border-color: var(--primary); }

        /* Order Operations Details Subpanel */
        .order-operations-panel .back-btn { margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem; }
        .order-details-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
        @media (max-width: 992px) { .order-details-grid { grid-template-columns: 1fr; } }
        
        .order-sheet, .status-management-card {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 2rem;
        }

        .order-sheet h3, .status-management-card h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; }
        .order-time { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem; }

        .customer-info-section, .items-list-section, .refund-quick-action-block {
          border-top: 1px solid var(--border-light);
          padding-top: 1.5rem;
          margin-top: 1.5rem;
        }
        .customer-info-section h4, .items-list-section h4, .status-management-card h4 { font-size: 0.95rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; margin-bottom: 0.75rem; }
        .customer-info-section p { font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.4rem; }

        .admin-items-list { list-style: none; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .admin-order-item { display: flex; align-items: center; gap: 1rem; }
        .admin-order-item .item-thumb { width: 50px; height: 50px; border-radius: 8px; object-fit: contain; background-color: var(--white); border: 1px solid var(--border-light); }
        .admin-order-item .item-details { flex-grow: 1; }
        .admin-order-item .item-name { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
        .admin-order-item .item-qty { font-size: 0.8rem; color: var(--text-muted); }
        .admin-order-item .item-price { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }

        .total-bar { display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 800; border-top: 1px solid var(--border-light); padding-top: 1rem; color: var(--text-main); }
        .total-bar strong { color: var(--primary); }

        .download-invoice-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 50px; font-weight: 600; margin-top: 1rem; }

        .status-form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; }
        .submit-status-btn { width: 100%; padding: 0.8rem; font-weight: 600; border-radius: 50px; }

        .status-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 30px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .status-badge.pending { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-badge.paid { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .status-badge.shipped { background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .status-badge.delivered { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.returning { background-color: rgba(236, 72, 153, 0.1); color: #ec4899; }
        .status-badge.returned { background-color: var(--border-light); color: var(--text-muted); }
        .status-badge.failed, .status-badge.cancelled { background-color: rgba(225, 29, 72, 0.1); color: var(--primary); }

        .refund-warning { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem; }
        .refund-btn { width: 100%; border-color: var(--primary); color: var(--primary); font-weight: 600; padding: 0.75rem; border-radius: 50px; }
        .refund-btn:hover { background-color: var(--primary); color: var(--white); }

        /* Modal support overlay and backdrop styles */
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
          max-height: 85vh;
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          z-index: 3001;
          overflow: hidden;
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
          border: none;
          background: none;
          cursor: pointer;
        }
        .support-close-btn:hover {
          background-color: var(--bg-subtle);
          color: var(--primary);
        }

        /* Modal Product CRUD Form */
        .product-crud-card { max-width: 600px; width: 90%; }
        .product-crud-form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; padding: 0 1.5rem 1.5rem 1.5rem; overflow-y: auto; flex: 1; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 576px) { .form-grid { grid-template-columns: 1fr; } }
        
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-main); }
        .form-control {
          padding: 0.7rem 1rem;
          border-radius: 12px;
          border: 1px solid var(--border-light);
          background-color: var(--white);
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--text-main);
          transition: var(--transition-fast);
        }
        .form-control:focus { border-color: var(--primary); outline: none; }
        .form-control.text-area { resize: vertical; border-radius: 16px; }

        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--border-light); padding-top: 1.25rem; margin-top: 1rem; }

        /* Pagination Controls styling */
        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
        }
        .pagination-info {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .pagination-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .page-btn {
          min-width: 32px;
          height: 32px;
          padding: 0 0.6rem;
          border-radius: 8px;
          border: 1px solid var(--border-light);
          background-color: var(--white);
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .page-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background-color: rgba(225, 29, 72, 0.05);
        }
        .page-btn.active {
          background-color: var(--primary);
          color: var(--white);
          border-color: var(--primary);
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

      `}} />
    </div>
  );
}
