import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Add product to cart
  const addToCart = (product) => {
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart! 🛍️', {
        style: {
          borderRadius: '20px',
          background: 'var(--card-bg, #fff)',
          color: 'var(--text, #333)',
          boxShadow: '0 10px 25px rgba(255, 77, 109, 0.2)',
        },
      });
      navigate('/login');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, cartQty: item.cartQty + 1 } : item
        );
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
    toast.success(`${product.name} added to cart! 🛍️`, {
      style: {
        borderRadius: '20px',
        background: 'var(--card-bg, #fff)',
        color: 'var(--text, #333)',
        boxShadow: '0 10px 25px rgba(255, 77, 109, 0.2)',
      },
    });
    setIsCartOpen(true);
  };

  // Remove a single product from cart
  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item._id !== productId));
    toast('Item removed', { icon: '🗑️' });
  };

  // Update quantity (+1 or -1)
  const updateQuantity = (productId, amount) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item._id === productId) {
          const newQty = Math.max(1, item.cartQty + amount);
          return { ...item, cartQty: newQty };
        }
        return item;
      })
    );
  };

  // Clear entire cart (called after placing order)
  const clearCart = () => setCartItems([]);

  const toggleCart = () => setIsCartOpen((prev) => !prev);
  const closeCart = () => setIsCartOpen(false);
  const openCart = () => setIsCartOpen(true);

  const cartTotal = cartItems.reduce((total, item) => total + (+item.price * item.cartQty), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.cartQty, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      toggleCart,
      closeCart,
      openCart,
      cartTotal,
      cartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};
