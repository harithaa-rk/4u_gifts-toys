import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, Sparkles, Gift, Trash2, ExternalLink, UserCheck, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCollaborativeWishlist } from "../../context/CollaborativeWishlistContext";

const NotificationBell = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptInvitation,
    rejectInvitation,
  } = useCollaborativeWishlist();

  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAcceptInvite = async (e, notif) => {
    e.stopPropagation();
    if (!notif.invitationId) return;
    setProcessingId(notif._id);
    try {
      const res = await acceptInvitation(notif.invitationId);
      await markNotificationAsRead(notif._id);
      setIsOpen(false);
      if (res?.wishlistId) {
        navigate(`/wishlist/${res.wishlistId}`);
      }
    } catch {
      // Handled in context toast
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvite = async (e, notif) => {
    e.stopPropagation();
    if (!notif.invitationId) return;
    setProcessingId(notif._id);
    try {
      await rejectInvitation(notif.invitationId);
      await markNotificationAsRead(notif._id);
    } catch {
      // Handled in context toast
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif._id);
    if (notif.link) {
      setIsOpen(false);
      navigate(notif.link);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadNotificationsCount} unread)`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: isOpen ? "rgba(255, 63, 157, 0.12)" : "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          color: unreadNotificationsCount > 0 ? "#FF3F9D" : "var(--plum)",
          transition: "background 0.2s",
        }}
      >
        <Bell size={19} />
        {unreadNotificationsCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 900,
              width: 17,
              height: 17,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(255, 63, 157, 0.4)",
            }}
          >
            {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: 48,
              right: -10,
              width: "clamp(300px, 85vw, 380px)",
              maxHeight: "480px",
              background: "#FFFFFF",
              borderRadius: "24px",
              boxShadow: "0 20px 60px rgba(64, 32, 68, 0.18)",
              border: "1.5px solid rgba(255, 99, 183, 0.3)",
              zIndex: 1000,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px 12px",
                borderBottom: "1px solid rgba(255, 99, 183, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #FFF9FB 0%, #FAF5FF 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔔</span>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 900, color: "var(--plum)", margin: 0 }}>
                  {t("notifications.title", "Notifications")}
                </h4>
                {unreadNotificationsCount > 0 && (
                  <span
                    style={{
                      background: "rgba(255, 63, 157, 0.15)",
                      color: "#FF3F9D",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: "var(--radius-pill)",
                    }}
                  >
                    {unreadNotificationsCount} new
                  </span>
                )}
              </div>

              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8057E8",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                >
                  {t("notifications.markAllRead", "Mark all read")}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div
              style={{
                overflowY: "auto",
                flex: 1,
                padding: "8px 10px",
                maxHeight: "380px",
              }}
            >
              {notifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  <Sparkles size={32} color="#FF3F9D" style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {t("notifications.noNew", "All caught up! No notifications yet.")}
                  </p>
                  <p style={{ fontSize: 11, margin: "4px 0 0" }}>
                    Wishlist invitations, collaborator updates, and orders will show up here.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isInvite = notif.type === "wishlist_invite" && notif.invitationId;
                  const isUnread = !notif.read;

                  return (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "16px",
                        marginBottom: 6,
                        background: isUnread ? "rgba(255, 240, 246, 0.75)" : "#fff",
                        border: "1px solid",
                        borderColor: isUnread ? "rgba(255, 99, 183, 0.3)" : "rgba(0,0,0,0.04)",
                        cursor: notif.link ? "pointer" : "default",
                        transition: "all 0.15s",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: isInvite
                              ? "rgba(128, 87, 232, 0.15)"
                              : isUnread
                              ? "rgba(255, 63, 157, 0.15)"
                              : "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            color: isInvite ? "#8057E8" : isUnread ? "#FF3F9D" : "var(--plum)",
                          }}
                        >
                          {isInvite ? <Gift size={16} /> : <Sparkles size={16} />}
                        </div>

                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, color: "var(--plum)", margin: 0, fontWeight: isUnread ? 800 : 600, lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "inline-block" }}>
                            {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {isUnread && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#FF3F9D",
                              flexShrink: 0,
                              marginTop: 4,
                            }}
                          />
                        )}
                      </div>

                      {/* Direct Accept / Reject Actions for Invitation Notifications */}
                      {isInvite && (
                        <div style={{ display: "flex", gap: 8, marginTop: 4, paddingLeft: 42 }}>
                          <button
                            type="button"
                            disabled={processingId === notif._id}
                            onClick={(e) => handleAcceptInvite(e, notif)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "var(--radius-pill)",
                              background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                              color: "#fff",
                              border: "none",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: processingId === notif._id ? "wait" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Check size={13} strokeWidth={3} /> Accept & Join
                          </button>

                          <button
                            type="button"
                            disabled={processingId === notif._id}
                            onClick={(e) => handleRejectInvite(e, notif)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "var(--radius-pill)",
                              background: "#f3f4f6",
                              color: "var(--plum)",
                              border: "none",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: processingId === notif._id ? "wait" : "pointer",
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
