import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Plus, Check, Lock, Users, Globe, X, 
  Sparkles, Gift, CheckSquare, Square, FolderHeart, 
  ArrowRight, Loader2, AlertCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useCollaborativeWishlist } from "../../context/CollaborativeWishlistContext";
import toast from "react-hot-toast";

const AddToWishlistModal = ({ 
  isOpen = false, 
  onClose, 
  product, 
  selectedVariant = null 
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const {
    ownedWishlists,
    sharedWishlists,
    fetchWishlists,
    createWishlist,
    addProductsToMultipleWishlists,
  } = useCollaborativeWishlist();

  // All wishlists the user has permission to add products to (Owned + Shared as Editor)
  const availableLists = [
    ...ownedWishlists,
    ...sharedWishlists.filter((w) => w.currentUserRole === "editor" || w.currentUserRole === "owner"),
  ];

  // Selected Wishlist IDs (Array / Set)
  const [selectedIds, setSelectedIds] = useState([]);
  const [desiredQuantity, setDesiredQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline "Create New Wishlist" form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [newListVisibility, setNewListVisibility] = useState("private");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Initialize selection when modal opens or availableLists changes
  useEffect(() => {
    if (isOpen) {
      // If user has lists and none selected, pre-select the primary or first list
      if (availableLists.length > 0 && selectedIds.length === 0) {
        const primary = availableLists.find((w) => w.isPrimary) || availableLists[0];
        setSelectedIds([primary._id]);
      }
    } else {
      // Reset form states on close
      setShowCreateForm(false);
      setNewListName("");
      setNewListDesc("");
      setNote("");
      setDesiredQuantity(1);
    }
  }, [isOpen, availableLists.length]);

  if (!isOpen || !product) return null;

  // Toggle wishlist selection checkbox
  const handleToggleWishlist = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Inline Create Wishlist Handler
  const handleCreateNewWishlist = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) {
      toast.error("Please enter a name for your wishlist.");
      return;
    }

    setIsCreatingList(true);
    try {
      const created = await createWishlist({
        name: newListName.trim(),
        description: newListDesc.trim(),
        visibility: newListVisibility,
      });

      if (created?._id) {
        // Automatically check the newly created list!
        setSelectedIds((prev) => [...prev, created._id]);
        setShowCreateForm(false);
        setNewListName("");
        setNewListDesc("");
        toast.success(`Created "${created.name}" and selected it! ✨`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create wishlist.");
    } finally {
      setIsCreatingList(false);
    }
  };

  // Save Product to All Selected Wishlists
  const handleSaveToSelected = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to save items to your wishlists! 💖");
      navigate("/login");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Please select at least one wishlist.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addProductsToMultipleWishlists(selectedIds, product._id, {
        variantName: selectedVariant,
        desiredQuantity,
        note: note.trim(),
      });

      if (res?.success) {
        const addedNames = res.results
          .filter((r) => r.status === "added")
          .map((r) => `"${r.name}"`);

        const alreadyNames = res.results
          .filter((r) => r.status === "already_exists")
          .map((r) => `"${r.name}"`);

        if (addedNames.length > 0) {
          const msg = `Saved to ${addedNames.join(", ")}! 🎁${
            alreadyNames.length > 0 ? ` (Already saved in ${alreadyNames.join(", ")})` : ""
          }`;
          
          toast((tObj) => (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{msg}</div>
              <button
                onClick={() => {
                  toast.dismiss(tObj.id);
                  navigate(`/wishlist/${selectedIds[0]}`);
                }}
                style={{
                  background: "#FF3F9D",
                  color: "#fff",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "100px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                View
              </button>
            </div>
          ), { duration: 4000 });
        } else if (alreadyNames.length > 0) {
          toast.info(`Already saved in ${alreadyNames.join(", ")}.`);
        }

        onClose();
      }
    } catch (err) {
      console.error("Batch add error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const productImage = product.images?.[0] || "https://via.placeholder.com/120";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(38, 16, 43, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#FFFFFF",
          borderRadius: "28px",
          border: "2px solid rgba(255, 99, 183, 0.35)",
          boxShadow: "0 20px 60px rgba(64, 32, 68, 0.22)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            background: "linear-gradient(135deg, #FFF9FB 0%, #FFF0F6 100%)",
            borderBottom: "1.5px solid rgba(255, 99, 183, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(255, 63, 157, 0.3)",
              }}
            >
              <Heart size={20} fill="#fff" />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 900,
                  color: "var(--plum)",
                  margin: 0,
                }}
              >
                Save to Wishlists
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                Select one or more collections for this gift
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-muted)",
              transition: "all 0.2s",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected Product Summary Card */}
        <div
          style={{
            padding: "14px 20px",
            background: "#FFFDFD",
            borderBottom: "1px solid #f3e8ee",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "14px",
              background: "#fff",
              border: "1.5px solid rgba(255, 99, 183, 0.25)",
              overflow: "hidden",
              flexShrink: 0,
              padding: 4,
            }}
          >
            <img
              src={productImage}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--plum)",
                margin: "0 0 4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {product.name}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#FF3F9D" }}>
                ₹{(+product.price).toLocaleString("en-IN")}
              </span>
              {selectedVariant && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#F3F4F6",
                    color: "var(--plum)",
                    padding: "2px 8px",
                    borderRadius: "100px",
                  }}
                >
                  {selectedVariant}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Wishlists Selection List */}
        <div
          style={{
            padding: "16px 20px",
            overflowY: "auto",
            flex: 1,
            maxHeight: "340px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)" }}>
              Your Wishlists ({availableLists.length})
            </span>
            {!showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#FF3F9D",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Plus size={14} strokeWidth={3} />
                <span>Create New</span>
              </button>
            )}
          </div>

          {/* Inline Create Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateNewWishlist}
                style={{
                  background: "linear-gradient(135deg, #FFF0F6 0%, #FAF5FF 100%)",
                  borderRadius: "18px",
                  border: "1.5px solid #FF3F9D",
                  padding: "14px 16px",
                  marginBottom: 8,
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: "#FF3F9D", textTransform: "uppercase" }}>
                    New Wishlist Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Wishlist name (e.g., Birthday Gifts, Diwali)"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid rgba(255, 99, 183, 0.4)",
                    fontSize: 13,
                    marginBottom: 8,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="text"
                  placeholder="Optional description"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    marginBottom: 10,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {["private", "shared", "public"].map((vis) => (
                    <button
                      key={vis}
                      type="button"
                      onClick={() => setNewListVisibility(vis)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: newListVisibility === vis ? "#FF3F9D" : "#e5e7eb",
                        background: newListVisibility === vis ? "#FF3F9D" : "#fff",
                        color: newListVisibility === vis ? "#fff" : "var(--plum)",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    >
                      {vis}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isCreatingList || !newListName.trim()}
                  style={{
                    width: "100%",
                    padding: "9px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {isCreatingList ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Create & Select</span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List of Wishlists with Checkboxes */}
          {availableLists.length === 0 ? (
            <div style={{ textAlign: "center", padding: "26px 12px", color: "var(--text-muted)", fontSize: 13 }}>
              No wishlists found. Click "+ Create New" above to create your first gift list!
            </div>
          ) : (
            availableLists.map((w) => {
              const isChecked = selectedIds.includes(w._id);
              const previewImg = w.items?.[0]?.productId?.images?.[0] || w.coverImage;
              const itemCount = w.items?.length || 0;

              return (
                <div
                  key={w._id}
                  onClick={() => handleToggleWishlist(w._id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    borderRadius: "16px",
                    border: "1.5px solid",
                    borderColor: isChecked ? "#FF3F9D" : "#e5e7eb",
                    background: isChecked ? "rgba(255, 63, 157, 0.05)" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Custom Checkbox */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "6px",
                      border: "2px solid",
                      borderColor: isChecked ? "#FF3F9D" : "#d1d5db",
                      background: isChecked ? "#FF3F9D" : "#fff",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {isChecked && <Check size={14} strokeWidth={3} />}
                  </div>

                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      background: "#FFF0F6",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {previewImg ? (
                      <img src={previewImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <FolderHeart size={18} color="#FF3F9D" />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "var(--plum)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {w.name}
                      </span>
                      {w.visibility === "shared" && (
                        <span style={{ color: "#8057E8" }} title="Shared collection">
                          <Users size={12} />
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Quantity & Notes Accordion */}
          <div
            style={{
              marginTop: 6,
              paddingTop: 12,
              borderTop: "1px dashed #e5e7eb",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)" }}>
                Desired Quantity:
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid rgba(255, 99, 183, 0.4)",
                  borderRadius: "100px",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setDesiredQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: 30,
                    height: 30,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--plum)",
                  }}
                >
                  −
                </button>
                <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 900 }}>
                  {desiredQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setDesiredQuantity((q) => q + 1)}
                  style={{
                    width: 30,
                    height: 30,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--plum)",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Optional gift note (e.g., Preferred color Pink / Size L)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 20px",
            background: "#FFF9FB",
            borderTop: "1.5px solid rgba(255, 99, 183, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "11px 18px",
              borderRadius: "100px",
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--plum)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveToSelected}
            disabled={isSubmitting || selectedIds.length === 0}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: "100px",
              background:
                selectedIds.length === 0
                  ? "#e5e7eb"
                  : "linear-gradient(135deg, #FF3F9D 0%, #8057E8 100%)",
              color: selectedIds.length === 0 ? "#9ca3af" : "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 900,
              cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
              boxShadow:
                selectedIds.length === 0
                  ? "none"
                  : "0 6px 20px rgba(255, 63, 157, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Heart size={16} fill="#fff" />
            )}
            <span>
              {selectedIds.length === 0
                ? "Select a Wishlist"
                : selectedIds.length === 1
                ? "Add to 1 Wishlist"
                : `Add to ${selectedIds.length} Wishlists`}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddToWishlistModal;
