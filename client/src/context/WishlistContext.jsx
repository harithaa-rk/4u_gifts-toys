import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Helper to get user ID from JWT token
  const getUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload).id || null;
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  };

  // Load wishlist from localStorage when logged in status changes
  useEffect(() => {
    if (isLoggedIn) {
      const userId = getUserId();
      const storageKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
      try {
        const stored = localStorage.getItem(storageKey);
        setWishlistItems(stored ? JSON.parse(stored) : []);
      } catch (err) {
        console.error('Error loading wishlist from storage:', err);
        setWishlistItems([]);
      }
    } else {
      setWishlistItems([]);
    }
  }, [isLoggedIn]);

  // Save wishlist helper
  const saveWishlist = (items) => {
    const userId = getUserId();
    const storageKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (err) {
      console.error('Error saving wishlist to storage:', err);
    }
  };

  // Toggle item in wishlist
  const toggleWishlist = (product) => {
    if (!isLoggedIn) {
      toast.error('Please login to wishlist products! 💖', {
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

    setWishlistItems((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item._id !== product._id);
        toast('Removed from wishlist', { icon: '🤍' });
      } else {
        updated = [...prev, product];
        toast.success(`Added to wishlist! ❤️`, {
          style: {
            borderRadius: '20px',
            background: 'var(--card-bg, #fff)',
            color: 'var(--text, #333)',
            boxShadow: '0 10px 25px rgba(255, 77, 109, 0.2)',
          },
        });
      }
      saveWishlist(updated);
      return updated;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => {
      const updated = prev.filter((item) => item._id !== productId);
      saveWishlist(updated);
      return updated;
    });
    toast('Removed from wishlist', { icon: '🤍' });
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item._id === productId);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    const userId = getUserId();
    const storageKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
    localStorage.removeItem(storageKey);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      toggleWishlist,
      removeFromWishlist,
      isInWishlist,
      clearWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
