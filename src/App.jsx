import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app-container">
            {/* Navigation Header */}
            <Navbar />

            {/* Shopping Cart Drawer Sidebar */}
            <CartDrawer />

            {/* Viewport Router Switch */}
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
              </Routes>
            </main>

            {/* Footer section */}
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
