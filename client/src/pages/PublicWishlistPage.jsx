import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { 
  Heart, ShoppingBag, Eye, Globe, Share2, 
  CheckCircle2, Clock, AlertCircle, ShoppingCart, Loader2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PublicWishlistPage() {
  const { shareCode } = useParams();
  const { addToCart } = useCart();

  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPublicWishlist();
  }, [shareCode]);

  const fetchPublicWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/collaborative-wishlists/public/${shareCode}`);
      if (res.data?.success) {
        setWishlist(res.data.wishlist);
      } else {
        setError(res.data?.message || 'Public wishlist not found or sharing has been disabled.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Public collection is private or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Public collection link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCart = (product, item) => {
    if (!product || product.stock <= 0) {
      toast.error('Item is currently out of stock.');
      return;
    }
    addToCart(product, item.desiredQuantity || 1);
    toast.success(`Added ${product.name} to your cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50/30 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-sm">Loading gift collection...</p>
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-screen bg-pink-50/30 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-pink-100 p-8 text-center">
          <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Collection Not Found</h2>
          <p className="text-gray-600 text-sm mb-6">{error || 'This gift list is not publicly shared.'}</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-2xl shadow transition"
          >
            Explore 4U Toys & Gifts
          </Link>
        </div>
      </div>
    );
  }

  const { name, description, coverImage, ownerId, items = [] } = wishlist;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'purchased':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" /> Purchased
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" /> Reserved
          </span>
        );
      case 'planning_to_buy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
            <ShoppingBag className="w-3 h-3" /> Planning to Buy
          </span>
        );
      case 'interested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <Heart className="w-3 h-3" /> Interested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Available
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Banner Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-pink-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden bg-gradient-to-tr from-pink-200 to-rose-100 shadow-md flex-shrink-0 relative">
            {coverImage ? (
              <img src={coverImage} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-pink-400">
                <Heart className="w-14 h-14" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" /> Public Gift Wishlist
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{name}</h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              {description || 'Curated wish list from 4U Toys & Gifts.'}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs sm:text-sm text-gray-500">
              <span>Curated by <span className="font-semibold text-gray-800">{ownerId?.name || 'A customer'}</span></span>
              <span>•</span>
              <span>{items.length} gift items</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={handleShare}
              className="px-5 py-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-600 font-semibold text-sm transition flex items-center justify-center gap-2 border border-pink-200"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? 'Link Copied!' : 'Share Collection'}</span>
            </button>
            <Link
              to="/shop"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-semibold text-sm transition text-center shadow"
            >
              Explore Shop
            </Link>
          </div>
        </div>

        {/* Product Items Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-current" />
              <span>Wishlist Gifts ({items.length})</span>
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 shadow-sm">
              <Heart className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800">No items in this collection yet</h3>
              <p className="text-gray-500 text-sm mt-1">Check back later when more gifts are added!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const product = item.productId;
                if (!product) return null;

                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-3xl p-5 border border-pink-100/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Product image */}
                      <div className="relative w-full h-48 bg-pink-50/50 rounded-2xl overflow-hidden mb-4">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/300x300?text=Gift'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          {getStatusBadge(item.groupStatus)}
                        </div>
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-red-500 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title & Notes */}
                      <Link
                        to={`/product/${product._id}`}
                        className="font-bold text-gray-900 hover:text-pink-600 transition line-clamp-1 text-base"
                      >
                        {product.name}
                      </Link>

                      {item.notes && (
                        <p className="text-xs text-pink-600 bg-pink-50/80 p-2.5 rounded-xl mt-2 italic border border-pink-100">
                          "{item.notes}"
                        </p>
                      )}

                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-pink-600">
                          ₹{product.price?.toLocaleString()}
                        </span>
                        {item.desiredQuantity > 1 && (
                          <span className="text-xs text-gray-500 font-medium">
                            Qty desired: <span className="text-gray-800 font-bold">{item.desiredQuantity}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
                      <Link
                        to={`/product/${product._id}`}
                        className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleAddToCart(product, item)}
                        disabled={isOutOfStock}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to My Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
