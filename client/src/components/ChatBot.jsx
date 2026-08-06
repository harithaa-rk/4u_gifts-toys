import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, ShoppingBag, Sparkles, MessageSquareHeart } from 'lucide-react';
import axios from 'axios';

const API = "http://localhost:5000/api";

// ─── Trendy Google Font ───
const CHAT_FONT = "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif";

// Inject Google Font stylesheet once
if (typeof document !== 'undefined' && !document.getElementById('chatbot-font')) {
  const link = document.createElement('link');
  link.id = 'chatbot-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

// ─── Animated typing dots ───
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginBottom: '16px',
    }}
  >
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #ff4d6d, #ff758f)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 4px 12px rgba(255, 77, 109, 0.3)',
    }}>
      <Bot size={18} color="#fff" />
    </div>
    <div style={{
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '18px 18px 18px 4px',
      padding: '14px 20px',
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
    }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: 'easeInOut' }}
          style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff4d6d, #ff758f)',
          }}
        />
      ))}
    </div>
  </motion.div>
);

// ─── Product card in chat ───
const ProductCard = ({ product }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.03, y: -2 }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    style={{
      minWidth: '180px',
      maxWidth: '180px',
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      cursor: 'pointer',
      flexShrink: 0,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    }}
  >
    {product.image ? (
      <img src={product.image} alt={product.name}
        style={{ width: '100%', height: '110px', objectFit: 'cover' }}
      />
    ) : (
      <div style={{
        width: '100%', height: '110px',
        background: 'linear-gradient(135deg, rgba(255, 77, 109, 0.3), rgba(255, 179, 193, 0.3))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '40px',
      }}>🎁</div>
    )}
    <div style={{ padding: '12px', fontFamily: CHAT_FONT }}>
      <div style={{
        fontSize: '14px', fontWeight: 600, color: '#f0f0f0',
        marginBottom: '6px', lineHeight: 1.4,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        letterSpacing: '0.1px',
      }}>{product.name}</div>
      <div style={{
        fontSize: '16px', fontWeight: 700,
        background: 'linear-gradient(135deg, #ff4d6d, #ff8fa3)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>₹{(+product.price).toLocaleString('en-IN')}</div>
    </div>
  </motion.div>
);

// ─── Single chat message ───
const ChatMessage = ({ msg, index }) => {
  const isUser = msg.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.05 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        maxWidth: '85%',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}>
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: isUser
              ? 'linear-gradient(135deg, #667eea, #764ba2)'
              : 'linear-gradient(135deg, #ff4d6d, #ff758f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isUser
              ? '0 4px 12px rgba(102, 126, 234, 0.4)'
              : '0 4px 12px rgba(255, 77, 109, 0.3)',
          }}
        >
          {isUser ? <User size={18} color="#fff" /> : <Bot size={18} color="#fff" />}
        </motion.div>

        {/* Message bubble */}
        <div style={{
          fontFamily: CHAT_FONT,
          background: isUser
            ? 'linear-gradient(135deg, #667eea, #764ba2)'
            : 'rgba(255, 255, 255, 0.12)',
          backdropFilter: isUser ? 'none' : 'blur(20px)',
          border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          padding: '16px 20px',
          color: isUser ? '#fff' : '#f0e8f8',
          fontSize: '15px',
          lineHeight: 1.7,
          fontWeight: 400,
          letterSpacing: '0.2px',
          boxShadow: isUser
            ? '0 4px 15px rgba(102, 126, 234, 0.3)'
            : '0 4px 15px rgba(0, 0, 0, 0.1)',
          wordBreak: 'break-word',
        }}>
          {msg.text.split('\n').map((line, i) => (
            <span key={i}>
              {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1 ? <strong key={j} style={{ fontWeight: 700, color: '#fff' }}>{part}</strong> : part
              )}
              {i < msg.text.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>

      {/* Products carousel */}
      {msg.products && msg.products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            padding: '12px 0 4px 46px',
            maxWidth: '100%',
            scrollbarWidth: 'none',
          }}
        >
          {msg.products.map((p, i) => (
            <ProductCard key={p._id || i} product={p} />
          ))}
        </motion.div>
      )}

      {/* Suggestion chips */}
      {msg.suggestions && msg.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '10px 0 0 46px',
          }}
        >
          {msg.suggestions.map((s, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => msg.onSuggestionClick?.(s)}
              style={{
                fontFamily: CHAT_FONT,
                padding: '9px 18px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 77, 109, 0.5)',
                background: 'rgba(255, 77, 109, 0.18)',
                color: '#ffb3c1',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
                letterSpacing: '0.2px',
              }}
            >
              {s}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

// ─── Floating Particles Background ───
const Particles = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        animate={{
          y: [0, -200, 0],
          x: [0, Math.random() * 60 - 30, 0],
          opacity: [0, 0.6, 0],
          scale: [0.5, 1, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 6 + Math.random() * 4,
          delay: i * 1.2,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: `${15 + i * 14}%`,
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
          borderRadius: '50%',
          background: 'rgba(255, 77, 109, 0.3)',
          filter: 'blur(1px)',
        }}
      />
    ))}
  </div>
);

// ═══════════════════════════════════════════
// ─── MAIN CHATBOT COMPONENT ───
// ═══════════════════════════════════════════
const ChatBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hey there! 👋✨ I'm the 4U Toys assistant! Ask me anything — I can search products, find gifts by price, browse categories, and more!",
      suggestions: ["Show popular products", "What categories do you have?", "Gifts under ₹500"],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;

    const userMsg = { sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post(`${API}/chat`, { message: userText });
      const data = res.data;

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply,
            products: data.products || [],
            suggestions: data.suggestions || [],
          },
        ]);
      }, 800 + Math.random() * 600); // Realistic typing delay
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "Oops! I couldn't reach the server right now 😥 Please make sure the backend is running and try again!",
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 998,
            }}
          />

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '24px',
              width: '420px',
              maxWidth: 'calc(100vw - 48px)',
              height: '620px',
              maxHeight: 'calc(100vh - 140px)',
              borderRadius: '28px',
              overflow: 'hidden',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: CHAT_FONT,
              background: 'linear-gradient(165deg, #1a1025 0%, #0f0a18 40%, #15101f 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 77, 109, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
          >
            <Particles />

            {/* ─── Header ─── */}
            <motion.div
              style={{
                background: 'linear-gradient(135deg, rgba(255, 77, 109, 0.2), rgba(255, 179, 193, 0.1))',
                backdropFilter: 'blur(20px)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Animated avatar */}
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                style={{
                  width: '48px', height: '48px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #ff4d6d, #ff758f)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(255, 77, 109, 0.4)',
                  position: 'relative',
                }}
              >
                <MessageSquareHeart size={24} color="#fff" />
                {/* Online pulse */}
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: '#22c55e',
                    border: '3px solid #1a1025',
                  }}
                />
              </motion.div>

              <div style={{ flex: 1, fontFamily: CHAT_FONT }}>
                <div style={{
                  fontSize: '18px', fontWeight: 700, color: '#fff',
                  letterSpacing: '-0.3px',
                }}>4U Gift Assistant</div>
                <div style={{
                  fontSize: '13px', color: 'rgba(255, 255, 255, 0.55)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginTop: '3px',
                  fontWeight: 400,
                }}>
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#22c55e', display: 'inline-block',
                    }}
                  />
                  Always online • Powered by your store
                </div>
              </div>

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: '36px', height: '36px', borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <X size={18} />
              </motion.button>
            </motion.div>

            {/* ─── Messages ─── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 18px',
                position: 'relative',
                zIndex: 2,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent',
              }}
            >
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  msg={{
                    ...msg,
                    onSuggestionClick: handleSuggestionClick,
                  }}
                  index={i}
                />
              ))}
              <AnimatePresence>
                {isTyping && <TypingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* ─── Quick suggestions bar ─── */}
            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '0 18px 12px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {["🧸 Baby toys", "💰 Budget gifts", "🌟 Popular items"].map((chip, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => sendMessage(chip.replace(/^[\p{Emoji}\s]+/u, ''))}
                    style={{
                      fontFamily: CHAT_FONT,
                      padding: '10px 16px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 77, 109, 0.4)',
                      background: 'linear-gradient(135deg, rgba(255, 77, 109, 0.15), rgba(255, 179, 193, 0.08))',
                      color: '#ffb3c1',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      letterSpacing: '0.2px',
                    }}
                  >
                    {chip}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* ─── Input Area ─── */}
            <div style={{
              padding: '16px 18px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(0, 0, 0, 0.2)',
              position: 'relative',
              zIndex: 2,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 6px 4px 18px',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#f0f0f0',
                    fontSize: '15px',
                    fontFamily: CHAT_FONT,
                    fontWeight: 400,
                    padding: '12px 0',
                    letterSpacing: '0.2px',
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85, rotate: -15 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  style={{
                    width: '42px', height: '42px', borderRadius: '14px',
                    background: input.trim()
                      ? 'linear-gradient(135deg, #ff4d6d, #ff758f)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    color: input.trim() ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                    cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.3s',
                    boxShadow: input.trim() ? '0 4px 15px rgba(255, 77, 109, 0.4)' : 'none',
                  }}
                >
                  <Send size={18} />
                </motion.button>
              </div>
              <div style={{
                fontFamily: CHAT_FONT,
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.25)',
                marginTop: '8px',
                letterSpacing: '0.5px',
              }}>
                Powered by 4U Toys & Treats 🎀
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatBot;
