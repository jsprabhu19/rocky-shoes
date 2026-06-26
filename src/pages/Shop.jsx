import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, Search, RotateCcw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Shop() {
  const location = useLocation();

  // All products from DB
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isInWishlist } = useWishlist();

  // Filters State
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState(15000);
  const [sortOption, setSortOption] = useState('default');
  const [wishlistOnly, setWishlistOnly] = useState(false);

  useDocumentTitle(wishlistOnly ? 'Your Wishlist' : 'Shop Collections');
  
  // Mobile filter drawer visibility
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync category & search query from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category');
    const searchParam = params.get('search');
    const wishParam = params.get('wishlist');

    if (catParam) {
      setCategoryFilter(catParam);
    } else {
      setCategoryFilter('all');
    }

    if (searchParam) {
      setSearchFilter(searchParam);
    } else {
      setSearchFilter('');
    }

    setWishlistOnly(wishParam === 'true');
  }, [location.search]);

  // Fetch all products on mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error loading products from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  // Filter and Sort Logic (Snappy Client-Side)
  const filteredProducts = products
    .filter((product) => {
      // Search matching
      const matchesSearch =
        product.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchFilter.toLowerCase()));
      
      // Category matching
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      // Price matching
      const matchesPrice = product.price <= priceRange;

      // Wishlist matching
      const matchesWishlist = !wishlistOnly || isInWishlist(product.id);

      return matchesSearch && matchesCategory && matchesPrice && matchesWishlist;
    })
    .sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
      return 0; // Default ordering from database
    });

  const handleResetFilters = () => {
    setSearchFilter('');
    setCategoryFilter('all');
    setPriceRange(15000);
    setSortOption('default');
  };

  return (
    <div className="shop-page animate-fade">
      <div className="container shop-container">
        {/* Page Title */}
        <div className="shop-header">
          <h1 className="shop-title-text">
            {wishlistOnly ? 'Your Saved Footwear' : 'Rocky Footwear Catalog'}
          </h1>
          <p className="shop-subtitle-text">
            {wishlistOnly 
              ? `You have saved ${filteredProducts.length} shoe models` 
              : `Showing ${filteredProducts.length} Premium Shoes`}
          </p>
        </div>

        {/* Layout Row */}
        <div className="shop-layout">
          {/* 1. Sidebar Filters (Desktop) */}
          <aside className="shop-sidebar-filters">
            <div className="sidebar-header">
              <h3><SlidersHorizontal size={18} /> Filters</h3>
              <button onClick={handleResetFilters} className="btn-reset-filters" title="Reset all filters">
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            <hr className="filter-divider" />

            {/* Filter Section: Search */}
            <div className="filter-section-item">
              <h4 className="filter-section-title">Search</h4>
              <div className="filter-search-box">
                <input
                  type="text"
                  placeholder="Keyword search..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="filter-search-input"
                />
                <Search size={16} className="filter-search-icon" />
              </div>
            </div>

            {/* Filter Section: Category */}
            <div className="filter-section-item">
              <h4 className="filter-section-title">Category</h4>
              <div className="filter-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="category"
                    checked={categoryFilter === 'all'}
                    onChange={() => setCategoryFilter('all')}
                    className="filter-radio-input"
                  />
                  <span>All Collections</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="category"
                    checked={categoryFilter === 'sneakers'}
                    onChange={() => setCategoryFilter('sneakers')}
                    className="filter-radio-input"
                  />
                  <span>Sneakers</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="category"
                    checked={categoryFilter === 'running_shoes'}
                    onChange={() => setCategoryFilter('running_shoes')}
                    className="filter-radio-input"
                  />
                  <span>Running Shoes</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="category"
                    checked={categoryFilter === 'boots'}
                    onChange={() => setCategoryFilter('boots')}
                    className="filter-radio-input"
                  />
                  <span>Boots</span>
                </label>
              </div>
            </div>

            {/* Filter Section: Price */}
            <div className="filter-section-item">
              <div className="flex-between">
                <h4 className="filter-section-title">Max Price</h4>
                <span className="price-range-value">₹{priceRange.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="15000"
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="price-slider-input"
              />
              <div className="price-slider-limits">
                <span>₹2,000</span>
                <span>₹15,000</span>
              </div>
            </div>
          </aside>

          {/* 2. Products Grid Panel */}
          <section className="shop-products-panel">
            {/* Sorting & Mobile Filter Triggers */}
            <div className="shop-controls-strip">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="btn-mobile-filter-trigger"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>

              <div className="shop-sort-dropdown-container">
                <label className="sort-label"><ArrowUpDown size={14} /> Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="sort-dropdown-select"
                >
                  <option value="default">Default Match</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-grid-spinner">
                <div className="spinner"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="shop-no-results">
                <h3>No shoes match your search.</h3>
                <p>Try resetting some filters or adjusting your keyword query.</p>
                <button onClick={handleResetFilters} className="btn btn-primary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="shop-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 3. Mobile Filters Overlay Drawer */}
      {showMobileFilters && (
        <div className="mobile-drawer animate-fade">
          <div className="drawer-overlay" onClick={() => setShowMobileFilters(false)}></div>
          <div className="drawer-content mobile-filter-drawer-content">
            <div className="sidebar-header">
              <h3>Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="btn-close-mobile-filters">Close</button>
            </div>
            
            <hr className="filter-divider" />
            
            {/* Filters Inside Mobile Drawer */}
            <div className="filter-section-item">
              <h4 className="filter-section-title">Search</h4>
              <div className="filter-search-box">
                <input
                  type="text"
                  placeholder="Keyword search..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="filter-search-input"
                />
              </div>
            </div>

            <div className="filter-section-item">
              <h4 className="filter-section-title">Category</h4>
              <div className="filter-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="category-m"
                    checked={categoryFilter === 'all'}
                    onChange={() => { setCategoryFilter('all'); setShowMobileFilters(false); }}
                    className="filter-radio-input"
                  />
                  <span>All Collections</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="category-m"
                    checked={categoryFilter === 'sneakers'}
                    onChange={() => { setCategoryFilter('sneakers'); setShowMobileFilters(false); }}
                    className="filter-radio-input"
                  />
                  <span>Sneakers</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="category-m"
                    checked={categoryFilter === 'running_shoes'}
                    onChange={() => { setCategoryFilter('running_shoes'); setShowMobileFilters(false); }}
                    className="filter-radio-input"
                  />
                  <span>Running Shoes</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="category-m"
                    checked={categoryFilter === 'boots'}
                    onChange={() => { setCategoryFilter('boots'); setShowMobileFilters(false); }}
                    className="filter-radio-input"
                  />
                  <span>Boots</span>
                </label>
              </div>
            </div>

            <div className="filter-section-item">
              <div className="flex-between">
                <h4 className="filter-section-title">Max Price</h4>
                <span className="price-range-value">₹{priceRange.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="15000"
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="price-slider-input"
              />
            </div>

            <button
              onClick={handleResetFilters}
              className="btn btn-secondary btn-block"
              style={{ marginTop: 'auto' }}
            >
              Reset All
            </button>
          </div>
        </div>
      )}

      {/* Embedded CSS for Shop Page Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .shop-container {
          padding-top: 3rem;
          padding-bottom: 5rem;
        }

        .shop-header {
          margin-bottom: 2.5rem;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 1.5rem;
        }

        .shop-title-text {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .shop-subtitle-text {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .shop-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 3rem;
          align-items: start;
        }

        @media (max-width: 992px) {
          .shop-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Sidebar Filters */
        .shop-sidebar-filters {
          background-color: var(--white);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        @media (max-width: 992px) {
          .shop-sidebar-filters {
            display: none;
          }
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .btn-reset-filters {
          font-size: 0.85rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .btn-reset-filters:hover {
          color: var(--primary);
        }

        .filter-divider {
          border: 0;
          border-top: 1px solid var(--border-light);
          margin: 0;
        }

        .filter-section-item {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .filter-section-title {
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-main);
        }

        .filter-search-box {
          position: relative;
        }

        .filter-search-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          font-size: 0.85rem;
          border-radius: 10px;
          border: 1px solid var(--border-light);
          background-color: var(--bg-subtle);
        }

        .filter-search-input:focus {
          border-color: var(--primary);
          background-color: var(--white);
        }

        .filter-search-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .filter-checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .checkbox-label:hover {
          color: var(--primary);
        }

        .filter-radio-input {
          accent-color: var(--primary);
          width: 16px;
          height: 16px;
        }

        .price-range-value {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--primary);
        }

        .price-slider-input {
          width: 100%;
          accent-color: var(--primary);
          cursor: pointer;
        }

        .price-slider-limits {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Products Panel */
        .shop-products-panel {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .shop-controls-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @media (max-width: 992px) {
          .shop-controls-strip {
            justify-content: space-between;
          }
        }

        .btn-mobile-filter-trigger {
          display: none;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--white);
          border: 1px solid var(--border-light);
          padding: 0.7rem 1.2rem;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: 10px;
        }

        @media (max-width: 992px) {
          .btn-mobile-filter-trigger {
            display: inline-flex;
          }
        }

        .shop-sort-dropdown-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: auto;
        }

        .sort-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .sort-dropdown-select {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
        }

        .shop-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        @media (max-width: 1200px) {
          .shop-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 576px) {
          .shop-grid {
            grid-template-columns: 1fr;
          }
        }

        .shop-no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 5rem 0;
          gap: 1rem;
          color: var(--text-muted);
        }

        .shop-no-results h3 {
          color: var(--text-main);
          font-size: 1.5rem;
          font-weight: 800;
        }

        .shop-no-results p {
          max-width: 320px;
          font-size: 0.95rem;
          margin-bottom: 1rem;
        }

        .mobile-filter-drawer-content {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .btn-close-mobile-filters {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--primary);
        }
      `}} />
    </div>
  );
}
