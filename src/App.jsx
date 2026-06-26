import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SupportModal from './components/SupportModal';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  const [supportTab, setSupportTab] = useState(null);

  // Global event listener for showing support modals dynamically
  useEffect(() => {
    const handleOpenSupport = (e) => {
      setSupportTab(e.detail);
    };
    window.addEventListener('open-support-modal', handleOpenSupport);
    return () => window.removeEventListener('open-support-modal', handleOpenSupport);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="app-container">
              {/* Navigation Header */}
              <Navbar />

              {/* Shopping Cart Drawer Sidebar */}
              <CartDrawer />

              {/* Support Info Modal Overlay */}
              <SupportModal tab={supportTab} onClose={() => setSupportTab(null)} />

              {/* Viewport Router Switch */}
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Routes>
              </main>

              {/* Footer section */}
              <Footer />
            </div>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
