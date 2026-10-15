import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import AddToWishlistModal from '../components/wishlist/AddToWishlistModal';
import { API_BASE_URL } from '../utils/constants';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

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

  // Load wishlist from localStorage and migrate legacy saved products to MongoDB
  useEffect(() => {
    if (isLoggedIn) {
      const userId = getUserId();
      const storageKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
      try {
        const stored = localStorage.getItem(storageKey);
        const legacyItems = stored ? JSON.parse(stored) : [];
        setWishlistItems(legacyItems);

        // Safe automatic migration into database "My Wishlist"
        if (legacyItems.length > 0) {
          const token = localStorage.getItem('token');
          axios
            .post(
              `${API_BASE_URL}/collaborative-wishlists/migrate-legacy`,
              { items: legacyItems },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
              if (res.data?.migratedCount > 0) {
                console.log(`Migrated ${res.data.migratedCount} legacy wishlist items to MongoDB.`);
              }
            })
            .catch((err) => {
              console.error('Failed to migrate legacy wishlist items:', err);
            });
        }
      } catch (err) {
        console.error('Error loading wishlist from storage:', err);
        setWishlistItems([]);
      }
    } else {
      setWishlistItems([]);
    }
  }, [isLoggedIn]);

  // Open the Multi-Wishlist Selection Modal for a product
  const openWishlistModal = (product, variant = null) => {
    if (!isLoggedIn) {
      toast.error('Please log in to save items to your wishlists! 💖');
      navigate('/login');
      return;
    }
    setModalProduct(product);
    setSelectedVariant(variant);
    setIsModalOpen(true);
  };

  const closeWishlistModal = () => {
    setIsModalOpen(false);
    setModalProduct(null);
    setSelectedVariant(null);
  };

  // Toggle item in wishlist opens the multi-wishlist selection modal
  const toggleWishlist = (product, variant = null) => {
    openWishlistModal(product, variant);
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => {
      const updated = prev.filter((item) => item._id !== productId);
      const userId = getUserId();
      const storageKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
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
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        openWishlistModal,
        closeWishlistModal,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}

      {/* Global Add to Wishlist Multi-Selection Modal */}
      <AddToWishlistModal
        isOpen={isModalOpen}
        onClose={closeWishlistModal}
        product={modalProduct}
        selectedVariant={selectedVariant}
      />
    </WishlistContext.Provider>
  );
};
