import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Search, Menu, X, ArrowRight, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { totalQuantity, toggleCart, cartBounce } = useCart();
  const { user, profile, signOut } = useAuth();
  const { wishlist } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/shop?category=${category}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="navbar-wrapper">
        <div className="container navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">R</span>
            <span className="logo-text">Rocky<span className="text-red">Shoes</span></span>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="navbar-links-desktop">
            <Link to="/" className="nav-link">Home</Link>
            <button onClick={() => handleCategoryClick('sneakers')} className="nav-link-btn">Sneakers</button>
            <button onClick={() => handleCategoryClick('running_shoes')} className="nav-link-btn">Running</button>
            <button onClick={() => handleCategoryClick('boots')} className="nav-link-btn">Boots</button>
            <Link to="/shop" className="nav-link shop-all">Shop All <ArrowRight size={14} /></Link>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearchSubmit} className="search-form-desktop">
            <input
              type="text"
              placeholder="Search premium footwear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <Search size={18} />
            </button>
          </form>

          {/* User Controls */}
          <div className="navbar-controls">
            {/* Profile Dropdown */}
            <div className="profile-menu-container">
              {user ? (
                <>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="navbar-ctrl-btn profile-trigger"
                    title="Account"
                  >
                    <User size={20} />
                    <span className="profile-name-span">{profile?.full_name?.split(' ')[0] || 'User'}</span>
                  </button>

                  {profileDropdownOpen && (
                    <div className="profile-dropdown animate-fade">
                      <div className="dropdown-header">
                        <p className="dropdown-username">{profile?.full_name || 'Rocky Customer'}</p>
                        <p className="dropdown-email">{user.email}</p>
                      </div>
                      <hr className="dropdown-divider" />
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="dropdown-item"
                      >
                        My Account & Orders
                      </Link>
                      {profile?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="dropdown-item admin-item"
                          style={{ color: 'var(--primary)', fontWeight: 'bold' }}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout} className="dropdown-item logout-btn">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/profile" className="navbar-ctrl-btn" title="Sign In">
                  <User size={20} />
                  <span className="profile-name-span">Sign In</span>
                </Link>
              )}
            </div>

            {/* Wishlist Button */}
            <Link
              to="/shop?wishlist=true"
              className="navbar-ctrl-btn"
              title="Wishlist"
            >
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="cart-badge animate-fade" style={{ backgroundColor: 'var(--text-main)' }}>{wishlist.length}</span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => toggleCart(true)}
              className={`navbar-ctrl-btn cart-trigger ${cartBounce ? 'bounce-active' : ''}`}
              title="Cart"
            >
              <ShoppingBag size={20} />
              {totalQuantity > 0 && (
                <span className="cart-badge animate-fade">{totalQuantity}</span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="navbar-ctrl-btn mobile-menu-trigger"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade">
          <div className="drawer-overlay" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="drawer-content">
            <form onSubmit={handleSearchSubmit} className="search-form-mobile">
              <input
                type="text"
                placeholder="Search shoes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-mobile"
              />
              <button type="submit" className="search-btn-mobile">
                <Search size={18} />
              </button>
            </form>

            <div className="mobile-links">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Home</Link>
              <button onClick={() => handleCategoryClick('sneakers')} className="mobile-nav-link-btn">Sneakers</button>
              <button onClick={() => handleCategoryClick('running_shoes')} className="mobile-nav-link-btn">Running Shoes</button>
              <button onClick={() => handleCategoryClick('boots')} className="mobile-nav-link-btn">Boots</button>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link highlight">Shop All Footwear</Link>
              
              <hr className="drawer-divider" />
              
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">My Account & Orders</Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="mobile-nav-link logout-btn-mobile">
                    <LogOut size={18} /> Sign Out
                  </button>
                </>
              ) : (
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Sign In / Register</Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for Navbar Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .navbar-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: var(--header-height);
          background-color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(15px) saturate(180%);
          -webkit-backdrop-filter: blur(15px) saturate(180%);
          border-bottom: 1px solid var(--border-light);
          z-index: 1000;
          display: flex;
          align-items: center;
          transition: var(--transition-smooth);
        }
        
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 800;
          font-size: 1.5rem;
          color: var(--text-main);
          letter-spacing: -0.03em;
        }

        .logo-icon {
          background-color: var(--primary);
          color: var(--white);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 1.2rem;
          font-weight: 900;
          box-shadow: 0 4px 10px rgba(225, 29, 72, 0.25);
        }

        .logo-text .text-red {
          color: var(--primary);
        }

        .navbar-links-desktop {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        @media (max-width: 992px) {
          .navbar-links-desktop, .search-form-desktop {
            display: none !important;
          }
        }

        .nav-link {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-main);
          padding: 0.5rem 0;
          border-bottom: 2px solid transparent;
        }

        .nav-link:hover {
          color: var(--primary);
        }

        .nav-link-btn {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-main);
          padding: 0.5rem 0;
          border-bottom: 2px solid transparent;
          transition: var(--transition-fast);
        }

        .nav-link-btn:hover {
          color: var(--primary);
        }

        .shop-all {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--primary);
          font-weight: 600;
        }

        .search-form-desktop {
          position: relative;
          width: 250px;
        }

        .search-input {
          width: 100%;
          padding: 0.55rem 2.5rem 0.55rem 1rem;
          font-size: 0.85rem;
          border-radius: 30px;
          border: 1px solid var(--border-light);
          background-color: var(--bg-subtle);
          transition: var(--transition-smooth);
        }

        .search-input:focus {
          width: 280px;
          border-color: var(--primary);
          background-color: var(--white);
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.05);
        }

        .search-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }

        .search-btn:hover {
          color: var(--primary);
        }

        .navbar-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .navbar-ctrl-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem;
          border-radius: 50px;
          color: var(--text-main);
          transition: var(--transition-fast);
          position: relative;
        }

        .navbar-ctrl-btn:hover {
          background-color: var(--bg-subtle);
          color: var(--primary);
        }

        .profile-name-span {
          font-size: 0.85rem;
          font-weight: 600;
          max-width: 80px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 576px) {
          .profile-name-span {
            display: none;
          }
        }

        .cart-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background-color: var(--primary);
          color: var(--white);
          font-size: 0.65rem;
          font-weight: 800;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(225, 29, 72, 0.4);
        }

        .bounce-active {
          animation: bounceCart 0.6s ease;
        }

        .mobile-menu-trigger {
          display: none;
        }

        @media (max-width: 992px) {
          .mobile-menu-trigger {
            display: inline-flex;
          }
        }

        /* Profile Dropdown Box */
        .profile-menu-container {
          position: relative;
        }

        .profile-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.75rem;
          width: 240px;
          background-color: var(--white);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-light);
          padding: 0.75rem 0;
          z-index: 1050;
        }

        .dropdown-header {
          padding: 0.75rem 1.25rem;
        }

        .dropdown-username {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .dropdown-email {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .dropdown-divider {
          border: 0;
          border-top: 1px solid var(--border-light);
          margin: 0.5rem 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1.25rem;
          font-size: 0.9rem;
          color: var(--text-main);
          font-weight: 500;
          text-align: left;
        }

        .dropdown-item:hover {
          background-color: var(--bg-subtle);
          color: var(--primary);
        }

        .logout-btn {
          color: var(--error);
        }
        
        .logout-btn:hover {
          background-color: hsl(0, 100%, 98%);
          color: var(--error);
        }

        /* Mobile Nav Drawer */
        .mobile-drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999;
          display: flex;
        }

        .drawer-overlay {
          flex-grow: 1;
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
        }

        .drawer-content {
          width: 300px;
          height: 100%;
          background-color: var(--white);
          box-shadow: var(--shadow-lg);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .search-form-mobile {
          position: relative;
        }

        .search-input-mobile {
          width: 100%;
          padding: 0.8rem 2.5rem 0.8rem 1.2rem;
          font-size: 0.9rem;
          border-radius: 12px;
          border: 1.5px solid var(--border-light);
          background-color: var(--bg-subtle);
        }

        .search-btn-mobile {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .mobile-links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mobile-nav-link {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
          padding: 0.5rem 0;
        }

        .mobile-nav-link-btn {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
          padding: 0.5rem 0;
          text-align: left;
          width: 100%;
        }

        .mobile-nav-link:hover, .mobile-nav-link-btn:hover {
          color: var(--primary);
        }

        .mobile-links .highlight {
          color: var(--primary);
          border-left: 3px solid var(--primary);
          padding-left: 0.75rem;
        }

        .logout-btn-mobile {
          color: var(--error);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }
      `}} />
    </>
  );
}
