import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Home() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle('Premium Footwear E-Store');

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(4);

        if (error) throw error;
        setFeaturedProducts(data || []);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home-page animate-fade">
      {/* 1. Hero Banner */}
      <section className="hero-banner">
        <div className="container hero-inner">
          <div className="hero-content">
            <span className="hero-tagline">Premium Performance & Style</span>
            <h1 className="hero-title text-gradient">STEP INTO GREATNESS</h1>
            <p className="hero-description">
              Uncompromising craftsmanship. Unrivaled comfort. Explore our collection of premium Sneakers, Running Shoes, and Boots engineered for the modern athlete and explorer.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary">
                Shop Collection <ArrowRight size={18} />
              </Link>
              <Link to="/shop?category=sneakers" className="btn btn-secondary">
                View Sneakers
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-circle-accent"></div>
            <img
              src="/images/running-shoes/img-1.jpg"
              alt="Rocky Premium Shoe"
              className="hero-shoe-image"
            />
          </div>
        </div>
      </section>

      {/* 2. Marketing Hooks */}
      <section className="features-strip">
        <div className="container features-inner">
          <div className="feature-item">
            <div className="feature-icon"><Truck size={24} /></div>
            <div>
              <h4>Free Shipping</h4>
              <p>On all orders above ₹999</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><RotateCcw size={24} /></div>
            <div>
              <h4>30-Day Returns</h4>
              <p>Hassle-free size exchange</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><CreditCard size={24} /></div>
            <div>
              <h4>Secure Checkout</h4>
              <p>Integrated with Razorpay</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><ShieldCheck size={24} /></div>
            <div>
              <h4>100% Genuine</h4>
              <p>Authentic Rocky footwear</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Grid */}
      <section className="categories-grid-section py-5">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find the perfect fit for your activities</p>
          </div>

          <div className="categories-grid-row">
            {/* Sneakers Card */}
            <div className="category-card" onClick={() => navigate('/shop?category=sneakers')}>
              <div className="cat-img-wrapper">
                <img src="/images/sneakers/img-1.jpg" alt="Sneakers Category" className="cat-card-img" />
              </div>
              <div className="cat-card-details">
                <h3>Sneakers</h3>
                <span>Explore Retro & Modern <ArrowRight size={14} /></span>
              </div>
            </div>

            {/* Running Shoes Card */}
            <div className="category-card" onClick={() => navigate('/shop?category=running_shoes')}>
              <div className="cat-img-wrapper">
                <img src="/images/running-shoes/img-2.jpg" alt="Running Shoes Category" className="cat-card-img" />
              </div>
              <div className="cat-card-details">
                <h3>Running Shoes</h3>
                <span>AeroStride & TrailBlazers <ArrowRight size={14} /></span>
              </div>
            </div>

            {/* Boots Card */}
            <div className="category-card" onClick={() => navigate('/shop?category=boots')}>
              <div className="cat-img-wrapper">
                <img src="/images/boots/boot_1_1782232192741.png" alt="Boots Category" className="cat-card-img" />
              </div>
              <div className="cat-card-details">
                <h3>Boots</h3>
                <span>IronClad & Tactical Boots <ArrowRight size={14} /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Products Section */}
      <section className="featured-section py-5">
        <div className="container">
          <div className="section-header flex-between">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Our best-selling footwear of the week</p>
            </div>
            <Link to="/shop" className="btn btn-outline-red">
              View All Collection
            </Link>
          </div>

          {loading ? (
            <div className="loading-grid-spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="featured-products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Embedded CSS for Home Styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Hero Banner */
        .hero-banner {
          position: relative;
          background: radial-gradient(circle at top right, rgba(225, 29, 72, 0.05) 0%, rgba(255, 255, 255, 1) 70%), var(--bg-subtle);
          padding: 6rem 0;
          overflow: hidden;
        }

        .hero-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
        }

        @media (max-width: 992px) {
          .hero-inner {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3rem;
            padding-bottom: 2rem;
          }
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hero-tagline {
          color: var(--primary);
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .hero-title {
          font-size: 3.75rem;
          font-weight: 900;
          line-height: 1.1;
        }

        @media (max-width: 576px) {
          .hero-title {
            font-size: 2.75rem;
          }
        }

        .hero-description {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.7;
          max-width: 500px;
        }

        @media (max-width: 992px) {
          .hero-description {
            margin: 0 auto;
          }
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        @media (max-width: 992px) {
          .hero-actions {
            justify-content: center;
          }
        }

        .hero-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-circle-accent {
          position: absolute;
          width: 320px;
          height: 320px;
          background: linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(225, 29, 72, 0.02) 100%);
          border-radius: 50%;
          z-index: 1;
        }

        .hero-shoe-image {
          position: relative;
          max-width: 85%;
          z-index: 2;
          transform: rotate(-15deg) translateY(-20px);
          animation: floatShoe 6s ease-in-out infinite;
          mix-blend-mode: multiply;
        }

        @keyframes floatShoe {
          0%, 100% { transform: rotate(-15deg) translateY(-20px); }
          50% { transform: rotate(-12deg) translateY(-40px); }
        }

        /* Features Strip */
        .features-strip {
          background-color: var(--white);
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 2.5rem 0;
        }

        .features-inner {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        @media (max-width: 992px) {
          .features-inner {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 576px) {
          .features-inner {
            grid-template-columns: 1fr;
          }
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .feature-icon {
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 0.8rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-item h4 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .feature-item p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        /* Common Section Headers */
        .section-header {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .section-subtitle {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-top: 0.35rem;
        }

        /* Categories Section */
        .categories-grid-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        @media (max-width: 992px) {
          .categories-grid-row {
            grid-template-columns: 1fr;
          }
        }

        .category-card {
          background-color: var(--bg-subtle);
          border-radius: 24px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid var(--border-light);
          transition: var(--transition-smooth);
        }

        .category-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .cat-img-wrapper {
          aspect-ratio: 1.4;
          overflow: hidden;
          background-color: var(--bg-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .cat-card-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
          transition: var(--transition-smooth);
        }

        .category-card:hover .cat-card-img {
          transform: scale(1.06);
        }

        .cat-card-details {
          padding: 1.5rem;
          background-color: var(--white);
          border-top: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .cat-card-details h3 {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .cat-card-details span {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary);
        }

        /* Featured Section */
        .featured-products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        @media (max-width: 1200px) {
          .featured-products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .featured-products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 576px) {
          .featured-products-grid {
            grid-template-columns: 1fr;
          }
        }

        .loading-grid-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 250px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--border-light);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
