import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  
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
  const [isDbCartLoaded, setIsDbCartLoaded] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('rockyshoes_cart', JSON.stringify(cart));
  }, [cart]);

  // 1. Fetch & Merge Cart on Login
  useEffect(() => {
    const loadCartFromDb = async () => {
      if (!user) {
        setIsDbCartLoaded(false);
        return;
      }

      try {
        const { data: dbCart, error: cartErr } = await supabase
          .from('carts')
          .select(`
            id,
            cart_items (
              quantity,
              size,
              product_id,
              products (*)
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (cartErr) throw cartErr;

        let mergedCart = [...cart];
        if (dbCart && dbCart.cart_items) {
          dbCart.cart_items.forEach((dbItem) => {
            if (!dbItem.products) return;
            const existingIndex = mergedCart.findIndex(
              (localItem) => localItem.product.id === dbItem.product_id && localItem.size === dbItem.size
            );
            if (existingIndex > -1) {
              // Merge by taking the maximum quantity to avoid reduction anomalies
              mergedCart[existingIndex].quantity = Math.max(mergedCart[existingIndex].quantity, dbItem.quantity);
            } else {
              mergedCart.push({
                product: dbItem.products,
                quantity: dbItem.quantity,
                size: dbItem.size
              });
            }
          });
        }

        setCart(mergedCart);
        setIsDbCartLoaded(true);
      } catch (err) {
        console.error("Error loading cart from Supabase:", err);
        // Fallback: mark as loaded so the user can still interact with their local cart
        setIsDbCartLoaded(true);
      }
    };

    loadCartFromDb();
  }, [user]);

  // 2. Sync Local Cart Changes to Supabase
  useEffect(() => {
    const syncCartToDb = async () => {
      if (!user || !isDbCartLoaded) return;

      try {
        // Find or create cart
        let { data: dbCart, error: cartErr } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cartErr) throw cartErr;

        let cartId;
        if (!dbCart) {
          const { data: newCart, error: newCartErr } = await supabase
            .from('carts')
            .insert({ user_id: user.id })
            .select('id')
            .single();
          if (newCartErr) throw newCartErr;
          cartId = newCart.id;
        } else {
          cartId = dbCart.id;
          // Touch cart timestamp
          await supabase
            .from('carts')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', cartId);
        }

        // Clear existing cart items in DB
        const { error: deleteErr } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartId);
        if (deleteErr) throw deleteErr;

        // Insert current items
        if (cart.length > 0) {
          const itemsToInsert = cart.map((item) => ({
            cart_id: cartId,
            product_id: item.product.id,
            quantity: item.quantity,
            size: item.size
          }));

          const { error: insertErr } = await supabase
            .from('cart_items')
            .insert(itemsToInsert);
          if (insertErr) throw insertErr;
        }
      } catch (err) {
        console.error("Error syncing cart to Supabase:", err);
      }
    };

    // Debounce DB sync to optimize throughput during rapid clicking
    const timeout = setTimeout(syncCartToDb, 1000);
    return () => clearTimeout(timeout);
  }, [cart, user, isDbCartLoaded]);

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
