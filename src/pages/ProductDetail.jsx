import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Shield, RotateCcw, Truck, Minus, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const wishlisted = product ? isInWishlist(product.id) : false;

  useDocumentTitle(product ? `${product.name} - Premium Shoe` : 'Product Details');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Selections
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Available Sizes for RockyShoes
  const availableSizes = ['6', '7', '8', '9', '10', '11'];

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        // Fetch current product
        const { data: currentProduct, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError) throw productError;
        setProduct(currentProduct);

        // Fetch related products in the same category
        if (currentProduct) {
          const { data: related, error: relatedError } = await supabase
            .from('products')
            .select('*')
            .eq('category', currentProduct.category)
            .neq('id', currentProduct.id)
            .limit(3);

          if (!relatedError) {
            setRelatedProducts(related || []);
          }
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    // Reset selections on product change
    setSelectedSize('');
    setQuantity(1);
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a shoe size (UK) before adding to cart.");
      return;
    }
    addToCart(product, quantity, selectedSize);
    toggleCart(true); // Open cart drawer to give direct checkout feedback
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="product-detail-page animate-fade">
      <div className="container detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <Link to="/">Home</Link> &rsaquo; <Link to="/shop">Shop</Link> &rsaquo; <span className="current-path">{product.name}</span>
        </div>

        {/* Product Presentation Grid */}
        <div className="product-presentation-grid">
          {/* Left Pane: Image Showcase */}
          <div className="detail-image-pane">
            <div className="image-showcase-box">
              <img
                src={product.image_url}
                alt={product.name}
                className="showcase-img"
              />
              {isOutOfStock && (
                <div className="sold-out-badge-detail">Sold Out</div>
              )}
            </div>
          </div>

          {/* Right Pane: Purchase Controls */}
          <div className="detail-info-pane">
            <span className="info-category-tag">
              {product.category === 'running_shoes' ? 'Running Shoes' : product.category}
            </span>
            
            <h1 className="info-title-heading">{product.name}</h1>
            
            <div className="info-price-row">
              <span className="price-tag">₹{product.price.toLocaleString('en-IN')}</span>
              {isOutOfStock ? (
                <span className="stock-tag out">Out of Stock</span>
              ) : (
                <span className="stock-tag in">In Stock ({product.stock} left)</span>
              )}
            </div>

            <p className="info-desc-paragraph">{product.description}</p>

            <hr className="info-divider" />

            {/* Size Selector */}
            <div className="selector-section">
              <div className="flex-between">
                <span className="selector-title">Select Size (UK)</span>
                <a href="#size-guide" className="size-guide-link">Size Guide</a>
              </div>
              <div className="size-grid">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => !isOutOfStock && setSelectedSize(size)}
                    disabled={isOutOfStock}
                    className={`size-box-btn ${selectedSize === size ? 'selected' : ''}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="selector-section qty-selector-section">
              <span className="selector-title">Quantity</span>
              <div className="qty-picker-container">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={isOutOfStock || quantity <= 1}
                  className="qty-picker-btn"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-picker-val">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={isOutOfStock || quantity >= product.stock}
                  className="qty-picker-btn"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to Cart Actions */}
            <div className="info-action-row">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="btn btn-primary btn-block btn-add-cart-detail"
              >
                <ShoppingBag size={20} /> Add To Shopping Bag
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`btn-wishlist-detail ${wishlisted ? 'active' : ''}`}
                title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={20} fill={wishlisted ? "var(--primary)" : "none"} />
              </button>
            </div>

            {/* Policy Hooks */}
            <div className="detail-safety-hooks">
              <p><Truck size={16} /> Free Express Delivery across India</p>
              <p><RotateCcw size={16} /> 30-day hassle-free replacement warranty</p>
              <p><Shield size={16} /> Secure payment checkout by Razorpay API</p>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="related-section py-5">
            <h2 className="section-title">You May Also Like</h2>
            <p className="section-subtitle">Recommended matching items</p>
            <div className="related-grid my-4">
              {relatedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Embedded CSS for Product Detail Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-loading-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80vh;
        }

        .detail-container {
          padding-top: 2rem;
          padding-bottom: 5rem;
        }

        .breadcrumb-nav {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 2rem;
          font-weight: 500;
        }

        .breadcrumb-nav a:hover {
          color: var(--primary);
        }

        .current-path {
          color: var(--text-main);
          font-weight: 600;
        }

        .product-presentation-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 4rem;
          align-items: start;
        }

        @media (max-width: 992px) {
          .product-presentation-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
        }

        /* Image Pane */
        .detail-image-pane {
          position: sticky;
          top: calc(var(--header-height) + 2rem);
        }

        @media (max-width: 992px) {
          .detail-image-pane {
            position: relative;
            top: 0;
          }
        }

        .image-showcase-box {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          border-radius: 24px;
          aspect-ratio: 1.15;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          position: relative;
          overflow: hidden;
        }

        .showcase-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
          transition: var(--transition-smooth);
        }

        .showcase-img:hover {
          transform: scale(1.05) rotate(-1deg);
        }

        .sold-out-badge-detail {
          position: absolute;
          background-color: var(--black);
          color: var(--white);
          font-size: 1rem;
          font-weight: 700;
          padding: 0.75rem 2rem;
          border-radius: 50px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: var(--shadow-md);
        }

        /* Info Pane */
        .detail-info-pane {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-category-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .info-title-heading {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.15;
        }

        @media (max-width: 576px) {
          .info-title-heading {
            font-size: 2rem;
          }
        }

        .info-price-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .price-tag {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary);
        }

        .stock-tag {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.35rem 0.85rem;
          border-radius: 30px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .stock-tag.in {
          background-color: hsl(142, 70%, 95%);
          color: var(--success);
        }

        .stock-tag.out {
          background-color: hsl(0, 84%, 95%);
          color: var(--error);
        }

        .info-desc-paragraph {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--text-muted);
        }

        .info-divider {
          border: 0;
          border-top: 1px solid var(--border-light);
          margin: 0.5rem 0;
        }

        /* Selectors */
        .selector-section {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .selector-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .size-guide-link {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: underline;
        }

        .size-guide-link:hover {
          color: var(--primary);
        }

        .size-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.75rem;
        }

        .size-box-btn {
          height: 48px;
          border: 1px solid var(--border-light);
          background-color: var(--white);
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 10px;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .size-box-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .size-box-btn.selected {
          background-color: var(--primary);
          color: var(--white);
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
        }

        .size-box-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Quantity selector */
        .qty-selector-section {
          flex-direction: row;
          align-items: center;
          gap: 2rem;
        }

        .qty-picker-container {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid var(--border-light);
          border-radius: 8px;
          background-color: var(--white);
        }

        .qty-picker-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }

        .qty-picker-btn:hover:not(:disabled) {
          color: var(--primary);
          background-color: var(--bg-subtle);
        }

        .qty-picker-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .qty-picker-val {
          font-size: 0.95rem;
          font-weight: 700;
          width: 40px;
          text-align: center;
        }

        /* Purchase Row */
        .info-action-row {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-add-cart-detail {
          padding: 1rem 2rem !important;
          border-radius: 12px;
          font-weight: 700;
        }

        .btn-wishlist-detail {
          width: 54px;
          height: 54px;
          border-radius: 12px;
          border: 1.5px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: var(--transition-smooth);
        }

        .btn-wishlist-detail:hover {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .btn-wishlist-detail.active {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .detail-safety-hooks {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.25rem;
          background-color: var(--bg-subtle);
          border-radius: 16px;
          margin-top: 1rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .detail-safety-hooks p {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .detail-safety-hooks svg {
          color: var(--primary);
        }

        /* Related Products Grid */
        .related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .related-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </div>
  );
}
