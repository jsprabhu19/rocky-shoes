import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock <= 0;

  // Format category name for human consumption
  const formatCategory = (cat) => {
    if (cat === 'running_shoes') return 'Running Shoes';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className="product-card animate-fade">
      {/* Category Badge */}
      <span className="product-category-badge">
        {formatCategory(product.category)}
      </span>

      {/* Product Image Container */}
      <Link to={`/product/${product.id}`} className="product-image-link">
        <div className="product-image-container">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="product-card-img"
          />
          {isOutOfStock && (
            <div className="out-of-stock-overlay">
              <span>Sold Out</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Details */}
      <div className="product-card-details">
        <Link to={`/product/${product.id}`}>
          <h3 className="product-card-title">{product.name}</h3>
        </Link>
        
        <p className="product-card-description">
          {product.description ? `${product.description.slice(0, 60)}...` : 'Premium footwear designed for comfort.'}
        </p>

        <div className="product-card-footer">
          <span className="product-card-price">₹{product.price.toLocaleString('en-IN')}</span>
          
          {isOutOfStock ? (
            <button className="btn-card-cart disabled" disabled title="Out of Stock">
              <ShoppingCart size={16} />
            </button>
          ) : (
            <Link
              to={`/product/${product.id}`}
              className="btn-card-cart"
              title="View Options"
            >
              <ShoppingCart size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* Embedded CSS for Product Card Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .product-card {
          position: relative;
          background-color: var(--white);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          overflow: hidden;
          transition: var(--transition-smooth);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .product-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .product-category-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background-color: rgba(255, 255, 255, 0.95);
          color: var(--text-main);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.4rem 0.8rem;
          border-radius: 30px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid var(--border-light);
          z-index: 5;
          box-shadow: var(--shadow-sm);
        }

        .product-image-link {
          display: block;
          overflow: hidden;
          background-color: var(--bg-subtle);
        }

        .product-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1.15;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          overflow: hidden;
        }

        .product-card-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: var(--transition-smooth);
          mix-blend-mode: multiply;
        }

        .product-card:hover .product-card-img {
          transform: scale(1.08) rotate(-2deg);
        }

        .out-of-stock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4;
        }

        .out-of-stock-overlay span {
          background-color: var(--text-main);
          color: var(--white);
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.5rem 1.2rem;
          border-radius: 50px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .product-card-details {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .product-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.4rem;
          line-height: 1.3;
          height: 1.3em;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .product-card-title:hover {
          color: var(--primary);
        }

        .product-card-description {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
          line-height: 1.5;
          flex-grow: 1;
        }

        .product-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .product-card-price {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--primary);
        }

        .btn-card-cart {
          background-color: var(--bg-subtle);
          color: var(--text-main);
          border: 1px solid var(--border-light);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }

        .product-card:hover .btn-card-cart:not(.disabled) {
          background-color: var(--primary);
          color: var(--white);
          border-color: var(--primary);
          box-shadow: 0 4px 10px rgba(225, 29, 72, 0.25);
        }

        .btn-card-cart.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}} />
    </div>
  );
}
