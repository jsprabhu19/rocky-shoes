import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const storedCart = localStorage.getItem('rockyshoes_cart');
      return storedCart ? JSON.parse(storedCart) : [];
    } catch {
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('rockyshoes_cart', JSON.stringify(cart));
  }, [cart]);

  // Operations
  const addToCart = (product, quantity = 1, size) => {
    if (!size) {
      alert("Please select a size");
      return;
    }

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        return [...prevCart, { product, quantity, size }];
      }
    });

    // Trigger cart badge bounce micro-animation
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 800);
  };

  const removeFromCart = (productId, size) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.product.id === productId && item.size === size))
    );
  };

  const updateCartQuantity = (productId, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId && item.size === size
          ? { ...item, quantity: Number(quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleCart = (open) => {
    setIsCartOpen(open !== undefined ? open : !isCartOpen);
  };

  // Computations
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        cartBounce,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleCart,
        totalQuantity,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
